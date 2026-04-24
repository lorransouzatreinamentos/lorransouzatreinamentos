/**
 * Storage — persistência local com ofuscação das API keys.
 * Usa localStorage + XOR+base64 (não é criptografia forte, mas evita plaintext trivial).
 * Para produção considerar OS keychain via Node (cep enable-nodejs).
 */
(function() {
    const NS = 'fastvideo';
    const SECRET_SALT = 'fv:v1:' + (navigator.userAgent || '').slice(0, 32);

    function xorCipher(text, key) {
        let out = '';
        for (let i = 0; i < text.length; i++) {
            out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return out;
    }

    function encode(value) {
        try {
            return btoa(unescape(encodeURIComponent(xorCipher(value, SECRET_SALT))));
        } catch (e) { return ''; }
    }

    function decode(value) {
        try {
            return xorCipher(decodeURIComponent(escape(atob(value))), SECRET_SALT);
        } catch (e) { return ''; }
    }

    const Storage = {
        getProviders() {
            const raw = localStorage.getItem(NS + ':providers');
            if (!raw) return { anthropic: {}, openai: {}, gemini: {} };
            try {
                const parsed = JSON.parse(raw);
                ['anthropic', 'openai', 'gemini'].forEach(p => {
                    if (parsed[p] && parsed[p].apiKey) parsed[p].apiKey = decode(parsed[p].apiKey);
                });
                return parsed;
            } catch (e) {
                return { anthropic: {}, openai: {}, gemini: {} };
            }
        },

        saveProviders(providers) {
            const copy = JSON.parse(JSON.stringify(providers));
            ['anthropic', 'openai', 'gemini'].forEach(p => {
                if (copy[p] && copy[p].apiKey) copy[p].apiKey = encode(copy[p].apiKey);
            });
            localStorage.setItem(NS + ':providers', JSON.stringify(copy));
        },

        getTemplates() {
            const raw = localStorage.getItem(NS + ':templates');
            if (!raw) return this._seedTemplates();
            try { return JSON.parse(raw); } catch (e) { return []; }
        },

        saveTemplates(templates) {
            localStorage.setItem(NS + ':templates', JSON.stringify(templates));
        },

        getPreferences() {
            const raw = localStorage.getItem(NS + ':prefs');
            if (!raw) return { defaultProvider: 'anthropic', lastModel: null };
            try { return JSON.parse(raw); } catch (e) { return {}; }
        },

        savePreferences(prefs) {
            localStorage.setItem(NS + ':prefs', JSON.stringify(prefs));
        },

        _seedTemplates() {
            const seeds = [
                {
                    id: 'seed-1',
                    name: 'Pegada emocional',
                    content: 'Extraia trechos com forte apelo emocional — histórias pessoais, momentos de vulnerabilidade, frases impactantes sobre superação ou transformação. Priorize ganchos que conectam emocionalmente no primeiro segundo.'
                },
                {
                    id: 'seed-2',
                    name: 'Financeiro / Empresarial',
                    content: 'Extraia trechos sobre negócios, finanças, ROI, estratégia e cases de sucesso. Priorize insights práticos, números, e conclusões acionáveis para empresários.'
                },
                {
                    id: 'seed-3',
                    name: 'Reels educacionais',
                    content: 'Extraia trechos que ensinam algo específico em 30–60s. Busque: pergunta → explicação curta → exemplo → conclusão. Falas completas, sem cortar no meio.'
                },
                {
                    id: 'seed-4',
                    name: 'Event Recap / Aftermovie',
                    content: 'Extraia as melhores falas e depoimentos para um recap de evento (casamento, festival, convenção). Priorize: emoção, testemunhos memoráveis, momentos de conexão. Frases curtas e impactantes que descrevem a experiência.'
                },
                {
                    id: 'seed-5',
                    name: 'Podcast / Entrevista — highlight quotes',
                    content: 'Encontre as melhores citações (quotes) da entrevista — insights originais, opiniões polêmicas, frases memoráveis, momentos de sinceridade. Cada quote deve funcionar isolada como post de redes sociais.'
                },
                {
                    id: 'seed-6',
                    name: 'Hook viral TikTok / Reels',
                    content: 'Extraia APENAS os trechos com hooks que prendem a atenção nos primeiros 3 segundos: perguntas provocativas, afirmações ousadas, revelações, "você sabia que...", "pare de fazer isso". Priorize alta curva emocional no início.'
                }
            ];
            localStorage.setItem(NS + ':templates', JSON.stringify(seeds));
            return seeds;
        }
    };

    window.Storage = Storage;
})();
