/**
 * FASTVIDEO — VideoLoader v1.10
 * Expõe window.VideoLoader para seleção de vídeo do SO.
 * Estratégia:
 *   1. Drag-drop: tenta file.path; se não existe, orienta a usar o seletor
 *   2. Clique no dropzone: abre window.cep.fs.showOpenDialog (nativo CEP) — retorna path real
 *   3. Fallback: input type=file (menos confiável em CEP, mas pode funcionar em alguns builds)
 * Ambiente: Adobe CEP (Chromium + Node.js, mixed context).
 */
(function () {
    'use strict';

    const LOG_PREFIX = '[FASTVIDEO][VideoLoader]';

    const SUPPORTED_EXTENSIONS = [
        'mp4', 'mov', 'm4v', 'mxf', 'avi', 'mkv', 'webm',
        'mp3', 'm4a', 'wav', 'flac'
    ];

    // Node modules (disponíveis em CEP com --enable-nodejs)
    let fsNode = null, pathNode = null;
    try { fsNode = require('fs'); pathNode = require('path'); } catch (_) { /* noop se não tem Node */ }

    const getExtension = (name) => {
        if (!name || typeof name !== 'string') return '';
        const clean = name.split(/[\\/]/).pop() || '';
        const dot = clean.lastIndexOf('.');
        if (dot < 0 || dot === clean.length - 1) return '';
        return clean.slice(dot + 1).toLowerCase();
    };

    const isVideoFile = (nameOrFile) => {
        if (!nameOrFile) return false;
        let name = '';
        if (typeof nameOrFile === 'string') name = nameOrFile;
        else if (typeof nameOrFile === 'object') name = nameOrFile.name || nameOrFile.path || '';
        const ext = getExtension(name);
        return SUPPORTED_EXTENSIONS.includes(ext);
    };

    const formatSize = (bytes) => {
        if (bytes == null || isNaN(bytes)) return '0 B';
        const n = Number(bytes);
        if (n < 1024) return `${n} B`;
        const units = ['KB', 'MB', 'GB', 'TB'];
        let value = n / 1024;
        let i = 0;
        while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
        return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[i]}`;
    };

    /**
     * Monta videoFile a partir de um path local (lendo stats via Node fs).
     */
    const videoFileFromPath = (filePath) => {
        if (!filePath || typeof filePath !== 'string') return null;
        if (!isVideoFile(filePath)) return null;
        if (!fsNode || !pathNode) {
            // Sem Node: retorna estrutura mínima (size zero)
            const name = filePath.split(/[\\/]/).pop() || 'video';
            return { name, path: filePath, size: 0, type: '', lastModified: Date.now() };
        }
        try {
            if (!fsNode.existsSync(filePath)) return null;
            const stats = fsNode.statSync(filePath);
            return {
                name: pathNode.basename(filePath),
                path: filePath,
                size: stats.size,
                type: '',
                lastModified: stats.mtimeMs || (stats.mtime && stats.mtime.getTime ? stats.mtime.getTime() : Date.now())
            };
        } catch (e) {
            console.warn(`${LOG_PREFIX} videoFileFromPath falhou:`, e.message);
            return null;
        }
    };

    /**
     * Abre o seletor nativo do CEP. Retorna Promise<string|null> com o path (ou null se cancelou).
     */
    const openNativeFileDialog = () => new Promise((resolve, reject) => {
        try {
            if (!window.cep || !window.cep.fs || typeof window.cep.fs.showOpenDialog !== 'function') {
                return reject(new Error('Diálogo CEP nativo indisponível'));
            }
            // cep.fs.showOpenDialog(allowMultipleSelection, chooseDirectory, title, initialPath, fileTypes)
            const result = window.cep.fs.showOpenDialog(
                false, false,
                'Selecionar vídeo',
                '',
                SUPPORTED_EXTENSIONS
            );
            if (result.err !== 0) {
                // err 0 = sucesso; outros códigos = erro/cancel
                console.log(`${LOG_PREFIX} showOpenDialog err:`, result.err);
                return resolve(null);
            }
            if (!result.data || !result.data.length) return resolve(null); // cancelou
            let filePath = Array.isArray(result.data) ? result.data[0] : result.data;
            // Em algumas plataformas o retorno vem como "file:///..." — normaliza
            if (typeof filePath === 'string' && filePath.indexOf('file://') === 0) {
                filePath = decodeURIComponent(filePath.replace(/^file:\/\//, ''));
            }
            resolve(filePath);
        } catch (e) {
            reject(e);
        }
    });

    const resolveLocalPath = (file) => {
        if (!file) return null;
        if (typeof file.path === 'string' && file.path.length > 0) return file.path;
        return null;
    };

    const buildVideoFileFromFile = (file, path) => ({
        name: file.name || (path ? path.split(/[\\/]/).pop() : 'video'),
        path: path,
        size: typeof file.size === 'number' ? file.size : 0,
        type: file.type || '',
        lastModified: typeof file.lastModified === 'number' ? file.lastModified : Date.now()
    });

    const handleFile = (file, callbacks) => {
        const { onLoad, onError } = callbacks;
        if (!file) return onError && onError('Nenhum arquivo recebido.');
        if (!isVideoFile(file)) {
            return onError && onError(`Formato não suportado: ${file.name || '(sem nome)'}. Use: ${SUPPORTED_EXTENSIONS.join(', ')}.`);
        }
        const path = resolveLocalPath(file);
        if (!path) {
            return onError && onError('Drag-drop não forneceu caminho local — clique no dropzone para usar o seletor nativo.');
        }
        const videoFile = buildVideoFileFromFile(file, path);
        console.log(`${LOG_PREFIX} vídeo via drop:`, videoFile.name, formatSize(videoFile.size));
        try { onLoad && onLoad(videoFile); }
        catch (err) {
            console.log(`${LOG_PREFIX} exceção em onLoad:`, err);
            onError && onError(`Erro ao processar vídeo: ${err && err.message ? err.message : err}`);
        }
    };

    const pickViaNativeDialog = async (callbacks) => {
        const { onLoad, onError } = callbacks;
        try {
            const filePath = await openNativeFileDialog();
            if (!filePath) return; // cancelado
            const vf = videoFileFromPath(filePath);
            if (!vf) return onError && onError('Não foi possível ler o arquivo selecionado.');
            console.log(`${LOG_PREFIX} vídeo via CEP dialog:`, vf.name, formatSize(vf.size));
            onLoad && onLoad(vf);
        } catch (e) {
            console.warn(`${LOG_PREFIX} CEP dialog falhou:`, e.message);
            // Fallback para input type=file
            if (callbacks.fileInputEl) {
                try { callbacks.fileInputEl.click(); }
                catch (err) { onError && onError(`Não foi possível abrir seletor: ${err.message}`); }
            } else {
                onError && onError(`Não foi possível abrir seletor: ${e.message}`);
            }
        }
    };

    const init = (opts) => {
        if (!opts || typeof opts !== 'object') throw new Error('VideoLoader.init: opts obrigatório.');
        const { dropzoneEl, fileInputEl, onLoad, onError } = opts;
        if (!dropzoneEl) throw new Error('VideoLoader.init: dropzoneEl obrigatório.');

        const callbacks = { onLoad, onError, fileInputEl };

        const onDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); dropzoneEl.classList.add('dragover'); };
        const onDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); try { e.dataTransfer.dropEffect = 'copy'; } catch (_) {} dropzoneEl.classList.add('dragover'); };
        const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); dropzoneEl.classList.remove('dragover'); };

        const onDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzoneEl.classList.remove('dragover');
            const files = e.dataTransfer && e.dataTransfer.files;
            if (!files || !files.length) return onError && onError('Nenhum arquivo detectado no drop.');
            handleFile(files[0], callbacks);
        };

        // Click no dropzone → tenta seletor CEP nativo primeiro (mais confiável)
        const onClick = (e) => {
            if (e && e.target === fileInputEl) return;
            pickViaNativeDialog(callbacks);
        };

        const onInputChange = (e) => {
            const files = e.target && e.target.files;
            if (!files || !files.length) return;
            handleFile(files[0], callbacks);
            try { e.target.value = ''; } catch (_) {}
        };

        dropzoneEl.addEventListener('dragenter', onDragEnter);
        dropzoneEl.addEventListener('dragover', onDragOver);
        dropzoneEl.addEventListener('dragleave', onDragLeave);
        dropzoneEl.addEventListener('drop', onDrop);
        dropzoneEl.addEventListener('click', onClick);
        if (fileInputEl) fileInputEl.addEventListener('change', onInputChange);

        const hasCepDialog = !!(window.cep && window.cep.fs && typeof window.cep.fs.showOpenDialog === 'function');
        console.log(`${LOG_PREFIX} inicializado. CEP dialog:`, hasCepDialog ? 'disponível' : 'INDISPONÍVEL (usando fallback input file)');
    };

    window.VideoLoader = {
        init,
        isVideoFile,
        formatSize,
        videoFileFromPath,
        openNativeFileDialog
    };
})();
