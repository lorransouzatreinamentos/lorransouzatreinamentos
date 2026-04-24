/**
 * FASTVIDEO — AudioTranscriber
 * Expõe window.AudioTranscriber para transcrever vídeo via OpenAI Whisper.
 * - Se arquivo < 24MB: envia direto.
 * - Se >= 24MB: extrai áudio com FFmpeg (mono 16kHz mp3 64kbps).
 * - Se áudio extraído ainda >= 24MB: divide em chunks de 15min e concatena.
 * Ambiente: Adobe CEP (Chromium + Node.js, mixed context).
 */
(function () {
    'use strict';

    const LOG_PREFIX = '[FASTVIDEO][Transcriber]';

    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const { exec } = require('child_process');

    const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';
    const SIZE_LIMIT = 24 * 1024 * 1024; // 24MB — limite seguro abaixo dos 25MB do Whisper
    const CHUNK_SECONDS = 900; // 15 minutos
    const EXEC_MAX_BUFFER = 50 * 1024 * 1024; // 50MB para stdout/stderr do ffmpeg

    // Cache do path do ffmpeg por sessão
    let ffmpegPathCache = undefined; // undefined = não procurado ainda; null = procurou e não achou

    /**
     * Executa um comando shell e retorna Promise<{stdout, stderr}>.
     */
    const execAsync = (cmd, options = {}) => new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: EXEC_MAX_BUFFER, ...options }, (err, stdout, stderr) => {
            if (err) {
                err.stdout = stdout;
                err.stderr = stderr;
                return reject(err);
            }
            resolve({ stdout, stderr });
        });
    });

    /**
     * Tenta descobrir o binário do ffmpeg via PATH + caminhos comuns por plataforma.
     */
    const findFFmpeg = async () => {
        if (ffmpegPathCache !== undefined) return ffmpegPathCache;

        const platform = process.platform;

        // 1) Tenta via PATH (which/where)
        try {
            const cmd = platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
            const { stdout } = await execAsync(cmd);
            const first = (stdout || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0];
            if (first && fs.existsSync(first)) {
                console.log(`${LOG_PREFIX} FFmpeg encontrado via PATH:`, first);
                ffmpegPathCache = first;
                return ffmpegPathCache;
            }
        } catch (_) {
            // ignora, tenta fallback
        }

        // 2) Caminhos comuns por plataforma
        let candidates = [];
        if (platform === 'darwin') {
            candidates = [
                '/opt/homebrew/bin/ffmpeg',
                '/usr/local/bin/ffmpeg',
                '/usr/bin/ffmpeg'
            ];
        } else if (platform === 'linux') {
            candidates = [
                '/usr/bin/ffmpeg',
                '/usr/local/bin/ffmpeg'
            ];
        } else if (platform === 'win32') {
            candidates = [
                'C:\\ffmpeg\\bin\\ffmpeg.exe',
                'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
            ];
        }

        for (const candidate of candidates) {
            try {
                if (fs.existsSync(candidate)) {
                    console.log(`${LOG_PREFIX} FFmpeg encontrado em caminho padrão:`, candidate);
                    ffmpegPathCache = candidate;
                    return ffmpegPathCache;
                }
            } catch (_) { /* noop */ }
        }

        console.log(`${LOG_PREFIX} FFmpeg NÃO encontrado no sistema.`);
        ffmpegPathCache = null;
        return null;
    };

    /**
     * Escapa path para uso em linha de comando (quoted).
     * Em Windows usa aspas duplas; em Unix também funcionam.
     */
    const quote = (p) => `"${String(p).replace(/"/g, '\\"')}"`;

    /**
     * Determina content-type a partir da extensão.
     */
    const contentTypeFor = (filePath) => {
        const ext = (path.extname(filePath) || '').toLowerCase().replace('.', '');
        const map = {
            mp3: 'audio/mpeg',
            m4a: 'audio/mp4',
            wav: 'audio/wav',
            flac: 'audio/flac',
            mp4: 'video/mp4',
            mov: 'video/quicktime',
            m4v: 'video/x-m4v',
            mxf: 'application/mxf',
            avi: 'video/x-msvideo',
            mkv: 'video/x-matroska',
            webm: 'video/webm'
        };
        return map[ext] || 'application/octet-stream';
    };

    /**
     * Tenta extrair duração do stderr do ffmpeg/ffprobe.
     * Formato: "Duration: HH:MM:SS.xx,"
     */
    const parseDurationFromStderr = (stderr) => {
        if (!stderr) return 0;
        const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
        if (!m) return 0;
        const h = parseInt(m[1], 10) || 0;
        const mi = parseInt(m[2], 10) || 0;
        const s = parseFloat(m[3]) || 0;
        return h * 3600 + mi * 60 + s;
    };

    /**
     * Pega duração (em segundos) de um arquivo via ffmpeg -i (lê stderr).
     */
    const getDuration = async (ffmpeg, filePath) => {
        try {
            // ffmpeg -i sem output falha intencionalmente; pegamos stderr mesmo assim
            await execAsync(`${quote(ffmpeg)} -i ${quote(filePath)} -f null -`);
            return 0;
        } catch (err) {
            return parseDurationFromStderr(err.stderr || '');
        }
    };

    /**
     * Faz upload direto ao Whisper e normaliza a resposta.
     */
    const uploadToWhisper = async (filePath, apiKey) => {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado para envio: ${filePath}`);
        }
        const buffer = fs.readFileSync(filePath);
        const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const fileName = path.basename(filePath);
        const blob = new Blob([ab], { type: contentTypeFor(filePath) });

        const formData = new FormData();
        formData.append('file', blob, fileName);
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'verbose_json');
        formData.append('timestamp_granularities[]', 'segment');

        let res;
        try {
            res = await fetch(WHISPER_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}` },
                body: formData
            });
        } catch (err) {
            throw new Error(`Falha na transcrição (Whisper): erro de rede — ${err && err.message ? err.message : err}`);
        }

        if (!res.ok) {
            let detail = `HTTP ${res.status}`;
            try {
                const errJson = await res.json();
                if (errJson && errJson.error && errJson.error.message) {
                    detail = errJson.error.message;
                }
            } catch (_) {
                try {
                    const errText = await res.text();
                    if (errText) detail = errText;
                } catch (__) { /* noop */ }
            }
            throw new Error(`Falha na transcrição (Whisper): ${detail}`);
        }

        const json = await res.json();
        const rawSegments = Array.isArray(json.segments) ? json.segments : [];
        const segments = rawSegments.map((s, idx) => ({
            id: idx + 1,
            start: typeof s.start === 'number' ? s.start : 0,
            end: typeof s.end === 'number' ? s.end : 0,
            text: (s.text || '').trim()
        }));

        console.log(`${LOG_PREFIX} Whisper OK — segments: ${segments.length}, duração: ${json.duration || 'n/a'}`);

        return {
            text: (json.text || '').trim(),
            segments,
            language: json.language || null,
            duration: json.duration || 0
        };
    };

    /**
     * Limpa uma lista de arquivos temporários (silencioso).
     */
    const cleanupFiles = (files) => {
        for (const f of files) {
            if (!f) continue;
            try { fs.unlinkSync(f); } catch (_) { /* ignora */ }
        }
    };

    /**
     * Extrai áudio (mono 16kHz mp3 64kbps) para um path temporário.
     */
    const extractAudio = async (ffmpeg, videoPath, audioPath) => {
        const cmd = `${quote(ffmpeg)} -y -i ${quote(videoPath)} -vn -ac 1 -ar 16000 -b:a 64k ${quote(audioPath)}`;
        console.log(`${LOG_PREFIX} executando ffmpeg:`, cmd);
        try {
            await execAsync(cmd);
        } catch (err) {
            throw new Error(`Falha ao extrair áudio: ${err.stderr || err.message || err}`);
        }
        if (!fs.existsSync(audioPath)) {
            throw new Error('Falha ao extrair áudio: arquivo de saída não foi criado.');
        }
    };

    /**
     * Divide um áudio em chunks de CHUNK_SECONDS. Retorna lista de { path, offset }.
     */
    const splitAudioIntoChunks = async (ffmpeg, audioPath, totalDuration) => {
        const chunks = [];
        let offset = 0;
        let index = 0;
        const dir = os.tmpdir();
        const ts = Date.now();

        // Se não temos duração, tenta estimar via getDuration
        let duration = totalDuration;
        if (!duration || duration <= 0) {
            duration = await getDuration(ffmpeg, audioPath);
        }
        if (!duration || duration <= 0) {
            // Sem duração: cria chunks até falhar. Abordagem simples com limite de tentativas.
            duration = CHUNK_SECONDS * 100; // 25h teto defensivo
        }

        while (offset < duration) {
            const chunkPath = path.join(dir, `fastvideo_chunk_${ts}_${index}.mp3`);
            const cmd = `${quote(ffmpeg)} -y -ss ${offset} -t ${CHUNK_SECONDS} -i ${quote(audioPath)} -c copy ${quote(chunkPath)}`;
            try {
                await execAsync(cmd);
            } catch (err) {
                throw new Error(`Falha ao dividir áudio: ${err.stderr || err.message || err}`);
            }
            if (!fs.existsSync(chunkPath) || fs.statSync(chunkPath).size === 0) {
                // Chunk vazio → fim dos dados
                try { fs.unlinkSync(chunkPath); } catch (_) { /* noop */ }
                break;
            }
            chunks.push({ path: chunkPath, offset });
            offset += CHUNK_SECONDS;
            index++;
        }

        console.log(`${LOG_PREFIX} áudio dividido em ${chunks.length} chunks`);
        return chunks;
    };

    /**
     * Mescla resultados de múltiplos chunks em um único objeto, ajustando offsets.
     */
    const mergeChunkResults = (results) => {
        const allSegments = [];
        const textParts = [];
        let totalDuration = 0;
        let language = null;

        for (const { result, offset } of results) {
            if (result.text) textParts.push(result.text);
            if (!language && result.language) language = result.language;
            totalDuration = Math.max(totalDuration, offset + (result.duration || 0));
            for (const seg of result.segments) {
                allSegments.push({
                    id: 0, // reatribuído abaixo
                    start: seg.start + offset,
                    end: seg.end + offset,
                    text: seg.text
                });
            }
        }

        const segments = allSegments.map((s, idx) => ({
            id: idx + 1,
            start: s.start,
            end: s.end,
            text: s.text
        }));

        return {
            text: textParts.join(' ').trim(),
            segments,
            language,
            duration: totalDuration
        };
    };

    /**
     * Transcreve vídeo/áudio via Whisper, com extração e chunking quando necessário.
     */
    const transcribe = async (opts) => {
        if (!opts || typeof opts !== 'object') {
            throw new Error('transcribe: opts obrigatório.');
        }
        const { videoPath, apiKey } = opts;
        const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : () => {};

        if (!videoPath || typeof videoPath !== 'string') {
            throw new Error('transcribe: videoPath obrigatório.');
        }
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('transcribe: apiKey obrigatório.');
        }
        if (!fs.existsSync(videoPath)) {
            throw new Error(`Arquivo não encontrado: ${videoPath}`);
        }

        const stats = fs.statSync(videoPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`${LOG_PREFIX} arquivo: ${sizeMB}MB`);

        const tempFiles = [];

        try {
            // Caminho simples: envia direto
            if (stats.size < SIZE_LIMIT) {
                onProgress('Enviando para Whisper…', 50);
                const result = await uploadToWhisper(videoPath, apiKey);
                onProgress('Transcrição concluída', 100);
                return {
                    text: result.text,
                    segments: result.segments,
                    fromAudioExtraction: false
                };
            }

            // Caminho com extração de áudio
            onProgress('Procurando FFmpeg…', 10);
            const ffmpeg = await findFFmpeg();
            if (!ffmpeg) {
                throw new Error(
                    "FFmpeg não encontrado. Instale FFmpeg (brew install ffmpeg no Mac, apt install ffmpeg no Linux, ou baixe em ffmpeg.org no Windows) OU use vídeos menores que 24MB OU escolha a opção 'Importar transcrição manual'."
                );
            }

            onProgress('Extraindo áudio…', 20);
            const audioPath = path.join(os.tmpdir(), `fastvideo_audio_${Date.now()}.mp3`);
            tempFiles.push(audioPath);
            await extractAudio(ffmpeg, videoPath, audioPath);

            const audioStats = fs.statSync(audioPath);
            const audioSizeMB = (audioStats.size / (1024 * 1024)).toFixed(2);
            console.log(`${LOG_PREFIX} áudio extraído: ${audioSizeMB}MB`);

            // Áudio extraído cabe — envio único
            if (audioStats.size < SIZE_LIMIT) {
                onProgress('Enviando para Whisper…', 60);
                const result = await uploadToWhisper(audioPath, apiKey);
                onProgress('Transcrição concluída', 100);
                return {
                    text: result.text,
                    segments: result.segments,
                    fromAudioExtraction: true
                };
            }

            // Áudio ainda grande — divide em chunks
            onProgress('Dividindo áudio em partes…', 40);
            const duration = await getDuration(ffmpeg, audioPath);
            console.log(`${LOG_PREFIX} duração do áudio: ${duration}s`);
            const chunks = await splitAudioIntoChunks(ffmpeg, audioPath, duration);
            for (const c of chunks) tempFiles.push(c.path);

            if (chunks.length === 0) {
                throw new Error('Falha ao dividir áudio: nenhum chunk gerado.');
            }

            const results = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const pctBase = 40 + Math.round(((i) / chunks.length) * 55);
                onProgress(`Transcrevendo parte ${i + 1}/${chunks.length}…`, pctBase);
                const partial = await uploadToWhisper(chunk.path, apiKey);
                results.push({ result: partial, offset: chunk.offset });
            }

            onProgress('Combinando transcrições…', 97);
            const merged = mergeChunkResults(results);
            onProgress('Transcrição concluída', 100);

            return {
                text: merged.text,
                segments: merged.segments,
                fromAudioExtraction: true
            };
        } catch (err) {
            // Preserva mensagens já formatadas; caso contrário, embrulha
            const msg = err && err.message ? err.message : String(err);
            if (/Falha (ao extrair áudio|na transcrição|ao dividir áudio)/i.test(msg) ||
                /FFmpeg não encontrado/.test(msg) ||
                /Arquivo não encontrado/.test(msg) ||
                /transcribe:/.test(msg)) {
                throw err instanceof Error ? err : new Error(msg);
            }
            throw new Error(`Falha na transcrição (Whisper): ${msg}`);
        } finally {
            cleanupFiles(tempFiles);
        }
    };

    window.AudioTranscriber = {
        transcribe,
        findFFmpeg
    };
})();
