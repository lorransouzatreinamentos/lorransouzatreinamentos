/**
 * Timeline operations — criação de sequência única e inserção agrupada.
 *
 * Regra v1.3:
 *   - UMA sequência para tudo (nunca múltiplas)
 *   - Modo contínuo: cada clipe (trecho) com cor diferente + gap 30s entre clipes
 *   - Modo compilação: cada VARIAÇÃO é um grupo de trechos com MESMA cor;
 *     grupos diferentes = cores diferentes; gap 30s entre variações
 *   - Vídeo original completo no final com gap de 90s
 */
var Timeline = (function() {
    var TICKS = 254016000000;
    var GAP_BETWEEN_GROUPS_SEC = 30;
    var GAP_BEFORE_REMAINING_SEC = 90;

    // Paleta de cores visualmente distintas do Premiere (0-15)
    var LABEL_COLORS = [2, 7, 5, 6, 1, 11, 10, 3, 15, 4, 13, 0, 8, 12];

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

    // Contador para garantir nomes únicos dos subclipes (evita colisões)
    var SUBCLIP_COUNTER = 0;

    function insertSubclipRange(referenceItem, sequence, startSec, endSec, offsetSec, colorIdx) {
        // Validação defensiva — se algo vier errado, ignora sem quebrar
        startSec = parseFloat(startSec);
        endSec = parseFloat(endSec);
        offsetSec = parseFloat(offsetSec);
        if (isNaN(startSec) || isNaN(endSec) || startSec < 0 || endSec <= startSec) {
            $.writeln('Timestamps inválidos: start=' + startSec + ' end=' + endSec);
            return false;
        }

        var inTicks = ticksStr(startSec);
        var outTicks = ticksStr(endSec);
        var offsetTicks = ticksStr(Math.max(0, offsetSec));

        SUBCLIP_COUNTER++;
        // Nome único garantido por contador + tempo (evita colisão quando dois
        // trechos têm mesmo Math.floor(start))
        var subName = 'FV_' + SUBCLIP_COUNTER + '_' + startSec.toFixed(1) + '-' + endSec.toFixed(1);

        try {
            var sub = referenceItem.createSubClip(subName, inTicks, outTicks, 0, 1, 1);
            if (sub) {
                if (typeof colorIdx === 'number') setLabelColor(sub, colorIdx);
                sequence.videoTracks[0].insertClip(sub, offsetTicks);
                if (sequence.audioTracks.numTracks > 0) {
                    sequence.audioTracks[0].insertClip(sub, offsetTicks);
                }
                return true;
            }
        } catch (e) {
            $.writeln('createSubClip falhou: ' + e.message);
        }

        // Fallback SEGURO: NÃO mutar referenceItem. Usa overwriteClip com
        // inPoint/outPoint locais da inserção (Premiere 2024+) ou falha sem
        // corromper o projeto.
        try {
            // Esta API aceita in/out points explícitos sem alterar o ProjectItem
            sequence.videoTracks[0].overwriteClip(referenceItem, offsetTicks, inTicks, outTicks);
            if (sequence.audioTracks.numTracks > 0) {
                sequence.audioTracks[0].overwriteClip(referenceItem, offsetTicks, inTicks, outTicks);
            }
            return true;
        } catch (e2) {
            $.writeln('Fallback overwriteClip falhou: ' + e2.message);
            return false;
        }
    }

    function insertFullClip(referenceItem, sequence, offsetSec, colorIdx) {
        var offsetTicks = ticksStr(Math.max(0, parseFloat(offsetSec)));
        try {
            sequence.videoTracks[0].insertClip(referenceItem, offsetTicks);
            if (sequence.audioTracks.numTracks > 0) {
                sequence.audioTracks[0].insertClip(referenceItem, offsetTicks);
            }
            return true;
        } catch (e) {
            $.writeln('insertFullClip falhou: ' + e.message);
            return false;
        }
    }

    return {
        createSequence: createSequence,

        insertItems: function(referenceItem, sequence, payload) {
            SUBCLIP_COUNTER = 0; // reset por execução
            var inserted = 0;
            var offsetSec = 0;
            var groupCount = 0;
            var appendRemaining = payload.appendRemaining !== false;

            try {
                if (sequence.getPlayerPosition) {
                    var pp = sequence.getPlayerPosition();
                    if (pp && pp.seconds) offsetSec = pp.seconds;
                }
            } catch (e) {}

            if (payload.mode === 'compilation') {
                // MODO COMPILAÇÃO: cada variação = um grupo com MESMA cor
                for (var v = 0; v < payload.items.length; v++) {
                    var variation = payload.items[v];
                    var groupColor = LABEL_COLORS[groupCount % LABEL_COLORS.length];
                    var groupInsertedAny = false;

                    for (var c = 0; c < (variation.clips || []).length; c++) {
                        var clip = variation.clips[c];
                        if (insertSubclipRange(referenceItem, sequence, clip.start, clip.end, offsetSec, groupColor)) {
                            offsetSec += (clip.end - clip.start);
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
                // MODO CONTÍNUO: cada trecho = um grupo individual com cor diferente
                for (var i = 0; i < payload.items.length; i++) {
                    var item = payload.items[i];
                    var col = LABEL_COLORS[groupCount % LABEL_COLORS.length];
                    if (insertSubclipRange(referenceItem, sequence, item.start, item.end, offsetSec, col)) {
                        offsetSec += (item.end - item.start) + GAP_BETWEEN_GROUPS_SEC;
                        inserted++;
                        groupCount++;
                    }
                }
            }

            // Vídeo original completo no final
            if (appendRemaining && inserted > 0) {
                var finalOffset = offsetSec + GAP_BEFORE_REMAINING_SEC - GAP_BETWEEN_GROUPS_SEC;
                insertFullClip(referenceItem, sequence, finalOffset,
                    LABEL_COLORS[LABEL_COLORS.length - 1]);
            }

            return {
                inserted: inserted,
                groups: groupCount,
                remainingAppended: appendRemaining && inserted > 0
            };
        }
    };
})();
