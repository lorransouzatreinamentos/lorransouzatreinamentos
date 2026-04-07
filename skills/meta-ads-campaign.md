---
name: meta-ads-campaign
description: "Criar e subir campanhas Meta Ads via API — campanha CBO, adset Advantage+, upload de criativos, ads com UTMs, auditoria pós-criação. Use quando precisar criar campanhas de tráfego pago no Facebook/Instagram."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - WebFetch
---

# Meta Ads Campaign — Skill de Criação de Campanhas via API

## Propósito

Criar campanhas Meta Ads completas via Marketing API — desde a estrutura de campanha até os anúncios individuais com criativos, copy e UTMs. Processo automatizado com auditoria pós-criação.

**Input:** Briefing + criativos (imagens) + copy + URL da LP
**Output:** Campanha ativa no Meta Ads com todos os componentes auditados

---

## Parâmetros Obrigatórios

O usuário DEVE fornecer:

| Parâmetro | Exemplo | Obrigatório |
|-----------|---------|-------------|
| Access Token Meta | `EAAx...` | Sim |
| Ad Account ID | `act_123456789` | Sim |
| Page ID (Facebook) | `${PAGE_ID}` | Sim |
| Pixel ID | `${PIXEL_ID}` | Sim |
| Nome da campanha | "Captação Desafio V3" | Sim |
| Budget diário (R$) | `30` | Sim |
| URL da landing page | `https://desafio.site.com/v3` | Sim |
| Criativos (imagens) | Caminhos dos arquivos | Sim |
| Copy do anúncio (texto) | Texto principal do ad | Sim |
| Headline do ad | "Vagas Limitadas" | Sim |
| Descrição do ad | "Desafio Gratuito de 5 Dias" | Não |

### Parâmetros com Defaults Inteligentes

| Parâmetro | Default | Quando Alterar |
|-----------|---------|----------------|
| Objetivo | `OUTCOME_LEADS` | Só se for vendas diretas |
| Otimização | `OFFSITE_CONVERSIONS` | Só se for tráfego/alcance |
| Evento do pixel | `Lead` | Só se for Purchase |
| CTA | `LEARN_MORE` | Quase nunca (campeão validado) |
| Idade | 25-65 | Raramente |
| País | BR | Só se for internacional |
| Posicionamentos | Facebook + Instagram | Nunca alterar |
| Start date | Hoje + 5 minutos | Só se quiser agendar |
| special_ad_categories | `[]` (vazio) | Só se for crédito/habitação/emprego |

---

## PASSO 1 — Criar Campanha (CBO)

### Request

```bash
curl -X POST \
  "https://graph.facebook.com/v21.0/AD_ACCOUNT_ID/campaigns" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "NOME_DA_CAMPANHA",
    "objective": "OUTCOME_LEADS",
    "status": "PAUSED",
    "special_ad_categories": [],
    "daily_budget": BUDGET_EM_CENTAVOS,
    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    "access_token": "ACCESS_TOKEN"
  }'
```

### Regras Críticas

| Regra | Detalhe |
|-------|---------|
| **Budget em CENTAVOS** | R$30/dia = `3000` na API |
| **Budget ímpar (King)** | R$31, R$33, R$37, R$43 (melhor distribuição) |
| **Status inicial PAUSED** | SEMPRE criar pausada, ativar depois da auditoria |
| **special_ad_categories = []** | Array vazio, NÃO omitir |
| **bid_strategy** | LOWEST_COST_WITHOUT_CAP (padrão CBO) |

---

## PASSO 2 — Criar AdSet (Advantage+)

### Request

```bash
curl -X POST \
  "https://graph.facebook.com/v21.0/AD_ACCOUNT_ID/adsets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AdSet - NOME",
    "campaign_id": "CAMPAIGN_ID",
    "billing_event": "IMPRESSIONS",
    "optimization_goal": "OFFSITE_CONVERSIONS",
    "promoted_object": {
      "pixel_id": "PIXEL_ID",
      "custom_event_type": "LEAD"
    },
    "targeting": {
      "age_min": 25,
      "age_max": 65,
      "geo_locations": {
        "countries": ["BR"]
      },
      "publisher_platforms": ["facebook", "instagram"],
      "facebook_positions": ["feed", "story", "reels"],
      "instagram_positions": ["stream", "story", "reels", "explore"]
    },
    "status": "PAUSED",
    "start_time": "START_TIME_ISO",
    "access_token": "ACCESS_TOKEN"
  }'
```

### Regras Críticas — Advantage+

| Regra | Detalhe | Validação |
|-------|---------|-----------|
| **Advantage+ >> Segmentação Manual** | CPL até 7x melhor que segmentação por interesses | SEMPRE usar Advantage+ (sem interesses) |
| **publisher_platforms EXPLÍCITO** | DEVE incluir `["facebook", "instagram"]` | NÃO omitir (causa erro) |
| **NÃO usar instagram_actor_id** | Causa erro na API | NUNCA incluir este campo |
| **Idade 25-65** | Range validado por performance | Só alterar se público é muito específico |
| **promoted_object com pixel** | Obrigatório para OFFSITE_CONVERSIONS | Verificar pixel_id correto |
| **Posicionamentos completos** | Feed + Story + Reels em ambas plataformas | Maximiza distribuição |

### Erro Comum: instagram_actor_id

```
NÃO incluir "instagram_actor_id": "12345" → causa ERRO na API
Simplesmente NÃO incluir o campo — a API resolve automaticamente
```

---

## PASSO 3 — Upload de Criativos

### Upload de Imagem

```bash
curl -X POST \
  "https://graph.facebook.com/v21.0/AD_ACCOUNT_ID/adimages" \
  -F "filename=@/caminho/para/criativo.png" \
  -F "access_token=ACCESS_TOKEN"
```

### Formatos Aceitos

| Formato | Dimensão | Uso |
|---------|----------|-----|
| Story/Reels (9:16) | 1080x1920 | **Padrão principal** — maior alcance |
| Feed (1:1) | 1080x1080 | Complementar, apenas se solicitado |
| Feed (4:5) | 1080x1350 | Alternativa para feed |

### Regras de Criativos

1. **SEMPRE enviar story 1080x1920** — é o formato de maior alcance
2. **Feed 1080x1080 é complementar** — só se o usuário pediu
3. **Conteúdo deve preencher 75%+ do canvas** — nada de criativos com muito espaço vazio
4. **NUNCA recortar foto de dentro de outro criativo** — usar foto raw ou estilo tipográfico puro
5. **Design dark/premium** — fundo escuro, accent neon, tipografia forte
6. **Acentuação obrigatória** — verificar CADA palavra no criativo

---

## PASSO 4 — Criar Anúncios (Ads)

### Request

```bash
curl -X POST \
  "https://graph.facebook.com/v21.0/AD_ACCOUNT_ID/ads" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ad - NOME_DO_CRIATIVO",
    "adset_id": "ADSET_ID",
    "creative": {
      "object_story_spec": {
        "page_id": "PAGE_ID",
        "link_data": {
          "image_hash": "IMAGE_HASH",
          "link": "LP_URL_COM_UTMS",
          "message": "COPY_DO_ANUNCIO",
          "name": "HEADLINE",
          "description": "DESCRICAO",
          "call_to_action": {
            "type": "LEARN_MORE",
            "value": {
              "link": "LP_URL_COM_UTMS"
            }
          }
        }
      }
    },
    "status": "PAUSED",
    "access_token": "ACCESS_TOKEN"
  }'
```

### UTMs no Link do Ad

```
https://DOMINIO/LP_PATH?utm_source=facebook&utm_medium=cpc&utm_campaign=SLUG_CAMPANHA&utm_content=SLUG_CRIATIVO&utm_term=advantage-plus
```

| UTM | Valor |
|-----|-------|
| utm_source | `facebook` (SEMPRE, mesmo para Instagram) |
| utm_medium | `cpc` |
| utm_campaign | slug da campanha (ex: `captacao-desafio-v3`) |
| utm_content | slug do criativo (ex: `mesa-dinheiro-story`) |
| utm_term | `advantage-plus` ou nome do público |

### Regras Críticas dos Ads

| Regra | Detalhe |
|-------|---------|
| **CTA = LEARN_MORE** | Campeão validado, quase nunca alterar |
| **NUNCA usar instagram_actor_id** | Erro na API |
| **1 criativo por ad** | Criar 1 ad para cada criativo/ângulo |
| **Copy com acentos** | Verificar acentuação em TODO o texto |
| **Link com UTMs** | TODOS os ads com UTMs completas |

---

## PASSO 5 — Múltiplos Ads (Teste de Criativos)

Para testar múltiplos criativos na mesma campanha:

```
Campanha (CBO, budget único)
  └── AdSet (Advantage+, sem interesses)
       ├── Ad 1 — Criativo A (ângulo transformação)
       ├── Ad 2 — Criativo B (ângulo dor)
       ├── Ad 3 — Criativo C (ângulo oportunidade)
       ├── Ad 4 — Criativo D (variação visual)
       └── Ad 5 — Criativo E (variação copy)
```

**Regra:** 1 campanha, 1 adset, N ads. O algoritmo do Meta otimiza entregando mais para o melhor criativo.

---

## PASSO 6 — Auditoria Pós-Criação (Obrigatória)

### Checklist de 14 Itens

Após criar TODOS os componentes, verificar via API:

```bash
# Verificar campanha
curl "https://graph.facebook.com/v21.0/CAMPAIGN_ID?fields=name,status,objective,daily_budget,special_ad_categories,bid_strategy&access_token=TOKEN"

# Verificar adset
curl "https://graph.facebook.com/v21.0/ADSET_ID?fields=name,status,optimization_goal,targeting,promoted_object,billing_event&access_token=TOKEN"

# Verificar ads
curl "https://graph.facebook.com/v21.0/AD_ID?fields=name,status,creative{object_story_spec}&access_token=TOKEN"
```

| # | Item | Esperado | Como Verificar |
|---|------|----------|---------------|
| 1 | Status da campanha | PAUSED | Campo `status` |
| 2 | Objetivo | OUTCOME_LEADS | Campo `objective` |
| 3 | Budget correto (centavos) | Budget * 100 | Campo `daily_budget` |
| 4 | special_ad_categories | [] | Campo `special_ad_categories` |
| 5 | Otimização do adset | OFFSITE_CONVERSIONS | Campo `optimization_goal` |
| 6 | Pixel ID correto | ID informado | `promoted_object.pixel_id` |
| 7 | Evento correto | LEAD | `promoted_object.custom_event_type` |
| 8 | Idade 25-65 | 25 e 65 | `targeting.age_min/max` |
| 9 | País BR | ["BR"] | `targeting.geo_locations` |
| 10 | Plataformas | facebook + instagram | `targeting.publisher_platforms` |
| 11 | CTA = LEARN_MORE | LEARN_MORE | `creative.call_to_action.type` |
| 12 | UTMs no link | Presentes | `creative.link_data.link` |
| 13 | Copy com acentos | Sem erros | `creative.link_data.message` |
| 14 | instagram_actor_id AUSENTE | Não existe | Campo NÃO deve existir |

---

## PASSO 7 — Escalar Campanha Vencedora

### Regras de Escala (Validadas)

| Ação | Correto | Errado |
|------|---------|--------|
| Escalar campanha boa | **Duplicar a campanha inteira** | Aumentar budget (piora CPL) |
| Testar novo ângulo | Criar novo ad no adset existente | Criar nova campanha |
| Campanha com CPL ruim | Pausar após 2x o CPL alvo sem conversão | Esperar mais |
| Budget da duplicação | **Mesmo budget** da original | Budget maior |

### Duplicação via API

```bash
# Duplicar campanha inteira (mantém estrutura e budget)
curl -X POST \
  "https://graph.facebook.com/v21.0/CAMPAIGN_ID/copies" \
  -d "deep_copy=true" \
  -d "status_option=PAUSED" \
  -d "rename_options={\"rename_suffix\": \" - Cópia\"}" \
  -d "access_token=TOKEN"
```

---

## PASSO 8 — Ativar Campanha

Só ativar DEPOIS da auditoria passar em todos os 14 itens:

```bash
# Ativar campanha
curl -X POST \
  "https://graph.facebook.com/v21.0/CAMPAIGN_ID" \
  -d "status=ACTIVE" \
  -d "access_token=TOKEN"

# Ativar adset
curl -X POST \
  "https://graph.facebook.com/v21.0/ADSET_ID" \
  -d "status=ACTIVE" \
  -d "access_token=TOKEN"

# Ativar ads
curl -X POST \
  "https://graph.facebook.com/v21.0/AD_ID" \
  -d "status=ACTIVE" \
  -d "access_token=TOKEN"
```

---

## Resultado Final

Ao concluir, apresentar resumo:

```
CAMPANHA META ADS CRIADA E AUDITADA

Campanha: NOME (ID: 12345)
   - Objetivo: OUTCOME_LEADS
   - Budget: R$XX/dia
   - Status: PAUSED → ACTIVE

AdSet: NOME (ID: 67890)
   - Advantage+ 25-65 BR
   - Pixel: PIXEL_ID → Lead
   - Plataformas: Facebook + Instagram

Anúncios:
   - Ad 1: NOME (ID: 111) — Criativo A
   - Ad 2: NOME (ID: 222) — Criativo B
   - Ad 3: NOME (ID: 333) — Criativo C

Auditoria: 14/14 itens OK
UTMs: Configuradas em todos os ads
CTA: LEARN_MORE

Regras de gestão:
   - Escalar = DUPLICAR (nunca aumentar budget)
   - Pausar se CPL > 2x o alvo após R$XX gastos
   - Novos criativos = novos ads no mesmo adset
```
