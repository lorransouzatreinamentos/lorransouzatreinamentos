---
name: campaign-builder
description: "Builder de campanhas Meta Ads com validação pré-envio — elimina erros de parâmetros, aplica checklist de 12 itens automaticamente"
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

# Campaign Builder — Skill de Criação de Campanhas Meta Ads

## Propósito

Automatizar a criação de campanhas Meta Ads via API com validação pré-envio de TODOS os parâmetros. Elimina os 2-3h/semana perdidos com erros de parâmetros incorretos.

**Input:** Briefing em 1 linha do CEO
**Output:** Campanha criada, validada, registrada no MY GROWTH e pronta para ativação

---

## PASSO 1 — Interpretar Briefing

O CEO fornece um briefing simples. Interpretar e preencher TODOS os parâmetros automaticamente.

### Exemplos de Briefing

| Briefing | Interpretação |
|----------|--------------|
| "3 criativos, R$30/dia, público aberto" | Nova campanha, 1 adset Advantage+ sem interesses, 3 ads, CBO R$30 |
| "Duplicar V3 Cópia³ com novos criativos" | Buscar estrutura da V3 Cópia³, copiar config, trocar criativos |
| "Campanha de retargeting, R$20/dia, visitantes LP" | Retargeting custom audience, R$20 CBO |
| "Testar 5 ângulos novos, R$25/dia" | 1 campanha, 1 adset, 5 ads com criativos diferentes |
| "Escalar V5 Variações" | Duplicar campanha INTEIRA (NUNCA aumentar budget) |

### Regras de Interpretação

1. Se não especificou LP → usar `/v3` (SEMPRE a versão atual)
2. Se não especificou CTA → usar `LEARN_MORE`
3. Se não especificou público → Advantage+ aberto 25-65 BR
4. Se não especificou budget → R$30/dia (padrão teste)
5. Se não especificou start → hoje, 5 minutos a partir de agora
6. Se disse "escalar" → DUPLICAR campanha inteira, NUNCA aumentar budget
7. Se disse "duplicar" → copiar estrutura completa, manter mesmo budget

---

## PASSO 2 — Pré-Validação (Checklist de 12 Itens)

**ANTES de enviar QUALQUER request para a API, validar TODOS os itens abaixo.**

### Checklist Obrigatório

| # | Parâmetro | Valor Correto | Erro Comum | Validação |
|---|-----------|--------------|------------|-----------|
| 1 | **LP URL** | `https://desafio.your-domain.com.br/v3` | Usar `/` ou `/v2` ou versão antiga | DEVE terminar em `/v3` (ou versão atual confirmada) |
| 2 | **CTA** | `LEARN_MORE` | `SIGN_UP`, `SUBSCRIBE`, `APPLY_NOW` | SEMPRE `LEARN_MORE` — único que performa |
| 3 | **instagram_actor_id** | **NÃO INCLUIR** | Incluir e quebrar a criação | Campo PROIBIDO — Meta resolve via Page vinculada |
| 4 | **start_time** | Hoje ISO 8601 (`-0300`) | Data no passado ou futuro distante | Default: 5 min a partir de agora. Só futuro se CEO pedir |
| 5 | **objective** | `OUTCOME_LEADS` | Outros objectives | ÚNICO objetivo usado |
| 6 | **optimization_goal** | `OFFSITE_CONVERSIONS` | `LEAD_GENERATION` (conflita com OUTCOME_LEADS) | NUNCA usar LEAD_GENERATION |
| 7 | **billing_event** | `IMPRESSIONS` | `LINK_CLICKS` | SEMPRE impressions com CBO |
| 8 | **bid_strategy** | `LOWEST_COST_WITHOUT_CAP` | Manual bid, bid cap | Setar na CAMPANHA, nunca no adset |
| 9 | **targeting age** | `25-65` | Range customizado | Advantage+ EXIGE 25-65, rejeita faixas customizadas |
| 10 | **Advantage+** | `targeting_automation.advantage_audience: 1` | `targeting_optimization` (parâmetro errado) | Campo correto = `targeting_automation` |
| 11 | **UTMs** | `utm_source=meta_ads&utm_medium=cpc&utm_campaign=...&utm_content=...` | Links sem UTMs | NUNCA gerar link sem UTMs |
| 12 | **daily_budget** | Em CENTAVOS na campanha | Em reais, ou no adset | R$30 = `3000`. SEMPRE na campanha (CBO) |

### Validações Adicionais

| Validação | Regra |
|-----------|-------|
| `special_ad_categories` | Usar `json.dumps([])` — NÃO string vazia |
| `promoted_object` | `json.dumps({'pixel_id': PIXEL_ID, 'custom_event_type': 'LEAD'})` |
| Form data | Usar `requests.post(data=...)` — NUNCA `json=` (causa erros silenciosos) |
| Interest IDs | Validar via `GET /search?type=adinterest` ANTES de usar |
| Token | Verificar se ainda válido antes de criar (tokens duram ~3-6h) |
| Schema DB | Consultar `information_schema.columns` ANTES de inserir no MY GROWTH |

### Se qualquer item falhar na validação → PARAR e corrigir antes de continuar.

---

## PASSO 3 — Constantes e IDs

### IDs Fixos (verificados)

```python
API = 'https://graph.facebook.com/v21.0'
PIXEL_ID = '${PIXEL_ID}'
CONVERSION_ID = '${CONVERSION_ID}'
PAGE_ID = '${PAGE_ID}'
AD_ACCOUNT = '${META_AD_ACCOUNT}'
LP_BASE = 'https://desafio.your-domain.com.br/v3'
```

### Interest IDs Validados

```python
INTERESTS = {
    'Empreendedorismo': '6003371567474',
    'Pequenas e médias empresas': '6003136069408',
    'Negócios': '6003402305839',
    'Marketing digital': '6003127206524',
    'Freelancer': '6003374632277',
}
```

**IMPORTANTE:** IDs de interesse podem expirar. Sempre validar via API antes de usar:
```python
requests.get(f'{API}/search', params={
    'access_token': token,
    'type': 'adinterest',
    'q': 'Empreendedorismo',
    'limit': 5,
    'locale': 'pt_BR',
})
```

---

## PASSO 4 — Criação em 6 Etapas

### Etapa 1: Criar Campanha (status PAUSED)

```python
campaign_data = {
    'access_token': token,
    'name': nome_campanha,           # Ex: "V14 Teste Ângulos Novos"
    'objective': 'OUTCOME_LEADS',
    'status': 'PAUSED',              # SEMPRE paused primeiro
    'special_ad_categories': json.dumps([]),
    'daily_budget': str(budget_centavos),  # R$30 = '3000'
    'bid_strategy': 'LOWEST_COST_WITHOUT_CAP',
}
response = requests.post(f'{API}/{AD_ACCOUNT}/campaigns', data=campaign_data)
campaign_id = response.json()['id']
```

**NÃO incluir:** `is_adset_budget_sharing_enabled` (conflita com CBO)

### Etapa 2: Criar AdSet (herda budget da campanha)

```python
# Montar UTMs
utms = f'utm_source=meta_ads&utm_medium=cpc&utm_campaign={versao}-{periodo}&utm_content={peca}'
lp_url = f'{LP_BASE}?{utms}'

# Calcular start_time (5 min a partir de agora)
from datetime import datetime, timedelta, timezone
tz = timezone(timedelta(hours=-3))
start = (datetime.now(tz) + timedelta(minutes=5)).strftime('%Y-%m-%dT%H:%M:%S%z')

adset_data = {
    'access_token': token,
    'name': nome_adset,              # Ex: "AS | V14 | Aberto 25-65 BR | Advantage+"
    'campaign_id': campaign_id,
    'billing_event': 'IMPRESSIONS',
    'optimization_goal': 'OFFSITE_CONVERSIONS',
    'promoted_object': json.dumps({
        'pixel_id': PIXEL_ID,
        'custom_event_type': 'LEAD',
    }),
    'targeting': json.dumps({
        'age_min': 25,
        'age_max': 65,
        'geo_locations': {
            'countries': ['BR'],
            'location_types': ['home', 'recent'],
        },
        'targeting_automation': {'advantage_audience': 1},
        # flexible_spec com interesses é OPCIONAL — Advantage+ usa como sugestão
    }),
    'start_time': start,
    'status': 'PAUSED',
    # NÃO colocar daily_budget aqui (CBO)
    # NÃO colocar bid_strategy aqui (fica na campanha)
}
response = requests.post(f'{API}/{AD_ACCOUNT}/adsets', data=adset_data)
adset_id = response.json()['id']
```

### Etapa 3: Criar Ads (1 por criativo)

```python
for criativo in criativos:
    ad_data = {
        'access_token': token,
        'name': criativo['nome'],    # Ex: "V14 | Ângulo Mesa de Dinheiro"
        'adset_id': adset_id,
        'status': 'PAUSED',
        'creative': json.dumps({
            'object_story_spec': {
                'page_id': PAGE_ID,
                # NÃO incluir instagram_actor_id
                'link_data': {
                    'link': lp_url,
                    'image_hash': criativo['image_hash'],
                    'message': criativo['texto'],
                    'name': criativo['headline'],
                    'description': criativo['link_description'],
                    'call_to_action': {
                        'type': 'LEARN_MORE',   # SEMPRE LEARN_MORE
                        'value': {'link': lp_url},
                    },
                },
            },
        }),
        'tracking_specs': json.dumps([{
            'action.type': ['offsite_conversion'],
            'fb_pixel': [PIXEL_ID],
        }]),
    }
    response = requests.post(f'{API}/{AD_ACCOUNT}/ads', data=ad_data)
```

### Etapa 4: Registrar no MY GROWTH DB

```bash
# PRIMEIRO: consultar schema
ssh ${VPS_USER}@${VPS_IP} "cd /opt/my-growth && sqlite3 database.db \".schema traffic_campaigns\""

# DEPOIS: inserir com campos corretos do schema
ssh ${VPS_USER}@${VPS_IP} "cd /opt/my-growth && sqlite3 database.db \"INSERT INTO traffic_campaigns (...) VALUES (...)\""
```

**REGRA:** Sempre consultar schema ANTES. `traffic_creatives` usa `uploaded_at` (NÃO `created_at`).

### Etapa 5: Apresentar Resumo para Aprovação

Antes de ativar, mostrar ao CEO:

```markdown
## Campanha Criada (PAUSADA)

| Item | Valor |
|------|-------|
| Nome | V14 Teste Ângulos Novos |
| Campaign ID | 120243XXXXXXXXX |
| Budget | R$30/dia (CBO) |
| AdSet | 1x Advantage+ 25-65 BR |
| Ads | 3 criativos |
| LP | https://desafio.your-domain.com.br/v3?utm_source=... |
| CTA | Saiba Mais (LEARN_MORE) |
| Start | 24/03/2026 00:05h |
| Pixel | ${PIXEL_ID} |

### Criativos
1. V14-A Mesa de Dinheiro — image_hash: abc123
2. V14-B Pergunta Provocativa — image_hash: def456
3. V14-C Urgência Countdown — image_hash: ghi789

**Ativar agora?** (sim/não)
```

### Etapa 6: Ativar Campanha (após aprovação)

```python
# Ativar na ordem: campanha → adset → ads
requests.post(f'{API}/{campaign_id}', data={
    'access_token': token,
    'status': 'ACTIVE',
})
requests.post(f'{API}/{adset_id}', data={
    'access_token': token,
    'status': 'ACTIVE',
})
for ad_id in ad_ids:
    requests.post(f'{API}/{ad_id}', data={
        'access_token': token,
        'status': 'ACTIVE',
    })
```

---

## PASSO 5 — Duplicação de Campanhas (Escala)

### Regras Absolutas de Duplicação

1. **NUNCA aumentar budget** — duplicar campanha inteira com MESMO budget
2. **Duplicar CAMPANHA INTEIRA** — não só adset
3. **O endpoint `/copies` NÃO funciona com Advantage+** — criar manualmente
4. **Nomenclatura:** `{Nome Original} Cópia{N}` (ex: "V5 Variações Cópia²")
5. **Agendar:** start_time para 00:05h do dia seguinte
6. **Esperar 48h** antes de avaliar performance da cópia

### Fluxo de Duplicação

```
1. Buscar config da campanha original via API
2. Buscar adsets e ads da campanha
3. Criar nova campanha com MESMOS parâmetros (status PAUSED)
4. Criar novo adset com MESMA targeting
5. Criar novos ads com MESMOS criativos (ou novos se especificado)
6. Registrar no MY GROWTH
7. Apresentar resumo
8. Ativar após aprovação
```

---

## PASSO 6 — Tratamento de Erros

### Erros Conhecidos e Correção Automática

| Código/Mensagem | Causa | Correção Automática |
|-----------------|-------|---------------------|
| `Invalid parameter` em special_ad_categories | String em vez de json.dumps | Corrigir para `json.dumps([])` e reenviar |
| `is_adset_budget_sharing_enabled required` | Sem budget na campanha nem adset | Adicionar `daily_budget` na campanha e reenviar |
| `Cannot use bid_strategy without budget` | bid_strategy sem daily_budget | Combinar ambos na campanha e reenviar |
| `Cannot use performance goal with campaign objective` | LEAD_GENERATION com OUTCOME_LEADS | Trocar para OFFSITE_CONVERSIONS e reenviar |
| `age_min cannot be more than 25` | Idade customizada com Advantage+ | Resetar para 25-65 e reenviar |
| `Interest ID invalid` | ID expirado ou inválido | Buscar novo ID via search endpoint e reenviar |
| `Session expired` / `OAuthException` | Token expirado | **NÃO pode corrigir** — avisar CEO para renovar token |
| `429 Too Many Requests` | Rate limit | Cooldown global 5 min, parar TUDO |
| Erro desconhecido | — | **NÃO retransmitir erro raw** — interpretar e explicar em português |

### Protocolo de Erro

```
1. API retorna erro
2. Verificar se está na tabela acima
3. SIM → corrigir automaticamente e reenviar (máx 2 tentativas)
4. NÃO → interpretar o erro e explicar ao CEO:
   - O que deu errado (em português simples)
   - Por que aconteceu
   - Como resolver
5. NUNCA mostrar JSON de erro cru da API
```

---

## PASSO 7 — Regras de Ouro (Consolidadas)

### Parâmetros que NUNCA mudam

| Parâmetro | Valor Fixo | Motivo |
|-----------|-----------|--------|
| objective | OUTCOME_LEADS | Único objetivo usado |
| optimization_goal | OFFSITE_CONVERSIONS | Compatível com OUTCOME_LEADS |
| billing_event | IMPRESSIONS | Padrão CBO |
| bid_strategy | LOWEST_COST_WITHOUT_CAP | Sem cap, na campanha |
| age_min/max | 25 / 65 | Advantage+ exige |
| CTA | LEARN_MORE | Único que performa |
| LP | /v3 | Converte 3x mais |
| Pixel | ${PIXEL_ID} | Fixo |
| Page | ${PAGE_ID} | Fixo |
| Form data | `data=` (NÃO `json=`) | API Meta exige form-encoded |

### Parâmetros que NUNCA incluir

| Parâmetro | Motivo |
|-----------|--------|
| `instagram_actor_id` | Quebra a criação — Meta resolve via Page |
| `daily_budget` no adset (com CBO) | Conflita com CBO na campanha |
| `bid_strategy` no adset | Deve ficar na campanha |
| `is_adset_budget_sharing_enabled` | Conflita com CBO |
| `targeting_optimization` | Parâmetro errado — usar `targeting_automation` |

### Regras Operacionais

1. **Escalar = duplicar** — NUNCA aumentar budget
2. **Duplicar campanha INTEIRA** — não só adset
3. **CPL > R$7 por 2 dias → PAUSA**
4. **Frequência > 3.5 → PAUSA** (fadiga criativa)
5. **NÃO religar pausadas** — duplicar do zero
6. **Manter pelo menos 1 campanha ativa** (nota da conta)
7. **Esperar 48h** antes de decidir sobre nova campanha
8. **Ao copiar estrutura** — validar TODOS os campos (LP, CTA, datas, valores)

---

## Integração com Outras Skills

| Skill | Quando Usar |
|-------|-------------|
| `/ad-creative` | Antes de criar ads — gerar os criativos visuais |
| `/paid-ads` | Após criar — monitorar performance e decidir escala/pausa |
| `/copywriting` | Para textos dos ads (message, headline, description) |

---

## Fluxo Completo Resumido

```
CEO: "3 criativos, R$30/dia, público aberto"
    ↓
[1] INTERPRETAR → Nova campanha, 1 adset Advantage+, 3 ads, R$30 CBO
    ↓
[2] PRÉ-VALIDAR → Checklist 12 itens (LP /v3? CTA LEARN_MORE? sem IG actor? ...)
    ↓
[3] CRIAR CAMPANHA → POST /campaigns (PAUSED, CBO R$3000 centavos)
    ↓
[4] CRIAR ADSET → POST /adsets (OFFSITE_CONVERSIONS, Advantage+ 25-65 BR)
    ↓
[5] CRIAR ADS → POST /ads x3 (LEARN_MORE, image_hash, tracking_specs)
    ↓
[6] REGISTRAR → MY GROWTH DB (consultar schema antes)
    ↓
[7] RESUMO → Mostrar tudo ao CEO para aprovação
    ↓
[8] ATIVAR → campanha → adset → ads (nesta ordem)
    ↓
[9] CONFIRMAR → "Campanha V14 ativa com 3 criativos, R$30/dia"
```
