/**
 * FASTVIDEO — main controller v1.2.
 */
(function() {
    const cs = new CSInterface();
    const state = {
        // Vídeo — fonte principal a partir da v1.8 (drop do SO)
        videoFile: null,       // { name, path, size, type, lastModified, durationSeconds? }
        projectItem: null,     // legado — clipe do Project Panel
        // Transcrição
        transcriptSource: 'ai', // 'ai' | 'manual'
        transcript: null,
        transcriptMeta: null,
        transcriptSegments: null,
        // Extração / resultados
        results: null,
        providerId: 'anthropic',
        model: 'claude-sonnet-4-6',
        availableClips: [],
        isInserting: false     // flag para impedir duplo clique em Adicionar à timeline
    };

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadProviders();
        refreshModelDropdown();
        wireNav();
        wireVideoDrop();         // v1.8 — drag-drop de vídeo do SO
        wireTranscriptSource();  // v1.8 — radio IA vs manual
        wireClipPicker();        // mantido como alternativa avançada
        wireTranscript();
        wireCountToggle();
        wireActions();
        wireSettings();
        wireTemplates();
        wireModals();
        refreshTemplatesUI();
        // Carrega clipes do Project em background para permitir alternativa
        setTimeout(loadClipsFromProject, 300);
    }

    // ==================== VIDEO DROP (v1.8) ====================
    function wireVideoDrop() {
        if (!window.VideoLoader) {
            console.error('[FASTVIDEO] VideoLoader não carregou');
            return;
        }
        const dz = document.getElementById('dropzone-video');
        const fi = document.getElementById('file-video');
        if (!dz || !fi) return;

        window.VideoLoader.init({
            dropzoneEl: dz,
            fileInputEl: fi,
            onLoad: (videoFile) => {
                console.log('[FASTVIDEO] Vídeo carregado:', videoFile);
                state.videoFile = videoFile;
                renderVideoInfo();
                updateStartButton();
                toast(`✓ "${videoFile.name}" carregado`, 'success');
            },
            onError: (msg) => {
                console.warn('[FASTVIDEO] VideoLoader error:', msg);
                toast(msg, 'error');
            }
        });

        const clearBtn = document.getElementById('btn-clear-video');
        if (clearBtn) clearBtn.onclick = clearVideo;

        const reproBtn = document.getElementById('btn-reprocess-transcription');
        if (reproBtn) reproBtn.onclick = reprocessTranscription;
    }

    function renderVideoInfo() {
        const info = document.getElementById('video-info');
        const dz = document.getElementById('dropzone-video');
        if (!state.videoFile) {
            info?.classList.add('hidden');
            dz?.classList.remove('hidden');
            return;
        }
        info?.classList.remove('hidden');
        dz?.classList.add('hidden');
        const nameEl = document.getElementById('video-name');
        const metaEl = document.getElementById('video-meta');
        const reproBtn = document.getElementById('btn-reprocess-transcription');
        if (nameEl) nameEl.textContent = state.videoFile.name;
        if (metaEl) {
            const sizeStr = window.VideoLoader?.formatSize(state.videoFile.size) || '';
            const parts = [sizeStr];
            if (state.transcriptMeta?.format === 'whisper') {
                parts.push(state.transcriptMeta.fromCache
                    ? `📁 cache · ${state.transcriptMeta.count} seg`
                    : `✨ Whisper · ${state.transcriptMeta.count} seg`);
            }
            metaEl.innerHTML = parts.map(p => escapeHtml(p)).join(' · ');
        }
        // Mostra botão "Reprocessar" apenas se temos transcrição whisper em cache
        if (reproBtn) {
            reproBtn.style.display = state.transcriptMeta?.format === 'whisper' ? '' : 'none';
        }
    }

    function clearVideo() {
        state.videoFile = null;
        renderVideoInfo();
        updateStartButton();
    }

    // ==================== TRANSCRIPT SOURCE RADIO (v1.8) ====================
    function wireTranscriptSource() {
        document.querySelectorAll('input[name="tr-source"]').forEach(r => {
            r.addEventListener('change', () => {
                const val = document.querySelector('input[name="tr-source"]:checked').value;
                const prev = state.transcriptSource;
                state.transcriptSource = val;
                const manualBox = document.getElementById('manual-transcript-box');
                if (manualBox) manualBox.classList.toggle('hidden', val !== 'manual');
                // Trocar a fonte invalida a transcrição anterior (se veio de outra fonte)
                if (prev && prev !== val) {
                    const wasWhisper = state.transcriptMeta?.format === 'whisper';
                    const isNowManual = val === 'manual';
                    if ((wasWhisper && isNowManual) || (!wasWhisper && !isNowManual)) {
                        state.transcript = null;
                        state.transcriptSegments = null;
                        state.transcriptMeta = null;
                        renderVideoInfo();
                        renderTranscriptInfo();
                    }
                }
                updateStartButton();
            });
        });
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

        // Atualiza nota de inserção conforme modo de extração
        document.querySelectorAll('input[name="mode"]').forEach(r => {
            r.addEventListener('change', () => {
                const mode = r.value;
                const note = document.querySelector('.insert-note');
                if (note) {
                    if (mode === 'speech') note.textContent = '✨ Cada fala vira um vídeo separado na timeline, com cor diferente e gap de 30s.';
                    else if (mode === 'narrative') note.textContent = '✨ Cada vídeo criado é um grupo de cortes com a mesma cor. Gap de 30s entre vídeos.';
                    else if (mode === 'compilation') note.textContent = '✨ Cada variação é um grupo com cor única, gap 30s entre grupos.';
                    else note.textContent = '✨ Cada trecho com cor diferente, gap 30s entre trechos.';
                }
            });
        });
    }

    function resetAll() {
        if (!confirm('Limpar tudo e começar de novo? Os trechos gerados e configurações deste fluxo serão descartados.')) return;

        // Vídeo (drop)
        clearVideo();
        // Clipe do Project Panel (alternativa avançada)
        state.projectItem = null;
        const cd = document.getElementById('clip-dropdown');
        if (cd) cd.value = '';
        document.getElementById('clip-info')?.classList.add('hidden');

        // Fonte de transcrição volta p/ IA
        const aiRadio = document.querySelector('input[name="tr-source"][value="ai"]');
        if (aiRadio) aiRadio.checked = true;
        state.transcriptSource = 'ai';
        document.getElementById('manual-transcript-box')?.classList.add('hidden');

        // Transcrição
        clearTranscript();

        // Briefing
        document.getElementById('prompt').value = '';

        // Config (volta aos defaults)
        document.querySelector('input[name="mode"][value="speech"]').checked = true;
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
            updateStartButton();
        };
        if (select.value) {
            const [pid, mid] = select.value.split('::');
            state.providerId = pid;
            state.model = mid;
        }
    }

    // ==================== VALIDATION ====================
    function updateStartButton() {
        const hasPrompt    = document.getElementById('prompt').value.trim().length >= 10;
        const hasVideo     = !!(state.videoFile || state.projectItem);
        const srcIsManual  = state.transcriptSource === 'manual';
        const hasTranscript = !!state.transcript;
        const hasProvider  = !!state.providerId && !!Storage.getProviders()[state.providerId]?.apiKey;
        const hasOpenAI    = !!Storage.getProviders().openai?.apiKey;

        // Se fonte é IA: precisa de vídeo + OpenAI key (Whisper)
        // Se fonte é manual: precisa de transcrição carregada
        const transcriptReady = srcIsManual ? hasTranscript : (hasVideo && hasOpenAI);

        const btn = document.getElementById('btn-start');
        btn.disabled = !(hasPrompt && hasVideo && transcriptReady && hasProvider);

        let label = 'Analisar vídeo';
        if (!hasVideo) label = 'Arraste um vídeo para começar';
        else if (!hasPrompt) label = 'Escreva o briefing';
        else if (!hasProvider) label = 'Configure um provider em ⚙';
        else if (srcIsManual && !hasTranscript) label = 'Carregue a transcrição manual';
        else if (!srcIsManual && !hasOpenAI) label = 'Configure OpenAI API key para Whisper';
        btn.querySelector('.btn-label').textContent = label;
    }

    // ==================== EXTRACTION ====================

    function getExtractionOpts() {
        const prompt = document.getElementById('prompt').value.trim();
        const mode   = document.querySelector('input[name="mode"]:checked').value;
        const durMin = parseInt(document.getElementById('dur-min').value, 10);
        const durMax = parseInt(document.getElementById('dur-max').value, 10);
        const isMax  = document.getElementById('max-count').checked;
        const count  = isMax ? 999 : parseInt(document.getElementById('count').value, 10);
        return { brief: prompt, mode, durMin, durMax, count, maxMode: isMax };
    }

    async function startExtraction() {
        const opts = getExtractionOpts();
        if (opts.durMin >= opts.durMax) return toast('Duração mínima deve ser menor que máxima', 'warn');

        console.log('[FASTVIDEO] Iniciando — modo:', opts.mode, '| fonte transcrição:', state.transcriptSource, '| modelo:', state.model);

        // Se fonte é IA e ainda não tem transcrição (ou é de vídeo diferente), transcreve com Whisper
        if (state.transcriptSource === 'ai') {
            const needsTranscribe = !state.transcriptSegments || (state.transcriptMeta?.sourceVideoPath !== state.videoFile?.path);
            if (needsTranscribe) {
                const ok = await runWhisperTranscription();
                if (!ok) return;
            }
        }

        if (!state.transcriptSegments || state.transcriptSegments.length < 2) {
            return toast('Transcrição indisponível — carregue uma manual ou configure o Whisper', 'warn');
        }

        if (opts.mode === 'speech')    return startSpeechExtraction(opts);
        if (opts.mode === 'narrative') return startNarrativeExtraction(opts);
        return startLegacyExtraction(opts);
    }

    async function runWhisperTranscription(forceRefresh) {
        if (!state.videoFile || !state.videoFile.path) {
            toast('Arraste um vídeo antes de transcrever', 'warn');
            return false;
        }
        const openaiKey = Storage.getProviders().openai?.apiKey;
        if (!openaiKey) {
            toast('Configure a OpenAI API key em ⚙ (usada para Whisper)', 'warn');
            return false;
        }
        if (!window.AudioTranscriber) {
            toast('AudioTranscriber não carregou', 'error');
            return false;
        }

        showProgress(true, 'Preparando transcrição…', 5);
        try {
            const result = await window.AudioTranscriber.transcribe({
                videoPath: state.videoFile.path,
                apiKey: openaiKey,
                forceRefresh: !!forceRefresh,
                onProgress: (label, pct) => showProgress(true, label, pct)
            });
            const fromCache = result.fromCache;
            console.log('[FASTVIDEO] Whisper retornou', result.segments?.length, 'segments, fromCache=', fromCache);
            state.transcript = (result.segments || []).map(s => {
                const m = Math.floor(s.start / 60), sec = Math.floor(s.start % 60);
                return `[${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}] ${s.text}`;
            }).join('\n');
            state.transcriptSegments = result.segments;
            state.transcriptMeta = {
                format: 'whisper',
                count: result.segments.length,
                sourceName: state.videoFile.name,
                sourceVideoPath: state.videoFile.path,
                fromCache
            };
            renderVideoInfo();
            const msg = fromCache
                ? `✓ ${result.segments.length} segmentos (cache local)`
                : `✓ ${result.segments.length} segmentos transcritos via Whisper`;
            toast(msg, 'success');
            return true;
        } catch (e) {
            showProgress(false);
            console.error('[FASTVIDEO] Whisper falhou:', e);
            toast('Erro na transcrição: ' + e.message, 'error');
            return false;
        }
    }

    // Botão "Reprocessar transcrição" — força nova chamada ao Whisper
    async function reprocessTranscription() {
        if (!state.videoFile) return toast('Nenhum vídeo carregado', 'warn');
        state.transcriptSegments = null;
        state.transcriptMeta = null;
        await runWhisperTranscription(true);
        updateStartButton();
    }

    async function startSpeechExtraction(opts) {
        const segments = state.transcriptSegments;
        if (!segments || segments.length < 4) {
            return toast('Transcrição insuficiente para gerar candidatos', 'warn');
        }

        showProgress(true, 'Gerando candidatos de fala…', 20);
        let candidates;
        try {
            candidates = Engines.buildFullSpeechCandidates(segments, opts);
        } catch (e) {
            showProgress(false);
            console.error('[FASTVIDEO] Erro ao gerar candidatos:', e);
            return toast('Erro ao gerar candidatos: ' + e.message, 'error');
        }

        console.log('[FASTVIDEO] Candidatos gerados:', candidates.length);
        if (candidates.length < 2) {
            showProgress(false);
            return toast(`Poucos candidatos (${candidates.length}) — ajuste duração mín/máx ou transcrição`, 'warn');
        }

        const candidatesMap = new Map(candidates.map(c => [c.id, c]));

        // Persiste em state para reprocessamento por card
        state.lastCandidates = candidates;
        state.candidatesMap = candidatesMap;
        state.lastBrief = opts.brief;
        state.lastOpts = opts;

        showProgress(true, 'Enviando para IA…', 55);
        try {
            const provider = Providers.get(state.providerId);
            const providerConfig = Storage.getProviders()[state.providerId];
            const selected = await provider.extractFullSpeech({
                apiKey: providerConfig.apiKey,
                model: state.model,
                candidates,
                candidatesMap,
                brief: opts.brief,
                count: opts.count,
                maxMode: opts.maxMode
            });
            state.results = { mode: 'speech', selected };
            showProgress(true, 'Pronto!', 100);
            setTimeout(() => { showProgress(false); renderResults(); }, 400);
        } catch (err) {
            showProgress(false);
            toast('Erro: ' + err.message, 'error');
        }
    }

    async function startNarrativeExtraction(opts) {
        const segments = state.transcriptSegments;
        if (!segments || segments.length < 4) {
            return toast('Transcrição insuficiente para gerar blocos', 'warn');
        }

        showProgress(true, 'Gerando blocos narrativos…', 20);
        let blocks;
        try {
            blocks = Engines.buildNarrativeBlocks(segments, opts);
        } catch (e) {
            showProgress(false);
            console.error('[FASTVIDEO] Erro ao gerar blocos:', e);
            return toast('Erro ao gerar blocos: ' + e.message, 'error');
        }

        console.log('[FASTVIDEO] Blocos gerados:', blocks.length);
        if (blocks.length < 4) {
            showProgress(false);
            return toast(`Poucos blocos (${blocks.length}) — verifique a transcrição`, 'warn');
        }

        const blocksMap = new Map(blocks.map(b => [b.id, b]));

        // Persiste em state para reprocessamento por card
        state.lastBlocks = blocks;
        state.blocksMap = blocksMap;
        state.lastBrief = opts.brief;
        state.lastOpts = opts;

        showProgress(true, 'Enviando para IA…', 55);
        try {
            const provider = Providers.get(state.providerId);
            const providerConfig = Storage.getProviders()[state.providerId];
            const videos = await provider.createNarrativeVideos({
                apiKey: providerConfig.apiKey,
                model: state.model,
                blocks,
                blocksMap,
                brief: opts.brief,
                count: opts.count,
                durMin: opts.durMin,
                durMax: opts.durMax,
                maxMode: opts.maxMode
            });
            state.results = { mode: 'narrative', videos };
            showProgress(true, 'Pronto!', 100);
            setTimeout(() => { showProgress(false); renderResults(); }, 400);
        } catch (err) {
            showProgress(false);
            toast('Erro: ' + err.message, 'error');
        }
    }

    async function startLegacyExtraction(opts) {
        showProgress(true, 'Enviando para IA…', 30);
        try {
            const provider = Providers.get(state.providerId);
            const providerConfig = Storage.getProviders()[state.providerId];
            const result = await provider.extractClips({
                apiKey: providerConfig.apiKey,
                model: state.model,
                transcript: state.transcript,
                segments: state.transcriptSegments,
                brief: opts.brief,
                mode: opts.mode, durMin: opts.durMin, durMax: opts.durMax, count: opts.count,
                maxMode: opts.maxMode,
                durationSeconds: state.projectItem?.durationSeconds || null
            });
            state.results = { ...result, mode: opts.mode };
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

        const mode = state.results.mode;
        if (mode === 'speech') {
            const items = state.results.selected || [];
            if (!items.length) {
                list.innerHTML = '<p class="note">Nenhuma fala encontrada com score ≥ 5. Tente ajustar o briefing ou as durações.</p>';
            } else {
                items.forEach((item, idx) => list.appendChild(renderSpeechCard(item, idx)));
            }
        } else if (mode === 'narrative') {
            const videos = state.results.videos || [];
            if (!videos.length) {
                list.innerHTML = '<p class="note">Nenhum vídeo gerado com score ≥ 5. Tente ajustar o briefing ou as durações.</p>';
            } else {
                videos.forEach((video, idx) => list.appendChild(renderNarrativeCard(video, idx)));
            }
        } else if (mode === 'compilation') {
            (state.results.variations || []).forEach((v, idx) => list.appendChild(renderVariationCard(v, idx)));
        } else {
            (state.results.clips || []).forEach((c, idx) => list.appendChild(renderClipCard(c, idx)));
        }

        results.classList.remove('hidden');
        results.scrollIntoView({ behavior: 'smooth' });
        wireCardActions();
    }

    function renderCardActions(idx) {
        return `<div class="card-actions">
            <button class="link-btn" data-action="refine" data-idx="${idx}" title="Melhorar este corte">✨ Melhorar</button>
            <button class="link-btn" data-action="new-hook" data-idx="${idx}" title="Buscar outro gancho">🎣 Novo gancho</button>
            <button class="link-btn" data-action="variation" data-idx="${idx}" title="Criar uma variação">🔀 Variação</button>
            <button class="link-btn muted-link" data-action="discard" data-idx="${idx}" title="Descartar">🗑</button>
        </div>`;
    }

    function renderSpeechCard(item, idx) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <input type="checkbox" data-idx="${idx}" checked>
            <div class="result-body">
                <div class="result-label-row">
                    <div class="result-label">${escapeHtml(item.label || 'Fala ' + (idx + 1))}<span class="candidate-id-badge">${escapeHtml(item.candidate_id || '')}</span></div>
                    ${scoreBadge(item.score)}
                </div>
                <div class="result-timestamp">${fmt(item.start)} → ${fmt(item.end)} (${(item.duration || (item.end - item.start)).toFixed(1)}s)</div>
                <div class="result-reason">${escapeHtml(item.reason || '')}</div>
                <details class="speech-text-details"><summary>Ver texto completo</summary><div class="speech-text">${escapeHtml(item.text || '')}</div></details>
                ${renderAiMeta(item)}
                ${renderCardActions(idx)}
            </div>`;
        return card;
    }

    const ROLE_LABELS = { hook: 'Gancho', body: 'Desenv.', context: 'Contexto', proof: 'Exemplo', contrast: 'Contraste', payoff: 'Fechamento', cta: 'CTA' };

    function renderNarrativeCard(video, idx) {
        const card = document.createElement('div');
        card.className = 'result-card';
        const total = video.totalDuration || (video.clips || []).reduce((s, c) => s + (c.duration || (c.end - c.start)), 0);
        const clipsHtml = (video.clips || []).map(c => {
            const roleLabel = ROLE_LABELS[c.role] || c.role;
            return `<div class="narrative-clip">
                <span class="role-badge role-${escapeHtml(c.role || 'body')}">${escapeHtml(roleLabel)}</span>
                <span class="clip-time">${fmt(c.start)}→${fmt(c.end)}</span>
                <span class="clip-text">${escapeHtml((c.text || '').slice(0, 55))}…</span>
            </div>`;
        }).join('');
        card.innerHTML = `
            <input type="checkbox" data-idx="${idx}" checked>
            <div class="result-body">
                <div class="result-label-row">
                    <div class="result-label">${escapeHtml(video.label || 'Vídeo ' + (idx + 1))}</div>
                    ${scoreBadge(video.score)}
                </div>
                <div class="result-timestamp">${total.toFixed(1)}s total · ${(video.clips || []).length} cortes</div>
                <div class="narrative-clips">${clipsHtml}</div>
                <div class="result-reason">${escapeHtml(video.reason || '')}</div>
                ${renderAiMeta(video)}
                ${renderCardActions(idx)}
            </div>`;
        return card;
    }

    // ==================== CARD ACTIONS (v1.9) ====================
    function wireCardActions() {
        const list = document.getElementById('results-list');
        if (!list || list._wiredActions) return;
        list._wiredActions = true;
        list.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const idx = parseInt(btn.dataset.idx, 10);
            if (isNaN(idx)) return;
            await handleCardAction(action, idx, btn);
        });
    }

    async function handleCardAction(action, idx, btn) {
        if (!state.results) return;
        const mode = state.results.mode;

        // Descartar: remove imediatamente
        if (action === 'discard') {
            if (mode === 'speech') state.results.selected.splice(idx, 1);
            else if (mode === 'narrative') state.results.videos.splice(idx, 1);
            renderResults();
            return;
        }

        // Ações de IA exigem candidates/blocks em memória
        if (mode === 'speech' && (!state.lastCandidates || !state.candidatesMap)) {
            return toast('Candidatos não disponíveis — refaça a análise', 'warn');
        }
        if (mode === 'narrative' && (!state.lastBlocks || !state.blocksMap)) {
            return toast('Blocos não disponíveis — refaça a análise', 'warn');
        }

        const provider = Providers.get(state.providerId);
        const providerConfig = Storage.getProviders()[state.providerId];
        if (!providerConfig?.apiKey) return toast('Provider sem API key', 'error');

        // Desabilita todos os botões do card durante o reprocessamento
        const card = btn.closest('.result-card');
        const allBtns = card?.querySelectorAll('button[data-action]') || [];
        allBtns.forEach(b => b.disabled = true);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '⏳ reprocessando…';

        try {
            if (mode === 'speech') {
                if (typeof provider.refineSpeechItem !== 'function') {
                    throw new Error('Provider ' + state.providerId + ' não suporta reprocessamento — use Claude');
                }
                const current = state.results.selected[idx];
                const alternatives = Engines.findSpeechAlternatives
                    ? Engines.findSpeechAlternatives(current, state.lastCandidates, action)
                    : state.lastCandidates.filter(c => c.id !== current.candidate_id).slice(0, 12);

                console.log('[FASTVIDEO] refineSpeechItem:', action, '| current:', current.candidate_id, '| alternatives:', alternatives.length);
                const refined = await provider.refineSpeechItem({
                    apiKey: providerConfig.apiKey,
                    model: state.model,
                    current,
                    alternatives,
                    candidatesMap: state.candidatesMap,
                    action,
                    brief: state.lastBrief || ''
                });
                if (!refined) throw new Error('Sem alternativa retornada');
                if (refined.candidate_id === current.candidate_id) {
                    toast('IA manteve o corte atual como melhor opção', 'info');
                } else {
                    state.results.selected[idx] = refined;
                    renderResults();
                    toast('✓ Card atualizado', 'success');
                }
            } else if (mode === 'narrative') {
                if (typeof provider.refineNarrativeVideo !== 'function') {
                    throw new Error('Provider ' + state.providerId + ' não suporta reprocessamento — use Claude');
                }
                const current = state.results.videos[idx];
                const alternatives = Engines.findNarrativeAlternatives
                    ? Engines.findNarrativeAlternatives(current, state.lastBlocks, action)
                    : state.lastBlocks.slice(0, 20);

                console.log('[FASTVIDEO] refineNarrativeVideo:', action, '| current:', current.id, '| alternatives:', alternatives.length);
                const refined = await provider.refineNarrativeVideo({
                    apiKey: providerConfig.apiKey,
                    model: state.model,
                    current,
                    alternatives,
                    blocksMap: state.blocksMap,
                    action,
                    brief: state.lastBrief || '',
                    durMin: state.lastOpts?.durMin || 15,
                    durMax: state.lastOpts?.durMax || 90
                });
                if (!refined) throw new Error('Sem alternativa retornada');
                state.results.videos[idx] = refined;
                renderResults();
                toast('✓ Vídeo atualizado', 'success');
            }
        } catch (e) {
            console.error('[FASTVIDEO] handleCardAction falhou:', e);
            toast('Erro: ' + e.message, 'error');
        } finally {
            allBtns.forEach(b => b.disabled = false);
            btn.innerHTML = originalHtml;
        }
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
            `<div class="result-clip-item">[${escapeHtml(String(c.role || '').toUpperCase().padEnd(5))}] ${fmt(c.start)}→${fmt(c.end)} · ${escapeHtml((c.text || '').slice(0, 50))}</div>`
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
        if (state.isInserting) {
            console.warn('[FASTVIDEO] Inserção já em andamento — ignorando clique duplicado');
            return;
        }

        const checked = Array.from(document.querySelectorAll('#results-list input[type="checkbox"]:checked'));
        if (!checked.length) return toast('Selecione pelo menos um trecho', 'warn');

        // Resolve nodeId: se temos videoFile (drop), importa para o Premiere; senão usa projectItem
        let nodeId = state.projectItem?.nodeId;
        if (!nodeId && state.videoFile?.path) {
            showProgress(true, 'Importando vídeo no Premiere…', 40);
            try {
                const importRes = await evalHost(`CC.importVideoIfNeeded(${JSON.stringify(state.videoFile.path)})`);
                if (!importRes.ok) {
                    showProgress(false);
                    return toast('Falha ao importar vídeo: ' + (importRes.error || 'erro'), 'error');
                }
                nodeId = importRes.nodeId;
                // Guarda o projectItem resolvido
                state.projectItem = {
                    nodeId: importRes.nodeId,
                    name: importRes.name,
                    path: importRes.path,
                    durationSeconds: importRes.durationSeconds
                };
                console.log('[FASTVIDEO] Vídeo importado: nodeId=' + nodeId, 'novo=' + importRes.wasImported);
            } catch (e) {
                showProgress(false);
                return toast('Erro ao importar vídeo: ' + e.message, 'error');
            }
        }

        if (!nodeId) return toast('Nenhum vídeo disponível para inserir', 'error');

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
            projectItemNodeId: nodeId,
            newSequence: insertMode === 'new',
            editExisting: insertMode === 'edit',
            appendRemaining: insertMode === 'new' && document.getElementById('append-remaining').checked,
            items: []
        };

        let invalidCount = 0;
        const mode = state.results.mode;

        checked.forEach(cb => {
            const idx = parseInt(cb.dataset.idx, 10);

            if (mode === 'speech') {
                // Cada fala selecionada → clip contínuo individual
                const item = state.results.selected[idx];
                const clean = sanitize(item);
                if (clean) payload.items.push(clean);
                else invalidCount++;
            } else if (mode === 'narrative') {
                // Cada vídeo narrativo → grupo de clips (igual à compilation no host)
                const video = state.results.videos[idx];
                const cleanClips = (video.clips || []).map(sanitize).filter(Boolean);
                if (cleanClips.length >= 2) payload.items.push({ label: video.label, clips: cleanClips });
                else invalidCount++;
            } else if (mode === 'compilation') {
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

        // Mapeia speech → continuous e narrative → compilation para o host
        if (mode === 'speech')    payload.mode = 'continuous';
        if (mode === 'narrative') payload.mode = 'compilation';

        if (!payload.items.length) {
            return toast('Nenhum trecho válido para inserir (timestamps inválidos)', 'error');
        }
        if (invalidCount) {
            toast(`Atenção: ${invalidCount} trecho(s) ignorado(s) por timestamps inválidos`, 'warn');
        }

        // Deduplicação cliente — evita enviar mesmo start-end duas vezes no payload
        const seenKeys = new Set();
        const dedupedItems = [];
        let dupCount = 0;
        for (const item of payload.items) {
            if (item.clips) {
                const unique = [];
                for (const c of item.clips) {
                    const k = `${c.start.toFixed(2)}-${c.end.toFixed(2)}`;
                    if (seenKeys.has(k)) { dupCount++; continue; }
                    seenKeys.add(k);
                    unique.push(c);
                }
                if (unique.length) dedupedItems.push({ ...item, clips: unique });
            } else {
                const k = `${item.start.toFixed(2)}-${item.end.toFixed(2)}`;
                if (seenKeys.has(k)) { dupCount++; continue; }
                seenKeys.add(k);
                dedupedItems.push(item);
            }
        }
        payload.items = dedupedItems;
        if (dupCount) console.warn('[FASTVIDEO] Removidos', dupCount, 'duplicatas do payload');

        console.log('[FASTVIDEO] Payload final:', payload.items.length, 'items (dedup=', dupCount, ')');

        state.isInserting = true;
        const insertBtn = document.getElementById('btn-insert');
        if (insertBtn) insertBtn.disabled = true;

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
        } finally {
            state.isInserting = false;
            if (insertBtn) insertBtn.disabled = false;
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
