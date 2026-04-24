/**
 * FASTVIDEO Engines v1.7
 * Motor 1: buildFullSpeechCandidates() — gera candidatos contínuos para modo "Extrair falas"
 * Motor 2: buildNarrativeBlocks()      — gera blocos para modo "Criar vídeos"
 * A IA recebe candidatos/blocos e retorna apenas IDs.
 * O código resolve IDs → timestamps reais.
 */
(function() {

    // ==================== STOP WORDS PT-BR ====================

    const STOP_WORDS = new Set([
        'a','o','as','os','um','uma','uns','umas','de','da','do','das','dos',
        'em','na','no','nas','nos','por','para','com','que','e','ou','se',
        'mas','mais','muito','bem','já','não','sim','é','era','são','foi',
        'ser','ter','ir','me','te','nos','vos','lhe','lhes','eu','tu','ele',
        'ela','nós','eles','elas','isso','esse','essa','este','esta','isto',
        'aquele','aquela','aquilo','quando','como','porque','então','aí','né',
        'pois','assim','tipo','bom','tá','tô'
    ]);

    // ==================== PADRÕES DE TEXTO ====================

    const WEAK_STARTERS = /^(então\s|aí\s|e\s|mas\s|porém\s|né\s|pois\s|assim\s|tipo\s|ó\s|bom\s|bem\s|tá\s|que\s)/i;
    const IMPACT_WORDS = /\b(falir|erro|verdade|mentira|segredo|riqueza|sucesso|fracasso|perder|ganhar|mudar|crise|oportunidade|diferença|fundamental|essencial|incrível|revolucionário|nunca|sempre|todo|todos|ninguém|jamais|impossível)\b/i;
    const CONCLUSION_PHRASES = /\b(portanto|por isso|então|afinal|resumindo|concluindo|em suma|no final|ao final|isso significa|isso prova|isso mostra|percebe|entende)\b/i;
    const CTA_PATTERNS = /\b(você deve|você precisa|faça|comece|tente|experimente|aplique|use|utilize|descubra|aprenda|invista|busque|se inscreva|acompanhe|siga)\b/i;
    const EMOTION_WORDS = /\b(incrível|fantástico|absurdo|chocante|surpreendente|emocionante|devastador|poderoso|transformador|urgente|crítico|perigoso|arriscado|impactante|revelador|assustador|motivador|inspirador|revoltante|impressionante)\b/i;
    const SENTENCE_END = /[.!?]$/;

    // ==================== SCORING HELPERS ====================

    const scoreHook = (text) => {
        const t = text.trim();
        let s = 0;
        if (/\?/.test(t)) s += 2.5;
        if (/!/.test(t)) s += 1.5;
        if (IMPACT_WORDS.test(t)) s += 2;
        if (/você|te|teu|sua|seu\b/i.test(t)) s += 1.5;
        if (/por que|como|o que|quando|qual\b/i.test(t)) s += 1;
        if (/\d/.test(t)) s += 1;
        if (WEAK_STARTERS.test(t)) s -= 2;
        return Math.max(0, Math.min(10, s));
    };

    const scoreClarity = (text) => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length === 0) return 0;
        const avgWps = words.length / sentences.length;
        let s = 0;
        if (avgWps >= 5 && avgWps <= 20) s += 4;
        else if (avgWps > 20 && avgWps <= 30) s += 2;
        else if (avgWps < 5) s += 1;
        if (SENTENCE_END.test(text.trim())) s += 3;
        if (words.length >= 10) s += 2;
        if (words.length >= 30) s += 1;
        return Math.max(0, Math.min(10, s));
    };

    const scoreDensity = (text, dur) => {
        if (!dur || dur <= 0) return 5;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const wps = words / dur;
        if (wps >= 2 && wps <= 3.5) return 10;
        if (wps >= 1.5 && wps < 2) return 7;
        if (wps > 3.5 && wps <= 5) return 7;
        if (wps >= 1 && wps < 1.5) return 4;
        if (wps > 5) return 3;
        return 1;
    };

    const scoreConclusion = (text) => {
        const t = text.trim();
        let s = 0;
        if (CONCLUSION_PHRASES.test(t)) s += 4;
        if (CTA_PATTERNS.test(t)) s += 3;
        if (SENTENCE_END.test(t)) s += 2;
        if (/!$/.test(t)) s += 1;
        return Math.max(0, Math.min(10, s));
    };

    const scoreKeywords = (text, kws) => {
        if (!kws || kws.length === 0) return 5;
        const lower = text.toLowerCase();
        let hits = 0;
        for (const kw of kws) {
            if (lower.includes(kw.toLowerCase())) hits++;
        }
        return Math.min(10, Math.round((hits / kws.length) * 10));
    };

    const scoreEmotion = (text) => {
        let s = 0;
        if (EMOTION_WORDS.test(text)) s += 4;
        if (IMPACT_WORDS.test(text)) s += 3;
        if (/!/.test(text)) s += 2;
        if (/\?/.test(text)) s += 1;
        return Math.max(0, Math.min(10, s));
    };

    const classifyRoles = (text) => {
        const roles = [];
        if (scoreHook(text) >= 6) roles.push('hook');
        if (CONCLUSION_PHRASES.test(text)) roles.push('payoff');
        if (CTA_PATTERNS.test(text)) roles.push('cta');
        if (IMPACT_WORDS.test(text)) roles.push('proof');
        if (/mas\s|porém\s|embora\s|apesar\s|contudo\s/i.test(text)) roles.push('contrast');
        if (/por\s+exemplo|como\s+por|por\s+isso|contexto\s/i.test(text)) roles.push('context');
        if (roles.length === 0) roles.push('body');
        return roles;
    };

    const extractTopicTags = (text) => {
        const words = text.toLowerCase()
            .replace(/[^a-záéíóúâêîôûãõàèìòùç\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !STOP_WORDS.has(w));
        const freq = {};
        for (const w of words) freq[w] = (freq[w] || 0) + 1;
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(e => e[0]);
    };

    const extractKeywords = (briefing) => {
        if (!briefing) return [];
        return briefing.toLowerCase()
            .replace(/[^a-záéíóúâêîôûãõàèìòùç\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !STOP_WORDS.has(w));
    };

    // ==================== MOTOR 1: buildFullSpeechCandidates ====================

    function buildFullSpeechCandidates(segments, opts) {
        opts = opts || {};
        const durMin = opts.durMin || 15;
        const durMax = opts.durMax || 90;
        const brief  = opts.brief || '';
        const kws    = extractKeywords(brief);

        const segs = (segments || []).filter(s =>
            s && typeof s.start === 'number' && typeof s.end === 'number' &&
            s.end > s.start && s.text && s.text.trim().length > 0
        );

        if (segs.length === 0) {
            console.warn('[FASTVIDEO] buildFullSpeechCandidates: nenhum segmento válido');
            return [];
        }

        const candidates = [];

        for (let i = 0; i < segs.length; i++) {
            // Pula inícios fracos
            if (WEAK_STARTERS.test(segs[i].text.trim())) continue;

            let textAcc    = '';
            let segIds     = [];
            let prevJ      = -1;

            for (let j = i; j < segs.length; j++) {
                const seg = segs[j];
                textAcc = textAcc ? textAcc + ' ' + seg.text.trim() : seg.text.trim();
                segIds.push(seg.id !== undefined ? seg.id : j);

                const dur = seg.end - segs[i].start;
                if (dur < durMin) continue;
                if (dur > durMax) break;

                // Gera candidato apenas em fronteira de sentença ou a cada 3 segmentos válidos após o mínimo
                const isSentenceBoundary = SENTENCE_END.test(seg.text.trim());
                const everyThree = (j - i + 1) % 3 === 0;

                if (!isSentenceBoundary && !everyThree) continue;
                if (j === prevJ) continue;
                prevJ = j;

                const start = segs[i].start;
                const end   = seg.end;

                const hook_score       = scoreHook(textAcc);
                const clarity_score    = scoreClarity(textAcc);
                const density_score    = scoreDensity(textAcc, dur);
                const conclusion_score = scoreConclusion(textAcc);
                const keyword_score    = scoreKeywords(textAcc, kws);

                candidates.push({
                    start,
                    end,
                    duration: dur,
                    text: textAcc,
                    segment_ids: [...segIds],
                    type: 'full_speech',
                    hook_score,
                    clarity_score,
                    density_score,
                    conclusion_score,
                    keyword_score,
                    _combined: (hook_score + clarity_score + density_score + conclusion_score + keyword_score) / 5
                });
            }
        }

        console.log('[FASTVIDEO] buildFullSpeechCandidates: candidatos antes de deduplicação:', candidates.length);

        // Deduplicação por sobreposição temporal >70% do menor
        const kept = [];
        candidates.sort((a, b) => b._combined - a._combined);

        for (const c of candidates) {
            let overlaps = false;
            for (const k of kept) {
                const overlapStart = Math.max(c.start, k.start);
                const overlapEnd   = Math.min(c.end, k.end);
                const overlapDur   = Math.max(0, overlapEnd - overlapStart);
                const minDur       = Math.min(c.duration, k.duration);
                if (minDur > 0 && overlapDur / minDur > 0.70) {
                    overlaps = true;
                    break;
                }
            }
            if (!overlaps) kept.push(c);
        }

        console.log('[FASTVIDEO] buildFullSpeechCandidates: candidatos após deduplicação:', kept.length);

        // Limita a 40, ordena por combined score
        const final = kept
            .sort((a, b) => b._combined - a._combined)
            .slice(0, 40);

        // Atribui IDs e remove campo interno
        final.forEach((c, i) => {
            c.id = 'speech_' + String(i + 1).padStart(3, '0');
            delete c._combined;
        });

        console.log('[FASTVIDEO] buildFullSpeechCandidates: candidatos finais:', final.length);
        return final;
    }

    // ==================== MOTOR 2: buildNarrativeBlocks ====================

    function buildNarrativeBlocks(segments, opts) {
        opts = opts || {};
        const blockDurMin = opts.blockDurMin || 3;
        const blockDurMax = opts.blockDurMax || 20;
        const brief       = opts.brief || '';
        const kws         = extractKeywords(brief);

        const segs = (segments || []).filter(s =>
            s && typeof s.start === 'number' && typeof s.end === 'number' &&
            s.end > s.start && s.text && s.text.trim().length > 0
        );

        if (segs.length === 0) {
            console.warn('[FASTVIDEO] buildNarrativeBlocks: nenhum segmento válido');
            return [];
        }

        const blocks = [];

        // Gera blocos de 1, 2, 3 segmentos consecutivos
        for (let i = 0; i < segs.length; i++) {
            for (let len = 1; len <= 3; len++) {
                const j = i + len - 1;
                if (j >= segs.length) break;

                const start = segs[i].start;
                const end   = segs[j].end;
                const dur   = end - start;

                if (dur < blockDurMin || dur > blockDurMax) continue;

                const text = segs.slice(i, j + 1).map(s => s.text.trim()).join(' ');
                const segIds = segs.slice(i, j + 1).map((s, idx) => s.id !== undefined ? s.id : i + idx);

                const hook_score    = scoreHook(text);
                const clarity_score = scoreClarity(text);
                const emotion_score = scoreEmotion(text);
                const keyword_score = scoreKeywords(text, kws);
                const avgScore      = (hook_score + clarity_score + emotion_score + keyword_score) / 4;

                // Filtra blocos muito genéricos
                if (avgScore < 4) continue;

                blocks.push({
                    start,
                    end,
                    duration: dur,
                    text,
                    segment_ids: segIds,
                    role_candidates: classifyRoles(text),
                    topic_tags: extractTopicTags(text),
                    hook_score,
                    clarity_score,
                    emotion_score,
                    keyword_score,
                    _combined: avgScore
                });
            }
        }

        console.log('[FASTVIDEO] buildNarrativeBlocks: blocos antes de deduplicação:', blocks.length);

        // Ordena por combined score, limita a 80
        blocks.sort((a, b) => b._combined - a._combined);
        const final = blocks.slice(0, 80);

        // Atribui IDs e remove campo interno
        final.forEach((b, i) => {
            b.id = 'block_' + String(i + 1).padStart(3, '0');
            delete b._combined;
        });

        console.log('[FASTVIDEO] buildNarrativeBlocks: blocos finais:', final.length);
        return final;
    }

    // ==================== VALIDAÇÃO ====================

    function validateSpeechSelection(aiSelected, candidatesMap) {
        if (!Array.isArray(aiSelected)) {
            console.warn('[FASTVIDEO] validateSpeechSelection: aiSelected não é array');
            return [];
        }

        const seen = new Set();
        const valid = [];

        for (const item of aiSelected) {
            const id = item.candidate_id;

            if (!id || !candidatesMap.has(id)) {
                console.warn('[FASTVIDEO] validateSpeechSelection: candidate_id inválido ou inexistente:', id);
                continue;
            }
            if (seen.has(id)) {
                console.warn('[FASTVIDEO] validateSpeechSelection: candidate_id duplicado:', id);
                continue;
            }

            const candidate = candidatesMap.get(id);
            const score = Number(item.score);

            if (!isFinite(score) || score < 5) {
                console.warn('[FASTVIDEO] validateSpeechSelection: score < 5 para', id, ':', score);
                continue;
            }

            seen.add(id);
            valid.push({
                candidate_id:  id,
                score,
                label:         item.label        || '',
                headline:      item.headline      || '',
                hook:          item.hook          || '',
                reason:        item.reason        || '',
                caption:       item.caption       || '',
                onscreen_text: item.onscreen_text || '',
                // Fonte de verdade: timestamps do candidato original
                start:    candidate.start,
                end:      candidate.end,
                duration: candidate.duration,
                text:     candidate.text
            });
        }

        valid.sort((a, b) => b.score - a.score);
        console.log('[FASTVIDEO] validateSpeechSelection: válidos:', valid.length, '/ recebidos:', aiSelected.length);
        return valid;
    }

    function validateNarrativeVideos(aiVideos, blocksMap, opts) {
        opts = opts || {};
        const durMin = opts.durMin || 15;
        const durMax = opts.durMax || 90;

        if (!Array.isArray(aiVideos)) {
            console.warn('[FASTVIDEO] validateNarrativeVideos: aiVideos não é array');
            return [];
        }

        const valid = [];

        for (const video of aiVideos) {
            const score = Number(video.score);

            if (!isFinite(score) || score < 5) {
                console.warn('[FASTVIDEO] validateNarrativeVideos: score < 5 para vídeo:', video.id, ':', score);
                continue;
            }

            if (!Array.isArray(video.clips) || video.clips.length === 0) {
                console.warn('[FASTVIDEO] validateNarrativeVideos: vídeo sem clips:', video.id);
                continue;
            }

            // Valida clips: verifica se block_id existe
            const validClips = [];
            for (const clip of video.clips) {
                const bid = clip.block_id;
                if (!bid || !blocksMap.has(bid)) {
                    console.warn('[FASTVIDEO] validateNarrativeVideos: block_id inválido:', bid);
                    continue;
                }
                const block = blocksMap.get(bid);
                validClips.push({
                    block_id: bid,
                    role:     clip.role || 'body',
                    // Fonte de verdade: timestamps do bloco original
                    start:    block.start,
                    end:      block.end,
                    duration: block.duration,
                    text:     block.text
                });
            }

            if (validClips.length < 2) {
                console.warn('[FASTVIDEO] validateNarrativeVideos: menos de 2 clips válidos para vídeo:', video.id);
                continue;
            }

            // Soma duração real dos blocos
            let totalDur = validClips.reduce((acc, c) => acc + c.duration, 0);

            if (totalDur < durMin) {
                console.warn('[FASTVIDEO] validateNarrativeVideos: duração total', totalDur.toFixed(1), '< durMin', durMin, 'para vídeo:', video.id);
                continue;
            }

            // Trunca pelo fim se > durMax
            if (totalDur > durMax) {
                let acc = 0;
                const truncated = [];
                for (const clip of validClips) {
                    if (acc + clip.duration <= durMax) {
                        truncated.push(clip);
                        acc += clip.duration;
                    } else {
                        console.warn('[FASTVIDEO] validateNarrativeVideos: truncando clip', clip.block_id, 'para respeitar durMax', durMax);
                        break;
                    }
                }
                if (truncated.length < 2) {
                    console.warn('[FASTVIDEO] validateNarrativeVideos: após truncamento sobrou < 2 clips para vídeo:', video.id);
                    continue;
                }
                totalDur = truncated.reduce((acc, c) => acc + c.duration, 0);
                validClips.length = 0;
                validClips.push(...truncated);
            }

            valid.push({
                id:            video.id           || '',
                score,
                label:         video.label         || '',
                headline:      video.headline       || '',
                hook:          video.hook           || '',
                reason:        video.reason         || '',
                caption:       video.caption        || '',
                onscreen_text: video.onscreen_text  || '',
                totalDuration: totalDur,
                clips: validClips
            });
        }

        valid.sort((a, b) => b.score - a.score);
        console.log('[FASTVIDEO] validateNarrativeVideos: válidos:', valid.length, '/ recebidos:', aiVideos.length);
        return valid;
    }

    // ==================== REFINE HELPERS ====================

    const combinedSpeechScore = (c) => {
        const h = Number(c.hook_score) || 0;
        const cl = Number(c.clarity_score) || 0;
        const d = Number(c.density_score) || 0;
        const co = Number(c.conclusion_score) || 0;
        const kw = Number(c.keyword_score) || 0;
        return (h + cl + d + co + kw) / 5;
    };

    const combinedBlockScore = (b) => {
        const h = Number(b.hook_score) || 0;
        const cl = Number(b.clarity_score) || 0;
        const e = Number(b.emotion_score) || 0;
        const kw = Number(b.keyword_score) || 0;
        return (h + cl + e + kw) / 4;
    };

    const temporalOverlapRatio = (a, b) => {
        const overlapStart = Math.max(a.start, b.start);
        const overlapEnd = Math.min(a.end, b.end);
        const overlap = Math.max(0, overlapEnd - overlapStart);
        const minDur = Math.min(a.duration || (a.end - a.start), b.duration || (b.end - b.start));
        if (!minDur || minDur <= 0) return 0;
        return overlap / minDur;
    };

    const shareSegmentIds = (a, b) => {
        const sa = new Set(a.segment_ids || []);
        for (const id of (b.segment_ids || [])) {
            if (sa.has(id)) return true;
        }
        return false;
    };

    const tagsOverlapCount = (tagsA, tagsB) => {
        if (!tagsA || !tagsB) return 0;
        const setA = new Set(tagsA);
        let n = 0;
        for (const t of tagsB) if (setA.has(t)) n++;
        return n;
    };

    function findSpeechAlternatives(currentCandidate, allCandidates, action, topN = 12) {
        if (!currentCandidate || !Array.isArray(allCandidates)) {
            console.warn('[FASTVIDEO] findSpeechAlternatives: argumentos inválidos');
            return [];
        }

        const pool = allCandidates.filter(c => c && c.id !== currentCandidate.id);
        const sortedByScore = [...pool].sort((a, b) => combinedSpeechScore(b) - combinedSpeechScore(a));

        let filtered = [];

        if (action === 'refine') {
            filtered = pool.filter(c => {
                const overlap = temporalOverlapRatio(currentCandidate, c);
                const shared = shareSegmentIds(currentCandidate, c);
                return overlap > 0.3 || shared;
            });
            filtered.sort((a, b) => combinedSpeechScore(b) - combinedSpeechScore(a));
        } else if (action === 'new-hook') {
            filtered = pool.filter(c => {
                return Math.abs(c.end - currentCandidate.end) < 10 && c.start < currentCandidate.start;
            });
            if (filtered.length === 0) {
                filtered = pool.filter(c =>
                    Math.abs(c.start - currentCandidate.start) < 20 &&
                    (Number(c.hook_score) || 0) >= 6
                );
            }
            filtered.sort((a, b) => (Number(b.hook_score) || 0) - (Number(a.hook_score) || 0));
        } else if (action === 'variation') {
            const currentTags = extractTopicTags(currentCandidate.text || '');
            const withOverlap = [];
            const highScoreNoOverlap = [];
            for (const c of pool) {
                const cTags = extractTopicTags(c.text || '');
                const overlap = tagsOverlapCount(currentTags, cTags);
                const temporal = temporalOverlapRatio(currentCandidate, c);
                if (overlap >= 1) {
                    withOverlap.push({ c, overlap });
                } else if (temporal === 0 && combinedSpeechScore(c) >= 5) {
                    highScoreNoOverlap.push(c);
                }
            }
            withOverlap.sort((a, b) => {
                if (b.overlap !== a.overlap) return b.overlap - a.overlap;
                return combinedSpeechScore(b.c) - combinedSpeechScore(a.c);
            });
            highScoreNoOverlap.sort((a, b) => combinedSpeechScore(b) - combinedSpeechScore(a));
            const seen = new Set();
            filtered = [];
            for (const entry of withOverlap) {
                if (!seen.has(entry.c.id)) { seen.add(entry.c.id); filtered.push(entry.c); }
            }
            for (const c of highScoreNoOverlap) {
                if (!seen.has(c.id)) { seen.add(c.id); filtered.push(c); }
            }
        } else {
            console.warn('[FASTVIDEO] findSpeechAlternatives: action desconhecida:', action);
            filtered = sortedByScore;
        }

        if (filtered.length === 0) {
            console.log('[FASTVIDEO] findSpeechAlternatives: fallback (action:', action + ')');
            return sortedByScore.slice(0, topN);
        }

        const result = filtered.slice(0, topN);
        console.log('[FASTVIDEO] findSpeechAlternatives: action=' + action, 'encontradas:', result.length);
        return result;
    }

    function findNarrativeAlternatives(currentVideo, allBlocks, action, topN = 20) {
        if (!currentVideo || !Array.isArray(allBlocks)) {
            console.warn('[FASTVIDEO] findNarrativeAlternatives: argumentos inválidos');
            return [];
        }

        const usedIds = new Set((currentVideo.clips || []).map(c => c.block_id).filter(Boolean));
        const pool = allBlocks.filter(b => b && !usedIds.has(b.id));
        const sortedByScore = [...pool].sort((a, b) => combinedBlockScore(b) - combinedBlockScore(a));

        let filtered = [];

        if (action === 'refine') {
            const usedTags = new Set();
            for (const clip of (currentVideo.clips || [])) {
                const src = clip.topic_tags || extractTopicTags(clip.text || '');
                for (const t of src) usedTags.add(t);
            }
            filtered = pool.filter(b => {
                const tags = b.topic_tags || [];
                for (const t of tags) if (usedTags.has(t)) return true;
                return false;
            });
            filtered.sort((a, b) => combinedBlockScore(b) - combinedBlockScore(a));
        } else if (action === 'new-hook') {
            filtered = pool.filter(b =>
                Array.isArray(b.role_candidates) &&
                b.role_candidates.includes('hook') &&
                (Number(b.hook_score) || 0) >= 6
            );
            filtered.sort((a, b) => (Number(b.hook_score) || 0) - (Number(a.hook_score) || 0));
        } else if (action === 'variation') {
            const usedTags = new Set();
            for (const clip of (currentVideo.clips || [])) {
                const src = clip.topic_tags || extractTopicTags(clip.text || '');
                for (const t of src) usedTags.add(t);
            }
            const withOverlap = [];
            const payoffCta = [];
            for (const b of pool) {
                const tags = b.topic_tags || [];
                let hasOverlap = false;
                for (const t of tags) if (usedTags.has(t)) { hasOverlap = true; break; }
                if (hasOverlap) withOverlap.push(b);
                const roles = b.role_candidates || [];
                if (roles.includes('payoff') || roles.includes('cta')) payoffCta.push(b);
            }
            withOverlap.sort((a, b) => combinedBlockScore(b) - combinedBlockScore(a));
            payoffCta.sort((a, b) => combinedBlockScore(b) - combinedBlockScore(a));
            const seen = new Set();
            filtered = [];
            for (const b of withOverlap) {
                if (!seen.has(b.id)) { seen.add(b.id); filtered.push(b); }
            }
            for (const b of payoffCta) {
                if (!seen.has(b.id)) { seen.add(b.id); filtered.push(b); }
            }
        } else {
            console.warn('[FASTVIDEO] findNarrativeAlternatives: action desconhecida:', action);
            filtered = sortedByScore;
        }

        if (filtered.length === 0) {
            console.log('[FASTVIDEO] findNarrativeAlternatives: fallback (action:', action + ')');
            return sortedByScore.slice(0, topN);
        }

        filtered.sort((a, b) => combinedBlockScore(b) - combinedBlockScore(a));
        const result = filtered.slice(0, topN);
        console.log('[FASTVIDEO] findNarrativeAlternatives: action=' + action, 'encontradas:', result.length);
        return result;
    }

    // ==================== EXPORT ====================

    window.Engines = {
        buildFullSpeechCandidates,
        buildNarrativeBlocks,
        validateSpeechSelection,
        validateNarrativeVideos,
        findSpeechAlternatives,
        findNarrativeAlternatives
    };

})();
