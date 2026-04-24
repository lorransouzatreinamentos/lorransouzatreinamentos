/**
 * Timeline operations — v1.4
 *
 * FIX CRÍTICO v1.4:
 *   insertClip/overwriteClip do Premiere interpretam strings como 0 segundos
 *   (documentado em fóruns Adobe: strings viram 0s, números são lidos como
 *   segundos). Agora SEMPRE passamos tempo como NÚMERO em segundos.
 *   createSubClip continua recebendo ticks em string (documentação oficial).
 *
 * Regras:
 *   - UMA sequência para tudo
 *   - Modo contínuo: cada trecho com cor diferente, gap 30s
 *   - Modo compilação: variação = grupo com mesma cor, gap 30s entre grupos
 *   - Vídeo original completo no final com gap de 90s
 */
var Timeline = (function() {
    var TICKS = 254016000000;
    var GAP_BETWEEN_GROUPS_SEC = 30;
    var GAP_BEFORE_REMAINING_SEC = 90;

    var LABEL_COLORS = [2, 7, 5, 6, 1, 11, 10, 3, 15, 4, 13, 0, 8, 12];
    var SUBCLIP_COUNTER = 0;

    function ticksStr(sec) {
        return String(Math.round(sec * TICKS));
    }

    function createSequence(name, referenceItem) {
        var project = app.project;
        try {
            var newSeq = project.createNewSequenceFromClips(name, [referenceItem], project.rootItem);
            if (newSeq) {
                project.openSequence(newSeq.sequenceID);
                project.activeSequence = newSeq;
                try {
                    var track = newSeq.videoTracks[0];
                    for (var i = track.clips.numItems - 1; i >= 0; i--) {
                        track.clips[i].remove(false, false);
                    }
                    var atrack = newSeq.audioTracks[0];
                    for (var j = atrack.clips.numItems - 1; j >= 0; j--) {
                        atrack.clips[j].remove(false, false);
                    }
                } catch (e) {}
                return newSeq;
            }
        } catch (e) {}
        try {
            qe.project.newSequence(name, null);
            return app.project.activeSequence;
        } catch (e2) {}
        return app.project.activeSequence;
    }

    function setLabelColor(projectItem, colorIdx) {
        try { projectItem.setColorLabel(colorIdx); return true; }
        catch (e) {
            try { projectItem.label = colorIdx; return true; }
            catch (e2) { return false; }
        }
    }

    /**
     * Insere um trecho (sub-range) do clipe original na sequência.
     *
     * IMPORTANTE: insertClip aceita NÚMERO em segundos. Strings viram 0.
     * createSubClip aceita ticks como STRING (documentado).
     */
    function insertSubclipRange(referenceItem, sequence, startSec, endSec, offsetSec, colorIdx) {
        startSec = parseFloat(startSec);
        endSec = parseFloat(endSec);
        offsetSec = Math.max(0, parseFloat(offsetSec));
        if (isNaN(startSec) || isNaN(endSec) || startSec < 0 || endSec <= startSec) {
            $.writeln('[FV] Timestamps inválidos: start=' + startSec + ' end=' + endSec);
            return false;
        }

        SUBCLIP_COUNTER++;
        var subName = 'FV_' + SUBCLIP_COUNTER + '_' + startSec.toFixed(1) + '-' + endSec.toFixed(1);

        try {
            // createSubClip: ticks como STRING (conforme docs Adobe)
            var sub = referenceItem.createSubClip(
                subName,
                ticksStr(startSec),
                ticksStr(endSec),
                0, 1, 1
            );
            if (sub) {
                if (typeof colorIdx === 'number') setLabelColor(sub, colorIdx);
                // insertClip: tempo como NÚMERO em segundos (fix crítico v1.4)
                sequence.videoTracks[0].insertClip(sub, offsetSec);
                if (sequence.audioTracks.numTracks > 0) {
                    sequence.audioTracks[0].insertClip(sub, offsetSec);
                }
                return true;
            }
        } catch (e) {
            $.writeln('[FV] createSubClip falhou: ' + e.message);
        }

        // Fallback: overwriteClip com in/out explícitos (não muta o item)
        try {
            sequence.videoTracks[0].overwriteClip(
                referenceItem, offsetSec, ticksStr(startSec), ticksStr(endSec)
            );
            if (sequence.audioTracks.numTracks > 0) {
                sequence.audioTracks[0].overwriteClip(
                    referenceItem, offsetSec, ticksStr(startSec), ticksStr(endSec)
                );
            }
            return true;
        } catch (e2) {
            $.writeln('[FV] overwriteClip falhou: ' + e2.message);
            return false;
        }
    }

    function insertFullClip(referenceItem, sequence, offsetSec) {
        offsetSec = Math.max(0, parseFloat(offsetSec));
        try {
            sequence.videoTracks[0].insertClip(referenceItem, offsetSec);
            if (sequence.audioTracks.numTracks > 0) {
                sequence.audioTracks[0].insertClip(referenceItem, offsetSec);
            }
            return true;
        } catch (e) {
            $.writeln('[FV] insertFullClip falhou: ' + e.message);
            return false;
        }
    }

    /**
     * Modo "Editar timeline existente": em vez de inserir novos subclipes,
     * aplica razor cuts no clipe existente na timeline ativa e pinta os
     * trechos escolhidos com cores distintas (resto fica cinza/neutro).
     *
     * Estratégia:
     *   1. Encontra o clipe na videoTracks[0] que corresponde ao referenceItem
     *   2. Coleta todos os pontos de corte (start/end de cada trecho escolhido)
     *   3. Aplica razor nos pontos via QE DOM
     *   4. Para cada segmento cortado que corresponde a um trecho escolhido,
     *      aplica setColorLabel com a cor do grupo; resto fica como label neutro
     */
    function editExistingTimeline(referenceItem, sequence, payload) {
        var editsApplied = 0;
        var groupCount = 0;

        try {
            app.enableQE();
        } catch (e) {}

        // Coleta pontos de corte ordenados + mapeamento para cor
        var cuts = [];  // [{ start, end, color }]

        if (payload.mode === 'compilation') {
            for (var v = 0; v < payload.items.length; v++) {
                var variation = payload.items[v];
                var vColor = LABEL_COLORS[groupCount % LABEL_COLORS.length];
                var any = false;
                for (var c = 0; c < (variation.clips || []).length; c++) {
                    var clip = variation.clips[c];
                    var s = parseFloat(clip.start);
                    var e = parseFloat(clip.end);
                    if (!isNaN(s) && !isNaN(e) && e > s) {
                        cuts.push({ start: s, end: e, color: vColor });
                        any = true;
                    }
                }
                if (any) groupCount++;
            }
        } else {
            for (var i = 0; i < payload.items.length; i++) {
                var item = payload.items[i];
                var st = parseFloat(item.start);
                var en = parseFloat(item.end);
                if (!isNaN(st) && !isNaN(en) && en > st) {
                    var col = LABEL_COLORS[groupCount % LABEL_COLORS.length];
                    cuts.push({ start: st, end: en, color: col });
                    groupCount++;
                }
            }
        }

        if (!cuts.length) return { inserted: 0, groups: 0, remainingAppended: false };

        // Aplica razor via QE DOM em cada ponto único
        var razorPoints = {};
        for (var k = 0; k < cuts.length; k++) {
            razorPoints[cuts[k].start.toFixed(3)] = cuts[k].start;
            razorPoints[cuts[k].end.toFixed(3)] = cuts[k].end;
        }
        var qSeq = null;
        try { qSeq = qe.project.getActiveSequence(); } catch (e) {}

        for (var key in razorPoints) {
            if (razorPoints.hasOwnProperty(key)) {
                var timeSec = razorPoints[key];
                try {
                    if (qSeq) {
                        var track = qSeq.getVideoTrackAt(0);
                        if (track && track.razor) track.razor(String(timeSec));
                        var atr = qSeq.getAudioTrackAt(0);
                        if (atr && atr.razor) atr.razor(String(timeSec));
                    }
                } catch (e) {
                    $.writeln('[FV] razor falhou em ' + timeSec + ': ' + e.message);
                }
            }
        }

        // Agora percorre os clipes da track e pinta os que caem DENTRO de algum trecho
        try {
            var vTrack = sequence.videoTracks[0];
            for (var n = 0; n < vTrack.clips.numItems; n++) {
                var tClip = vTrack.clips[n];
                var clipStart = parseFloat(tClip.start.seconds);
                var clipEnd = parseFloat(tClip.end.seconds);

                for (var m = 0; m < cuts.length; m++) {
                    var cut = cuts[m];
                    // Clipe cai dentro do range escolhido (com tolerância)
                    if (clipStart >= cut.start - 0.05 && clipEnd <= cut.end + 0.05) {
                        try {
                            if (tClip.projectItem) setLabelColor(tClip.projectItem, cut.color);
                            // Também tenta setar label no trackItem
                            if (tClip.setColorLabel) tClip.setColorLabel(cut.color);
                        } catch (e) {}
                        editsApplied++;
                        break;
                    }
                }
            }
        } catch (e) {
            $.writeln('[FV] erro pintando cortes: ' + e.message);
        }

        return {
            inserted: editsApplied,
            groups: groupCount,
            remainingAppended: false,
            mode: 'edit-timeline'
        };
    }

    return {
        createSequence: createSequence,
        editExistingTimeline: editExistingTimeline,

        insertItems: function(referenceItem, sequence, payload) {
            SUBCLIP_COUNTER = 0;
            var inserted = 0;
            var offsetSec = 0;
            var groupCount = 0;
            var appendRemaining = payload.appendRemaining !== false;

            // Playhead atual como ponto inicial
            try {
                if (sequence.getPlayerPosition) {
                    var pp = sequence.getPlayerPosition();
                    if (pp && pp.seconds) offsetSec = parseFloat(pp.seconds) || 0;
                }
            } catch (e) {}

            if (payload.mode === 'compilation') {
                for (var v = 0; v < payload.items.length; v++) {
                    var variation = payload.items[v];
                    var groupColor = LABEL_COLORS[groupCount % LABEL_COLORS.length];
                    var groupInsertedAny = false;

                    for (var c = 0; c < (variation.clips || []).length; c++) {
                        var clip = variation.clips[c];
                        var startSec = parseFloat(clip.start);
                        var endSec = parseFloat(clip.end);
                        if (insertSubclipRange(referenceItem, sequence, startSec, endSec, offsetSec, groupColor)) {
                            offsetSec += (endSec - startSec);
                            inserted++;
                            groupInsertedAny = true;
                        }
                    }

                    if (groupInsertedAny) {
                        offsetSec += GAP_BETWEEN_GROUPS_SEC;
                        groupCount++;
                    }
                }
            } else {
                for (var i = 0; i < payload.items.length; i++) {
                    var item = payload.items[i];
                    var s = parseFloat(item.start);
                    var e = parseFloat(item.end);
                    var col = LABEL_COLORS[groupCount % LABEL_COLORS.length];
                    if (insertSubclipRange(referenceItem, sequence, s, e, offsetSec, col)) {
                        offsetSec += (e - s) + GAP_BETWEEN_GROUPS_SEC;
                        inserted++;
                        groupCount++;
                    }
                }
            }

            // Vídeo original completo no final
            if (appendRemaining && inserted > 0) {
                var finalOffset = offsetSec + GAP_BEFORE_REMAINING_SEC - GAP_BETWEEN_GROUPS_SEC;
                insertFullClip(referenceItem, sequence, finalOffset);
            }

            return {
                inserted: inserted,
                groups: groupCount,
                remainingAppended: appendRemaining && inserted > 0
            };
        }
    };
})();
