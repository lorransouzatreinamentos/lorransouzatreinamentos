/**
 * FASTVIDEO Transcript Parser v1.6
 *
 * Novo contrato de saída:
 *   {
 *     text: "[mm:ss] texto\n..." (compatibilidade visual),
 *     segments: [{ id, start, end, text }] (estruturado para IA + validação),
 *     format: string,
 *     count: number,
 *     debug: object
 *   }
 *
 * Formatos aceitos: JSON/SRT/VTT/Premiere TXT/bracketed TXT/CSV/raw.
 */
(function() {

    function pad(n, w) {
        var s = String(n);
        while (s.length < w) s = '0' + s;
        return s;
    }

    function fmtBracket(sec) {
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return '[' + pad(m, 2) + ':' + pad(s, 2) + ']';
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

    function stripBOM(s) {
        if (!s) return s;
        if (s.charCodeAt(0) === 0xFEFF) return s.slice(1);
        return s;
    }

    // ==================== DETECT ====================
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

    // ==================== PARSERS (cada um retorna [{start, end, text}]) ====================

    function parseJSON(content) {
        var data = JSON.parse(content);

        function findSegments(obj, depth) {
            if (depth > 5 || !obj) return null;
            if (Array.isArray(obj)) {
                if (obj.length > 0 && typeof obj[0] === 'object') {
                    var first = obj[0];
                    var hasStart = first.start !== undefined || first.startTime !== undefined
                                 || first.begin !== undefined || first.time !== undefined
                                 || first.ts !== undefined || first.from !== undefined;
                    var hasText = first.text !== undefined || first.content !== undefined
                               || first.transcript !== undefined || first.dialogue !== undefined
                               || first.words !== undefined;
                    if (hasStart && hasText) return obj;
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
                for (var k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        var f = findSegments(obj[k], depth + 1);
                        if (f) return f;
                    }
                }
            }
            return null;
        }

        var segs = findSegments(data, 0);
        if (!segs) throw new Error('JSON sem array de segmentos reconhecível');

        var out = [];
        for (var i = 0; i < segs.length; i++) {
            var s = segs[i] || {};
            var start = s.start !== undefined ? s.start
                      : s.startTime !== undefined ? s.startTime
                      : s.begin !== undefined ? s.begin
                      : s.time !== undefined ? s.time
                      : s.ts !== undefined ? s.ts
                      : s.from !== undefined ? s.from : 0;
            var end = s.end !== undefined ? s.end
                    : s.endTime !== undefined ? s.endTime
                    : s.finish !== undefined ? s.finish
                    : s.to !== undefined ? s.to
                    : (s.duration !== undefined ? (Number(start) + Number(s.duration)) : null);

            if (typeof start === 'string') start = parseTimecode(start);
            if (typeof end === 'string') end = parseTimecode(end);

            var text = s.text || s.content || s.transcript || s.dialogue || '';
            if (!text && s.words && Array.isArray(s.words)) {
                text = s.words.map(function(w) { return w.word || w.text || ''; }).join(' ');
            }
            text = String(text || '').replace(/\s+/g, ' ').trim();
            if (!text) continue;
            out.push({ start: Number(start) || 0, end: end !== null ? Number(end) : null, text: text });
        }
        return out;
    }

    function parseSRT(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/);
            if (m) {
                var start = +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
                var end   = +m[5] * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000;
                var textLines = [];
                i++;
                while (i < lines.length && lines[i].trim() !== '') {
                    textLines.push(lines[i]);
                    i++;
                }
                if (textLines.length) {
                    out.push({
                        start: start, end: end,
                        text: textLines.join(' ').replace(/<[^>]+>/g, '').trim()
                    });
                }
            }
        }
        return out;
    }

    function parseVTT(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s*-->\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/);
            if (m) {
                var h1 = m[1] ? +m[1] : 0;
                var start = h1 * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
                var h2 = m[5] ? +m[5] : 0;
                var end = h2 * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000;
                var textLines = [];
                i++;
                while (i < lines.length && lines[i].trim() !== '') {
                    textLines.push(lines[i]);
                    i++;
                }
                if (textLines.length) {
                    out.push({
                        start: start, end: end,
                        text: textLines.join(' ').replace(/<[^>]+>/g, '').trim()
                    });
                }
            }
        }
        return out;
    }

    function parsePremiereTXT(content) {
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
                    out.push({ start: currentStart, end: null, text: currentText.join(' ').trim() });
                }
                currentStart = parseTimecode(m[1]);
                currentText = [];
            } else if (line.trim() !== '' && currentStart !== null) {
                currentText.push(line.trim());
            }
        }
        if (currentStart !== null && currentText.length) {
            out.push({ start: currentStart, end: null, text: currentText.join(' ').trim() });
        }
        return out;
    }

    function parseBracketedTXT(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/^﻿/, '');
            var m = line.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)/);
            if (m) out.push({ start: parseTimecode(m[1]), end: null, text: m[2].trim() });
        }
        return out;
    }

    function parseTimecodeTXT(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/^﻿/, '');
            var m = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/);
            if (m) out.push({ start: parseTimecode(m[1]), end: null, text: m[2].trim() });
        }
        return out;
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
                var end = parseTimecode(parts[1]);
                var text = parts.slice(2).join(',').replace(/^"|"$/g, '').trim();
                if (text) out.push({ start: start, end: end, text: text });
            }
        }
        return out;
    }

    function parseRawTXT(content, estimatedDurationSec) {
        var text = content.replace(/\s+/g, ' ').trim();
        if (!text) return [];
        var sentences = text.match(/[^.!?…]+[.!?…]+/g);
        if (!sentences || sentences.length < 2) {
            // Chunks de ~25 palavras
            var words = text.split(/\s+/);
            sentences = [];
            for (var i = 0; i < words.length; i += 25) {
                sentences.push(words.slice(i, i + 25).join(' '));
            }
        }
        var totalWords = text.split(/\s+/).length;
        var duration = estimatedDurationSec || Math.max(totalWords / 2.5, 10);
        var wps = totalWords / duration;
        var out = [];
        var cursor = 0;
        for (var j = 0; j < sentences.length; j++) {
            var s = sentences[j].trim();
            if (!s) continue;
            var wordCount = s.split(/\s+/).length;
            var durSec = wordCount / wps;
            out.push({ start: cursor, end: cursor + durSec, text: s });
            cursor += durSec;
        }
        return out;
    }

    // ==================== POST-PROCESS ====================

    // Se end não está disponível, estima a partir do próximo segmento ou words/wps
    function fillMissingEnds(segments, estimatedDurationSec) {
        if (!segments.length) return segments;
        for (var i = 0; i < segments.length; i++) {
            var s = segments[i];
            if (s.end === null || s.end === undefined || s.end <= s.start) {
                if (i < segments.length - 1) {
                    s.end = segments[i + 1].start;
                } else if (estimatedDurationSec) {
                    s.end = Math.min(estimatedDurationSec, s.start + Math.max(3, s.text.split(/\s+/).length / 2.5));
                } else {
                    s.end = s.start + Math.max(3, s.text.split(/\s+/).length / 2.5);
                }
            }
        }
        return segments;
    }

    function toBracketText(segments) {
        return segments.map(function(s) { return fmtBracket(s.start) + ' ' + s.text; }).join('\n');
    }

    function addIds(segments) {
        for (var i = 0; i < segments.length; i++) segments[i].id = i + 1;
        return segments;
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
            var segments = null;

            function tryParse(fmtName, fn) {
                try {
                    var r = fn();
                    if (r && r.length >= 2) { debug.finalFormat = fmtName; return r; }
                } catch (e) {
                    debug.tried.push({ format: fmtName, error: e.message });
                }
                return null;
            }

            var order = [format];
            ['json', 'srt', 'vtt', 'premiere-txt', 'bracketed-txt', 'timecode-txt', 'csv'].forEach(function(f) {
                if (f !== format) order.push(f);
            });

            for (var i = 0; i < order.length && !segments; i++) {
                var f = order[i];
                if (f === 'json')              segments = tryParse('json',           function() { return parseJSON(content); });
                else if (f === 'srt')          segments = tryParse('srt',            function() { return parseSRT(content); });
                else if (f === 'vtt')          segments = tryParse('vtt',            function() { return parseVTT(content); });
                else if (f === 'premiere-txt') segments = tryParse('premiere-txt',   function() { return parsePremiereTXT(content); });
                else if (f === 'bracketed-txt')segments = tryParse('bracketed-txt',  function() { return parseBracketedTXT(content); });
                else if (f === 'timecode-txt') segments = tryParse('timecode-txt',   function() { return parseTimecodeTXT(content); });
                else if (f === 'csv')          segments = tryParse('csv',            function() { return parseCSV(content); });
            }

            if (!segments || segments.length < 2) {
                segments = parseRawTXT(content, opts.durationSeconds);
                debug.finalFormat = 'raw-fallback';
            }

            fillMissingEnds(segments, opts.durationSeconds);
            addIds(segments);

            return {
                text: toBracketText(segments),
                segments: segments,
                format: debug.finalFormat,
                count: segments.length,
                debug: debug
            };
        },

        detectFormat: detectFormat
    };
})();
