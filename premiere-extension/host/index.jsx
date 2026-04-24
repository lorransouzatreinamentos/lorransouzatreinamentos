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

        // Marca silêncios na timeline atual: razor cuts nos pontos + cor vermelha (6=Rose)
        markSilences: function(payloadJson) {
            try {
                var payload = JSON.parse(payloadJson);
                var seq = app.project.activeSequence;
                if (!seq) return fail('Abra uma sequência no Premiere primeiro');

                app.enableQE();
                var qSeq = null;
                try { qSeq = qe.project.getActiveSequence(); } catch (e) {}

                var cutPoints = {};
                for (var i = 0; i < payload.gaps.length; i++) {
                    cutPoints[payload.gaps[i].start.toFixed(3)] = payload.gaps[i].start;
                    cutPoints[payload.gaps[i].end.toFixed(3)] = payload.gaps[i].end;
                }

                for (var key in cutPoints) {
                    if (cutPoints.hasOwnProperty(key)) {
                        try {
                            if (qSeq) {
                                var vt = qSeq.getVideoTrackAt(0);
                                if (vt && vt.razor) vt.razor(String(cutPoints[key]));
                                var at = qSeq.getAudioTrackAt(0);
                                if (at && at.razor) at.razor(String(cutPoints[key]));
                            }
                        } catch (e) {}
                    }
                }

                // Marca clipes que caem nos gaps em vermelho (6 = Rose)
                var cut = 0;
                try {
                    var vTrack = seq.videoTracks[0];
                    for (var n = 0; n < vTrack.clips.numItems; n++) {
                        var c = vTrack.clips[n];
                        var cStart = parseFloat(c.start.seconds);
                        var cEnd = parseFloat(c.end.seconds);
                        for (var g = 0; g < payload.gaps.length; g++) {
                            var gap = payload.gaps[g];
                            if (cStart >= gap.start - 0.05 && cEnd <= gap.end + 0.05) {
                                try {
                                    if (c.setColorLabel) c.setColorLabel(6);
                                    if (c.projectItem) c.projectItem.setColorLabel(6);
                                } catch (e) {}
                                cut++;
                                break;
                            }
                        }
                    }
                } catch (e) {
                    return fail('Erro marcando clipes: ' + e.message);
                }

                return ok({ cut: cut });
            } catch (e) {
                return fail(e.message || e.toString());
            }
        },

        insertClips: function(payloadJson) {
            try {
                var payload = JSON.parse(payloadJson);
                var item = findProjectItemByNodeId(payload.projectItemNodeId);
                if (!item) return fail('Vídeo não encontrado no projeto');

                app.enableQE();

                // Modo "Editar timeline existente": razor cuts + cores no clipe atual
                if (payload.editExisting) {
                    var existingSeq = app.project.activeSequence;
                    if (!existingSeq) return fail('Abra uma sequência no Premiere primeiro');
                    var editResult = Timeline.editExistingTimeline(item, existingSeq, payload);
                    return ok({
                        inserted: editResult.inserted,
                        sequenceName: existingSeq.name,
                        remainingAppended: false,
                        editMode: true
                    });
                }

                // Modo normal: cria ou usa sequência e insere subclipes
                var sequence = payload.newSequence
                    ? Timeline.createSequence('FASTVIDEO_' + Date.now(), item)
                    : app.project.activeSequence;
                if (!sequence) return fail('Sem sequência ativa. Marque "Criar nova sequência"');

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
