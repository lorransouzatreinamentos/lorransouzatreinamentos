/**
 * Timeline operations — v1.6
 *
 * Melhorias v1.6 (#7):
 *  - Valida start/end contra duração real do item antes de qualquer inserção
 *  - Busca a track correta onde o clipe reference vive (não assume videoTracks[0])
 *  - Mensagens de erro claras e específicas
 *
 * Fix crítico v1.4 (mantido):
 *  insertClip/overwriteClip recebe NÚMERO em segundos (string = 0).
 *  createSubClip recebe ticks em STRING (documentação Adobe).
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

    // ==================== VALIDAÇÃO DE DURAÇÃO (#7) ====================

    function getItemDuration(projectItem) {
        try {
            var ticks = projectItem.getOutPoint().ticks - projectItem.getInPoint().ticks;
            var sec = parseFloat(ticks) / TICKS;
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

    // Retorna { start, end } clampados na duração do item, ou null se inválidos
    function clampToItemDuration(startSec, endSec, itemDurationSec) {
        startSec = parseFloat(startSec);
        endSec   = parseFloat(endSec);
        if (isNaN(startSec) || isNaN(endSec)) return null;
        if (startSec < 0) {
            $.writeln('[FV] start negativo corrigido para 0: ' + startSec);
            startSec = 0;
        }
        if (itemDurationSec > 0) {
            if (startSec >= itemDurationSec) {
                $.writeln('[FV] start (' + startSec + ') >= duração do item (' + itemDurationSec + ')');
                return null;
            }
            if (endSec > itemDurationSec) {
                $.writeln('[FV] end (' + endSec + ') > duração (' + itemDurationSec + '): clampando');
                endSec = itemDurationSec;
            }
        }
        if (endSec <= startSec + 0.5) {
            $.writeln('[FV] Duração efetiva <0.5s: start=' + startSec + ' end=' + endSec);
            return null;
        }
        return { start: startSec, end: endSec };
    }

    // ==================== TRACK FINDER (#7) ====================

    // Encontra o índice de videoTrack onde o referenceItem aparece
    function findTrackIndex(sequence, referenceItem) {
        try {
            for (var t = 0; t < sequence.videoTracks.numTracks; t++) {
                var track = sequence.videoTracks[t];
                for (var c = 0; c < track.clips.numItems; c++) {
                    var cl = track.clips[c];
                    if (cl.projectItem && cl.projectItem.nodeId === referenceItem.nodeId) {
                        return t;
                    }
                }
            }
        } catch (e) {}
        return 0; // fallback para track 0
    }

    function findAudioTrackIndex(sequence, referenceItem) {
        try {
            for (var t = 0; t < sequence.audioTracks.numTracks; t++) {
                var track = sequence.audioTracks[t];
                for (var c = 0; c < track.clips.numItems; c++) {
                    var cl = track.clips[c];
                    if (cl.projectItem && cl.projectItem.nodeId === referenceItem.nodeId) {
                        return t;
                    }
                }
            }
        } catch (e) {}
        return 0;
    }

    // ==================== CREATE SEQUENCE ====================

    function createSequence(name, referenceItem) {
        var project = app.project;
        try {
            var newSeq = project.createNewSequenceFromClips(name, [referenceItem], project.rootItem);
            if (newSeq) {
                project.openSequence(newSeq.sequenceID);
                project.activeSequence = newSeq;
                try {
                    var track = newSeq.videoTracks[0];
                    for (var i = track.clips.numItems - 1; i >= 0; i--) track.clips[i].remove(false, false);
                    var atrack = newSeq.audioTracks[0];
                    for (var j = atrack.clips.numItems - 1; j >= 0; j--) atrack.clips[j].remove(false, false);
                } catch (e) {}
                return newSeq;
            }
        } catch (e) {}
        try { qe.project.newSequence(name, null); return app.project.activeSequence; } catch (e2) {}
        return app.project.activeSequence;
    }

    function setLabelColor(projectItem, colorIdx) {
        try { projectItem.setColorLabel(colorIdx); return true; }
        catch (e) {
            try { projectItem.label = colorIdx; return true; }
            catch (e2) { return false; }
        }
    }

    // ==================== INSERT SUBCLIP RANGE ====================

    function insertSubclipRange(referenceItem, sequence, startSec, endSec, offsetSec, colorIdx) {
        var itemDur = getItemDuration(referenceItem);
        var clamped = clampToItemDuration(startSec, endSec, itemDur);
        if (!clamped) {
            $.writeln('[FV] insertSubclipRange: clamp falhou start=' + startSec + ' end=' + endSec + ' dur=' + itemDur);
            return false;
        }
        startSec  = clamped.start;
        endSec    = clamped.end;
        offsetSec = Math.max(0, parseFloat(offsetSec));

        var vTrackIdx = findTrackIndex(sequence, referenceItem);
        $.writeln('[FV] insertSubclipRange: track=' + vTrackIdx + ' start=' + startSec + ' end=' + endSec + ' offset=' + offsetSec);

        SUBCLIP_COUNTER++;
        var subName = 'FV_' + SUBCLIP_COUNTER + '_' + startSec.toFixed(1) + '-' + endSec.toFixed(1);

        $.writeln('[FV] insertSubclipRange: inserindo APENAS no video track (áudio segue vinculado)');

        // Tenta createSubClip (ticks como STRING — documentação Adobe)
        try {
            var sub = referenceItem.createSubClip(subName, ticksStr(startSec), ticksStr(endSec), 0, 1, 1);
            if (sub) {
                if (typeof colorIdx === 'number') setLabelColor(sub, colorIdx);
                sequence.videoTracks[vTrackIdx].insertClip(sub, offsetSec);
                return true;
            }
        } catch (e) {
            $.writeln('[FV] createSubClip falhou: ' + e.message);
        }

        // Fallback: overwriteClip com in/out explícitos (somente video track)
        try {
            sequence.videoTracks[vTrackIdx].overwriteClip(referenceItem, offsetSec, ticksStr(startSec), ticksStr(endSec));
            return true;
        } catch (e2) {
            $.writeln('[FV] overwriteClip falhou: ' + e2.message);
            return false;
        }
    }

    function insertFullClip(referenceItem, sequence, offsetSec) {
        offsetSec = Math.max(0, parseFloat(offsetSec));
        var vTrackIdx = findTrackIndex(sequence, referenceItem);
        $.writeln('[FV] insertFullClip: inserindo APENAS no video track (áudio segue vinculado)');
        try {
            sequence.videoTracks[vTrackIdx].insertClip(referenceItem, offsetSec);
            return true;
        } catch (e) {
            $.writeln('[FV] insertFullClip falhou: ' + e.message);
            return false;
        }
    }

    // ==================== EDIT EXISTING TIMELINE ====================

    function editExistingTimeline(referenceItem, sequence, payload) {
        var editsApplied = 0;
        var groupCount = 0;
        var itemDur = getItemDuration(referenceItem);

        try { app.enableQE(); } catch (e) {}

        var cuts = [];

        if (payload.mode === 'compilation') {
            for (var v = 0; v < payload.items.length; v++) {
                var variation = payload.items[v];
                var vColor = LABEL_COLORS[groupCount % LABEL_COLORS.length];
                var any = false;
                for (var c = 0; c < (variation.clips || []).length; c++) {
                    var clip = variation.clips[c];
                    var clamped = clampToItemDuration(clip.start, clip.end, itemDur);
                    if (clamped) { cuts.push({ start: clamped.start, end: clamped.end, color: vColor }); any = true; }
                    else $.writeln('[FV] editExisting: clip compilation inválido, ignorado');
                }
                if (any) groupCount++;
            }
        } else {
            for (var i = 0; i < payload.items.length; i++) {
                var item = payload.items[i];
                var cl = clampToItemDuration(item.start, item.end, itemDur);
                if (cl) {
                    cuts.push({ start: cl.start, end: cl.end, color: LABEL_COLORS[groupCount % LABEL_COLORS.length] });
                    groupCount++;
                } else {
                    $.writeln('[FV] editExisting: item continuous inválido, ignorado');
                }
            }
        }

        if (!cuts.length) return { inserted: 0, groups: 0, remainingAppended: false };

        // Razor via QE DOM
        var razorPoints = {};
        for (var k = 0; k < cuts.length; k++) {
            razorPoints[cuts[k].start.toFixed(3)] = cuts[k].start;
            razorPoints[cuts[k].end.toFixed(3)]   = cuts[k].end;
        }
        var qSeq = null;
        try { qSeq = qe.project.getActiveSequence(); } catch (e) {}

        for (var key in razorPoints) {
            if (razorPoints.hasOwnProperty(key)) {
                try {
                    if (qSeq) {
                        var track = qSeq.getVideoTrackAt(findTrackIndex(sequence, referenceItem));
                        if (track && track.razor) track.razor(String(razorPoints[key]));
                        var atr = qSeq.getAudioTrackAt(findAudioTrackIndex(sequence, referenceItem));
                        if (atr && atr.razor) atr.razor(String(razorPoints[key]));
                    }
                } catch (e) {
                    $.writeln('[FV] razor falhou em ' + razorPoints[key] + ': ' + e.message);
                }
            }
        }

        // Pinta os clipes que caem nos ranges escolhidos
        try {
            var vTrack = sequence.videoTracks[findTrackIndex(sequence, referenceItem)];
            for (var n = 0; n < vTrack.clips.numItems; n++) {
                var tClip = vTrack.clips[n];
                var clipStart = parseFloat(tClip.start.seconds);
                var clipEnd   = parseFloat(tClip.end.seconds);
                for (var m = 0; m < cuts.length; m++) {
                    var cut = cuts[m];
                    if (clipStart >= cut.start - 0.05 && clipEnd <= cut.end + 0.05) {
                        try {
                            if (tClip.projectItem) setLabelColor(tClip.projectItem, cut.color);
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

        return { inserted: editsApplied, groups: groupCount, remainingAppended: false, mode: 'edit-timeline' };
    }

    // ==================== INSERT ITEMS ====================

    return {
        createSequence: createSequence,
        editExistingTimeline: editExistingTimeline,

        insertItems: function(referenceItem, sequence, payload) {
            SUBCLIP_COUNTER = 0;
            var inserted = 0;
            var offsetSec = 0;
            var groupCount = 0;
            var appendRemaining = payload.appendRemaining !== false;
            var itemDur = getItemDuration(referenceItem);

            $.writeln('[FV] insertItems: modo=' + payload.mode + ' dur=' + itemDur + 's');
            $.writeln('[FV] insertItems iniciado com ' + payload.items.length + ' itens');
            for (var _i = 0; _i < payload.items.length; _i++) {
                var _it = payload.items[_i];
                if (_it.clips) {
                    $.writeln('[FV]   Grupo ' + _i + ': ' + _it.clips.length + ' clips');
                } else {
                    $.writeln('[FV]   Item ' + _i + ': ' + _it.start + '-' + _it.end);
                }
            }

            function makeKey(s, e) {
                return Math.round(s * 100) + '-' + Math.round(e * 100);
            }
            var insertedKeys = {};

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
                        var clamped = clampToItemDuration(clip.start, clip.end, itemDur);
                        if (!clamped) { $.writeln('[FV] clip compilation ignorado: fora dos limites'); continue; }
                        var key = makeKey(clamped.start, clamped.end);
                        if (insertedKeys[key]) {
                            $.writeln('[FV] Ignorando duplicata start=' + clamped.start + ' end=' + clamped.end);
                            continue;
                        }
                        insertedKeys[key] = true;
                        if (insertSubclipRange(referenceItem, sequence, clamped.start, clamped.end, offsetSec, groupColor)) {
                            offsetSec += (clamped.end - clamped.start);
                            inserted++;
                            groupInsertedAny = true;
                        }
                    }
                    if (groupInsertedAny) { offsetSec += GAP_BETWEEN_GROUPS_SEC; groupCount++; }
                }
            } else {
                for (var i = 0; i < payload.items.length; i++) {
                    var item = payload.items[i];
                    var cl = clampToItemDuration(item.start, item.end, itemDur);
                    if (!cl) { $.writeln('[FV] item continuous ignorado: fora dos limites'); continue; }
                    var keyC = makeKey(cl.start, cl.end);
                    if (insertedKeys[keyC]) {
                        $.writeln('[FV] Ignorando duplicata start=' + cl.start + ' end=' + cl.end);
                        continue;
                    }
                    insertedKeys[keyC] = true;
                    var col = LABEL_COLORS[groupCount % LABEL_COLORS.length];
                    if (insertSubclipRange(referenceItem, sequence, cl.start, cl.end, offsetSec, col)) {
                        offsetSec += (cl.end - cl.start) + GAP_BETWEEN_GROUPS_SEC;
                        inserted++;
                        groupCount++;
                    }
                }
            }

            if (appendRemaining && inserted > 0) {
                var finalOffset = offsetSec + GAP_BEFORE_REMAINING_SEC - GAP_BETWEEN_GROUPS_SEC;
                insertFullClip(referenceItem, sequence, finalOffset);
            }

            $.writeln('[FV] insertItems concluído: ' + inserted + ' inseridos');
            return { inserted: inserted, groups: groupCount, remainingAppended: appendRemaining && inserted > 0 };
        }
    };
})();
