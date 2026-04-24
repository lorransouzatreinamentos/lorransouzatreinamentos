/**
 * FASTVIDEO Transcript Parser v1.2 — detecção e parsing tolerante de
 * múltiplos formatos exportados do Adobe Premiere Pro.
 *
 * Formatos suportados (detecção automática):
 *   - JSON nativo do Premiere (.prtranscript, .json)
 *   - TXT com "Speaker N  HH:MM:SS\n texto..." (export Premiere)
 *   - TXT com marcadores [HH:MM:SS]
 *   - SRT (legendas)
 *   - VTT (WebVTT)
 *   - CSV (start,end,text)
 *   - Texto puro (cola direto do painel)
 *
 * Output: { text: "[mm:ss] ...", format, segments, debug }
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
        if (tc === null || tc === undefined) return 0;
        tc = String(tc).replace(',', '.').trim();
        if (!tc) return 0;
        var parts = tc.split(':');
        if (parts.length === 4) return +parts[0] * 3600 + +parts[1] * 60 + +parts[2] + +parts[3] / 30;
        if (parts.length === 3) return +parts[0] * 3600 + +parts[1] * 60 + parseFloat(parts[2]);
        if (parts.length === 2) return +parts[0] * 60 + parseFloat(parts[1]);
        return parseFloat(tc) || 0;
    }

    // Remove BOM UTF-8/16 que às vezes aparece em exports do Premiere
    function stripBOM(s) {
        if (!s) return s;
        if (s.charCodeAt(0) === 0xFEFF) return s.slice(1);
        return s;
    }

    // ==================== FORMAT DETECTION ====================
    function detectFormat(content) {
        var sample = content.slice(0, 3000).trim();

        if (sample[0] === '{' || sample[0] === '[') {
            try { JSON.parse(content); return 'json'; } catch (e) {}
        }
        if (/^WEBVTT/mi.test(sample)) return 'vtt';
        if (/^\d+\s*[\r\n]+\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/m.test(sample)) return 'srt';
        if (/\d{2}:\d{2}[.,:]\d{3}\s*-->\s*\d{2}:\d{2}/.test(sample)) return 'vtt';
        if (/^Speaker\s+\S+.*\d{1,2}:\d{2}(?::\d{2})?/m.test(sample)) return 'premiere-txt';
        if (/\[\d{1,2}:\d{2}(?::\d{2})?\]\s*\S/.test(sample)) return 'bracketed-txt';
        if (/^[\d.:]+\s*[,;\t]\s*[\d.:]+\s*[,;\t]/m.test(sample)) return 'csv';
        if (/^\d{1,2}:\d{2}(?::\d{2})?\s+\S/m.test(sample)) return 'timecode-txt';
        return 'raw-txt';
    }

    // ==================== PARSERS ====================
    function parseJSON(content) {
        var data = JSON.parse(content);

        // Procura recursivamente por array de segmentos
        function findSegments(obj, depth) {
            if (depth > 5 || !obj) return null;
            if (Array.isArray(obj)) {
                // É array de segmentos? Precisa ter pelo menos { start, text }
                if (obj.length > 0 && typeof obj[0] === 'object') {
                    var first = obj[0];
                    if ((first.start !== undefined || first.startTime !== undefined || first.begin !== undefined || first.time !== undefined || first.ts !== undefined) &&
                        (first.text !== undefined || first.content !== undefined || first.transcript !== undefined || first.dialogue !== undefined || first.words !== undefined)) {
                        return obj;
                    }
                }
                return null;
            }
            if (typeof obj === 'object') {
                var keys = ['transcript', 'segments', 'results', 'speakers', 'items',
                            'lines', 'phrases', 'sentences', 'utterances', 'data'];
                for (var i = 0; i < keys.length; i++) {
                    if (obj[keys[i]]) {
                        var found = findSegments(obj[keys[i]], depth + 1);
                        if (found) return found;
                    }
                }
                // Varredura genérica
                for (var k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        var f = findSegments(obj[k], depth + 1);
                        if (f) return f;
                    }
                }
            }
            return null;
        }

        var segments = findSegments(data, 0);
        if (!segments) throw new Error('JSON sem array de segmentos reconhecível');

        var lines = [];
        for (var i = 0; i < segments.length; i++) {
            var s = segments[i] || {};
            var start = s.start ?? s.startTime ?? s.begin ?? s.time ?? s.ts ?? s.from ?? 0;
            if (typeof start === 'string') start = parseTimecode(start);
            var text = s.text || s.content || s.transcript || s.dialogue || '';

            // Formatos com array de palavras {word, start}
            if (!text && s.words && Array.isArray(s.words)) {
                text = s.words.map(function(w) { return w.word || w.text || ''; }).join(' ');
            }

            if (text) lines.push(fmt(start) + ' ' + String(text).replace(/\s+/g, ' ').trim());
        }
        if (lines.length < 2) throw new Error('JSON parseou mas sem segmentos úteis');
        return lines.join('\n');
    }

    function parseSRT(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->/);
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
            var m = lines[i].match(/(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s*-->/);
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
        // Formatos possíveis no export de TXT do Premiere:
        //   "Speaker 1  00:00:05"     (2 espaços)
        //   "Speaker 1\t00:00:05"     (tab)
        //   "Speaker 1 00:00:05"      (espaço simples)
        // Seguido de uma ou mais linhas de texto
        var lines = content.split(/\r?\n/);
        var out = [];
        var currentStart = null;
        var currentText = [];

        var headerRe = /^(?:Speaker\s+\S+\s+|)(\d{1,2}:\d{2}(?::\d{2})?)\s*$/;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/^﻿/, '');
            var m = line.match(headerRe);
            if (m) {
                if (currentStart !== null && currentText.length) {
                    out.push(fmt(currentStart) + ' ' + currentText.join(' ').trim());
                }
                currentStart = parseTimecode(m[1]);
                currentText = [];
            } else if (line.trim() !== '' && currentStart !== null) {
                currentText.push(line.trim());
            }
        }
        if (currentStart !== null && currentText.length) {
            out.push(fmt(currentStart) + ' ' + currentText.join(' ').trim());
        }
        return out.join('\n');
    }

    function parseBracketedTXT(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/^﻿/, '');
            var m = line.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)/);
            if (m) out.push(fmt(parseTimecode(m[1])) + ' ' + m[2].trim());
        }
        return out.join('\n');
    }

    function parseTimecodeTXT(content) {
        // Linhas como: "00:00:05 texto da frase"
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/^﻿/, '');
            var m = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/);
            if (m) out.push(fmt(parseTimecode(m[1])) + ' ' + m[2].trim());
        }
        return out.join('\n');
    }

    function parseCSV(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            var parts = line.split(/[,;\t]/);
            if (parts.length >= 3 && /^[\d.:]+$/.test(parts[0].trim())) {
                var start = parseTimecode(parts[0]);
                var text = parts.slice(2).join(',').replace(/^"|"$/g, '').trim();
                if (text) out.push(fmt(start) + ' ' + text);
            }
        }
        return out.join('\n');
    }

    function parseRawTXT(content, estimatedDurationSec) {
        // Limpa e normaliza
        var text = content.replace(/\s+/g, ' ').trim();
        if (!text) return '';

        // Tenta quebrar em frases; se poucas, usa tamanho fixo
        var sentences = text.match(/[^.!?…]+[.!?…]+/g) || text.split(/\s+/).reduce(function(acc, w, i) {
            var chunk = Math.floor(i / 25);
            acc[chunk] = (acc[chunk] || '') + ' ' + w;
            return acc;
        }, []);

        var totalWords = text.split(/\s+/).length;
        var duration = estimatedDurationSec || Math.max(totalWords / 2.5, 10);
        var wps = totalWords / duration;
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
            content = stripBOM(String(content || ''));
            if (!content || content.length < 10) {
                throw new Error('Conteúdo vazio ou muito curto');
            }

            var debug = { detected: null, tried: [], finalFormat: null };
            var format = detectFormat(content);
            debug.detected = format;
            var result = null;
            var attemptedFormats = [];

            function tryParse(fmtName, fn) {
                attemptedFormats.push(fmtName);
                try {
                    var r = fn();
                    if (r && r.length > 20 && r.split('\n').length >= 2) {
                        debug.finalFormat = fmtName;
                        return r;
                    }
                } catch (e) {
                    debug.tried.push({ format: fmtName, error: e.message });
                }
                return null;
            }

            // Tenta o formato detectado primeiro, depois fallbacks em ordem de prioridade
            var order = [format];
            var fallbacks = ['json', 'srt', 'vtt', 'premiere-txt', 'bracketed-txt', 'timecode-txt', 'csv'];
            for (var i = 0; i < fallbacks.length; i++) {
                if (fallbacks[i] !== format) order.push(fallbacks[i]);
            }

            for (var j = 0; j < order.length; j++) {
                var f = order[j];
                if (f === 'json')          result = tryParse('json',          function() { return parseJSON(content); });
                else if (f === 'srt')      result = tryParse('srt',           function() { return parseSRT(content); });
                else if (f === 'vtt')      result = tryParse('vtt',           function() { return parseVTT(content); });
                else if (f === 'premiere-txt')  result = tryParse('premiere-txt',  function() { return parsePremiereTXT(content); });
                else if (f === 'bracketed-txt') result = tryParse('bracketed-txt', function() { return parseBracketedTXT(content); });
                else if (f === 'timecode-txt')  result = tryParse('timecode-txt',  function() { return parseTimecodeTXT(content); });
                else if (f === 'csv')      result = tryParse('csv',           function() { return parseCSV(content); });
                if (result) break;
            }

            if (!result) {
                result = parseRawTXT(content, opts.durationSeconds);
                debug.finalFormat = 'raw-fallback';
            }

            var segmentCount = result.split('\n').filter(function(l) { return l.trim(); }).length;
            debug.tried.push({ format: 'attempts', list: attemptedFormats });

            return {
                text: result,
                format: debug.finalFormat,
                segments: segmentCount,
                debug: debug
            };
        },

        detectFormat: detectFormat
    };
})();
