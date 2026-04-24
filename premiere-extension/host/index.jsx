/**
 * FASTVIDEO — ExtendScript host (Premiere Pro).
 */
// @include "./json2.jsx"
// @include "./timeline.jsx"

var CC = (function() {
    var TICKS_PER_SECOND = 254016000000;

    function ok(payload) { return JSON.stringify(mergeObj({ ok: true }, payload || {})); }
    function fail(message) { return JSON.stringify({ ok: false, error: String(message) }); }
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
                if (parts.length === 4) return (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]) + (+parts[3]) / 30;
                return parseFloat(m[1]);
            }
        } catch (e) {}
        return 0;
    }

    function isVideoClip(item) {
        if (!item || item.type !== 1) return false;
        try {
            var path = item.getMediaPath ? item.getMediaPath() : '';
            if (!path) return false;
            var ext = path.toLowerCase().split('.').pop();
            return /^(mp4|mov|mxf|avi|mkv|m4v|webm|wmv|prores|r3d|braw)$/.test(ext);
        } catch (e) { return false; }
    }

    function collectAllClips(root, list, depth) {
        list = list || [];
        root = root || app.project.rootItem;
        depth = depth || 0;
        if (depth > 10) return list;
        for (var i = 0; i < root.children.numItems; i++) {
            var child = root.children[i];
            if (child.type === 2) {
                collectAllClips(child, list, depth + 1);
            } else if (isVideoClip(child)) {
                var path = '';
                try { path = child.getMediaPath(); } catch (e) {}
                list.push({
                    name: child.name,
                    path: path,
                    nodeId: child.nodeId,
                    durationSeconds: getDurationSeconds(child)
                });
            }
        }
        return list;
    }

    function readFile(path) {
        var f = new File(path);
        if (!f.exists) return null;
        f.encoding = 'UTF-8';
        f.open('r');
        var content = f.read();
        f.close();
        return content;
    }

    return {
        // Lista TODOS os clipes de vídeo do projeto (usuário escolhe qual usar)
        listProjectClips: function() {
            try {
                if (!app.project) return fail('Abra um projeto no Premiere');
                var clips = collectAllClips();
                if (!clips.length) return fail('Nenhum vídeo encontrado no Project panel');

                // Marca qual está selecionado no Project
                var selectedNodeId = null;
                try {
                    var sel = app.project.getSelection ? app.project.getSelection() : [];
                    if (sel && sel.length && sel[0].nodeId) selectedNodeId = sel[0].nodeId;
                } catch (e) {}

                return ok({ clips: clips, selectedNodeId: selectedNodeId });
            } catch (e) {
                return fail(e.message || e.toString());
            }
        },

        // Retorna detalhes de um clipe específico pelo nodeId
        getClipByNodeId: function(nodeId) {
            try {
                var item = findProjectItemByNodeId(nodeId);
                if (!item) return fail('Clipe não encontrado');
                var path = '';
                try { path = item.getMediaPath(); } catch (e) {}
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

        // Busca transcrição automática gerada pelo Premiere ao lado do media
        // Premiere cria .prtranscript quando "Auto-transcribe on import" está ligado
        findAutoTranscript: function(nodeId) {
            try {
                var item = findProjectItemByNodeId(nodeId);
                if (!item) return fail('Clipe não encontrado');
                var path = '';
                try { path = item.getMediaPath(); } catch (e) {}
                if (!path) return fail('Caminho do vídeo não disponível');

                var base = path.replace(/\.[^.\\\/]+$/, '');
                var candidates = [
                    base + '.prtranscript',
                    base + '.transcript',
                    base + '.srt',
                    base + '.vtt',
                    base + '.json',
                    base + '.txt'
                ];
                for (var i = 0; i < candidates.length; i++) {
                    var content = readFile(candidates[i]);
                    if (content && content.length > 30) {
                        return ok({
                            content: content,
                            fileName: candidates[i].split(/[\/\\]/).pop(),
                            path: candidates[i]
                        });
                    }
                }

                return fail('Nenhuma transcrição encontrada. Gere manualmente: Window > Text > Transcribe, depois exporte como TXT/JSON e arraste aqui.');
            } catch (e) {
                return fail(e.message || e.toString());
            }
        },

        // Abre o painel Text do Premiere para o usuário gerar transcrição
        openTranscriptPanel: function() {
            try {
                // Tenta acionar o comando de menu via app.sourceMonitor ou QE
                app.enableQE();
                // Melhor que temos: direcionar o usuário
                return ok({
                    instruction: 'Clique em Window > Text > Transcript > Transcribe sequence'
                });
            } catch (e) {
                return fail(e.message || e.toString());
            }
        },

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
                var result = Timeline.insertItems(item, sequence, payload);
                return ok({
                    inserted: result.inserted,
                    sequenceName: sequence.name,
                    remainingAppended: result.remainingAppended
                });
            } catch (e) {
                return fail(e.message || e.toString());
            }
        }
    };
})();
