---
name: ops-catalog
description: "Catálogo de processos operacionais automatizados — tráfego, design, deploy, analytics, notificação. Processos genéricos reutilizáveis para qualquer produto/campanha."
user-invocable: true
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---

# Processos Operacionais — Catálogo

> Processos genéricos. Funcionam pra qualquer produto, campanha ou lançamento.
> Cada processo recebe INPUTS e produz OUTPUTS — sem nomes hardcoded.
> Atualizado: 2026-03-19

---

## ÍNDICE DE PROCESSOS

| # | Processo | Categoria | O que faz | Autonomia |
|---|----------|-----------|-----------|-----------|
| 1 | [Criar Campanha Meta](#1-criar-campanha-meta) | Tráfego | Criativos → Campanha completa na API | 100% |
| 2 | [Upload Criativos](#2-upload-criativos-my-growth) | Tráfego | Imagens locais → MY GROWTH (VPS + DB) | 100% |
| 3 | [Gerar Criativo Estático](#3-gerar-criativo-estático) | Design | Ângulo + copy → Imagem 9:16 pronta | 100% |
| 4 | [Gerar Imagem IA](#4-gerar-imagem-ia) | Design | Prompt → Imagem via Freepik AI | 100% |
| 5 | [Gerar Vídeo IA](#5-gerar-vídeo-ia) | Design | Prompt/imagem → Vídeo via fal.ai | 100% |
| 6 | [Publicar no MY GROWTH](#6-publicar-no-my-growth) | Deploy | Post + legenda → Agendado no Instagram | 100% |
| 7 | [Snapshot CPL](#7-snapshot-cpl) | Analytics | Momento → Foto dos CPLs atuais | 100% |
| 8 | [Relatório Meta Ads](#8-relatório-meta-ads) | Analytics | Período → Relatório completo | 100% |
| 9 | [Monitor de Campanhas](#9-monitor-de-campanhas) | Analytics | Loop → Alertas automáticos Telegram | Daemon |
| 10 | [Gestão de UTMs](#10-gestão-de-utms) | Analytics | Link + tags → URL rastreável | 100% |
| 11 | [Relatório GA4](#11-relatório-ga4) | Analytics | Período → Sessões × campanhas | 100% |
| 12 | [Notificação Telegram](#12-notificação-telegram) | Notificação | Mensagem → Telegram | 100% |
| 13 | [Refresh Token Meta](#13-refresh-token-meta) | Infra | Token curto → Token longo | 100% |
| 14 | [QA Visual](#14-qa-visual) | QA | Imagens → Checklist qualidade | 100% |
| 15 | [Deploy VPS](#15-deploy-vps) | Deploy | Arquivos → Servidor produção | 100% |
| 16 | [Conteúdo Semanal](#16-conteúdo-semanal) | Conteúdo | Tendências → 21 posts agendados | Workflow |

---

## PROCESSOS DE TRÁFEGO

### 1. CRIAR CAMPANHA META

**Processo:** Recebe criativos + parâmetros → cria campanha completa via Meta Ads API.

**Inputs:**
| Input | Exemplo | Obrigatório |
|-------|---------|-------------|
| Pasta de criativos (PNG/JPG) | qualquer pasta local | Sim |
| Budget diário (R$) | 30 | Sim |
| Data/hora início | 2026-03-20 00:05 | Sim |
| Data/hora fim | 2026-03-27 23:59 | Sim |
| Nome da campanha | texto descritivo | Sim |
| Copy por ad (corpo, título) | texto por criativo | Sim |
| UTM campaign tag | texto slug | Sim |
| Público (aberto ou com interesses) | aberto / lista de IDs | Sim |

**Estrutura fixa (validada — não mudar):**
```
Campanha CBO → OUTCOME_LEADS, LOWEST_COST_WITHOUT_CAP
  └── Ad Set Advantage+ → OFFSITE_CONVERSIONS, Pixel Lead, 25-65 BR
       └── Ad 1..N → SIGN_UP, tracking pixel
```

**6 Steps:**
1. Validar token Meta
2. Upload imagens → `image_hash`
3. Criar ad creatives (hash + copy + UTMs)
4. Criar campanha CBO (budget + bid strategy)
5. Criar ad set Advantage+ (targeting + datas)
6. Criar ads + agendar ativação

**Script base:** `~/utm-manager/criar_campanha_v*.py`

**Como criar nova instância:**
```bash
# Copiar último script e editar os inputs
cp utm-manager/criar_campanha_v11.py utm-manager/criar_campanha_v12.py
# Editar: CREATIVES_DIR, DAILY_BUDGET, START/STOP_TIME, ADS_CONFIG, UTM_CAMPAIGN
```

**Próximo passo (autonomia):** Refatorar num único script parametrizado:
```bash
python3 criar_campanha.py \
  --criativos /caminho/pasta/ \
  --budget 30 \
  --inicio "2026-03-20 00:05" \
  --fim "2026-03-27 23:59" \
  --nome "Nome Campanha" \
  --publico aberto \
  --ads-config ads.json
```

---

### 2. UPLOAD CRIATIVOS (MY GROWTH)

**Processo:** Envia imagens para VPS e registra no banco para visualização no dashboard.

**Inputs:** Pasta ou arquivo de imagem + nome da campanha
**Output:** Imagens no VPS + IDs no banco PostgreSQL

**Comando:**
```bash
cd ~/content-studio

# Pasta inteira
python3 upload_criativos_trafego.py "/caminho/pasta/" "Nome Campanha"

# Arquivo único
python3 upload_criativos_trafego.py "/caminho/arquivo.png" "Nome Campanha" "Nome Peça"
```

**Destino:** `/opt/my-growth/public/traffic-creatives/{slug}/`
**Dashboard:** https://mygrowth.your-domain.com.br/traffic

---

## PROCESSOS DE DESIGN

### 3. GERAR CRIATIVO ESTÁTICO

**Processo:** Recebe ângulo + copy → gera imagem pronta para Meta Ads.

**Inputs:** Ângulo/hook, texto do corpo, formato, estilo visual
**Output:** PNG 1080x1920 (9:16) no padrão dark/green

**Motor:** `uma_engine.py` (PIL) ou `uma_engine_v2.py` (HTML+Playwright)
**Scripts:** `~/content-studio/gerar_ads_mi_v*.py`

**Padrão visual validado (melhor CPL):**
- Fundo dark gradiente
- Números grandes em verde (#2ECC71) ou laranja
- Headlines brancas bold
- CTA verde/teal arredondado
- Badge de contexto no topo
- Sem foto (text-only performa melhor para frio)

**Próximo passo (autonomia):** Template engine genérico que recebe JSON de conteúdo e gera imagem.

---

### 4. GERAR IMAGEM IA

**Processo:** Prompt de texto → imagem gerada por IA.

**Comando:**
```bash
cd ~/content-studio
python3 gerar-imagem.py "descrição da imagem" \
  --proporcao reels \
  --modelo seedream \
  --destino posts-criados/YYYY-MM
```

**Proporções:** `square_1_1`, `social_story_9_16`, `widescreen_16_9`, `social_post_4_5`, `portrait_2_3`
**Modelos:** seedream (~6s), mystic (~3min), retrato, realismo

---

### 5. GERAR VÍDEO IA

**Processo:** Prompt ou imagem → vídeo curto gerado por IA.

**Comando:**
```bash
cd ~/content-studio

# Text-to-Video
python3 luna_uma.py video "descrição da cena" --proporcao reels --duracao 8

# Image-to-Video
python3 luna_uma.py video "movimento de câmera" -m i2v --imagem https://url/foto.png
```

---

## PROCESSOS DE DEPLOY

### 6. PUBLICAR NO MY GROWTH

**Processo:** Post com legenda + data → agendado no MY GROWTH para publicação automática.

**Uso:**
```python
from publicar_mygrowth import registrar_post
registrar_post(
    slug="slug-do-post",
    nome="Título",
    tema="Tema/pilar",
    imagens=["/caminho/img1.jpg"],
    legenda="Legenda com #hashtags",
    data_agendada="2026-03-20T12:00:00Z",  # UTC!
    gerado_por="luna-content-studio"
)
```

**Batch (semana inteira):**
```bash
python3 upload_v3_mygrowth.py
```

**Dashboard:** https://mygrowth.your-domain.com.br/instagram

---

### 15. DEPLOY VPS

**Processo:** Arquivos/código local → servidor de produção.

**Para assets:** `upload_to_vps.py` (SFTP via paramiko)
**Para app:** `ssh ${VPS_USER}@${VPS_IP} "cd /opt/my-growth && npm run build && pm2 restart my-growth"`

---

## PROCESSOS DE ANALYTICS

### 7. SNAPSHOT CPL

**Processo:** Captura CPL de todas as campanhas ativas no momento.

```bash
cd ~/utm-manager && python3 snapshot_cpl.py
```

**Quando:** Checkpoints diários (11h e 18h), antes de decisões de escala/pausa.

---

### 8. RELATÓRIO META ADS

**Processo:** Gera relatório completo com métricas, CPL, alertas.

```bash
cd ~/utm-manager
python3 meta_ads.py campanhas --apenas-ativas       # Listar
python3 meta_ads.py insights --dias 7               # Métricas
python3 meta_ads.py alertas --dias 7                 # Alertas
python3 meta_ads.py relatorio --dias 7 --telegram    # Completo + notifica
```

---

### 9. MONITOR DE CAMPANHAS

**Processo:** Daemon que monitora e alerta automaticamente via Telegram.

```bash
cd ~/utm-manager
python3 meta_monitor.py           # Uma vez
python3 meta_monitor.py --loop    # Contínuo
python3 meta_monitor.py --alertas # Só alertas
```

---

### 10. GESTÃO DE UTMs

**Processo:** Cria, lista e exporta links rastreáveis.

```bash
cd ~/utm-manager
python3 utm_manager.py criar --produto PRODUTO --objetivo OBJETIVO --source SOURCE
python3 utm_manager.py listar --produto PRODUTO
python3 utm_manager.py exportar --launch TAG
python3 utm_manager.py relatorio --telegram
```

---

### 11. RELATÓRIO GA4

**Processo:** Sessões, campanhas e correlação UTM × GA4.

```bash
cd ~/utm-manager
python3 ga4.py sessoes --dias 7
python3 ga4.py campanhas
python3 ga4.py correlacao
python3 ga4.py relatorio --telegram
```

---

## PROCESSOS DE SUPORTE

### 12. NOTIFICAÇÃO TELEGRAM

```bash
python3 ~/utm-manager/telegram_notify.py "Mensagem"
```
```python
from telegram_notify import send
send("Texto HTML <b>formatado</b>")
```

### 13. REFRESH TOKEN META

```bash
cd ~/utm-manager && python3 token_refresh.py
```
Usar quando: erro 190 na API (token expirado).

### 14. QA VISUAL

```bash
cd ~/content-studio && python3 qa_visual.py
```
Verifica: resolução, proporção, cores, contraste dos criativos.

### 16. CONTEÚDO SEMANAL

Workflow completo: Pesquisa → Estratégia → Roteiros → Criativos → Upload.
Trigger: todo domingo. Skill `/conteudo-semanal` já existe.

---

## WORKFLOWS COMPOSTOS (processos combinados)

### Workflow: Novo Ângulo de Ads

```
INPUT: Briefing (ângulo, público, budget, data)
  ↓
1. Gerar criativos estáticos     → Processo #3
2. Upload para MY GROWTH          → Processo #2
3. Criar campanha Meta             → Processo #1
4. Monitorar CPL 24h               → Processo #7
5. Decisão: duplicar ou pausar     → Regras Sobral (paid-ads skill)
```

### Workflow: Lançamento Digital

```
INPUT: Produto, LP, datas, budget total
  ↓
1. Landing page + deploy           → Processos #15 + page-cro skill
2. Criativos × N ângulos           → Processo #3 (loop)
3. Campanhas × N versões           → Processo #1 (loop)
4. Monitor + alertas               → Processos #7 + #8 + #12
5. Otimização diária               → Regras Sobral (pausa/duplica)
6. Conteúdo orgânico               → Processo #16
7. Nutrição leads                  → whatsapp-bot skill
```

### Workflow: Checkpoint Diário

```
TRIGGER: 2x/dia (11h e 18h)
  ↓
1. Snapshot CPL                    → Processo #7
2. Relatório Meta                  → Processo #8
3. Correlação GA4                  → Processo #11
4. Análise + decisão               → Regras Sobral
5. Notificação                     → Processo #12
```

---

## CREDENCIAIS (referência)

### utm-manager/.env
`META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GA4_PROPERTY_ID`, `GA4_CREDENTIALS_FILE`

### content-studio/.env
`FREEPIK_API_KEY`, `FAL_KEY`

### Constantes Meta Ads (Pixel/Page/Account)
Armazenadas nos scripts e na memória `feedback_meta_api_campanhas.md`.

---

## EVOLUÇÃO → AUTONOMIA TOTAL

### Hoje (v1): Semi-autônomo
- Claude monta o script por campanha
- Copia script anterior, ajusta parâmetros
- Executa via CLI

### Próximo (v2): Parametrizado
- Script único `criar_campanha.py` que recebe TUDO via args/JSON
- `gerar_criativo.py` que recebe ângulo + copy e gera imagem
- Zero cópia de scripts — tudo é input

### Futuro (v3): Autônomo
- Claude recebe: "sobe campanha com esses criativos, R$30, amanhã 00:05"
- Executa workflow inteiro sem intervenção
- Monitora, decide, escala/pausa sozinho
- Reporta via Telegram

### Longo prazo (v4): Proativo
- Claude identifica fadiga de criativo
- Gera novos ângulos baseado em dados
- Sobe campanha de teste
- Escala winners automaticamente
- YOUR_NAME só aprova decisões de alto risco (budget > X)
