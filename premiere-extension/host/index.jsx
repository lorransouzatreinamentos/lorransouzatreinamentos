/**
 * FASTVIDEO — ExtendScript host (Premiere Pro).
 * Operações expostas ao painel via CC.*
 *
 * Simplificado: transcrição é processada no cliente (CEP panel) via
 * FileReader HTML5. O host só cuida de seleção de clipe e inserção na timeline.
 */
// @include "./json2.jsx"
// @include "./timeline.jsx"

var CC = (function() {
    var TICKS_PER_SECOND = 254016000000;

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

    function findProjectItemByNodeId(nodeId, root) {
        root = root || app.project.rootItem;
        for (var i = 0; i < root.children.numItems; i++) {
            var child = root.children[i];
            if (child.nodeId === nodeId) return child;
            if (child.type === 2) {
                var found = findProjectItemByNodeId(nodeId, child);
                if (found) return found;
            }
        }
        return null;
    }

    function getDurationSeconds(projectItem) {
        try {
            var ticks = projectItem.getOutPoint().ticks - projectItem.getInPoint().ticks;
            var sec = parseFloat(ticks) / TICKS_PER_SECOND;
            if (sec > 0) return sec;
        } catch (e) {}
        try {
            var md = projectItem.getProjectMetadata();
            var m = md.match(/<premierePrivateProjectMetaData:Column\.Intrinsic\.MediaDuration>([^<]+)</);
            if (m) {
                var parts = m[1].split(':');
                if (parts.length === 4) {
                    return (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]) + (+parts[3]) / 30;
                }
                return parseFloat(m[1]);
            }
        } catch (e) {}
        return 0;
    }

    return {
        // Retorna o clipe selecionado no Project panel, ou primeiro clipe se nenhum selecionado
        getSelectedProjectItem: function() {
            try {
                if (!app.project) return fail('Abra um projeto no Premiere');
                var selected = app.project.getSelection ? app.project.getSelection() : [];
                if (!selected || !selected.length) {
                    var root = app.project.rootItem;
                    for (var i = 0; i < root.children.numItems; i++) {
                        var it = root.children[i];
                        if (it.type === 1) {
                            selected = [it];
                            break;
                        }
                    }
                }
                if (!selected || !selected.length) return fail('Selecione um vídeo no painel Project');
                var item = selected[0];
                if (item.type !== 1) return fail('Selecione um clipe (não uma bin)');

                var path = '';
                try { path = item.getMediaPath ? item.getMediaPath() : ''; } catch (e) {}

                return ok({
                    item: {
                        name: item.name,
                        path: path,
                        nodeId: item.nodeId,
                        durationSeconds: getDurationSeconds(item)
                    }
                });
            } catch (e) {
                return fail(e.message || e.toString());
            }
        },

        // Insere clipes na timeline (modo contínuo ou compilação)
        insertClips: function(payloadJson) {
            try {
                var payload = JSON.parse(payloadJson);
                var item = findProjectItemByNodeId(payload.projectItemNodeId);
                if (!item) return fail('Vídeo não encontrado no projeto');

                var sequence = payload.newSequence
                    ? Timeline.createSequence('FASTVIDEO_' + Date.now(), item)
                    : app.project.activeSequence;

                if (!sequence) return fail('Sem sequência ativa. Marque "Criar nova sequência"');

                app.enableQE();
                var count = Timeline.insertItems(item, sequence, payload);
                return ok({ inserted: count, sequenceName: sequence.name });
            } catch (e) {
                return fail(e.message || e.toString());
            }
        }
    };
})();
