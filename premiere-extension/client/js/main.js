/**
 * Claudio Cuts — main controller.
 * Orquestra: dropzone → transcrição (Premiere) → provider IA → inserção timeline.
 */
(function() {
    const cs = new CSInterface();
    const state = {
        projectItem: null,  // { name, path, nodeId, durationSeconds }
        transcript: null,   // string "[mm:ss] texto..."
        results: null,      // output bruto do provider
        providerId: 'anthropic',
        model: 'claude-sonnet-4-6'
    };

    // ==================== INIT ====================
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadProviders();
        refreshModelDropdown();
        wireMainView();
        wireSettings();
        wireTemplates();
        wireModals();
        refreshTemplatesUI();
    }

    // ==================== VIEWS ====================
    function showView(id) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + id).classList.add('active');
    }

    function wireSettings() {
        document.getElementById('btn-settings').onclick = () => showView('settings');
        document.getElementById('btn-back-settings').onclick = () => showView('main');

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.dataset.tab === tab));
            };
        });

        // Load providers into inputs
        const p = Storage.getProviders();
        document.getElementById('key-anthropic').value = p.anthropic?.apiKey || '';
        document.getElementById('key-openai').value = p.openai?.apiKey || '';
        document.getElementById('key-gemini').value = p.gemini?.apiKey || '';
        if (p.anthropic?.model) document.getElementById('model-anthropic').value = p.anthropic.model;
        if (p.openai?.model) document.getElementById('model-openai').value = p.openai.model;
        if (p.gemini?.model) document.getElementById('model-gemini').value = p.gemini.model;

        document.getElementById('btn-save-providers').onclick = () => {
            Storage.saveProviders({
                anthropic: {
                    apiKey: document.getElementById('key-anthropic').value,
                    model: document.getElementById('model-anthropic').value
                },
                openai: {
                    apiKey: document.getElementById('key-openai').value,
                    model: document.getElementById('model-openai').value
                },
                gemini: {
                    apiKey: document.getElementById('key-gemini').value,
                    model: document.getElementById('model-gemini').value
                }
            });
            refreshModelDropdown();
            toast('Chaves salvas com sucesso', 'success');
        };

        // Test buttons
        document.querySelectorAll('[data-test]').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.test;
                const key = document.getElementById('key-' + id).value;
                const model = document.getElementById('model-' + id).value;
                if (!key) return toast('Informe a API key primeiro', 'warn');
                btn.disabled = true;
                btn.textContent = 'Testando…';
                try {
                    await Providers.get(id).test(key, model);
                    toast(`${Providers.get(id).name}: conexão OK`, 'success');
                } catch (e) {
                    toast(`Falha: ${e.message}`, 'error');
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Testar conexão';
                }
            };
        });
    }

    function loadProviders() {
        const prefs = Storage.getPreferences();
        state.providerId = prefs.defaultProvider || 'anthropic';
        state.model = prefs.lastModel || 'claude-sonnet-4-6';
    }

    function refreshModelDropdown() {
        const select = document.getElementById('model-select');
        const providers = Storage.getProviders();
        select.innerHTML = '';
        Providers.list().forEach(p => {
            const hasKey = providers[p.id]?.apiKey;
            const group = document.createElement('optgroup');
            group.label = p.name + (hasKey ? '' : ' (sem API key)');
            p.models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = p.id + '::' + m.id;
                opt.textContent = m.label;
                opt.disabled = !hasKey;
                group.appendChild(opt);
            });
            select.appendChild(group);
        });
        // Restore last selection
        const prefs = Storage.getPreferences();
        if (prefs.lastSelection) select.value = prefs.lastSelection;
        select.onchange = () => {
            const [pid, mid] = select.value.split('::');
            state.providerId = pid;
            state.model = mid;
            Storage.savePreferences({ ...prefs, lastSelection: select.value, defaultProvider: pid, lastModel: mid });
        };
        if (select.value) {
            const [pid, mid] = select.value.split('::');
            state.providerId = pid;
            state.model = mid;
        }
    }

    // ==================== MAIN VIEW ====================
    function wireMainView() {
        const dropzone = document.getElementById('dropzone');

        dropzone.addEventListener('dragover', e => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', e => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            handleDrop(e);
        });
        dropzone.addEventListener('click', () => {
            // Pega item selecionado no project panel
            cs.evalScript('CC.getSelectedProjectItem()', (res) => {
                handleHostResult(res);
            });
        });

        document.getElementById('btn-clear-clip').onclick = () => {
            state.projectItem = null;
            state.transcript = null;
            renderClipInfo();
            updateStartButton();
        };

        document.getElementById('btn-start').onclick = startExtraction;
        document.getElementById('btn-insert').onclick = insertSelectedClips;
        document.getElementById('btn-select-all').onclick = () => {
            document.querySelectorAll('#results-list input[type="checkbox"]').forEach(c => c.checked = true);
        };

        document.getElementById('prompt').addEventListener('input', updateStartButton);
    }

    function handleDrop(e) {
        // CEP não passa FileList real do Premiere; usa o selecionado no Project
        cs.evalScript('CC.getSelectedProjectItem()', handleHostResult);
    }

    function handleHostResult(res) {
        let parsed;
        try { parsed = JSON.parse(res); } catch (e) {
            return toast('Erro ao comunicar com Premiere', 'error');
        }
        if (!parsed.ok) return toast(parsed.error || 'Selecione um vídeo no painel Project', 'warn');
        state.projectItem = parsed.item;
        renderClipInfo();
        updateStartButton();
    }

    function renderClipInfo() {
        const info = document.getElementById('clip-info');
        const dropzone = document.getElementById('dropzone');
        if (!state.projectItem) {
            info.classList.add('hidden');
            dropzone.classList.remove('hidden');
            return;
        }
        info.classList.remove('hidden');
        dropzone.classList.add('hidden');
        document.getElementById('clip-name').textContent = state.projectItem.name;
        const dur = state.projectItem.durationSeconds || 0;
        const mins = Math.floor(dur / 60);
        const secs = Math.floor(dur % 60);
        document.getElementById('clip-meta').textContent = `${mins}:${secs.toString().padStart(2, '0')} · ${state.projectItem.path || ''}`;
    }

    function updateStartButton() {
        const hasPrompt = document.getElementById('prompt').value.trim().length >= 10;
        const hasClip = !!state.projectItem;
        const hasProvider = !!state.providerId && !!Storage.getProviders()[state.providerId]?.apiKey;
        const btn = document.getElementById('btn-start');
        btn.disabled = !(hasPrompt && hasClip && hasProvider);
        if (!hasProvider) btn.querySelector('.btn-label').textContent = 'Configure um provider nas settings';
        else if (!hasClip) btn.querySelector('.btn-label').textContent = 'Selecione um vídeo';
        else if (!hasPrompt) btn.querySelector('.btn-label').textContent = 'Escreva o briefing';
        else btn.querySelector('.btn-label').textContent = 'Iniciar extração';
    }

    // ==================== EXTRACTION FLOW ====================
    async function startExtraction() {
        const prompt = document.getElementById('prompt').value.trim();
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const durMin = parseInt(document.getElementById('dur-min').value, 10);
        const durMax = parseInt(document.getElementById('dur-max').value, 10);
        const count = parseInt(document.getElementById('count').value, 10);

        if (durMin >= durMax) return toast('Duração mínima deve ser menor que máxima', 'warn');

        showProgress(true, 'Lendo transcrição do Premiere…', 15);

        try {
            // 1. Obter transcrição via host script
            const transcriptResult = await evalHost(`CC.getTranscript(${JSON.stringify(state.projectItem.nodeId)})`);
            if (!transcriptResult.ok) throw new Error(transcriptResult.error || 'Transcrição não disponível. Use Window > Text > Transcript > Transcrever no Premiere primeiro.');
            state.transcript = transcriptResult.transcript;

            showProgress(true, 'Enviando para IA…', 45);

            // 2. Chamar provider
            const provider = Providers.get(state.providerId);
            const providerConfig = Storage.getProviders()[state.providerId];

            const result = await provider.extractClips({
                apiKey: providerConfig.apiKey,
                model: state.model,
                transcript: state.transcript,
                brief: prompt,
                mode, durMin, durMax, count
            });

            state.results = { ...result, mode };
            showProgress(true, 'Pronto!', 100);
            setTimeout(() => {
                showProgress(false);
                renderResults();
            }, 400);
        } catch (err) {
            showProgress(false);
            toast('Erro: ' + err.message, 'error');
        }
    }

    // ==================== RESULTS ====================
    function renderResults() {
        const list = document.getElementById('results-list');
        const results = document.getElementById('results');
        list.innerHTML = '';

        if (state.results.mode === 'compilation') {
            (state.results.variations || []).forEach((v, idx) => {
                list.appendChild(renderVariationCard(v, idx));
            });
        } else {
            (state.results.clips || []).forEach((c, idx) => {
                list.appendChild(renderClipCard(c, idx));
            });
        }
        results.classList.remove('hidden');
    }

    function renderClipCard(clip, idx) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <input type="checkbox" data-idx="${idx}" checked>
            <div class="result-body">
                <div class="result-label">${escapeHtml(clip.label || 'Trecho ' + (idx + 1))}</div>
                <div class="result-timestamp">${fmt(clip.start)} → ${fmt(clip.end)} (${(clip.end - clip.start).toFixed(1)}s)</div>
                <div class="result-reason">${escapeHtml(clip.reason || clip.text || '')}</div>
            </div>`;
        return card;
    }

    function renderVariationCard(variation, idx) {
        const card = document.createElement('div');
        card.className = 'result-card';
        const total = (variation.clips || []).reduce((s, c) => s + (c.end - c.start), 0);
        const clipsHtml = (variation.clips || []).map(c =>
            `<div class="result-clip-item">[${(c.role || '').toUpperCase().padEnd(5)}] ${fmt(c.start)}→${fmt(c.end)} · ${escapeHtml((c.text || '').slice(0, 50))}</div>`
        ).join('');
        card.innerHTML = `
            <input type="checkbox" data-idx="${idx}" checked>
            <div class="result-body">
                <div class="result-label">${escapeHtml(variation.label || 'Variação ' + (idx + 1))}</div>
                <div class="result-timestamp">${total.toFixed(1)}s total · ${(variation.clips || []).length} cortes</div>
                <div class="result-clips">${clipsHtml}</div>
            </div>`;
        return card;
    }

    async function insertSelectedClips() {
        const checked = Array.from(document.querySelectorAll('#results-list input[type="checkbox"]:checked'));
        if (!checked.length) return toast('Selecione pelo menos um trecho', 'warn');

        const newSequence = document.getElementById('new-sequence').checked;
        const payload = {
            mode: state.results.mode,
            projectItemNodeId: state.projectItem.nodeId,
            newSequence,
            items: []
        };

        checked.forEach(cb => {
            const idx = parseInt(cb.dataset.idx, 10);
            if (state.results.mode === 'compilation') {
                payload.items.push(state.results.variations[idx]);
            } else {
                payload.items.push(state.results.clips[idx]);
            }
        });

        showProgress(true, 'Inserindo na timeline…', 70);
        try {
            const res = await evalHost(`CC.insertClips(${JSON.stringify(JSON.stringify(payload))})`);
            showProgress(false);
            if (res.ok) toast(`${res.inserted} trecho(s) inseridos com sucesso`, 'success');
            else toast('Falha: ' + (res.error || 'erro desconhecido'), 'error');
        } catch (e) {
            showProgress(false);
            toast('Erro: ' + e.message, 'error');
        }
    }

    // ==================== TEMPLATES ====================
    function wireTemplates() {
        document.getElementById('btn-save-template').onclick = () => {
            const content = document.getElementById('prompt').value.trim();
            if (content.length < 10) return toast('Escreva um briefing antes de salvar', 'warn');
            const name = window.prompt('Nome do template:', 'Meu template');
            if (!name) return;
            Templates.create(name, content);
            refreshTemplatesUI();
            toast(`Template "${name}" salvo`, 'success');
        };

        document.getElementById('btn-load-template').onclick = () => {
            document.getElementById('modal-load').classList.remove('hidden');
            refreshTemplatesUI();
        };

        document.getElementById('btn-create-template').onclick = () => {
            const name = document.getElementById('tpl-name').value.trim();
            const content = document.getElementById('tpl-content').value.trim();
            if (!name || content.length < 10) return toast('Nome e conteúdo obrigatórios', 'warn');
            Templates.create(name, content);
            document.getElementById('tpl-name').value = '';
            document.getElementById('tpl-content').value = '';
            refreshTemplatesUI();
            toast('Template criado', 'success');
        };
    }

    function refreshTemplatesUI() {
        const settingsList = document.getElementById('templates-list');
        const modalList = document.getElementById('modal-templates-list');
        [settingsList, modalList].forEach(l => l.innerHTML = '');

        Templates.all().forEach(tpl => {
            // Settings list (with edit/delete)
            const itemSettings = document.createElement('div');
            itemSettings.className = 'template-item';
            itemSettings.innerHTML = `
                <div>
                    <div class="template-name">${escapeHtml(tpl.name)}</div>
                    <div class="template-preview">${escapeHtml(tpl.content.slice(0, 60))}…</div>
                </div>
                <div class="template-actions">
                    <button class="link-btn" data-action="delete" data-id="${tpl.id}">🗑</button>
                </div>`;
            itemSettings.querySelector('[data-action="delete"]').onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Excluir "${tpl.name}"?`)) {
                    Templates.remove(tpl.id);
                    refreshTemplatesUI();
                }
            };
            settingsList.appendChild(itemSettings);

            // Modal list (click to load)
            const itemModal = document.createElement('div');
            itemModal.className = 'template-item';
            itemModal.innerHTML = `
                <div>
                    <div class="template-name">${escapeHtml(tpl.name)}</div>
                    <div class="template-preview">${escapeHtml(tpl.content.slice(0, 60))}…</div>
                </div>`;
            itemModal.onclick = () => {
                document.getElementById('prompt').value = tpl.content;
                document.getElementById('modal-load').classList.add('hidden');
                updateStartButton();
                toast(`Template "${tpl.name}" carregado`, 'success');
            };
            modalList.appendChild(itemModal);
        });
    }

    function wireModals() {
        document.getElementById('btn-close-modal').onclick = () => {
            document.getElementById('modal-load').classList.add('hidden');
        };
    }

    // ==================== HELPERS ====================
    function evalHost(script) {
        return new Promise((resolve, reject) => {
            cs.evalScript(script, (res) => {
                try { resolve(JSON.parse(res)); }
                catch (e) { reject(new Error('Resposta inválida do host: ' + res)); }
            });
        });
    }

    function showProgress(show, label, pct) {
        const el = document.getElementById('progress');
        if (!show) return el.classList.add('hidden');
        el.classList.remove('hidden');
        document.getElementById('progress-label').textContent = label || '';
        document.getElementById('progress-fill').style.width = (pct || 0) + '%';
    }

    function toast(msg, type) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.className = 'toast ' + (type || '');
        setTimeout(() => el.classList.add('hidden'), 3500);
    }

    function fmt(sec) {
        const m = Math.floor(sec / 60);
        const s = (sec % 60).toFixed(1).padStart(4, '0');
        return `${m}:${s}`;
    }

    function escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
})();
