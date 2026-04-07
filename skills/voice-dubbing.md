---
name: voice-dubbing
description: "Pipeline completo de dublagem automática — transcrição, tradução, TTS, sincronização, pós-processamento. Use quando precisar dublar vídeos, gerar áudio em outro idioma, ou criar pipeline de voz."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# Voice Dubbing Pipeline

Pipeline end-to-end para dublagem automática de vídeos.

## 10 Etapas

| # | Etapa | Ferramenta | Output |
|---|-------|-----------|--------|
| 1 | Entrada | - | vídeo/áudio source |
| 2 | Extração | FFmpeg | audio_src.wav (48kHz, mono) |
| 3 | Transcrição | Faster-Whisper | asr.json + asr.srt |
| 4 | Tradução | M2M100/Claude | asr_trad.json + srt |
| 5 | Split | Regex | Segmentos ≤10s |
| 6 | TTS | Bark/Coqui/ElevenLabs | seg_XXXX.wav |
| 6.1 | Micro-fade | FFmpeg afade | seg_XXXX_xf.wav |
| 7 | Sync | smart mode | Áudio alinhado |
| 8 | Concat | FFmpeg | dub_raw.wav |
| 9 | Pós-proc | loudnorm+EQ+denoise | dub_final.wav |
| 10 | Mux | FFmpeg | video_dublado.mp4 |

## Modos de Sincronização

- **none**: Sem ajuste
- **fit**: atempo (max 1.35x stretch)
- **pad**: Silêncio/corte
- **smart** (recomendado): Híbrido

## Parâmetros Padrão
```
--sync smart --tolerance 0.15 --maxstretch 1.35
--maxdur 10.0 --fade 0.02 --preserve-gaps --gap-min 0.20
```

## Requisitos
- Python 3.10+, FFmpeg, faster-whisper, bark/coqui-tts
- GPU recomendada para TTS (Bark especialmente)
