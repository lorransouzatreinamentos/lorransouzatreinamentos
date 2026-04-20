/**
 * Transcript extractor — tenta múltiplas fontes, na ordem:
 *   1. Text-based captions associadas ao clipe (SRT embed)
 *   2. Arquivo .prtranscript ao lado do media file
 *   3. XMP / metadata
 *   4. Fallback: nome + marcadores (graceful degradation)
 *
 * Formato de saída: "[mm:ss] texto\n[mm:ss] texto\n..."
 */
var Transcript = (function() {
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

    function readFile(path) {
        var f = new File(path);
        if (!f.exists) return null;
        f.encoding = 'UTF-8';
        f.open('r');
        var content = f.read();
        f.close();
        return content;
    }

    function findTranscriptFile(mediaPath) {
        if (!mediaPath) return null;
        var base = mediaPath.replace(/\.[^.\\\/]+$/, '');
        var candidates = [
            base + '.prtranscript',
            base + '.transcript',
            base + '.json',
            base + '.srt',
            base + '.vtt'
        ];
        for (var i = 0; i < candidates.length; i++) {
            var c = candidates[i];
            if (new File(c).exists) return c;
        }
        return null;
    }

    function parseJSONTranscript(content) {
        // Formato Premiere .prtranscript (JSON com segmentos {start, end, text})
        try {
            var data = JSON.parse(content);
            var segments = data.transcript || data.segments || data.results || [];
            if (!segments.length && data.speakers) segments = data.speakers;
            var lines = [];
            for (var i = 0; i < segments.length; i++) {
                var s = segments[i];
                var start = s.start || s.startTime || s.begin || 0;
                var text = s.text || s.content || s.transcript || '';
                if (typeof start === 'string') start = parseFloat(start);
                if (text) lines.push(fmt(start) + ' ' + text.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, ''));
            }
            return lines.join('\n');
        } catch (e) { return null; }
    }

    function parseSRT(content) {
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->/);
            if (m) {
                var start = parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
                var textLines = [];
                i++;
                while (i < lines.length && lines[i].replace(/^\s+|\s+$/g, '') !== '') {
                    textLines.push(lines[i]);
                    i++;
                }
                if (textLines.length) out.push(fmt(start) + ' ' + textLines.join(' ').replace(/<[^>]+>/g, ''));
            }
        }
        return out.join('\n');
    }

    function parseVTT(content) {
        // Similar ao SRT mas com "-->" e formato HH:MM:SS.mmm
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/(\d{2}):(\d{2})(?::(\d{2}))?[.,](\d{3})\s*-->/);
            if (m) {
                var h = m[3] ? parseInt(m[1], 10) : 0;
                var mm = m[3] ? parseInt(m[2], 10) : parseInt(m[1], 10);
                var ss = m[3] ? parseInt(m[3], 10) : parseInt(m[2], 10);
                var start = h * 3600 + mm * 60 + ss;
                var textLines = [];
                i++;
                while (i < lines.length && lines[i].replace(/^\s+|\s+$/g, '') !== '') {
                    textLines.push(lines[i]);
                    i++;
                }
                if (textLines.length) out.push(fmt(start) + ' ' + textLines.join(' ').replace(/<[^>]+>/g, ''));
            }
        }
        return out.join('\n');
    }

    function extractFromXMP(projectItem) {
        try {
            var xmp = projectItem.getXMPMetadata();
            // Procura por speech-to-text embed
            var m = xmp.match(/<transcriptionMetadata[^>]*>([\s\S]*?)<\/transcriptionMetadata>/);
            if (!m) return null;
            var segments = m[1].match(/<tr:segment[^>]*>([\s\S]*?)<\/tr:segment>/g);
            if (!segments) return null;
            var out = [];
            for (var i = 0; i < segments.length; i++) {
                var startMatch = segments[i].match(/start="([\d.]+)"/);
                var textMatch = segments[i].match(/<tr:text>([^<]+)<\/tr:text>/);
                if (startMatch && textMatch) {
                    out.push(fmt(parseFloat(startMatch[1])) + ' ' + textMatch[1]);
                }
            }
            return out.join('\n');
        } catch (e) { return null; }
    }

    return {
        extract: function(projectItem) {
            var mediaPath = '';
            try { mediaPath = projectItem.getMediaPath(); } catch (e) {}

            // 1. Arquivo ao lado do media
            var file = findTranscriptFile(mediaPath);
            if (file) {
                var content = readFile(file);
                if (content) {
                    var ext = file.split('.').pop().toLowerCase();
                    var parsed = null;
                    if (ext === 'srt') parsed = parseSRT(content);
                    else if (ext === 'vtt') parsed = parseVTT(content);
                    else parsed = parseJSONTranscript(content);
                    if (parsed && parsed.length > 30) return { ok: true, text: parsed };
                }
            }

            // 2. XMP embed
            var xmpText = extractFromXMP(projectItem);
            if (xmpText && xmpText.length > 30) return { ok: true, text: xmpText };

            // 3. Fail gracefully com instruções
            return {
                ok: false,
                error: 'Transcrição não encontrada. No Premiere: Window > Text > Transcript > Gerar transcrição, depois clique direito > Exportar > SRT (salve com o mesmo nome do vídeo).'
            };
        }
    };
})();
