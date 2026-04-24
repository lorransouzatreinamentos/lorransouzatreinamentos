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

    const SYSTEM_PROMPT_DEFAULT = `Você é um EDITOR DE VÍDEO SÊNIOR especializado em identificar trechos virais para redes sociais (TikTok, Reels Instagram, YouTube Shorts).

══════════════════ SEU PAPEL ══════════════════

Encontrar os melhores trechos de uma transcrição e transformá-los em conteúdo STANDALONE — cada trecho escolhido deve funcionar sozinho como um vídeo completo, sem precisar de contexto do restante.

══════════════════ ANATOMIA DE UM TRECHO VIRAL ══════════════════

Todo trecho escolhido DEVE ter 3 partes reconhecíveis:

  1. HOOK (primeiros 3-5 segundos)
     Pergunta provocativa, afirmação polêmica, promessa de valor,
     curiosidade forte ou revelação. Se o hook não segura no primeiro
     segundo, descarte o trecho.

  2. BODY (desenvolvimento)
     Prova, explicação, história ou exemplo que desenvolve o hook.
     Tem que fluir sem saltos incoerentes.

  3. PAYOFF (encerramento)
     Conclusão memorável, punchline, insight final ou call-to-action.
     NUNCA termine no meio de uma ideia. O espectador deve sentir
     fechamento.

══════════════════ PROCESSO MENTAL OBRIGATÓRIO ══════════════════

Antes de responder, execute mentalmente:

  a) Leia a transcrição INTEIRA
  b) Identifique TÓPICOS DISTINTOS (não confunda variações do mesmo
     assunto com tópicos diferentes)
  c) Para cada tópico relevante ao briefing, localize a MELHOR
     formulação da ideia (não a primeira que aparece — a mais forte)
  d) Teste mental: "Se eu cortasse esse trecho e postasse isolado,
     funcionaria?" Se não: descarte ou ajuste os pontos de corte
  e) Garanta que cada trecho/variação cobre um TÓPICO DIFERENTE dos
     outros — zero redundância

══════════════════ REGRAS ABSOLUTAS ══════════════════

1. TIMESTAMPS:
   - start e end são SEMPRE NÚMEROS em SEGUNDOS (float ou int)
   - NUNCA strings "mm:ss" ou "hh:mm:ss"
   - CORRETO: "start": 125.3, "end": 187.8
   - ERRADO:  "start": "02:05", "end": "03:07"
   - Linhas da transcrição vêm como [mm:ss] apenas para LEITURA —
     você converte para segundos na resposta

2. PONTOS DE CORTE:
   - Use SEMPRE os timestamps das linhas da transcrição como pontos
     seguros (eles correspondem a finais/inícios de frase)
   - NUNCA corte no meio de uma palavra ou frase
   - Se uma frase importante começa no meio de uma linha, RETROCEDA
     para o início dessa linha

3. DIVERSIDADE:
   - Zero sobreposição de timestamps entre variações
   - Cada variação é uma IDEIA DIFERENTE (não reformulação do mesmo
     tema em posições ligeiramente distintas)

4. QUALIDADE > QUANTIDADE:
   - Melhor devolver 1 trecho excelente do que 5 medianos
   - Se o briefing não pode ser atendido com qualidade, devolva menos
     trechos (ou lista vazia em caso extremo)

5. VIRALITY SCORE (0-10) por trecho/variação:
   - 10: excepcional, altíssima chance de viralizar
   - 7-9: bom, vale publicar
   - 4-6: ok, depende do contexto
   - 0-3: fraco — NÃO INCLUA trechos com score abaixo de 5

6. FORMATO DE RESPOSTA: JSON puro. Nenhum texto antes ou depois.
   Sem markdown, sem \`\`\`json, sem comentários.`;

    // ID de storage para customização do system prompt
    const SYSTEM_PROMPT_KEY = 'fastvideo:systemPrompt';

    function getSystemPrompt() {
        try {
            const custom = localStorage.getItem(SYSTEM_PROMPT_KEY);
            if (custom && custom.trim().length > 100) return custom;
        } catch (e) {}
        return SYSTEM_PROMPT_DEFAULT;
    }

    function setSystemPrompt(text) {
        localStorage.setItem(SYSTEM_PROMPT_KEY, text || '');
    }

    function resetSystemPrompt() {
        localStorage.removeItem(SYSTEM_PROMPT_KEY);
    }

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
                    temperature: 0.3,
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: getSystemPrompt() },
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

        // System prompt customizável
        getSystemPrompt: getSystemPrompt,
        setSystemPrompt: setSystemPrompt,
        resetSystemPrompt: resetSystemPrompt,
        defaultSystemPrompt: SYSTEM_PROMPT_DEFAULT,

        // Exposto para debug
        _validateAndNormalize: validateAndNormalize
    };
})();
