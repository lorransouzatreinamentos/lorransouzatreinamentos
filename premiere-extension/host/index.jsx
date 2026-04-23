/**
 * FASTVIDEO — ExtendScript host (Premiere Pro).
 * Todas as operações expostas ao painel via CC.*
 */
// @include "./json2.jsx"
// @include "./transcript.jsx"
// @include "./timeline.jsx"

var CC = (function() {
    var TICKS_PER_SECOND = 254016000000; // unidade interna do Premiere

    function ok(payload) {
        return JSON.stringify(mergeObj({ ok: true }, payload || {}));
    }

    function fail(message) {
        return JSON.stringify({ ok: false, error: String(message) });
    }

    function mergeObj(a, b) {
        var out = {};
        for (var k in a) if (a.hasOwnProperty(k)) out[k] = a[k];
        for (var k2 in b) if (b.hasOwnProperty(k2)) out[k2] = b[k2];
        return out;
    }

    function secondsToTicks(sec) {
        return String(Math.round(sec * TICKS_PER_SECOND));
    }

    function findProjectItemByNodeId(nodeId, root) {
        root = root || app.project.rootItem;
        for (var i = 0; i < root.children.numItems; i++) {
            var child = root.children[i];
            if (child.nodeId === nodeId) return child;
            if (child.type === 2) { // Bin
                var found = findProjectItemByNodeId(nodeId, child);
                if (found) return found;
            }
        }
        return null;
    }

    function getDurationSeconds(projectItem) {
        try {
            var ticks = projectItem.getOutPoint().ticks - projectItem.getInPoint().ticks;
            return parseFloat(ticks) / TICKS_PER_SECOND;
        } catch (e) {
            try {
                var md = projectItem.getProjectMetadata();
                var m = md.match(/<premierePrivateProjectMetaData:Column\.Intrinsic\.MediaDuration>([^<]+)</);
                if (m) return parseFloat(m[1]);
            } catch (e2) {}
            return 0;
        }
    }

    return {
        // ==================== GET SELECTED ITEM ====================
        getSelectedProjectItem: function() {
            try {
                if (!app.project) return fail('Abra um projeto no Premiere');
                var selected = app.project.getSelection ? app.project.getSelection() : [];
                if (!selected || !selected.length) {
                    // Fallback: pegar o primeiro video do rootItem
                    var root = app.project.rootItem;
                    for (var i = 0; i < root.children.numItems; i++) {
                        var it = root.children[i];
                        if (it.type === 1 /* CLIP */ && it.canProxy) {
                            selected = [it];
                            break;
                        }
                    }
                }
                if (!selected || !selected.length) return fail('Selecione um vídeo no painel Project');
                var item = selected[0];
                if (item.type !== 1) return fail('Selecione um clipe (não uma bin)');

                return ok({
                    item: {
                        name: item.name,
                        path: item.getMediaPath ? item.getMediaPath() : '',
                        nodeId: item.nodeId,
                        durationSeconds: getDurationSeconds(item)
                    }
                });
            } catch (e) {
                return fail(e.message || e.toString());
            }
        },

        // ==================== TRANSCRIPT ====================
        getTranscript: function(nodeId) {
            try {
                var item = findProjectItemByNodeId(nodeId);
                if (!item) return fail('Item não encontrado no projeto');
                var result = Transcript.extract(item);
                if (!result.ok) return fail(result.error);
                return ok({ transcript: result.text });
            } catch (e) {
                return fail(e.message || e.toString());
            }
        },

        // ==================== INSERT CLIPS ====================
        insertClips: function(payloadJson) {
            try {
                var payload = JSON.parse(payloadJson);
                var item = findProjectItemByNodeId(payload.projectItemNodeId);
                if (!item) return fail('Vídeo não encontrado no projeto');

                var sequence = payload.newSequence
                    ? Timeline.createSequence('FASTVIDEO_' + Date.now(), item)
                    : app.project.activeSequence;

                if (!sequence) return fail('Sem sequência ativa. Crie uma sequência ou marque "Criar nova sequência"');

                app.enableQE();
                var count = Timeline.insertItems(item, sequence, payload);
                return ok({ inserted: count, sequenceName: sequence.name });
            } catch (e) {
                return fail(e.message || e.toString());
            }
        },

        _utils: {
            secondsToTicks: secondsToTicks,
            findProjectItemByNodeId: findProjectItemByNodeId
        }
    };
})();
