---
name: reel-to-meta-ad
description: "Converte Reel do Instagram em criativo de anúncio Meta Ads — download, upscale de resolução (480→1080p), merge de áudio, upload como video asset, criação de criativo com thumbnail e atualização do anúncio. Resolve o erro Meta #2875006 (vídeo < 500px)."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Reel to Meta Ad — Pipeline Completo

## Propósito

Transformar um Reel do Instagram (mesmo gravado via WhatsApp com resolução baixa) em criativo válido para Meta Ads, resolvendo o erro `#2875006` (largura mínima 500px).

**Input:** URL do Reel + ad_account_id + ad_id existente (opcional)
**Output:** Criativo de vídeo ativo no Meta Ads sem erros

---

## Problema que esta skill resolve

Reels gravados via WhatsApp ou dispositivos antigos chegam em **480x854px**. O Meta Ads exige mínimo **500px de largura**. Resultado: erro `#2875006` e status `WITH_ISSUES`.

**Solução:** baixar → upscalar para 1080x1920 → fazer upload como novo asset.

---

## Dependências

```bash
# Verificar dependências
pip3 show yt-dlp moviepy pillow  # deve estar instalado
python3 -c "import moviepy; print(moviepy.__version__)"  # 2.x
```

Se moviepy não instalado:
```bash
pip3 install moviepy pillow yt-dlp
```

---

## Etapa 1 — Download do Reel

```bash
# Baixa vídeo e áudio como streams separados (Instagram HLS → não tem stream único)
yt-dlp --cookies-from-browser chrome \
  -o "/tmp/reel-%(id)s.%(ext)s" \
  "https://www.instagram.com/reel/REEL_ID/"
```

**Resultado esperado:**
- `/tmp/reel-{id}.fdash-{video_id}v.mp4` — vídeo sem áudio
- `/tmp/reel-{id}.fdash-{audio_id}a.m4a` — áudio sem vídeo

> **Nota:** Instagramm serve vídeo via HLS (blob://), então yt-dlp baixa os dois streams separados. Precisa de cookies do Chrome para reels de contas privadas ou com autenticação.

---

## Etapa 2 — Verificar Resolução

```python
from moviepy import VideoFileClip
vid = VideoFileClip("/tmp/reel-ARQUIVO.mp4")
print("Size:", vid.size)   # ex: [480, 854] — abaixo do mínimo
print("Duration:", vid.duration)
vid.close()
```

Se `width < 500px` → prosseguir com upscale. Se `>= 500px` → pular para Etapa 4.

---

## Etapa 3 — Upscale + Merge Áudio/Vídeo

```python
from moviepy import VideoFileClip, AudioFileClip

vid = VideoFileClip("/tmp/reel-video.mp4")
aud = AudioFileClip("/tmp/reel-audio.m4a")

# Upscale para 1080x1920 (9:16 fullHD — ideal para Instagram Stories/Reels)
vid_resized = vid.resized((1080, 1920))
vid_final = vid_resized.with_audio(aud)

vid_final.write_videofile(
    "/tmp/reel-upscaled.mp4",
    codec="libx264",
    audio_codec="aac",
    fps=30,
    preset="fast",
    logger="bar"
)

vid.close()
aud.close()
```

> ⏱ Leva ~8 min para vídeo de 3 min em 1080p. Rodar em background.

---

## Etapa 4 — Upload para Meta Ads

```bash
TOKEN="SEU_ACCESS_TOKEN"
AD_ACCOUNT="act_XXXXXXXXXX"

curl -X POST \
  "https://graph-video.facebook.com/v19.0/${AD_ACCOUNT}/advideos" \
  -F "access_token=${TOKEN}" \
  -F "title=Nome do Anúncio" \
  -F "source=@/tmp/reel-upscaled.mp4;type=video/mp4"
# Retorna: {"id": "VIDEO_ID"}
```

---

## Etapa 5 — Aguardar Processamento

```bash
# Poll até status = "ready" (geralmente 1-3 min)
curl "https://graph.facebook.com/v19.0/VIDEO_ID?fields=status&access_token=${TOKEN}"
# Aguardar: video_status = "ready"
```

---

## Etapa 6 — Extrair Thumbnail

```python
from moviepy import VideoFileClip
from PIL import Image
import numpy as np

vid = VideoFileClip("/tmp/reel-upscaled.mp4")
frame = vid.get_frame(2.0)  # frame em 2s (evita frames pretos iniciais)
vid.close()

Image.fromarray(frame).save("/tmp/reel-thumbnail.jpg", "JPEG", quality=90)
```

---

## Etapa 7 — Upload Thumbnail → Obter Hash

```bash
curl -X POST \
  "https://graph.facebook.com/v19.0/${AD_ACCOUNT}/adimages" \
  -F "access_token=${TOKEN}" \
  -F "filename=@/tmp/reel-thumbnail.jpg"
# Retorna: {"images": {"reel-thumbnail.jpg": {"hash": "HASH_VALUE", ...}}}
```

---

## Etapa 8 — Criar Criativo de Vídeo

```bash
PAGE_ID="ID_DA_PAGINA_FACEBOOK"  # Página com acesso no token

curl -X POST \
  "https://graph.facebook.com/v19.0/${AD_ACCOUNT}/adcreatives" \
  -d "access_token=${TOKEN}" \
  -d "name=Nome do Criativo" \
  -d "{
    \"object_story_spec\": {
      \"page_id\": \"${PAGE_ID}\",
      \"video_data\": {
        \"video_id\": \"VIDEO_ID\",
        \"image_hash\": \"HASH_VALUE\",
        \"title\": \"\",
        \"message\": \"\",
        \"call_to_action\": {\"type\": \"NO_BUTTON\"}
      }
    }
  }"
# Retorna: {"id": "CREATIVE_ID"}
```

> **ThruPlay + sem CTA:** ideal para campanhas de aquecimento/awareness.
> **call_to_action NO_BUTTON:** vídeo puro, sem botão de ação.

---

## Etapa 9 — Atualizar Anúncio

```bash
AD_ID="120XXXXXXXXXXXX"

curl -X POST \
  "https://graph.facebook.com/v19.0/${AD_ID}" \
  -d "access_token=${TOKEN}" \
  -d "name=Novo Nome do Anúncio" \
  -d "creative={\"creative_id\":\"CREATIVE_ID\"}"
# Retorna: {"success": true}
```

---

## Verificação Final

```bash
curl "https://graph.facebook.com/v19.0/${AD_ID}?fields=name,status,effective_status,issues_info&access_token=${TOKEN}"
# Esperado: effective_status = "PAUSED" (sem WITH_ISSUES)
# IN_PROCESS = ainda processando (normal, aguardar 5-30 min)
```

---

## Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| `#2875006` — largura < 500px | Vídeo em 480px | Upscale para ≥540x960 (mínimo) ou 1080x1920 (ideal) |
| `video_status: processing` | Upload recente | Aguardar 1-3 min, fazer poll |
| `Miniatura de vídeo necessária` | `image_hash` ausente | Extrair frame e fazer upload como adimage |
| `Página inválida` | Token sem acesso à página | Usar page_id de página que o token gerencia |
| `start_time não pode ser editado` | Ad set já iniciado | Criar cron para ativar via API no horário certo |
| `age_max: 70 inválido` | Meta max é 65 | Usar `age_max: 65` |
| `VIDEO_VIEWS inválido` | API v19+ mudou | Usar `OUTCOME_AWARENESS` |

---

## Parâmetros Meta Ads para Aquecimento de Conta

```json
{
  "campaign": {
    "objective": "OUTCOME_AWARENESS",
    "is_adset_budget_sharing_enabled": false
  },
  "adset": {
    "optimization_goal": "THRUPLAY",
    "billing_event": "THRUPLAY",
    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    "daily_budget": 1000,
    "publisher_platforms": ["instagram"],
    "instagram_positions": ["stream", "explore", "reels"],
    "age_min": 45,
    "age_max": 65,
    "geo_locations": {"countries": ["BR"]}
  }
}
```

> **ThruPlay** cobra apenas quando o usuário assiste 15s+ ou o vídeo completo. Ideal para aquecimento — pagamos por engajamento real.

---

## Referência — Caso HEO (01/04/2026)

- **Conta:** `${META_AD_ACCOUNT_HEO}`
- **Reel original:** `DU6k5VVjTh9` — 480x854px (gravado via WhatsApp)
- **Vídeo upscalado:** `video_id: ${VIDEO_ASSET_ID}` — 1080x1920px
- **Criativo:** `${CREATIVE_ID}`
- **Anúncio:** `${AD_ID}` — "Depoimento — Ela Falou Que Era Ansiedade"
- **Campanha:** `${CAMPAIGN_ID}` — HEO Aquecimento 01
