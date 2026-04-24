/**
 * Providers — camada de abstração para Claude, OpenAI e Gemini.
 * Todos os providers expõem:
 *   - test(apiKey, model) → Promise<{ok, message}>
 *   - extractClips({apiKey, model, transcript, brief, mode, durMin, durMax, count}) → Promise<{variations|clips}>
 *
 * Contrato de saída normalizado:
 *   Modo "continuous" → { clips: [{start, end, label, reason}] }
 *   Modo "compilation" → { variations: [{label, clips: [{start, end, role, text}]}] }
 */
(function() {
    const SYSTEM_PROMPT_BASE = `Você é um editor de vídeo especialista em identificar os melhores trechos de uma transcrição para transformar em conteúdo viral de redes sociais (Reels, Shorts, TikTok).

REGRAS CRÍTICAS:
1. Responda APENAS com JSON válido, sem markdown, sem comentários, sem texto antes ou depois.
2. Os timestamps devem cair em finais/inícios naturais de frase — NUNCA corte no meio de palavra.
3. Respeite rigorosamente a duração mínima e máxima pedidas.
4. Cada trecho deve fazer sentido lido isoladamente (começo, meio, fim).
5. Priorize ganchos fortes nos primeiros 3 segundos.`;

    function buildUserPrompt({ transcript, brief, mode, durMin, durMax, count, maxMode }) {
        const quantity = maxMode
            ? 'QUANTOS TRECHOS conseguir encontrar que sejam realmente relevantes ao briefing (extraia o MÁXIMO possível — não limite a quantidade, mas só inclua trechos com qualidade alta)'
            : `exatamente ${count} (ou menos, se não houver trechos suficientes de qualidade)`;

        const modeBlock = mode === 'compilation'
            ? `MODO: COMPILAÇÃO MULTI-CUT
Monte ${quantity} variações de vídeo. Cada variação combina trechos NÃO-contíguos da transcrição, costurando momentos de partes diferentes do vídeo.
Estrutura recomendada de cada variação: HOOK (3-8s) + BODY (trechos que desenvolvem) + CTA/PUNCHLINE (5-15s finais).
Duração total de cada variação: entre ${durMin}s e ${durMax}s.

Formato de resposta:
{"variations":[{"label":"string curta","clips":[{"start":number,"end":number,"role":"hook|body|cta","text":"fala exata"}]}]}`
            : `MODO: TRECHO CONTÍNUO
Encontre ${quantity} opções de trechos CONTÍNUOS (sem cortes internos) que funcionem sozinhos.
Duração de cada trecho: entre ${durMin}s e ${durMax}s.

Formato de resposta:
{"clips":[{"start":number,"end":number,"label":"string curta","reason":"por que funciona","text":"fala exata"}]}`;

        return `BRIEFING DO CRIADOR:
${brief}

${modeBlock}

TRANSCRIÇÃO (formato [mm:ss] texto):
${transcript}`;
    }

    function extractJSON(text) {
        // Remove markdown fences e tenta parsear
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Resposta da IA não contém JSON válido');
        return JSON.parse(match[0]);
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
            const maxTokens = opts.maxMode ? 8192 : 4096;
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
                    max_tokens: maxTokens,
                    system: [
                        { type: 'text', text: SYSTEM_PROMPT_BASE, cache_control: { type: 'ephemeral' } }
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
            return extractJSON(text);
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
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${opts.apiKey}`
                },
                body: JSON.stringify({
                    model: opts.model,
                    max_tokens: opts.maxMode ? 8192 : 4096,
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT_BASE },
                        { role: 'user', content: userPrompt }
                    ]
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || '';
            return extractJSON(text);
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
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT_BASE }] },
                    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        maxOutputTokens: opts.maxMode ? 8192 : 4096
                    }
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return extractJSON(text);
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
                    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
                    { id: 'claude-opus-4-7', label: 'Claude Opus 4.7' }
                ]},
                { id: 'openai', name: 'OpenAI', models: [
                    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
                    { id: 'gpt-4o', label: 'GPT-4o' },
                    { id: 'gpt-5', label: 'GPT-5' }
                ]},
                { id: 'gemini', name: 'Gemini', models: [
                    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' }
                ]}
            ];
        }
    };
})();
