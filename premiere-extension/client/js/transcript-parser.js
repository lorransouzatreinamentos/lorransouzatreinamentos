/**
 * Transcript Parser — detecta e processa múltiplos formatos exportados
 * do Adobe Premiere Pro. Roda no browser (CEP panel), sem ExtendScript.
 *
 * Formatos suportados (detecção automática):
 *   1. JSON nativo do Premiere (painel Transcript > Export)
 *   2. TXT com "Speaker N  HH:MM:SS\n texto..."
 *   3. TXT texto corrido (sem timestamps) — estima timestamps por palavra
 *   4. SRT (legendas)
 *   5. VTT (WebVTT)
 *   6. CSV (start,end,text)
 *
 * Output normalizado: string "[mm:ss] texto\n[mm:ss] texto\n..."
 */
(function() {

    function fmt(sec) {
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return '[' + pad(m, 2) + ':' + pad(s, 2) + ']';
    }
    function pad(n, w) {
        var s = String(n);
        while (s.length < w) s = '0' + s;
        return s;
    }

    function parseTimecode(tc) {
        // Aceita "00:00:05", "00:05", "5.2", "5,2"
        if (!tc) return 0;
        tc = String(tc).replace(',', '.').trim();
        var parts = tc.split(':');
        if (parts.length === 3) return +parts[0] * 3600 + +parts[1] * 60 + parseFloat(parts[2]);
        if (parts.length === 2) return +parts[0] * 60 + parseFloat(parts[1]);
        return parseFloat(tc) || 0;
    }

    // ==================== FORMAT DETECTION ====================
    function detectFormat(content) {
        var sample = content.slice(0, 2000).trim();

        // JSON
        if (sample[0] === '{' || sample[0] === '[') {
            try { JSON.parse(content); return 'json'; } catch (e) {}
        }

        // SRT (linhas com índice + timecode -->)
        if (/^\d+\s*[\r\n]+\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/m.test(sample)) return 'srt';

        // VTT
        if (/^WEBVTT/m.test(sample) || /\d{2}:\d{2}[.:]\d{3}\s*-->/m.test(sample)) return 'vtt';

        // Premiere TXT (Speaker N  HH:MM:SS\n)
        if (/^Speaker\s+\S+\s+\d{2}:\d{2}:\d{2}/m.test(sample)) return 'premiere-txt';

        // TXT com [HH:MM:SS] ou [MM:SS]
        if (/\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(sample)) return 'bracketed-txt';

        // CSV
        if (/^[\d.]+\s*[,;]\s*[\d.]+\s*[,;]/.test(sample)) return 'csv';

        // Fallback: texto corrido
        return 'raw-txt';
    }

    // ==================== PARSERS ====================
    function parsePremiereJSON(content) {
        var data = JSON.parse(content);

        // Formatos possíveis: {transcript:[...]}, {segments:[...]}, [...], {speakers:[...]}
        var segments = data.transcript || data.segments || data.results
                     || (Array.isArray(data) ? data : null) || data.speakers || [];

        if (data.items && Array.isArray(data.items)) segments = data.items;

        var lines = [];
        for (var i = 0; i < segments.length; i++) {
            var s = segments[i];
            var start = s.start ?? s.startTime ?? s.begin ?? s.time ?? 0;
            if (typeof start === 'string') start = parseTimecode(start);
            var text = s.text || s.content || s.transcript || s.dialogue || '';
            if (text) lines.push(fmt(start) + ' ' + String(text).replace(/\s+/g, ' ').trim());
        }
        return lines.join('\n');
    }

    function parseSRT(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->/);
            if (m) {
                var start = +m[1] * 3600 + +m[2] * 60 + +m[3];
                var textLines = [];
                i++;
                while (i < lines.length && lines[i].trim() !== '') {
                    textLines.push(lines[i]);
                    i++;
                }
                if (textLines.length) {
                    out.push(fmt(start) + ' ' + textLines.join(' ').replace(/<[^>]+>/g, '').trim());
                }
            }
        }
        return out.join('\n');
    }

    function parseVTT(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->/);
            if (m) {
                var h = m[1] ? +m[1] : 0;
                var start = h * 3600 + +m[2] * 60 + +m[3];
                var textLines = [];
                i++;
                while (i < lines.length && lines[i].trim() !== '') {
                    textLines.push(lines[i]);
                    i++;
                }
                if (textLines.length) {
                    out.push(fmt(start) + ' ' + textLines.join(' ').replace(/<[^>]+>/g, '').trim());
                }
            }
        }
        return out.join('\n');
    }

    function parsePremiereTXT(content) {
        // Formato:
        //   Speaker 1  00:00:05
        //   Olá, bem vindo ao vídeo.
        //
        //   Speaker 1  00:00:12
        //   Hoje vamos falar sobre...
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/^(?:Speaker\s+\S+\s+|)(\d{1,2}:\d{2}(?::\d{2})?)\s*$/);
            if (m) {
                var start = parseTimecode(m[1]);
                var textLines = [];
                i++;
                while (i < lines.length && !/^(?:Speaker\s+\S+\s+|)(\d{1,2}:\d{2}(?::\d{2})?)\s*$/.test(lines[i]) && lines[i].trim() !== '') {
                    textLines.push(lines[i].trim());
                    i++;
                }
                i--;
                if (textLines.length) {
                    out.push(fmt(start) + ' ' + textLines.join(' ').trim());
                }
            }
        }
        if (out.length === 0) return null;
        return out.join('\n');
    }

    function parseBracketedTXT(content) {
        // Formato "[mm:ss] texto" ou "[hh:mm:ss] texto"
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)$/);
            if (m) {
                var start = parseTimecode(m[1]);
                out.push(fmt(start) + ' ' + m[2].trim());
            }
        }
        return out.join('\n');
    }

    function parseCSV(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split(/[,;]/);
            if (parts.length >= 3 && /^[\d.:]+$/.test(parts[0].trim())) {
                var start = parseTimecode(parts[0]);
                var text = parts.slice(2).join(',').replace(/^"|"$/g, '').trim();
                if (text) out.push(fmt(start) + ' ' + text);
            }
        }
        return out.join('\n');
    }

    function parseRawTXT(content, estimatedDurationSec) {
        // Texto corrido sem timestamps — estima por palavra (avg 150 palavras/min)
        // Quebra em frases e distribui timestamps.
        var text = content.replace(/\s+/g, ' ').trim();
        if (!text) return '';
        var sentences = text.split(/(?<=[.!?…])\s+/);
        var totalWords = text.split(/\s+/).length;
        var wps = totalWords / Math.max(estimatedDurationSec || totalWords / 2.5, 10);
        var out = [];
        var cursor = 0;
        for (var i = 0; i < sentences.length; i++) {
            var s = sentences[i].trim();
            if (!s) continue;
            out.push(fmt(cursor) + ' ' + s);
            cursor += (s.split(/\s+/).length / wps);
        }
        return out.join('\n');
    }

    // ==================== PUBLIC API ====================
    window.TranscriptParser = {
        parse: function(content, opts) {
            opts = opts || {};
            if (!content || content.length < 10) {
                throw new Error('Arquivo de transcrição vazio');
            }
            var format = detectFormat(content);
            var result = null;

            try {
                switch (format) {
                    case 'json':         result = parsePremiereJSON(content); break;
                    case 'srt':          result = parseSRT(content); break;
                    case 'vtt':          result = parseVTT(content); break;
                    case 'premiere-txt': result = parsePremiereTXT(content); break;
                    case 'bracketed-txt':result = parseBracketedTXT(content); break;
                    case 'csv':          result = parseCSV(content); break;
                    default:             result = parseRawTXT(content, opts.durationSeconds);
                }
            } catch (e) {
                // fallback: se o parser específico falhar, tenta raw
                result = parseRawTXT(content, opts.durationSeconds);
                format = 'raw-fallback';
            }

            if (!result || result.length < 30) {
                // última tentativa: texto puro
                result = parseRawTXT(content, opts.durationSeconds);
                format = 'raw-fallback';
            }

            return {
                text: result,
                format: format,
                segments: result.split('\n').length
            };
        },

        detectFormat: detectFormat
    };
})();
