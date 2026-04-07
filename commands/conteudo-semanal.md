---
description: "Pesquisa tendências, gera conteúdo semanal para Instagram com criativos visuais e sobe no MY GROWTH. Pesquisa → Estratégia → Legendas → Criativos → Upload."
argument-hint: "[pesquisar|planejar|gerar|upload|tudo]"
allowed-tools: ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "WebSearch", "WebFetch", "Agent"]
---

# /conteudo-semanal — Conteúdo Semanal Instagram

Skill completa para pesquisar tendências, planejar estratégia, gerar criativos visuais e subir tudo no MY GROWTH.

## Contexto

### Infraestrutura
| Recurso | Detalhe |
|---------|---------|
| VPS MY GROWTH | `${VPS_IP}` — root — `${VPS_PASSWORD}` |
| Posts JSON | `/opt/my-growth/data/scheduled-posts.json` |
| Imagens VPS | `/opt/my-growth/public/carrosseis/{slug}/` |
| Content Studio | `~/content-studio/` |
| Uma Engine V1 | `uma_engine.py` — PIL/Pillow (reels, carrosseis, stories) |
| Uma Engine V2 | `uma_engine_v2.py` — HTML/Playwright (templates avançados) |
| Stock Images | `assets/stock-images/` — imagens temáticas por tópico |
| Fotos YOUR_NAME | `fotos-pessoais/rosto/` — 8 variantes com metadata |
| Brand Config | `your-name-brand.json` — cores, fontes, formatos, CTAs |
| Output | `posts-criados/2026-03/` — criativos gerados |

### Perfil Instagram
- **Handle:** @your-handle
- **Negócio:** DOMINA.IA — ferramentas com IA, mentoria, eventos
- **Tom:** Autoridade + urgência + dados reais
- **Ângulo campeão:** "R$3K a R$30K" com IA

### MCPs Disponíveis para Pesquisa
| MCP | Função |
|-----|--------|
| WebSearch | Busca web (notícias, trends) |
| WebFetch | Conteúdo de qualquer URL |
| Playwright | Screenshots, scraping de sites |
| RSS Reader | Feeds de notícias IA |
| Reddit | Trends de r/artificial, r/MachineLearning |
| Hacker News | Trending tech em tempo real |
| Canva | Criar/exportar designs |

## Comandos

### /conteudo-semanal pesquisar

Pesquisa tendências e notícias quentes de IA para a semana.

1. **Buscar em paralelo** (usar Agent tool para cada):
   - Notícias de IA da semana (TechCrunch, CNN, Fortune, THE DECODER)
   - Reddit r/artificial + r/ChatGPT + r/singularity (hot posts)
   - Hacker News (stories de IA na front page)
   - Perfis virais de IA no Instagram (hooks, formatos, engagement)
   - Google Trends / trending topics de IA

2. **Compilar TOP 10 tópicos** ranqueados por:
   - Potencial viral no Instagram (1-10)
   - Conexão com narrativa atual (ex: Mercado Invisível, DOMINA.IA)
   - Facilidade de criação visual

3. **Para cada tópico incluir:**
   - O que aconteceu (1-2 frases)
   - Fonte real (TechCrunch, CNN, etc.)
   - Ângulo para Instagram
   - Formato sugerido (reel, carrossel, feed)

### /conteudo-semanal planejar

Monta o plano da semana com posts dia a dia.

1. **PRIMEIRO:** Verificar agenda existente no MY GROWTH via SSH
   ```
   cat /opt/my-growth/data/scheduled-posts.json
   ```
   Identificar quais datas/horários JÁ TÊM posts agendados.

2. **NUNCA modificar posts existentes** — só criar nos espaços vazios.

3. **Montar grade semanal** com:
   - 2-3 posts por dia
   - Mix de formatos: Reels (discovery) + Carrosseis (saves) + CTAs
   - Horários ideais: Feed 11h30-13h | Stories 8h + 20h
   - FOMO crescente se houver lançamento ativo
   - Ângulo "R$3K a R$30K" em pelo menos 1 post/dia

4. **Cada post deve ter:**
   - Título, slug, tipo (reel/carrossel/feed/news)
   - Data e horário agendado
   - Legenda completa com fontes citadas
   - Hashtags relevantes (3-5 de nicho, não genéricos)
   - CTA claro → link na bio

5. **Inserir no scheduled-posts.json** com status "rascunho"
   - IDs sequenciais (pegar último ID + 1)
   - Formato JSON exato do MY GROWTH

### /conteudo-semanal gerar

Gera os criativos visuais para todos os posts.

1. **ANTES de gerar, para cada post:**
   - Buscar imagem temática no Unsplash/Pexels via WebFetch
   - Salvar em `assets/stock-images/{tema}.jpg`
   - NUNCA usar a mesma imagem em posts diferentes
   - NUNCA usar só a foto do YOUR_NAME em tudo

2. **Tipos de criativo e funções:**

   | Tipo | Função | Engine |
   |------|--------|--------|
   | Reel com stock | `render_reel_stock()` | Script custom (V2) |
   | Reel com foto YOUR_NAME | `render_reel()` | uma_engine.py |
   | Carrossel dark | `render_carrossel()` | uma_engine.py |
   | Carrossel news | `render_carrossel_news()` | uma_engine.py |
   | Carrossel tweet | `render_carrossel_tweet()` | uma_engine.py |
   | Feed image | `render_feed_image()` | uma_engine_v2.py |
   | Story CTA | `render_story_cta()` | uma_engine.py |

3. **Regras de geração:**
   - Reels: 1080x1920 (9:16) — imagem stock como background, gradiente escuro, texto legível
   - Carrosseis: 1080x1350 (4:5) — slides dark ou news
   - Feed: 1080x1080 ou 1080x1350
   - Qualidade JPEG 97
   - SEMPRE verificar overflow de texto antes de finalizar
   - Subtítulos curtos (máx 3 linhas, ~35 chars por linha)
   - Fonte de notícia SEMPRE visível na imagem

4. **Após gerar, verificar VISUALMENTE cada criativo:**
   - Usar `Read` tool para ver cada imagem
   - Checar: texto cortado? Imagem legível? Variedade visual?
   - SE houver problema, corrigir ANTES de fazer upload

### /conteudo-semanal upload

Sobe criativos no MY GROWTH VPS.

1. **Upload via Paramiko (SSH/SFTP):**
   ```python
   import paramiko
   ssh = paramiko.SSHClient()
   ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
   ssh.connect("${VPS_IP}", username="root", password="${VPS_PASSWORD}")
   sftp = ssh.open_sftp()
   ```

2. **Estrutura de diretórios no VPS:**
   ```
   /opt/my-growth/public/carrosseis/{slug}/
     slide_01_capa.jpg    ← primeiro slide (capa)
     slide_02.jpg         ← slide 2
     slide_03.jpg         ← slide 3
     ...
     slide_XX.jpg         ← último slide (CTA)
   ```

3. **REGRAS CRÍTICAS de nomenclatura:**
   - Primeiro slide: `slide_01_capa.jpg`
   - Slides internos: `slide_02.jpg`, `slide_03.jpg`, etc.
   - Último slide (CTA): `slide_XX.jpg` (número sequencial, SEM sufixo `_cta`)
   - Post de 1 slide: `slide_01_capa.jpg`
   - **NUNCA usar `_cta` no nome** — o MY GROWTH não reconhece

4. **Atualizar scheduled-posts.json:**
   - Campo `slides` = número total de arquivos
   - Manter status "rascunho" até aprovação manual

5. **Após upload, verificar no painel MY GROWTH:**
   - Abrir https://mygrowth.your-domain.com.br
   - Conferir cada post: thumbnail aparece? Slides carregam?

### /conteudo-semanal tudo

Executa o fluxo completo em sequência:
1. `pesquisar` → trends e notícias
2. `planejar` → grade semanal + legendas + JSON
3. `gerar` → criativos visuais com imagens temáticas
4. `upload` → subir no MY GROWTH

## Formatos de Imagem por Tipo de Post

| Formato | Dimensão | Uso |
|---------|----------|-----|
| Story/Reel | 1080x1920 | Capas de reel, stories, CTAs verticais |
| Feed Portrait | 1080x1350 | Carrosseis (dark, news, tweet) |
| Feed Square | 1080x1080 | Feed simples (só quando explicitamente pedido) |

## Template — Buscar Imagem Stock

```python
# Via WebFetch no Unsplash
# 1. Buscar na página de busca
# 2. Extrair URL da imagem
# 3. Baixar com curl
curl -L "https://images.unsplash.com/photo-{ID}?w=1080&q=80" \
  -o assets/stock-images/{tema}.jpg
```

## Template — Gerar Reel com Stock Image

```python
from uma_engine import font, autofit, make_canvas, add_particles, \
    draw_glow_line, draw_badge, draw_text_stroke, draw_handle, C, BRAND, OUT_DIR
from PIL import Image, ImageDraw, ImageEnhance

def render_reel_stock(headline_lines, subtitle="", badge="",
                      stock_image="", output_name="reel.jpg"):
    W, H = 1080, 1920
    pad = int(W * 0.068)
    max_w = W - pad * 2

    canvas = Image.new("RGB", (W, H), (8, 10, 14))

    if stock_image and Path(stock_image).exists():
        bg = Image.open(stock_image).convert("RGB")
        bg_ratio = max(W / bg.width, H / bg.height)
        bg = bg.resize((int(bg.width * bg_ratio), int(bg.height * bg_ratio)), Image.LANCZOS)
        cx, cy = (bg.width - W) // 2, (bg.height - H) // 2
        bg = bg.crop((cx, cy, cx + W, cy + H))
        bg = ImageEnhance.Brightness(bg).enhance(0.35)
        canvas.paste(bg, (0, 0))

    # Gradiente escuro no topo + embaixo
    gradient = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gradient)
    for y in range(int(H * 0.55)):
        alpha = int(200 * (1 - y / (H * 0.55)) ** 1.5)
        gd.line([(0, y), (W, y)], fill=(8, 10, 20, alpha))
    for y in range(int(H * 0.15)):
        ry = H - int(H * 0.15) + y
        alpha = int(180 * (y / (H * 0.15)) ** 1.8)
        gd.line([(0, ry), (W, ry)], fill=(8, 10, 20, alpha))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), gradient).convert("RGB")

    # Badge, headline, glow line, subtitle, handle (usar funções da uma_engine)
    # ... (ver gerar_semana_mercado_invisivel_v2.py para implementação completa)
```

## Template — Upload para MY GROWTH

```python
import json, paramiko
from pathlib import Path

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("${VPS_IP}", username="root", password="${VPS_PASSWORD}")
sftp = ssh.open_sftp()

slug = "nome-do-post"
local_files = sorted(glob.glob(f"posts-criados/2026-03/{slug}-*.jpg"))
remote_dir = f"/opt/my-growth/public/carrosseis/{slug}"

try:
    sftp.stat(remote_dir)
except FileNotFoundError:
    sftp.mkdir(remote_dir)

for i, f in enumerate(local_files):
    if i == 0:
        remote_name = "slide_01_capa.jpg"
    else:
        remote_name = f"slide_{i+1:02d}.jpg"  # SEM _cta!
    sftp.put(f, f"{remote_dir}/{remote_name}")

sftp.close()
ssh.close()
```

## Problemas Conhecidos

| Problema | Causa | Solução |
|----------|-------|---------|
| Slide CTA não aparece no MY GROWTH | Nome com `_cta` no arquivo | Renomear para `slide_XX.jpg` (sem sufixo) |
| Texto cortado no reel | Subtítulo muito longo | Máx 35 chars/linha, máx 3 linhas |
| Mesma foto em todos os reels | Usando `render_reel()` padrão | Usar `render_reel_stock()` com imagem temática |
| Post sem thumbnail no calendário | Diretório não criado no VPS | Criar `/opt/my-growth/public/carrosseis/{slug}/` |
| Imagem quebrada no MY GROWTH | Arquivo não existe ou nome errado | Verificar ls no diretório do VPS |
| Conflito com post existente | Criou em data/horário já ocupado | SEMPRE verificar `scheduled-posts.json` ANTES |

## Regras

- **SEMPRE** verificar agenda existente no MY GROWTH antes de criar novos posts
- **NUNCA** modificar posts já agendados/publicados
- **SEMPRE** usar imagens temáticas DIFERENTES para cada post
- **NUNCA** repetir a mesma foto do YOUR_NAME em todos os reels
- **SEMPRE** incluir fonte da notícia na legenda E na imagem
- **SEMPRE** usar acentos e cedilha (ã, é, ç, ô) — NUNCA sem acentuação
- **SEMPRE** verificar visualmente cada criativo antes de fazer upload
- **NUNCA** usar sufixo `_cta` no nome de arquivos de slide
- **SEMPRE** buscar imagens stock via WebFetch/Unsplash para temas diferentes
- **SEMPRE** testar overflow de texto (subtítulos curtos, máx 35 chars/linha)
- **SEMPRE** atualizar `scheduled-posts.json` após upload com contagem de slides correta
- Formato padrão ads Meta: Story/Reel 1080x1920 (9:16)
- Formato carrossel: 1080x1350 (4:5)
- Formato feed square: 1080x1080 — APENAS quando explicitamente pedido
- Qualidade JPEG: 97 (profissional)
- Horários ideais: Feed 11h30-13h | Stories manhã 8h + noite 20h
- Hashtags: 3-5 de nicho específico, não genéricos (#ia é muito amplo)

## Referência — Scripts Existentes

| Script | Função |
|--------|--------|
| `gerar_semana_mercado_invisivel_v2.py` | Geração V2 com stock images (modelo a seguir) |
| `regenerar_carrosseis_45.py` | Regenerar carrosseis em lote |
| `campanha_mercado_invisivel.py` | Criativos de ads com PIL |
| `upload_v3_mygrowth.py` | Upload original dos 21 posts |
| `photo_config.py` | Metadata das fotos do YOUR_NAME |
| `your-name-brand.json` | Identidade visual completa |
