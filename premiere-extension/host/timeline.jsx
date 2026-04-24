/**
 * Timeline operations — criação de sequências, subclipes e montagem final.
 *
 * Features v1.2:
 *   - Cores de rótulo rotacionadas por clipe (14 cores distintas)
 *   - Gap de 30s entre cada trecho extraído
 *   - Vídeo original completo no final da sequência com gap de 90s
 */
var Timeline = (function() {
    var TICKS = 254016000000;
    var GAP_BETWEEN_CLIPS_SEC = 30;
    var GAP_BEFORE_REMAINING_SEC = 90;

    // Paleta de cores visualmente distintas do Premiere (0-15)
    // 0=Violet, 1=Iris, 2=Caribbean, 3=Lavender, 4=Cerulean, 5=Forest,
    // 6=Rose, 7=Mango, 8=Purple, 9=Blue, 10=Teal, 11=Magenta,
    // 12=Tan, 13=Green, 14=Brown, 15=Yellow
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
                // Limpa a timeline da sequência recém-criada (createFromClips adiciona o clipe)
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
        try {
            projectItem.setColorLabel(colorIdx);
            return true;
        } catch (e) {
            try {
                // Fallback: setar via label property
                projectItem.label = colorIdx;
                return true;
            } catch (e2) { return false; }
        }
    }

    function insertSubclipRange(referenceItem, sequence, startSec, endSec, offsetSec, colorIdx) {
        var inTicks = ticksStr(startSec);
        var outTicks = ticksStr(endSec);
        var offsetTicks = ticksStr(offsetSec);

        try {
            var subName = 'FV_' + Math.floor(startSec) + '-' + Math.floor(endSec);
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
            $.writeln('createSubClip fallback: ' + e.message);
        }

        try {
            referenceItem.setInPoint(inTicks, 4);
            referenceItem.setOutPoint(outTicks, 4);
            sequence.videoTracks[0].insertClip(referenceItem, offsetTicks);
            if (sequence.audioTracks.numTracks > 0) {
                sequence.audioTracks[0].insertClip(referenceItem, offsetTicks);
            }
            return true;
        } catch (e) { return false; }
    }

    function insertFullClip(referenceItem, sequence, offsetSec, colorIdx) {
        try {
            var offsetTicks = ticksStr(offsetSec);
            var dupe = referenceItem.createSubClip(
                'FV_original_' + Date.now(),
                '0',
                String(parseFloat(referenceItem.getOutPoint().ticks)),
                0, 1, 1
            );
            var target = dupe || referenceItem;
            if (typeof colorIdx === 'number') setLabelColor(target, colorIdx);
            sequence.videoTracks[0].insertClip(target, offsetTicks);
            if (sequence.audioTracks.numTracks > 0) {
                sequence.audioTracks[0].insertClip(target, offsetTicks);
            }
            return true;
        } catch (e) {
            try {
                sequence.videoTracks[0].insertClip(referenceItem, ticksStr(offsetSec));
                if (sequence.audioTracks.numTracks > 0) {
                    sequence.audioTracks[0].insertClip(referenceItem, ticksStr(offsetSec));
                }
                return true;
            } catch (e2) { return false; }
        }
    }

    return {
        createSequence: createSequence,

        insertItems: function(referenceItem, sequence, payload) {
            var inserted = 0;
            var colorCursor = 0;
            var offsetSec = 0;
            var appendRemaining = payload.appendRemaining !== false; // default true

            // Posição inicial = playhead atual
            try {
                if (sequence.getPlayerPosition) {
                    var pp = sequence.getPlayerPosition();
                    if (pp && pp.seconds) offsetSec = pp.seconds;
                }
            } catch (e) {}

            if (payload.mode === 'compilation') {
                // Cada variação: sequência separada OU blocos na mesma
                for (var v = 0; v < payload.items.length; v++) {
                    var variation = payload.items[v];
                    var seqName = (variation.label || ('Variacao_' + (v + 1)))
                        .replace(/[^\wÀ-ſ]+/g, '_').slice(0, 60);
                    var vSeq = (payload.newSequence || v > 0)
                        ? createSequence('FV_' + seqName, referenceItem)
                        : sequence;
                    var vOffset = 0;

                    for (var c = 0; c < (variation.clips || []).length; c++) {
                        var clip = variation.clips[c];
                        var color = LABEL_COLORS[colorCursor % LABEL_COLORS.length];
                        if (insertSubclipRange(referenceItem, vSeq, clip.start, clip.end, vOffset, color)) {
                            vOffset += (clip.end - clip.start) + GAP_BETWEEN_CLIPS_SEC;
                            inserted++;
                            colorCursor++;
                        }
                    }

                    // Após todos os clipes da variação, adiciona vídeo completo no final
                    if (appendRemaining && vOffset > 0) {
                        insertFullClip(referenceItem, vSeq,
                            vOffset + GAP_BEFORE_REMAINING_SEC - GAP_BETWEEN_CLIPS_SEC,
                            LABEL_COLORS[LABEL_COLORS.length - 1]);
                    }
                }
            } else {
                // Modo contínuo
                for (var i = 0; i < payload.items.length; i++) {
                    var item = payload.items[i];
                    var col = LABEL_COLORS[colorCursor % LABEL_COLORS.length];
                    if (insertSubclipRange(referenceItem, sequence, item.start, item.end, offsetSec, col)) {
                        offsetSec += (item.end - item.start) + GAP_BETWEEN_CLIPS_SEC;
                        inserted++;
                        colorCursor++;
                    }
                }

                if (appendRemaining && inserted > 0) {
                    insertFullClip(referenceItem, sequence,
                        offsetSec + GAP_BEFORE_REMAINING_SEC - GAP_BETWEEN_CLIPS_SEC,
                        LABEL_COLORS[LABEL_COLORS.length - 1]);
                }
            }

            return {
                inserted: inserted,
                remainingAppended: appendRemaining && inserted > 0
            };
        }
    };
})();
