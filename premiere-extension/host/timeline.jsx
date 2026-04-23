/**
 * Timeline operations — criação de sequências e inserção de subclipes.
 */
var Timeline = (function() {
    var TICKS = 254016000000;

    function ticksStr(sec) {
        return String(Math.round(sec * TICKS));
    }

    function createSequence(name, referenceItem) {
        // Usa QE DOM para criar sequência baseada no clipe de referência
        var project = app.project;
        try {
            app.enableQE();
            var preset = referenceItem.getMediaPath();
            // newSequenceFromClips cria sequence com config do clipe
            var newSeq = project.createNewSequenceFromClips(name, [referenceItem], project.rootItem);
            if (newSeq) {
                project.openSequence(newSeq.sequenceID);
                project.activeSequence = newSeq;
                return newSeq;
            }
        } catch (e) {}

        // Fallback: QE DOM
        try {
            var qe = qe.project.newSequence(name, null);
            return app.project.activeSequence;
        } catch (e2) {}

        return app.project.activeSequence;
    }

    function insertSubclipRange(referenceItem, sequence, startSec, endSec, offsetSec) {
        var inTicks = ticksStr(startSec);
        var outTicks = ticksStr(endSec);
        var offsetTicks = ticksStr(offsetSec);

        // Método 1: createSubClip + insertClip
        try {
            var subName = 'Cut_' + Math.floor(startSec) + '-' + Math.floor(endSec);
            var sub = referenceItem.createSubClip(subName, inTicks, outTicks, 0, 1, 1);
            if (sub) {
                sequence.videoTracks[0].insertClip(sub, offsetTicks);
                if (sequence.audioTracks.numTracks > 0) {
                    sequence.audioTracks[0].insertClip(sub, offsetTicks);
                }
                return true;
            }
        } catch (e) {
            $.writeln('createSubClip fallback: ' + e.message);
        }

        // Método 2: setInPoint/setOutPoint no item e insertClip direto
        try {
            referenceItem.setInPoint(inTicks, 4);
            referenceItem.setOutPoint(outTicks, 4);
            sequence.videoTracks[0].insertClip(referenceItem, offsetTicks);
            if (sequence.audioTracks.numTracks > 0) {
                sequence.audioTracks[0].insertClip(referenceItem, offsetTicks);
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    return {
        createSequence: createSequence,

        insertItems: function(referenceItem, sequence, payload) {
            var inserted = 0;
            var offsetSec = 0;

            try {
                if (sequence.getPlayerPosition) {
                    var pp = sequence.getPlayerPosition();
                    if (pp && pp.seconds) offsetSec = pp.seconds;
                }
            } catch (e) {}

            if (payload.mode === 'compilation') {
                // Cada variação vira sua própria sequência
                for (var v = 0; v < payload.items.length; v++) {
                    var variation = payload.items[v];
                    var seqName = variation.label || ('Variacao_' + (v + 1));
                    seqName = seqName.replace(/[^\w\u00C0-\u017F]+/g, '_').slice(0, 60);
                    var vSeq = payload.newSequence || v > 0
                        ? createSequence('FV_' + seqName, referenceItem)
                        : sequence;
                    var vOffset = 0;
                    for (var c = 0; c < (variation.clips || []).length; c++) {
                        var clip = variation.clips[c];
                        if (insertSubclipRange(referenceItem, vSeq, clip.start, clip.end, vOffset)) {
                            vOffset += (clip.end - clip.start);
                            inserted++;
                        }
                    }
                }
            } else {
                // Modo contínuo: insere cada clip em sequência
                for (var i = 0; i < payload.items.length; i++) {
                    var item = payload.items[i];
                    if (insertSubclipRange(referenceItem, sequence, item.start, item.end, offsetSec)) {
                        offsetSec += (item.end - item.start);
                        inserted++;
                    }
                }
            }

            return inserted;
        }
    };
})();
