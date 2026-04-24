/**
 * FASTVIDEO — main controller v1.2.
 */
(function() {
    const cs = new CSInterface();
    const state = {
        projectItem: null,
        transcript: null,
        transcriptMeta: null,
        transcriptSegments: null,  // [{id,start,end,text}] para passar para providers
        results: null,
        providerId: 'anthropic',
        model: 'claude-sonnet-4-6',
        availableClips: []
    };

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadProviders();
        refreshModelDropdown();
        wireNav();
        wireClipPicker();
        wireTranscript();
        wireCountToggle();
        wireActions();
        wireSettings();
        wireTemplates();
        wireModals();
        refreshTemplatesUI();
        // Carrega clipes automaticamente ao abrir
        setTimeout(loadClipsFromProject, 300);
    }

    // ==================== NAV ====================
    function wireNav() {
        document.getElementById('btn-settings').onclick = () => showView('settings');
        document.getElementById('btn-manual').onclick = () => showView('manual');
        document.getElementById('btn-silence').onclick = () => { showView('silence'); refreshSilenceStatus(); };
        document.getElementById('btn-back-settings').onclick = () => showView('main');
        document.getElementById('btn-back-manual').onclick = () => showView('main');
        document.getElementById('btn-back-silence').onclick = () => showView('main');
        wireSilence();
    }

    function showView(id) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + id).classList.add('active');
    }

    // ==================== CLIP PICKER (bug #1 fix + drag-drop v1.5) ====================
    function wireClipPicker() {
        const refreshBtn = document.getElementById('btn-refresh-clips');
        refreshBtn.onclick = async () => {
            refreshBtn.classList.add('spinning');
            await loadClipsFromProject();
            setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
        };

        document.getElementById('btn-use-selected').onclick = useSelectedFromPremiere;
        document.getElementById('clip-dropdown').onchange = (e) => {
            const nodeId = e.target.value;
            if (!nodeId) {
                state.projectItem = null;
                renderClipInfo();
                updateStartButton();
                return;
            }
            const clip = state.availableClips.find(c => String(c.nodeId) === String(nodeId));
            if (clip) {
                state.projectItem = clip;
                renderClipInfo();
                updateStartButton();
            }
        };

        // Dropzone para drag-drop do Project panel
        // CEP não expõe drop de ProjectItem direto, então interceptamos o drop
        // e pegamos o que estava selecionado no Project naquele momento
        const dz = document.getElementById('dropzone-clip');
        dz.addEventListener('dragover', e => {
            e.preventDefault();
            dz.classList.add('dragover');
        });
        dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
        dz.addEventListener('drop', async e => {
            e.preventDefault();
            dz.classList.remove('dragover');
            // Tenta pegar o item selecionado no Premiere no momento do drop
            await useSelectedFromPremiere();
        });
        dz.addEventListener('click', useSelectedFromPremiere);
    }

    async function loadClipsFromProject() {
        try {
            const res = await evalHost('CC.listProjectClips()');
            if (!res.ok) {
                document.getElementById('clip-dropdown').innerHTML = '<option value="">— ' + (res.error || 'sem clipes') + ' —</option>';
                return;
            }
            state.availableClips = res.clips || [];
            renderClipDropdown(res.selectedNodeId);
            toast(`${state.availableClips.length} clipe(s) carregado(s)`, 'success');
        } catch (e) {
            toast('Erro ao listar clipes: ' + e.message, 'error');
        }
    }

    function renderClipDropdown(preselectNodeId) {
        const dd = document.getElementById('clip-dropdown');
        dd.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '— Selecione um vídeo —';
        dd.appendChild(placeholder);

        state.availableClips.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nodeId;
            const mins = Math.floor((c.durationSeconds || 0) / 60);
            const secs = Math.floor((c.durationSeconds || 0) % 60);
            opt.textContent = `${c.name} (${mins}:${secs.toString().padStart(2, '0')})`;
            dd.appendChild(opt);
        });

        if (preselectNodeId) {
            dd.value = preselectNodeId;
            const clip = state.availableClips.find(c => String(c.nodeId) === String(preselectNodeId));
            if (clip) {
                state.projectItem = clip;
                renderClipInfo();
                updateStartButton();
            }
        }
    }

    async function useSelectedFromPremiere() {
        try {
            const res = await evalHost('CC.listProjectClips()');
            if (!res.ok || !res.selectedNodeId) {
                return toast('Nenhum clipe selecionado no Project panel do Premiere', 'warn');
            }
            state.availableClips = res.clips;
            document.getElementById('clip-dropdown').value = res.selectedNodeId;
            const clip = state.availableClips.find(c => String(c.nodeId) === String(res.selectedNodeId));
            if (clip) {
                state.projectItem = clip;
                renderClipInfo();
                updateStartButton();
                toast(`"${clip.name}" selecionado`, 'success');
            }
        } catch (e) {
            toast('Erro: ' + e.message, 'error');
        }
    }

    function renderClipInfo() {
        const info = document.getElementById('clip-info');
        const dz = document.getElementById('dropzone-clip');
        if (!state.projectItem) {
            info.classList.add('hidden');
            if (dz) dz.classList.remove('hidden');
            return;
        }
        info.classList.remove('hidden');
        if (dz) dz.classList.add('hidden');
        document.getElementById('clip-name').textContent = state.projectItem.name;
        const dur = state.projectItem.durationSeconds || 0;
        const mins = Math.floor(dur / 60);
        const secs = Math.floor(dur % 60);
        document.getElementById('clip-meta').textContent = `Duração: ${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ==================== TRANSCRIPT ====================
    function wireTranscript() {
        const dz = document.getElementById('dropzone-tr');
        const file = document.getElementById('file-tr');

        dz.addEventListener('click', () => file.click());
        dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
        dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
        dz.addEventListener('drop', e => {
            e.preventDefault();
            dz.classList.remove('dragover');
            const f = e.dataTransfer.files[0];
            if (f) readTranscriptFile(f);
        });
        file.addEventListener('change', e => {
            if (e.target.files[0]) readTranscriptFile(e.target.files[0]);
        });

        document.getElementById('btn-clear-tr').onclick = clearTranscript;
    }

    function clearTranscript() {
        state.transcript = null;
        state.transcriptMeta = null;
        state.transcriptSegments = null;
        document.getElementById('tr-info').classList.add('hidden');
        document.getElementById('dropzone-tr').classList.remove('hidden');
        document.getElementById('file-tr').value = '';
        updateStartButton();
    }

    function readTranscriptFile(file) {
        const reader = new FileReader();
        reader.onload = e => processTranscript(e.target.result, file.name);
        reader.onerror = () => toast('Erro ao ler arquivo: ' + file.name, 'error');
        // Força leitura como UTF-8 (resolve BOM e encoding de exports do Premiere)
        reader.readAsText(file, 'UTF-8');
    }

    function processTranscript(content, sourceName) {
        try {
            if (!content || content.length < 10) {
                return toast('Arquivo vazio ou muito curto', 'error');
            }
            const dur = state.projectItem?.durationSeconds || null;
            const result = TranscriptParser.parse(content, { durationSeconds: dur });
            console.log('[FASTVIDEO] Parser result:', result);

            if (!result.text || result.count < 2) {
                return toast(`Transcrição inválida (formato detectado: ${result.format}, ${result.count} seg)`, 'error');
            }
            state.transcript = result.text;
            state.transcriptSegments = result.segments;  // array [{id,start,end,text}]
            state.transcriptMeta = { ...result, sourceName };
            renderTranscriptInfo();
            updateStartButton();
            console.log('[FASTVIDEO]', result.count, 'segmentos carregados, formato:', result.format, '| debug:', result.debug);
            toast(`✓ ${result.count} segmentos carregados (${result.format})`, 'success');
        } catch (e) {
            console.error('[FASTVIDEO] Parser error:', e);
            toast('Erro ao processar: ' + e.message, 'error');
        }
    }

    function renderTranscriptInfo() {
        const info = document.getElementById('tr-info');
        const dz = document.getElementById('dropzone-tr');
        info.classList.remove('hidden');
        dz.classList.add('hidden');
        document.getElementById('tr-meta').textContent =
            `${state.transcriptMeta.sourceName} · ${state.transcriptMeta.format} · ${state.transcriptMeta.count} segmentos`;
    }

    // ==================== COUNT TOGGLE ====================
    function wireCountToggle() {
        const maxCb = document.getElementById('max-count');
        const countInput = document.getElementById('count');
        maxCb.addEventListener('change', () => {
            if (maxCb.checked) {
                countInput.disabled = true;
                countInput.value = '';
                countInput.placeholder = '∞ máximo';
            } else {
                countInput.disabled = false;
                countInput.value = '3';
                countInput.placeholder = '';
            }
        });
    }

    // ==================== ACTIONS ====================
    function wireActions() {
        document.getElementById('btn-start').onclick = startExtraction;
        document.getElementById('btn-insert').onclick = insertSelectedClips;
        document.getElementById('btn-select-all').onclick = () => {
            document.querySelectorAll('#results-list input[type="checkbox"]').forEach(c => c.checked = true);
        };
        document.getElementById('prompt').addEventListener('input', updateStartButton);
        document.getElementById('btn-reset-all').onclick = resetAll;

        // Toggle visibilidade do "append-remaining" conforme modo de inserção
        document.querySelectorAll('input[name="insert-mode"]').forEach(r => {
            r.addEventListener('change', () => {
                const isEdit = document.querySelector('input[name="insert-mode"]:checked').value === 'edit';
                document.getElementById('append-remaining-line').style.display = isEdit ? 'none' : '';
            });
        });
    }

    function resetAll() {
        if (!confirm('Limpar tudo e começar de novo? Os trechos gerados e configurações deste fluxo serão descartados.')) return;

        // Clipe
        state.projectItem = null;
        document.getElementById('clip-dropdown').value = '';
        document.getElementById('clip-info').classList.add('hidden');

        // Transcrição
        clearTranscript();

        // Briefing
        document.getElementById('prompt').value = '';

        // Config (volta aos defaults)
        document.querySelector('input[name="mode"][value="continuous"]').checked = true;
        document.getElementById('dur-min').value = 30;
        document.getElementById('dur-max').value = 90;
        document.getElementById('max-count').checked = false;
        document.getElementById('count').disabled = false;
        document.getElementById('count').value = 3;
        document.getElementById('count').placeholder = '';

        // Resultados
        state.results = null;
        document.getElementById('results-list').innerHTML = '';
        document.getElementById('results').classList.add('hidden');

        // Toggles de inserção
        const newRadio = document.querySelector('input[name="insert-mode"][value="new"]');
        if (newRadio) newRadio.checked = true;
        document.getElementById('append-remaining').checked = true;
        const appendLine = document.getElementById('append-remaining-line');
        if (appendLine) appendLine.style.display = '';

        // Progress
        showProgress(false);

        updateStartButton();
        toast('Tudo limpo. Pronto para novo fluxo.', 'success');
    }

    // ==================== SETTINGS / PROVIDERS ====================
    function wireSettings() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.dataset.tab === tab));
            };
        });

        const p = Storage.getProviders();
        document.getElementById('key-anthropic').value = p.anthropic?.apiKey || '';
        document.getElementById('key-openai').value = p.openai?.apiKey || '';
        document.getElementById('key-gemini').value = p.gemini?.apiKey || '';
        if (p.anthropic?.model) document.getElementById('model-anthropic').value = p.anthropic.model;
        if (p.openai?.model) document.getElementById('model-openai').value = p.openai.model;
        if (p.gemini?.model) document.getElementById('model-gemini').value = p.gemini.model;

        document.getElementById('btn-save-providers').onclick = () => {
            Storage.saveProviders({
                anthropic: { apiKey: document.getElementById('key-anthropic').value, model: document.getElementById('model-anthropic').value },
                openai:    { apiKey: document.getElementById('key-openai').value,    model: document.getElementById('model-openai').value },
                gemini:    { apiKey: document.getElementById('key-gemini').value,    model: document.getElementById('model-gemini').value }
            });
            refreshModelDropdown();
            updateStartButton();
            toast('Chaves salvas com sucesso', 'success');
        };

        // Aba Prompt IA: editar system prompt
        const spArea = document.getElementById('system-prompt');
        if (spArea) {
            spArea.value = Providers.getSystemPrompt();
            document.getElementById('btn-save-prompt').onclick = () => {
                const txt = spArea.value.trim();
                if (txt.length < 100) return toast('Prompt muito curto (mín. 100 caracteres)', 'warn');
                Providers.setSystemPrompt(txt);
                toast('Prompt salvo. Será usado nas próximas extrações.', 'success');
            };
            document.getElementById('btn-reset-prompt').onclick = () => {
                if (!confirm('Restaurar o system prompt para o padrão da FASTVIDEO?')) return;
                Providers.resetSystemPrompt();
                spArea.value = Providers.defaultSystemPrompt;
                toast('Prompt restaurado ao padrão', 'success');
            };
        }

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
        const prefs = Storage.getPreferences();
        if (prefs.lastSelection) {
            const opt = Array.from(select.options).find(o => o.value === prefs.lastSelection && !o.disabled);
            if (opt) select.value = prefs.lastSelection;
        }
        if (!select.value) {
            const firstEnabled = Array.from(select.options).find(o => !o.disabled);
            if (firstEnabled) select.value = firstEnabled.value;
        }
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

    // ==================== VALIDATION ====================
    function updateStartButton() {
        const hasPrompt = document.getElementById('prompt').value.trim().length >= 10;
        const hasClip = !!state.projectItem;
        const hasTranscript = !!state.transcript;
        const hasProvider = !!state.providerId && !!Storage.getProviders()[state.providerId]?.apiKey;
        const btn = document.getElementById('btn-start');
        btn.disabled = !(hasPrompt && hasClip && hasTranscript && hasProvider);

        let label = 'Iniciar extração';
        if (!hasProvider) label = 'Configure um provider em ⚙';
        else if (!hasClip) label = 'Passo 1: selecione o vídeo';
        else if (!hasTranscript) label = 'Passo 2: carregue a transcrição';
        else if (!hasPrompt) label = 'Passo 3: escreva o briefing';
        btn.querySelector('.btn-label').textContent = label;
    }

    // ==================== EXTRACTION ====================
    async function startExtraction() {
        const prompt = document.getElementById('prompt').value.trim();
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const durMin = parseInt(document.getElementById('dur-min').value, 10);
        const durMax = parseInt(document.getElementById('dur-max').value, 10);
        const isMax = document.getElementById('max-count').checked;
        const count = isMax ? 999 : parseInt(document.getElementById('count').value, 10);

        if (durMin >= durMax) return toast('Duração mínima deve ser menor que máxima', 'warn');

        console.log('[FASTVIDEO] Iniciando extração — modo:', mode, '| segmentos:', state.transcriptSegments?.length, '| modelo:', state.model);
        showProgress(true, 'Enviando para IA…', 30);
        try {
            const provider = Providers.get(state.providerId);
            const providerConfig = Storage.getProviders()[state.providerId];
            const result = await provider.extractClips({
                apiKey: providerConfig.apiKey,
                model: state.model,
                transcript: state.transcript,
                segments: state.transcriptSegments,
                brief: prompt,
                mode, durMin, durMax, count,
                maxMode: isMax,
                durationSeconds: state.projectItem?.durationSeconds || null
            });
            state.results = { ...result, mode };
            showProgress(true, 'Pronto!', 100);
            setTimeout(() => { showProgress(false); renderResults(); }, 400);
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
            (state.results.variations || []).forEach((v, idx) => list.appendChild(renderVariationCard(v, idx)));
        } else {
            (state.results.clips || []).forEach((c, idx) => list.appendChild(renderClipCard(c, idx)));
        }
        results.classList.remove('hidden');
        results.scrollIntoView({ behavior: 'smooth' });
    }

    function scoreBadge(score) {
        const s = Number(score) || 0;
        let cls = 'score-low';
        if (s >= 7) cls = 'score-high';
        else if (s >= 4) cls = 'score-mid';
        return `<span class="score-badge ${cls}" title="Virality Score">${s.toFixed(1)}</span>`;
    }

    function renderAiMeta(item) {
        const parts = [];
        if (item.headline) parts.push(`<div class="ai-headline">${escapeHtml(item.headline)}</div>`);
        if (item.hook)     parts.push(`<div class="ai-meta-row"><span class="ai-meta-label">Hook</span>${escapeHtml(item.hook)}</div>`);
        if (item.caption)  parts.push(`<div class="ai-meta-row"><span class="ai-meta-label">Caption</span>${escapeHtml(item.caption)}</div>`);
        if (item.onscreen_text) parts.push(`<div class="ai-meta-row"><span class="ai-meta-label">Onscreen</span>${escapeHtml(item.onscreen_text)}</div>`);
        if (!parts.length) return '';
        return `<details class="ai-meta-details"><summary>Ver headline / hook / caption</summary>${parts.join('')}</details>`;
    }

    function renderClipCard(clip, idx) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <input type="checkbox" data-idx="${idx}" checked>
            <div class="result-body">
                <div class="result-label-row">
                    <div class="result-label">${escapeHtml(clip.label || 'Trecho ' + (idx + 1))}</div>
                    ${scoreBadge(clip.score)}
                </div>
                <div class="result-timestamp">${fmt(clip.start)} → ${fmt(clip.end)} (${(clip.end - clip.start).toFixed(1)}s)</div>
                <div class="result-reason">${escapeHtml(clip.reason || clip.text || '')}</div>
                ${renderAiMeta(clip)}
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
                <div class="result-label-row">
                    <div class="result-label">${escapeHtml(variation.label || 'Variação ' + (idx + 1))}</div>
                    ${scoreBadge(variation.score)}
                </div>
                <div class="result-timestamp">${total.toFixed(1)}s total · ${(variation.clips || []).length} cortes</div>
                <div class="result-clips">${clipsHtml}</div>
                ${renderAiMeta(variation)}
            </div>`;
        return card;
    }

    async function insertSelectedClips() {
        const checked = Array.from(document.querySelectorAll('#results-list input[type="checkbox"]:checked'));
        if (!checked.length) return toast('Selecione pelo menos um trecho', 'warn');

        // Validação final de timestamps antes de enviar para host
        function sanitize(clip) {
            const start = Number(clip.start);
            const end = Number(clip.end);
            if (!isFinite(start) || !isFinite(end) || end <= start) return null;
            return { ...clip, start, end };
        }

        const insertMode = document.querySelector('input[name="insert-mode"]:checked')?.value || 'new';
        const payload = {
            mode: state.results.mode,
            projectItemNodeId: state.projectItem.nodeId,
            newSequence: insertMode === 'new',
            editExisting: insertMode === 'edit',
            appendRemaining: insertMode === 'new' && document.getElementById('append-remaining').checked,
            items: []
        };

        let invalidCount = 0;
        checked.forEach(cb => {
            const idx = parseInt(cb.dataset.idx, 10);
            if (state.results.mode === 'compilation') {
                const v = state.results.variations[idx];
                const cleanClips = (v.clips || []).map(sanitize).filter(Boolean);
                if (cleanClips.length) payload.items.push({ label: v.label, clips: cleanClips });
                else invalidCount++;
            } else {
                const clean = sanitize(state.results.clips[idx]);
                if (clean) payload.items.push(clean);
                else invalidCount++;
            }
        });

        if (!payload.items.length) {
            return toast('Nenhum trecho válido para inserir (timestamps inválidos)', 'error');
        }
        if (invalidCount) {
            toast(`Atenção: ${invalidCount} trecho(s) ignorado(s) por timestamps inválidos`, 'warn');
        }

        console.log('[FASTVIDEO] Payload para host:', JSON.parse(JSON.stringify(payload)));

        showProgress(true, 'Inserindo na timeline…', 70);
        try {
            const res = await evalHost(`CC.insertClips(${JSON.stringify(JSON.stringify(payload))})`);
            showProgress(false);
            if (res.ok) {
                let msg;
                if (res.editMode) {
                    msg = `✓ ${res.inserted} corte(s) aplicado(s) na timeline atual com cores`;
                } else {
                    msg = `✓ ${res.inserted} trecho(s) inseridos com cores rotacionadas`;
                    if (res.remainingAppended) msg += ' + vídeo original no final';
                }
                toast(msg, 'success');
            } else {
                toast('Falha: ' + (res.error || 'erro desconhecido'), 'error');
            }
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

    // ==================== SILENCE REMOVER ====================
    let silenceGaps = [];

    function wireSilence() {
        document.getElementById('btn-analyze-silence').onclick = analyzeSilences;
        document.getElementById('btn-apply-silence').onclick = applySilenceCuts;
    }

    function refreshSilenceStatus() {
        const status = document.getElementById('silence-status');
        const btn = document.getElementById('btn-analyze-silence');
        const hasClip = !!state.projectItem;
        const hasTranscript = !!state.transcript;
        if (hasClip && hasTranscript) {
            status.innerHTML = `✓ <strong>${escapeHtml(state.projectItem.name)}</strong> com ${state.transcriptMeta.segments} segmentos de transcrição prontos para análise.`;
            status.style.color = 'var(--success)';
            btn.disabled = false;
        } else {
            status.innerHTML = 'Volte à tela principal (←), selecione o vídeo e carregue a transcrição primeiro.';
            status.style.color = 'var(--text-muted)';
            btn.disabled = true;
        }
    }

    function analyzeSilences() {
        const threshold = parseFloat(document.getElementById('silence-threshold').value) || 1.5;
        const padding = parseFloat(document.getElementById('silence-padding').value) || 0.3;

        // Parse transcript: cada linha é "[mm:ss] texto"
        const lines = state.transcript.split('\n').map(line => {
            const m = line.match(/^\[(\d{1,2}):(\d{2})\]\s*(.*)$/);
            if (!m) return null;
            return {
                start: parseInt(m[1], 10) * 60 + parseInt(m[2], 10),
                text: m[3].trim(),
                words: m[3].trim().split(/\s+/).length
            };
        }).filter(Boolean);

        if (lines.length < 2) {
            return toast('Transcrição sem timestamps suficientes', 'warn');
        }

        // Estima fim de cada frase: start da próxima linha OU start + wordCount/2.5 wps
        silenceGaps = [];
        for (let i = 0; i < lines.length - 1; i++) {
            const current = lines[i];
            const next = lines[i + 1];
            const estimatedEnd = current.start + Math.max(1, current.words / 2.5);
            const gap = next.start - estimatedEnd;
            if (gap >= threshold) {
                silenceGaps.push({
                    start: estimatedEnd + padding,
                    end: next.start - padding,
                    duration: gap - 2 * padding
                });
            }
        }

        renderSilenceList();
    }

    function renderSilenceList() {
        const list = document.getElementById('silence-list');
        const box = document.getElementById('silence-results');
        list.innerHTML = '';

        if (!silenceGaps.length) {
            list.innerHTML = '<p class="note">Nenhum silêncio encontrado acima do limite configurado. Tente reduzir o threshold.</p>';
            box.classList.remove('hidden');
            return;
        }

        silenceGaps.forEach((gap, idx) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <input type="checkbox" data-idx="${idx}" checked>
                <div class="result-body">
                    <div class="result-label-row">
                        <div class="result-label">Silêncio ${idx + 1}</div>
                        <span class="score-badge score-low">${gap.duration.toFixed(1)}s</span>
                    </div>
                    <div class="result-timestamp">${fmt(gap.start)} → ${fmt(gap.end)}</div>
                </div>`;
            list.appendChild(card);
        });

        box.classList.remove('hidden');
        toast(`${silenceGaps.length} silêncio(s) encontrado(s)`, 'success');
    }

    async function applySilenceCuts() {
        const checked = Array.from(document.querySelectorAll('#silence-list input[type="checkbox"]:checked'));
        if (!checked.length) return toast('Selecione pelo menos um silêncio', 'warn');

        const gaps = checked.map(cb => silenceGaps[parseInt(cb.dataset.idx, 10)]);
        const payload = {
            projectItemNodeId: state.projectItem.nodeId,
            gaps: gaps.map(g => ({ start: g.start, end: g.end }))
        };

        showProgress(true, 'Aplicando cortes…', 70);
        try {
            const res = await evalHost(`CC.markSilences(${JSON.stringify(JSON.stringify(payload))})`);
            showProgress(false);
            if (res.ok) toast(`✓ ${res.cut} silêncio(s) marcados em vermelho na timeline`, 'success');
            else toast('Falha: ' + (res.error || 'erro'), 'error');
        } catch (e) {
            showProgress(false);
            toast('Erro: ' + e.message, 'error');
        }
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
        setTimeout(() => el.classList.add('hidden'), 4000);
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
