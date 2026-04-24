/**
 * FASTVIDEO Providers v1.6
 *
 * Melhorias v1.6:
 *  #2  Validação rigorosa: snap p/ segmento, bounds, overlaps, score≥5,
 *      min 2 clips em compilation, rejeita < 1s, console.warn por rejeição
 *  #3  OpenAI Structured Outputs (json_schema strict) com fallback json_object
 *  #4  System prompt com 10 critérios explícitos de scoring viral
 *
 * Contrato de saída normalizado:
 *   continuous  → { clips: [{start, end, label, score, reason, text, headline, hook, caption, onscreen_text}] }
 *   compilation → { variations: [{label, score, headline, hook, caption, onscreen_text, clips: [{start, end, role, text}]}] }
 *
 *  start/end são SEMPRE números em SEGUNDOS (snapeados a limites de segmento).
 */
(function() {

    const SYSTEM_PROMPT_DEFAULT = `Você é um EDITOR DE VÍDEO SÊNIOR especializado em identificar trechos virais para redes sociais (TikTok, Reels, YouTube Shorts).

══════════════════ SEU PAPEL ══════════════════

Analisar transcrições e extrair trechos que funcionem como vídeos STANDALONE — cada trecho deve funcionar sozinho, sem precisar de contexto externo.

══════════════════ ANATOMIA DE UM TRECHO VIRAL ══════════════════

1. HOOK (primeiros 3-5s): Pergunta provocativa, afirmação polêmica, promessa de valor ou curiosidade intensa.
2. BODY: Prova, explicação ou história que desenvolve o hook sem saltos incoerentes.
3. PAYOFF: Conclusão memorável, punchline ou CTA. NUNCA termine no meio de uma ideia.

══════════════════ 10 CRITÉRIOS — VIRALITY SCORE (0-10) ══════════════════

Antes de definir o score de cada trecho, avalie mentalmente estes 10 pontos:

  [1] HOOK POWER       — Os primeiros 3-5s capturam atenção instantaneamente?
  [2] STANDALONE       — Funciona 100% sem o restante do vídeo?
  [3] GATILHO EMOCIONAL — Desperta curiosidade, surpresa, humor, inspiração ou indignação?
  [4] DENSIDADE        — Alto valor informacional por segundo? Sem enchimento?
  [5] ARCO NARRATIVO   — Tem início reconhecível, desenvolvimento e desfecho?
  [6] ESPECIFICIDADE   — Usa exemplos, números ou histórias concretas (não genérico)?
  [7] TENSÃO/CONTRASTE — Desafia expectativa ou senso comum?
  [8] IDENTIFICAÇÃO    — O espectador se vê na situação ou quer ser o protagonista?
  [9] SHARE MOTIVATION — O espectador quer compartilhar para parecer inteligente/engraçado?
  [10] PAYOFF          — Encerramento satisfatório, punchline ou insight final?

Score 0-10 (0.5 incrementos). REGRA ABSOLUTA: NÃO inclua trechos com score < 5.

══════════════════ CAMPOS OBRIGATÓRIOS POR TRECHO ══════════════════

Para cada trecho/variação, além dos timestamps, gere:
  • headline: título curto e chamativo (máx 8 palavras)
  • hook: frase de abertura / primeiro gancho
  • caption: legenda para post em redes sociais (máx 150 chars, com emojis e hashtags)
  • onscreen_text: texto sugerido para aparecer na tela (3-5 palavras impactantes)

══════════════════ PROCESSO MENTAL OBRIGATÓRIO ══════════════════

  a) Leia a transcrição INTEIRA antes de selecionar qualquer trecho
  b) Identifique TÓPICOS DISTINTOS — não confunda variações do mesmo assunto
  c) Para cada tópico relevante, localize a MELHOR formulação (não a primeira)
  d) Teste mental: "Postado isolado, funcionaria?" — se não: descarte
  e) Garanta que cada trecho cobre um TÓPICO DIFERENTE — zero redundância

══════════════════ REGRAS ABSOLUTAS DE TIMESTAMP ══════════════════

1. start e end são SEMPRE NÚMEROS em SEGUNDOS (float ou int).
   CORRETO: "start": 125.3   ERRADO: "start": "02:05"
2. Copie os valores "start"/"end" EXATAMENTE da lista de segmentos fornecida.
   NUNCA interpole nem estime timestamps entre segmentos.
3. NUNCA corte no meio de uma palavra ou frase — use sempre limites de segmento.
4. Zero sobreposição de timestamps entre variações diferentes.
5. FORMATO DE RESPOSTA: JSON puro. Nenhum texto antes ou depois. Sem markdown.`;

    const SYSTEM_PROMPT_KEY = 'fastvideo:systemPrompt';

    function getSystemPrompt() {
        try {
            const c = localStorage.getItem(SYSTEM_PROMPT_KEY);
            if (c && c.trim().length > 100) return c;
        } catch (e) {}
        return SYSTEM_PROMPT_DEFAULT;
    }

    function setSystemPrompt(text) { localStorage.setItem(SYSTEM_PROMPT_KEY, text || ''); }
    function resetSystemPrompt() { localStorage.removeItem(SYSTEM_PROMPT_KEY); }

    // ==================== JSON SCHEMAS (OpenAI Structured Outputs) ====================

    const CLIP_ITEM_SCHEMA = {
        type: 'object',
        properties: {
            start:        { type: 'number' },
            end:          { type: 'number' },
            role:         { type: 'string' },
            text:         { type: 'string' }
        },
        required: ['start', 'end', 'role', 'text'],
        additionalProperties: false
    };

    const CLIP_TOP_SCHEMA = {
        type: 'object',
        properties: {
            start:        { type: 'number' },
            end:          { type: 'number' },
            label:        { type: 'string' },
            score:        { type: 'number' },
            reason:       { type: 'string' },
            text:         { type: 'string' },
            headline:     { type: 'string' },
            hook:         { type: 'string' },
            caption:      { type: 'string' },
            onscreen_text:{ type: 'string' }
        },
        required: ['start','end','label','score','reason','text','headline','hook','caption','onscreen_text'],
        additionalProperties: false
    };

    const VARIATION_SCHEMA = {
        type: 'object',
        properties: {
            label:        { type: 'string' },
            score:        { type: 'number' },
            headline:     { type: 'string' },
            hook:         { type: 'string' },
            caption:      { type: 'string' },
            onscreen_text:{ type: 'string' },
            clips: { type: 'array', items: CLIP_ITEM_SCHEMA }
        },
        required: ['label','score','headline','hook','caption','onscreen_text','clips'],
        additionalProperties: false
    };

    const JSON_SCHEMA_CONTINUOUS = {
        name: 'clips_response',
        strict: true,
        schema: {
            type: 'object',
            properties: { clips: { type: 'array', items: CLIP_TOP_SCHEMA } },
            required: ['clips'],
            additionalProperties: false
        }
    };

    const JSON_SCHEMA_COMPILATION = {
        name: 'variations_response',
        strict: true,
        schema: {
            type: 'object',
            properties: { variations: { type: 'array', items: VARIATION_SCHEMA } },
            required: ['variations'],
            additionalProperties: false
        }
    };

    // ==================== PROMPT BUILDER ====================

    function buildUserPrompt({ transcript, segments, brief, mode, durMin, durMax, count, maxMode, durationSeconds }) {
        const quantity = maxMode
            ? 'Gere QUANTAS variações/opções realmente boas você encontrar. Não limite — inclua todas as que fazem sentido.'
            : `Gere até ${count} variações/opções (pode gerar menos se não houver material de qualidade suficiente).`;

        const modeBlock = mode === 'compilation'
            ? `MODO: COMPILAÇÃO MULTI-CUT

${quantity}

Cada variação costura 2+ trechos NÃO-contíguos da transcrição. A quantidade de trechos internos deve ser a necessária para a narrativa funcionar — pode ser 2, 3, 4, 5 ou mais.
Duração TOTAL somada de cada variação: entre ${durMin}s e ${durMax}s.
Zero sobreposição de timestamps entre variações.

FORMATO JSON (puro, sem markdown):
{
  "variations": [
    {
      "label": "nome curto",
      "score": <0-10>,
      "headline": "título chamativo máx 8 palavras",
      "hook": "frase de abertura do trecho",
      "caption": "legenda redes sociais máx 150 chars",
      "onscreen_text": "3-5 palavras para tela",
      "clips": [
        { "start": <SEGUNDOS_EXATOS_DO_SEGMENTO>, "end": <SEGUNDOS_EXATOS_DO_SEGMENTO>, "role": "hook|body|cta", "text": "fala exata" }
      ]
    }
  ]
}`
            : `MODO: TRECHO CONTÍNUO

${quantity}

Cada opção é UM TRECHO CONTÍNUO (um start e um end, sem cortes internos).
Duração de cada trecho: entre ${durMin}s e ${durMax}s.
Cada opção deve ser um intervalo DIFERENTE.

FORMATO JSON (puro, sem markdown):
{
  "clips": [
    {
      "start": <SEGUNDOS_EXATOS_DO_SEGMENTO>,
      "end": <SEGUNDOS_EXATOS_DO_SEGMENTO>,
      "label": "nome curto",
      "score": <0-10>,
      "reason": "por que viraliza",
      "text": "fala exata do início do trecho",
      "headline": "título chamativo máx 8 palavras",
      "hook": "frase de abertura",
      "caption": "legenda redes sociais máx 150 chars",
      "onscreen_text": "3-5 palavras para tela"
    }
  ]
}`;

        // Usa segmentos estruturados se disponíveis (mais preciso); caso contrário usa texto bracket
        let transcriptBlock;
        if (segments && segments.length > 0) {
            const segsJson = segments.map(s =>
                `{"id":${s.id},"start":${s.start},"end":${s.end !== null && s.end !== undefined ? s.end : 'null'},"text":${JSON.stringify(s.text)}}`
            ).join(',\n');
            transcriptBlock = `TRANSCRIÇÃO — copie os valores "start"/"end" EXATAMENTE nas suas respostas:
[
${segsJson}
]`;
        } else {
            transcriptBlock = `TRANSCRIÇÃO ([mm:ss] texto — converta para segundos nas suas respostas):
${transcript}`;
        }

        const durationLine = durationSeconds ? `\nDURAÇÃO DO VÍDEO: ${durationSeconds.toFixed(1)}s\n` : '';

        return `BRIEFING DO CRIADOR:
${brief}
${durationLine}
${modeBlock}

${transcriptBlock}`;
    }

    // ==================== HELPERS ====================

    function extractJSON(text) {
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Resposta da IA não contém JSON válido');
        return JSON.parse(match[0]);
    }

    function toSeconds(val) {
        if (val === null || val === undefined) return null;
        if (typeof val === 'number' && isFinite(val)) return val;
        if (typeof val === 'string') {
            const s = val.replace(',', '.').trim();
            if (!s) return null;
            if (s.includes(':')) {
                const p = s.split(':').map(parseFloat);
                if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
                if (p.length === 2) return p[0] * 60 + p[1];
            }
            const n = parseFloat(s);
            if (isFinite(n)) return n;
        }
        return null;
    }

    // Snapa um timestamp para o limite de segmento mais próximo (dentro de tolerance)
    function snapToSegmentBoundary(time, segments, tolerance) {
        tolerance = (tolerance === undefined) ? 2.5 : tolerance;
        if (!segments || !segments.length) return time;
        let bestTime = time;
        let bestDist = Infinity;
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const dStart = Math.abs(seg.start - time);
            if (dStart < bestDist) { bestDist = dStart; bestTime = seg.start; }
            if (seg.end !== null && seg.end !== undefined) {
                const dEnd = Math.abs(seg.end - time);
                if (dEnd < bestDist) { bestDist = dEnd; bestTime = seg.end; }
            }
        }
        if (bestDist <= tolerance) {
            if (Math.abs(bestTime - time) > 0.1) {
                console.warn('[FASTVIDEO] Snap:', time.toFixed(2), '→', bestTime.toFixed(2), '(dist:', bestDist.toFixed(2) + ')');
            }
            return bestTime;
        }
        console.warn('[FASTVIDEO] Sem snap para', time.toFixed(2), '— dist mín:', bestDist.toFixed(2), '> tolerância', tolerance);
        return time;
    }

    // ==================== VALIDAÇÃO RIGOROSA ====================

    function validateAndNormalize(raw, mode, segments) {
        const result = { mode };
        const seenKeys = [];

        function isDuplicate(start, end) {
            for (let i = 0; i < seenKeys.length; i++) {
                const k = seenKeys[i];
                if (Math.abs(k[0] - start) < 0.5 && Math.abs(k[1] - end) < 0.5) return true;
            }
            seenKeys.push([start, end]);
            return false;
        }

        function clampScore(s) {
            const n = Number(s);
            return isFinite(n) ? Math.max(0, Math.min(10, Math.round(n * 10) / 10)) : 5;
        }

        function cleanClip(c, requireRole) {
            let start = toSeconds(c.start);
            let end = toSeconds(c.end);
            if (start === null || end === null) {
                console.warn('[FASTVIDEO] Clip rejeitado: start/end nulos', c);
                return null;
            }
            // Snap a limite de segmento
            start = snapToSegmentBoundary(start, segments);
            end   = snapToSegmentBoundary(end, segments);

            if (end <= start) {
                console.warn('[FASTVIDEO] Clip rejeitado: end <= start', start, end);
                return null;
            }
            if ((end - start) < 1.0) {
                console.warn('[FASTVIDEO] Clip rejeitado: duração <1s', (end - start).toFixed(2));
                return null;
            }
            const out = {
                start,
                end,
                text:         c.text || c.content || '',
                score:        clampScore(c.score),
                headline:     c.headline || '',
                hook:         c.hook || '',
                caption:      c.caption || '',
                onscreen_text:c.onscreen_text || ''
            };
            if (requireRole) {
                out.role = c.role || 'body';
            } else {
                out.label  = c.label || '';
                out.reason = c.reason || '';
            }
            return out;
        }

        if (mode === 'compilation') {
            const rawVars = Array.isArray(raw.variations) ? raw.variations : [];
            const variations = rawVars.map((v, vi) => {
                const rawClips = Array.isArray(v.clips) ? v.clips : [];
                const clips = rawClips.map(c => cleanClip(c, true)).filter(Boolean);

                if (clips.length < 2) {
                    console.warn('[FASTVIDEO] Variação', vi, 'rejeitada: menos de 2 clips válidos (tinha', rawClips.length + ')');
                    return null;
                }

                const avgScore = clips.reduce((s, c) => s + c.score, 0) / clips.length;
                const vScore = clampScore(v.score !== undefined ? v.score : avgScore);

                if (vScore < 5) {
                    console.warn('[FASTVIDEO] Variação', vi, 'rejeitada: score', vScore, '< 5');
                    return null;
                }

                return {
                    label:        v.label || ('Variação ' + (vi + 1)),
                    score:        vScore,
                    headline:     v.headline || '',
                    hook:         v.hook || '',
                    caption:      v.caption || '',
                    onscreen_text:v.onscreen_text || '',
                    clips
                };
            }).filter(Boolean);

            // Deduplicação por assinatura de timestamps
            const seen = new Set();
            const unique = [];
            for (const v of variations) {
                const sig = v.clips.map(c => c.start.toFixed(1) + '-' + c.end.toFixed(1)).sort().join(',');
                if (!seen.has(sig)) { seen.add(sig); unique.push(v); }
                else console.warn('[FASTVIDEO] Variação duplicada ignorada:', v.label);
            }

            unique.sort((a, b) => b.score - a.score);
            result.variations = unique;

        } else {
            const rawClips = Array.isArray(raw.clips) ? raw.clips : [];
            const clips = rawClips.map((c, ci) => {
                const clean = cleanClip(c, false);
                if (!clean) return null;
                if (clean.score < 5) {
                    console.warn('[FASTVIDEO] Clip', ci, 'rejeitado: score', clean.score, '< 5');
                    return null;
                }
                if (isDuplicate(clean.start, clean.end)) {
                    console.warn('[FASTVIDEO] Clip', ci, 'rejeitado: timestamps duplicados', clean.start, clean.end);
                    return null;
                }
                return clean;
            }).filter(Boolean);

            clips.sort((a, b) => b.score - a.score);
            result.clips = clips;
        }

        return result;
    }

    // ==================== ANTHROPIC ====================
    const Anthropic = {
        id: 'anthropic',
        name: 'Claude',

        async test(apiKey, model) {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: model || 'claude-haiku-4-5-20251001',
                    max_tokens: 20,
                    messages: [{ role: 'user', content: 'ping' }]
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }
            return { ok: true, message: 'Conexão OK' };
        },

        async extractClips(opts) {
            const userPrompt = buildUserPrompt(opts);
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': opts.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: opts.model,
                    max_tokens: opts.maxMode ? 8192 : 4096,
                    temperature: 0.3,
                    system: [
                        { type: 'text', text: getSystemPrompt(), cache_control: { type: 'ephemeral' } }
                    ],
                    messages: [{ role: 'user', content: userPrompt }]
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            const text = data.content?.[0]?.text || '';
            console.log('[FASTVIDEO] Anthropic resposta bruta:', text.slice(0, 300));
            const raw = extractJSON(text);
            return validateAndNormalize(raw, opts.mode, opts.segments);
        }
    };

    // ==================== OPENAI ====================
    const OpenAI = {
        id: 'openai',
        name: 'OpenAI',

        async test(apiKey, model) {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model || 'gpt-4o-mini',
                    max_tokens: 20,
                    messages: [{ role: 'user', content: 'ping' }]
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }
            return { ok: true, message: 'Conexão OK' };
        },

        async extractClips(opts) {
            const userPrompt = buildUserPrompt(opts);
            const schema = opts.mode === 'compilation' ? JSON_SCHEMA_COMPILATION : JSON_SCHEMA_CONTINUOUS;
            const baseBody = {
                model: opts.model,
                max_tokens: opts.maxMode ? 8192 : 4096,
                temperature: 0.3,
                messages: [
                    { role: 'system', content: getSystemPrompt() },
                    { role: 'user', content: userPrompt }
                ]
            };

            // Tenta Structured Outputs (json_schema)
            let raw = null;
            try {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${opts.apiKey}`
                    },
                    body: JSON.stringify({ ...baseBody, response_format: { type: 'json_schema', json_schema: schema } })
                });
                if (res.ok) {
                    const data = await res.json();
                    const choice = data.choices?.[0];
                    // Verifica recusa (content_filter / refusal)
                    if (choice?.finish_reason === 'content_filter' || choice?.message?.refusal) {
                        throw new Error('Structured output recusado: ' + (choice.message?.refusal || 'content_filter'));
                    }
                    const text = choice?.message?.content || '';
                    console.log('[FASTVIDEO] OpenAI Structured Outputs OK. Trecho:', text.slice(0, 200));
                    raw = extractJSON(text);
                } else if (res.status === 400) {
                    // Modelo não suporta json_schema → cai no fallback
                    const err = await res.json().catch(() => ({}));
                    console.warn('[FASTVIDEO] json_schema não suportado (400):', err.error?.message, '— usando json_object');
                } else {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error?.message || `HTTP ${res.status}`);
                }
            } catch (e) {
                if (e.message.includes('HTTP') || e.message.includes('recusado')) throw e;
                console.warn('[FASTVIDEO] Structured Outputs falhou:', e.message, '— usando json_object fallback');
            }

            // Fallback: json_object
            if (raw === null) {
                const res2 = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${opts.apiKey}`
                    },
                    body: JSON.stringify({ ...baseBody, response_format: { type: 'json_object' } })
                });
                if (!res2.ok) {
                    const err = await res2.json().catch(() => ({}));
                    throw new Error(err.error?.message || `HTTP ${res2.status}`);
                }
                const data2 = await res2.json();
                const text2 = data2.choices?.[0]?.message?.content || '';
                console.log('[FASTVIDEO] OpenAI json_object fallback. Trecho:', text2.slice(0, 200));
                raw = extractJSON(text2);
            }

            return validateAndNormalize(raw, opts.mode, opts.segments);
        }
    };

    // ==================== GEMINI ====================
    const Gemini = {
        id: 'gemini',
        name: 'Gemini',

        async test(apiKey, model) {
            const m = model || 'gemini-2.5-flash';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
                    generationConfig: { maxOutputTokens: 20 }
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }
            return { ok: true, message: 'Conexão OK' };
        },

        async extractClips(opts) {
            const userPrompt = buildUserPrompt(opts);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${opts.apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: getSystemPrompt() }] },
                    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        maxOutputTokens: opts.maxMode ? 8192 : 4096,
                        temperature: 0.3
                    }
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log('[FASTVIDEO] Gemini resposta bruta:', text.slice(0, 300));
            const raw = extractJSON(text);
            return validateAndNormalize(raw, opts.mode, opts.segments);
        }
    };

    window.Providers = {
        anthropic: Anthropic,
        openai: OpenAI,
        gemini: Gemini,

        get(id) { return this[id]; },

        list() {
            return [
                { id: 'anthropic', name: 'Claude', models: [
                    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
                    { id: 'claude-sonnet-4-6',        label: 'Claude Sonnet 4.6' },
                    { id: 'claude-opus-4-7',          label: 'Claude Opus 4.7' }
                ]},
                { id: 'openai', name: 'OpenAI', models: [
                    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
                    { id: 'gpt-4o',      label: 'GPT-4o' },
                    { id: 'gpt-5',       label: 'GPT-5' }
                ]},
                { id: 'gemini', name: 'Gemini', models: [
                    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                    { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro' }
                ]}
            ];
        },

        getSystemPrompt,
        setSystemPrompt,
        resetSystemPrompt,
        defaultSystemPrompt: SYSTEM_PROMPT_DEFAULT,

        _validateAndNormalize: validateAndNormalize,
        _snapToSegmentBoundary: snapToSegmentBoundary
    };
})();
