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

    return {
        createSequence: createSequence,

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
