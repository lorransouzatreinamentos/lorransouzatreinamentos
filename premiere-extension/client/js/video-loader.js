/**
 * FASTVIDEO — VideoLoader
 * Expõe window.VideoLoader para drag-drop real de vídeo do SO + seleção via input file.
 * Ambiente: Adobe CEP (Chromium + Node.js, mixed context).
 */
(function () {
    'use strict';

    const LOG_PREFIX = '[FASTVIDEO][VideoLoader]';

    const SUPPORTED_EXTENSIONS = [
        'mp4', 'mov', 'm4v', 'mxf', 'avi', 'mkv', 'webm',
        'mp3', 'm4a', 'wav', 'flac'
    ];

    /**
     * Extrai extensão lowercase de um nome/path.
     */
    const getExtension = (name) => {
        if (!name || typeof name !== 'string') return '';
        const clean = name.split(/[\\/]/).pop() || '';
        const dot = clean.lastIndexOf('.');
        if (dot < 0 || dot === clean.length - 1) return '';
        return clean.slice(dot + 1).toLowerCase();
    };

    /**
     * Valida se um File ou path/nome é um vídeo/áudio suportado.
     */
    const isVideoFile = (nameOrFile) => {
        if (!nameOrFile) return false;
        let name = '';
        if (typeof nameOrFile === 'string') {
            name = nameOrFile;
        } else if (typeof nameOrFile === 'object') {
            name = nameOrFile.name || nameOrFile.path || '';
        }
        const ext = getExtension(name);
        return SUPPORTED_EXTENSIONS.includes(ext);
    };

    /**
     * Formata bytes em string legível.
     */
    const formatSize = (bytes) => {
        if (bytes == null || isNaN(bytes)) return '0 B';
        const n = Number(bytes);
        if (n < 1024) return `${n} B`;
        const units = ['KB', 'MB', 'GB', 'TB'];
        let value = n / 1024;
        let i = 0;
        while (value >= 1024 && i < units.length - 1) {
            value /= 1024;
            i++;
        }
        return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[i]}`;
    };

    /**
     * Tenta obter o path local real de um File.
     * No CEP/Electron, File.path existe nativamente.
     */
    const resolveLocalPath = (file) => {
        if (!file) return null;
        if (typeof file.path === 'string' && file.path.length > 0) {
            return file.path;
        }
        // Fallback: alguns builds CEP expõem window.cep.fs; não há como resolver
        // um path local a partir de um Blob sem o atributo .path.
        return null;
    };

    /**
     * Monta o objeto videoFile normalizado para o callback onLoad.
     */
    const buildVideoFile = (file, path) => ({
        name: file.name || (path ? path.split(/[\\/]/).pop() : 'video'),
        path: path,
        size: typeof file.size === 'number' ? file.size : 0,
        type: file.type || '',
        lastModified: typeof file.lastModified === 'number' ? file.lastModified : Date.now()
    });

    /**
     * Processa um File vindo do drop ou do input, validando e chamando onLoad/onError.
     */
    const handleFile = (file, callbacks) => {
        const { onLoad, onError } = callbacks;
        if (!file) {
            onError && onError('Nenhum arquivo recebido.');
            return;
        }
        if (!isVideoFile(file)) {
            const msg = `Formato não suportado: ${file.name || '(sem nome)'}. Use: ${SUPPORTED_EXTENSIONS.join(', ')}.`;
            console.log(`${LOG_PREFIX} erro de formato:`, msg);
            onError && onError(msg);
            return;
        }
        const path = resolveLocalPath(file);
        if (!path) {
            const msg = 'Não foi possível obter caminho local do arquivo — use o botão Selecionar vídeo';
            console.log(`${LOG_PREFIX} erro de path:`, msg);
            onError && onError(msg);
            return;
        }
        const videoFile = buildVideoFile(file, path);
        console.log(`${LOG_PREFIX} vídeo carregado:`, {
            name: videoFile.name,
            path: videoFile.path,
            size: formatSize(videoFile.size),
            type: videoFile.type
        });
        try {
            onLoad && onLoad(videoFile);
        } catch (err) {
            console.log(`${LOG_PREFIX} exceção em onLoad:`, err);
            onError && onError(`Erro ao processar vídeo: ${err && err.message ? err.message : err}`);
        }
    };

    /**
     * Inicializa dropzone + input file.
     */
    const init = (opts) => {
        if (!opts || typeof opts !== 'object') {
            throw new Error('VideoLoader.init: opts obrigatório.');
        }
        const { dropzoneEl, fileInputEl, onLoad, onError } = opts;
        if (!dropzoneEl) {
            throw new Error('VideoLoader.init: dropzoneEl obrigatório.');
        }
        if (!fileInputEl) {
            throw new Error('VideoLoader.init: fileInputEl obrigatório.');
        }

        const callbacks = { onLoad, onError };

        const onDragEnter = (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropzoneEl.classList.add('dragover');
        };

        const onDragOver = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.dataTransfer) {
                try { event.dataTransfer.dropEffect = 'copy'; } catch (_) { /* noop */ }
            }
            dropzoneEl.classList.add('dragover');
        };

        const onDragLeave = (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropzoneEl.classList.remove('dragover');
        };

        const onDrop = (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropzoneEl.classList.remove('dragover');
            const files = event.dataTransfer && event.dataTransfer.files;
            if (!files || files.length === 0) {
                onError && onError('Nenhum arquivo detectado no drop.');
                return;
            }
            handleFile(files[0], callbacks);
        };

        const onClick = (event) => {
            // Evita reentrância caso o click venha de dentro do input
            if (event && event.target === fileInputEl) return;
            try {
                fileInputEl.click();
            } catch (err) {
                onError && onError(`Não foi possível abrir seletor de arquivo: ${err && err.message ? err.message : err}`);
            }
        };

        const onInputChange = (event) => {
            const files = event.target && event.target.files;
            if (!files || files.length === 0) return;
            handleFile(files[0], callbacks);
            // Limpa para permitir re-selecionar o mesmo arquivo
            try { event.target.value = ''; } catch (_) { /* noop */ }
        };

        dropzoneEl.addEventListener('dragenter', onDragEnter);
        dropzoneEl.addEventListener('dragover', onDragOver);
        dropzoneEl.addEventListener('dragleave', onDragLeave);
        dropzoneEl.addEventListener('drop', onDrop);
        dropzoneEl.addEventListener('click', onClick);
        fileInputEl.addEventListener('change', onInputChange);

        console.log(`${LOG_PREFIX} inicializado. Formatos:`, SUPPORTED_EXTENSIONS.join(', '));
    };

    window.VideoLoader = {
        init,
        isVideoFile,
        formatSize
    };
})();
