---
name: proactive-ads
description: "Monitora performance de campanhas Meta Ads — identifica problemas de CPL, gasto sem conversão e sugere ações via Telegram"
---

# /proactive-ads — Monitoramento de Campanhas Meta Ads

## Objetivo

Verificar performance das campanhas Meta Ads ativas, identificar problemas (CPL alto, gasto sem conversão, fadiga de criativo), sugerir ações operacionais e notificar via Telegram quando necessário.

---

## Dados de Referência

| Parâmetro | Valor |
|-----------|-------|
| Pixel ID | ${PIXEL_ID} |
| Page ID | ${PAGE_ID} |
| CPL Alvo | R$ 5,00 |
| Budget Diário Referência | R$ 150-200/dia |
| Ad Account | (ler de ~/observations/ads-performance.md ou config MY GROWTH) |

### Limiares de Performance

| Métrica | BOM | ACEITÁVEL | RUIM | CRÍTICO |
|---------|-----|-----------|------|---------|
| CPL | < R$ 4,00 | R$ 4-5 | R$ 5-7 | > R$ 7,00 |
| CTR (link) | > 2,0% | 1,5-2,0% | 1,0-1,5% | < 1,0% |
| CPM | < R$ 15 | R$ 15-25 | R$ 25-40 | > R$ 40 |
| Frequência | < 2,0 | 2,0-3,0 | 3,0-4,0 | > 4,0 (fadiga) |
| Gasto sem conversão | — | — | > R$ 15 | > R$ 25 |

---

## Execução — Passo a Passo

### 1. Coletar Dados de Campanhas

Conectar via SSH na VPS MY GROWTH e consultar o banco de dados local (as campanhas são sincronizadas do Meta):

```bash
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'REMOTE'
cd /opt/my-growth
# Consultar campanhas ativas e métricas do dia
node -e "
const db = require('./src/database');
// Buscar campanhas ativas com métricas
db.query('SELECT * FROM campaigns WHERE status = \'ACTIVE\' ORDER BY spend DESC');
// Buscar métricas de adsets do dia
db.query('SELECT * FROM adset_insights WHERE date_start = CURRENT_DATE');
// Buscar métricas de ads do dia
db.query('SELECT * FROM ad_insights WHERE date_start = CURRENT_DATE');
"
REMOTE
```

**Se a consulta ao DB falhar**, usar a Meta Marketing API diretamente (via curl ou fetch MCP):

```
GET /{ad_account_id}/campaigns?fields=name,status,daily_budget,lifetime_budget&filtering=[{"field":"status","operator":"EQUAL","value":"ACTIVE"}]
GET /{ad_account_id}/insights?fields=spend,impressions,clicks,actions,cost_per_action_type,cpm,ctr&date_preset=today&level=campaign
```

### 2. Analisar Performance por Campanha

Para cada campanha ativa, calcular:

- **CPL** = Gasto / Leads (ação: `offsite_conversion.fb_pixel_lead`)
- **CTR** = Cliques no link / Impressões × 100
- **CPM** = (Gasto / Impressões) × 1000
- **Frequência** = Impressões / Alcance
- **Gasto sem conversão** = Gasto em adsets com 0 leads hoje

### 3. Comparar com Estado Anterior

Ler `~/observations/ads-performance.md` e identificar:

- **Tendência de CPL:** Subindo, estável ou caindo nos últimos 3 registros
- **Campanhas novas:** Adicionadas desde última verificação
- **Campanhas removidas/pausadas:** Desapareceram desde última verificação
- **Fadiga de criativo:** Frequência crescente + CTR decrescente

### 4. Classificar e Gerar Recomendações

#### Regras de Ação (baseadas no Playbook Sobral)

| Situação | Ação Recomendada |
|----------|-----------------|
| CPL < R$ 4 e gasto > R$ 30 | ESCALAR — duplicar campanha (não aumentar budget) |
| CPL R$ 4-5 e estável | MANTER — campanha saudável |
| CPL R$ 5-7 e subindo | ATENÇÃO — monitorar 24h, se piorar pausar |
| CPL > R$ 7 e gasto > R$ 20 | PAUSAR — CPL insustentável |
| Gasto > R$ 15 sem leads | PAUSAR — gasto sem retorno |
| Frequência > 3,0 | PAUSAR ou trocar criativos — fadiga |
| CTR < 1,0% e gasto > R$ 10 | PAUSAR — criativo fraco |
| Campanha < 3 dias | AGUARDAR — fase de aprendizado |

**REGRA CRÍTICA:** Nunca aumentar orçamento de campanha. Para escalar, DUPLICAR a campanha inteira.

### 5. Registrar Observações

Atualizar `~/observations/ads-performance.md`:

```markdown
# Ads Performance — Última verificação

**Timestamp:** YYYY-MM-DD HH:MM:SS
**Estado Geral:** SAUDÁVEL | ATENÇÃO | CRÍTICO
**Gasto Hoje:** R$ XX,XX
**Leads Hoje:** XX
**CPL Médio:** R$ X,XX

## Campanhas Ativas

| Campanha | ID | Budget/Dia | Gasto Hoje | Leads | CPL | CTR | Freq | Status |
|----------|----|-----------|------------|-------|-----|-----|------|--------|
| Nome | ID | R$ XX | R$ XX | X | R$ X | X% | X.X | BOM/ATENÇÃO/RUIM |

## Recomendações

| Campanha | Ação | Motivo | Prioridade |
|----------|------|--------|------------|
| Nome | ESCALAR/PAUSAR/MANTER | Descrição | ALTA/MÉDIA/BAIXA |

## Tendência (últimas 5 verificações)

| Data | Gasto | Leads | CPL | Observações |
|------|-------|-------|-----|-------------|
| DD/MM HH:MM | R$ XX | X | R$ X | — |
```

### 6. Notificar se Necessário

**Notificar via Telegram se:**
- Qualquer campanha com CPL > R$ 7 e gasto > R$ 20
- Gasto total do dia > 120% do budget planejado
- Campanha com gasto > R$ 25 sem leads
- Frequência > 4,0 (fadiga severa)
- Oportunidade de escala (CPL < R$ 4 consistente)

**Formato da notificação:**

```
📊 RELATÓRIO ADS — [SAUDÁVEL/ATENÇÃO/CRÍTICO]

⏰ [timestamp]
💰 Gasto hoje: R$ XX,XX | Leads: XX | CPL: R$ X,XX

🔴 Problemas:
• [campanha] — CPL R$ X,XX (acima do alvo)
• [campanha] — R$ XX gastos sem conversão

🟢 Destaques:
• [campanha] — CPL R$ X,XX — candidata a escala

📋 Ações sugeridas:
• PAUSAR: [campanha] — motivo
• ESCALAR: [campanha] — duplicar (NÃO aumentar budget)
• MONITORAR: [campanha] — aguardar 24h

📊 Detalhes: ~/observations/ads-performance.md
```

**Se tudo saudável:** Apenas registrar, sem notificação.

---

## Parâmetros

| Parâmetro | Descrição | Default |
|-----------|-----------|---------|
| --chat-id | Chat ID Telegram | (obrigatório 1ª vez) |
| --cpl-target | CPL alvo em reais | 5.00 |
| --force-notify | Notificar mesmo se saudável | false |
| --period | Período de análise | today |

---

## Frequência Recomendada

- **Cron:** A cada 2 horas (08:00 - 22:00)
- **Trigger:** `proactive-ads`
- **Horário crítico:** 12:00 e 18:00 (meio do dia e fechamento)

---

## Dependências

- Acesso SSH à VPS MY GROWTH (para consultar DB sincronizado)
- OU Meta Marketing API token configurado
- MCP Telegram ativo
- Diretório `~/observations/` existente
- Playbook Sobral (referência em memória: `playbook-trafego.md`)
