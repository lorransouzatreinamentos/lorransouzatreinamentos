/**
 * Providers — camada de abstração para Claude, OpenAI e Gemini.
 *
 * Todos expõem:
 *   - test(apiKey, model) → Promise<{ok, message}>
 *   - extractClips(opts) → Promise<{variations|clips}> (normalizado)
 *
 * Contrato de saída normalizado:
 *   Modo "continuous" → { clips: [{start, end, label, reason, text}] }
 *   Modo "compilation" → { variations: [{label, clips: [{start, end, role, text}]}] }
 *
 * IMPORTANTE: start/end são SEMPRE número em SEGUNDOS (não mm:ss)
 */
(function() {

    const SYSTEM_PROMPT_BASE = `Você é um editor de vídeo especialista em identificar os melhores trechos de uma transcrição para transformar em conteúdo viral de redes sociais (Reels, Shorts, TikTok).

REGRAS CRÍTICAS E INEGOCIÁVEIS:

1. FORMATO DE RESPOSTA: JSON puro, válido, sem markdown, sem comentários, sem texto antes ou depois.

2. TIMESTAMPS:
   - start e end são SEMPRE NÚMEROS em SEGUNDOS (float ou int).
   - NUNCA use strings no formato "mm:ss" ou "hh:mm:ss".
   - CORRETO:   "start": 125.3, "end": 187.8
   - ERRADO:    "start": "02:05", "end": "03:07"
   - ERRADO:    "start": "125.3", "end": "187.8"
   - Os timestamps na transcrição vêm como [mm:ss] apenas para sua leitura —
     na sua resposta, converta para segundos. Ex: [02:05] = 125 segundos.

3. PRECISÃO DE CORTE:
   - Os timestamps devem cair em finais/inícios naturais de frase.
   - NUNCA corte no meio de palavra ou no meio de uma frase.
   - Use os timestamps das linhas da transcrição como pontos de corte seguros.

4. DIVERSIDADE ENTRE VARIAÇÕES (quando aplicável):
   - Cada variação DEVE usar TRECHOS DIFERENTES das outras variações.
   - NUNCA repita os mesmos timestamps em variações diferentes.
   - Se uma variação usa 02:05-03:10, outras variações devem evitar essa janela.

5. QUALIDADE SOBRE QUANTIDADE:
   - Só inclua trechos que REALMENTE se encaixam no briefing.
   - Melhor 2 trechos excelentes do que 5 medianos.
   - A quantidade de cortes internos dentro de uma variação deve ser a
     NECESSÁRIA para contar a história — não use número fixo.

6. VIRALITY SCORE (0-10):
   - Atribua um score de viralidade a cada trecho/variação.
   - Considere: força do gancho (hook strength), emoção, completude narrativa,
     engajamento potencial, relevância ao briefing.
   - 10 = trecho excepcional com alta chance de viralizar
   - 7-9 = bom, vale publicar
   - 4-6 = ok, depende do contexto
   - 0-3 = fraco (evite incluir trechos com score < 5)`;

    function buildUserPrompt({ transcript, brief, mode, durMin, durMax, count, maxMode }) {
        const quantity = maxMode
            ? 'Gere QUANTAS variações conseguir que sejam realmente boas. Não limite quantidade — inclua todas as que fazem sentido com o briefing'
            : `Gere até ${count} variações (pode gerar menos se não houver material suficiente de qualidade)`;

        const modeBlock = mode === 'compilation'
            ? `MODO: COMPILAÇÃO MULTI-CUT

${quantity}.

Cada variação costura 2 OU MAIS trechos NÃO-contíguos da transcrição (não é um único corte contínuo). A quantidade de trechos internos por variação deve ser a NECESSÁRIA para a narrativa funcionar — pode ser 2, 3, 4, 5 ou mais. Não há número fixo.

Duração total somada de cada variação: entre ${durMin} e ${durMax} segundos.

ESTRUTURA SUGERIDA (não obrigatória):
- Começo com gancho/hook
- Meio com desenvolvimento
- Fim com punchline/CTA
Mas o importante é que cada variação TENHA SENTIDO NARRATIVO quando unida.

LEMBRE: cada variação deve ter TRECHOS DIFERENTES das outras. Zero sobreposição de timestamps entre variações.

FORMATO DE RESPOSTA (JSON PURO):
{
  "variations": [
    {
      "label": "string curta descritiva",
      "score": <NÚMERO_0_A_10>,
      "clips": [
        { "start": <NÚMERO_SEGUNDOS>, "end": <NÚMERO_SEGUNDOS>, "role": "hook|body|cta", "text": "fala exata" }
      ]
    }
  ]
}`
            : `MODO: TRECHO CONTÍNUO

${quantity}.

Cada opção é UM TRECHO CONTÍNUO do vídeo original (sem cortes internos — apenas um start e um end).

Duração de cada trecho: entre ${durMin} e ${durMax} segundos.

LEMBRE: cada opção deve ser um intervalo DIFERENTE das outras.

FORMATO DE RESPOSTA (JSON PURO):
{
  "clips": [
    { "start": <NÚMERO_SEGUNDOS>, "end": <NÚMERO_SEGUNDOS>, "label": "string curta", "score": <NÚMERO_0_A_10>, "reason": "por que funciona", "text": "fala exata" }
  ]
}`;

        return `BRIEFING DO CRIADOR:
${brief}

${modeBlock}

TRANSCRIÇÃO (formato [mm:ss] texto — use esses marcadores como REFERÊNCIA mas CONVERTA para segundos na resposta):
${transcript}`;
    }

    function extractJSON(text) {
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Resposta da IA não contém JSON válido');
        return JSON.parse(match[0]);
    }

    // ==================== NORMALIZAÇÃO E VALIDAÇÃO ====================

    // Converte qualquer formato de timestamp para segundos (número)
    function toSeconds(val) {
        if (val === null || val === undefined) return null;
        if (typeof val === 'number' && isFinite(val)) return val;
        if (typeof val === 'string') {
            const s = val.replace(',', '.').trim();
            if (!s) return null;
            // Formato hh:mm:ss ou mm:ss
            if (s.includes(':')) {
                const parts = s.split(':').map(parseFloat);
                if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                if (parts.length === 2) return parts[0] * 60 + parts[1];
            }
            const n = parseFloat(s);
            if (isFinite(n)) return n;
        }
        return null;
    }

    function validateAndNormalize(raw, mode) {
        const result = { mode };
        const seen = new Set(); // chave "start-end" para detectar duplicatas

        function isDuplicate(start, end) {
            // Considera duplicado se start/end batem dentro de 0.5s
            for (const key of seen) {
                const [s, e] = key.split('|').map(parseFloat);
                if (Math.abs(s - start) < 0.5 && Math.abs(e - end) < 0.5) return true;
            }
            seen.add(`${start}|${end}`);
            return false;
        }

        function clampScore(s) {
            const n = Number(s);
            if (!isFinite(n)) return 5;
            return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
        }

        function cleanClip(c) {
            const start = toSeconds(c.start);
            const end = toSeconds(c.end);
            if (start === null || end === null) return null;
            if (end <= start) return null;
            if (end - start < 0.5) return null;
            return {
                start,
                end,
                label: c.label || '',
                reason: c.reason || '',
                role: c.role || 'body',
                text: c.text || c.content || '',
                score: clampScore(c.score)
            };
        }

        if (mode === 'compilation') {
            const variations = (raw.variations || []).map(v => {
                seen.clear();
                const clips = (v.clips || []).map(cleanClip).filter(c => {
                    if (!c) return false;
                    return !isDuplicate(c.start, c.end);
                });
                if (clips.length < 1) return null;
                const avgScore = clips.reduce((s, c) => s + c.score, 0) / clips.length;
                return {
                    label: v.label || '',
                    score: clampScore(v.score !== undefined ? v.score : avgScore),
                    clips
                };
            }).filter(Boolean);

            const uniqueVariations = [];
            const variationSignatures = new Set();
            for (const v of variations) {
                const sig = v.clips.map(c => `${c.start.toFixed(1)}-${c.end.toFixed(1)}`).sort().join(',');
                if (!variationSignatures.has(sig)) {
                    variationSignatures.add(sig);
                    uniqueVariations.push(v);
                }
            }
            // Ordena variações por score decrescente
            uniqueVariations.sort((a, b) => b.score - a.score);
            result.variations = uniqueVariations;
        } else {
            const clips = (raw.clips || []).map(cleanClip).filter(c => {
                if (!c) return false;
                return !isDuplicate(c.start, c.end);
            });
            // Ordena clipes por score decrescente
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
            const raw = extractJSON(text);
            return validateAndNormalize(raw, opts.mode);
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
            const raw = extractJSON(text);
            return validateAndNormalize(raw, opts.mode);
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
            const raw = extractJSON(text);
            return validateAndNormalize(raw, opts.mode);
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
        },

        // Exposto para debug
        _validateAndNormalize: validateAndNormalize
    };
})();
