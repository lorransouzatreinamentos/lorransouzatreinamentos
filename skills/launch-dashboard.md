---
name: launch-dashboard
description: "Dashboard consolidado de evento — coleta dados de Meta Ads, MY GROWTH, WhatsApp Bot e Calendar. Métricas, projeções, análise 4 players, alertas proativos."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - WebFetch
  - mcp__claude_ai_Google_Calendar__gcal_list_events
---

# Launch Dashboard — Skill de Dashboard de Evento/Captação

## Contexto

**Marca:** DOMINA.IA — @your-handle
**MY GROWTH:** https://mygrowth.your-domain.com.br (módulo de captação)
**VPS:** `${VPS_IP}` — root — porta 22 — senha: `${VPS_PASSWORD}`
**DB:** `${DATABASE_URL_MYGROWTH}`
**Pixel Meta:** `${PIXEL_ID}`
**Page ID:** `${PAGE_ID}`

**Schema do módulo de captação:**
As tabelas no PostgreSQL seguem a convenção `lançamento_*` — porém no DB real o prefixo SQL é sem acento (padrão técnico). Ao montar queries, construir o prefixo dinamicamente via variável bash `PFX` para evitar ambiguidade.

---

## Regras Invioláveis

1. **SEMPRE usar acentos e cedilha** em todo output em português.
2. **Dashboards NUNCA chamam APIs externas em real-time** — dados vêm do DB local (padrão SYNC).
3. **Análise SEMPRE inclui recomendação dos 4 players** (Sobral, Hormozi, Manon, Motion).
4. **Alertas proativos** obrigatórios — nunca entregar só números sem diagnóstico.
5. **Projeções** usam taxa média dos últimos 3 dias (e não acumulado total).

---

## Comandos

```
/launch-dashboard                → dashboard completo do evento ativo
/launch-dashboard campanhas      → foco em campanhas Meta Ads
/launch-dashboard leads          → foco em leads e pipeline CRM
/launch-dashboard whatsapp       → foco em WhatsApp Bot e conversões
/launch-dashboard alertas        → apenas alertas e ações urgentes
```

---

## Fluxo Completo

### PASSO 1 — Coleta de Dados (via DB local na VPS)

#### 1A. Meta Ads (campanhas e leads)

```bash
# Via SSH na VPS — consultar tabelas do evento
ssh ${VPS_USER}@${VPS_IP} -p 22 << 'REMOTE'
cd /opt/my-growth

# Prefixo técnico das tabelas (sem acento no schema SQL)
PFX=$(echo "lançamento" | iconv -f utf-8 -t ascii//TRANSLIT)

# Leads captados
psql -U manychat -d manychat_db -t -A -c "
SELECT
  COUNT(*) as total_leads,
  COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as leads_hoje,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '3 days' THEN 1 END) as leads_3d,
  MIN(created_at)::date as primeiro_lead,
  MAX(created_at)::date as ultimo_lead
FROM ${PFX}_leads;
"

# Leads por dia (últimos 14 dias)
psql -U manychat -d manychat_db -t -A -c "
SELECT
  created_at::date as dia,
  COUNT(*) as leads,
  COUNT(CASE WHEN source ILIKE '%meta%' OR source ILIKE '%facebook%' THEN 1 END) as leads_meta,
  COUNT(CASE WHEN source ILIKE '%organic%' OR source IS NULL THEN 1 END) as leads_organico
FROM ${PFX}_leads
WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY dia ORDER BY dia;
"

# Leads por fonte/campanha
psql -U manychat -d manychat_db -t -A -c "
SELECT
  COALESCE(source, 'desconhecido') as fonte,
  COUNT(*) as total,
  ROUND(AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))/3600), 1) as intervalo_medio_h
FROM ${PFX}_leads
GROUP BY fonte ORDER BY total DESC LIMIT 20;
"

# Fichas preenchidas (engajamento)
psql -U manychat -d manychat_db -t -A -c "
SELECT
  COUNT(*) as total_fichas,
  COUNT(CASE WHEN nivel_ia IS NOT NULL THEN 1 END) as com_nivel,
  COUNT(CASE WHEN renda IS NOT NULL THEN 1 END) as com_renda,
  COUNT(CASE WHEN ocupacao IS NOT NULL THEN 1 END) as com_ocupacao
FROM ${PFX}_fichas;
"

# Presenças por aula (se disponível)
psql -U manychat -d manychat_db -t -A -c "
SELECT
  aula,
  COUNT(*) as presencas,
  COUNT(DISTINCT lead_id) as leads_unicos
FROM ${PFX}_presencas
GROUP BY aula ORDER BY aula;
" 2>/dev/null || echo "Tabela de presenças ainda inexistente"

REMOTE
```

#### 1B. WhatsApp Bot (mensagens e conversões)

```bash
ssh ${VPS_USER}@${VPS_IP} -p 22 << 'REMOTE'
cd /opt/whatsapp-bot

psql -U manychat -d manychat_db -t -A -c "
-- Mensagens enviadas pelo bot (broadcasts)
SELECT
  COUNT(*) as total_msgs_enviadas,
  COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as msgs_hoje,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as entregues,
  COUNT(CASE WHEN status = 'read' THEN 1 END) as lidas
FROM whatsapp_messages
WHERE direction = 'outgoing'
  AND created_at >= CURRENT_DATE - INTERVAL '14 days';
"

# Tags de conversão
psql -U manychat -d manychat_db -t -A -c "
SELECT
  tag,
  COUNT(*) as total
FROM whatsapp_contact_tags
WHERE tag IN ('bot', 'vip-closer', 'vip-link-enviado', 'comprou-vip')
GROUP BY tag;
"

# Contatos com interação recente
psql -U manychat -d manychat_db -t -A -c "
SELECT
  COUNT(DISTINCT phone) as contatos_ativos
FROM whatsapp_messages
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
"

REMOTE
```

#### 1C. Google Calendar (próximos eventos)

Usar MCP Google Calendar para buscar eventos:

```
gcal_list_events: próximos 7 dias, calendar principal
Filtrar por: "aula", "live", "desafio", "evento"
```

### PASSO 2 — Métricas Calculadas

Com os dados coletados, calcular:

```
MÉTRICAS CORE:
├── CPL médio geral = gasto_total / total_leads
├── CPL últimos 3 dias = gasto_3d / leads_3d
├── Budget gasto vs restante = gasto / budget_total
├── Dias restantes de captação = data_fim - hoje
├── Projeção de leads = leads_3d_média_diária × dias_restantes + leads_atuais
├── Taxa ficha = fichas_preenchidas / total_leads × 100
├── Taxa presença = presenças_aula1 / total_leads × 100
└── ROI projetado = (leads × taxa_conversão × ticket_médio - investimento) / investimento × 100

MÉTRICAS WHATSAPP:
├── Taxa de resposta = msgs_respondidas / msgs_enviadas × 100
├── Taxa VIP = vip_link_enviado / contatos_closer × 100
├── Conversão VIP = comprou_vip / vip_link_enviado × 100
└── Custo por VIP = gasto_total / total_vips

TENDÊNCIAS:
├── CPL tendência = comparar CPL 3d vs CPL 7d (subindo/descendo/estável)
├── Volume tendência = leads/dia últimos 3d vs 7d
└── Engajamento = fichas/dia tendência
```

### PASSO 3 — Análise 4 Players

Incluir SEMPRE na análise:

```markdown
### Diagnóstico dos Especialistas

**Pedro Sobral (Execução Brasil):**
- Nota da conta: X/10
- Frequência das campanhas: OK/ALERTA
- Recomendação: [escalar/pausar/duplicar/diversificar]
- Regra aplicável: [ex: "campanha com CPL abaixo da meta = duplicar, sem aumentar budget"]

**Alex Hormozi (Oferta e Unit Economics):**
- LTV projetado: R$X
- CAC atual: R$X
- LTV:CAC ratio: X:1 (ideal >= 3:1)
- Stack de valor percebido: R$X vs preço R$Y
- Recomendação: [ajustar oferta/preço/bônus]

**Brian Manon (Escala e Criativos):**
- Creative velocity: X novos criativos/semana
- Ângulos testados: X de Y possíveis
- Budget utilização: X% do potencial
- Recomendação: [novos ângulos/formatos/audiências]

**Motion (Dados e Iteração):**
- Fase do criativo: [teste/escala/fadiga]
- Próximo teste recomendado: [público/criativo/copy/LP]
- Hierarquia de impacto: [1.criativo 2.oferta 3.público 4.LP]
- Recomendação: [iteração específica baseada em dados]
```

### PASSO 4 — Alertas Proativos

Verificar automaticamente e alertar se:

| Condição | Severidade | Alerta |
|----------|-----------|--------|
| Budget restante < 20% e captação > 3 dias | CRÍTICO | "Budget acabando antes do fim — redistribuir ou recarregar" |
| CPL últimos 3d > CPL médio × 1.3 | ALTO | "CPL subindo 30%+ — revisar criativos e públicos" |
| Frequência > 2.5 em qualquer campanha | ALTO | "Frequência alta em {campanha} — audiência saturada" |
| Zero leads no dia | CRÍTICO | "Nenhum lead hoje — verificar campanhas ativas e pixel" |
| Aula ao vivo em < 24h | URGENTE | "Aula {N} amanhã às {hora} — verificar links, notificações, WhatsApp" |
| Taxa ficha < 30% | MÉDIO | "Poucos leads preenchendo ficha — revisar CTA pós-captura" |
| WhatsApp Bot offline | CRÍTICO | "Bot desconectado — reconectar imediatamente" |
| Taxa presença aula < 40% | ALTO | "Presença baixa — intensificar lembretes WhatsApp" |
| Nenhum criativo novo em 5+ dias | MÉDIO | "Risco de fadiga criativa — gerar novos criativos" |

### PASSO 5 — Output Final

Formato do resumo executivo (15-20 linhas):

```markdown
## Dashboard — {Nome do Evento}
**Data:** {hoje} | **Dia {N} de {total}** | **Fase:** {captação/aquecimento/abertura/carrinho}

### Números-Chave
| Métrica | Valor | Meta | Status |
|---------|-------|------|--------|
| Leads captados | {X} | {meta} | OK/Alerta/Crítico |
| CPL médio | R${X} | R${meta} | OK/Alerta/Crítico |
| Budget gasto | R${X} de R${total} | — | {X}% |
| Fichas preenchidas | {X} ({Y}%) | 50% | OK/Alerta/Crítico |
| Projeção final | {X} leads | {meta} | OK/Alerta/Crítico |

### Campanhas Ativas
| Campanha | CPL | Gasto/dia | Leads/dia | Status |
|----------|-----|-----------|-----------|--------|
| {nome} | R${X} | R${Y} | {Z} | Escalar/Manter/Pausar |

### Alertas
- CRÍTICO: {alerta crítico}
- MÉDIO: {alerta médio}

### Recomendações
1. {ação prioritária baseada nos dados + diagnóstico dos 4 players}
2. {segunda ação}
3. {terceira ação}

### Diagnóstico dos Especialistas
{ver PASSO 3}
```

---

## Tratamento de Erros

| Erro | Ação |
|------|------|
| SSH falhou | Retry 3x. Se persistir, reportar com dados disponíveis localmente. |
| Tabela inexistente | Pular métrica, marcar como "N/D" no dashboard. |
| Query timeout | Limitar a últimos 7 dias. Se persistir, últimos 3 dias. |
| Sem dados de campanha | Alertar: "Dados de campanha desatualizados — verificar sync Meta para DB". |
| Google Calendar indisponível | Pular seção de eventos. Alertar. |
| WhatsApp Bot offline | Marcar status como "OFFLINE" e incluir alerta crítico. |

---

## Observações

```bash
mkdir -p ~/observations
echo "[$(date)] launch-dashboard: relatório gerado — {total_leads} leads, CPL R${cpl}, dia {N}/{total}" >> ~/observations/launch-dashboard.log
```

---

## Configuração do Evento Ativo

Atualizar estes valores para cada novo evento:

```yaml
evento:
  nome: "Desafio O Mercado Invisível da IA"
  produto: "Desafio gratuito 5 dias"
  periodo_captacao:
    inicio: "2026-03-11"
    fim: "2026-03-22"
  periodo_aulas:
    inicio: "2026-03-23"
    fim: "2026-03-27"
    horario: "20:00 BRT"
  budget_total: 3000
  meta_leads: 480
  cpl_alvo: 5.00
  ticket_vip: 67.00
  lp: "https://desafio.your-domain.com.br/"
  pixel_id: "${PIXEL_ID}"
  page_id: "${PAGE_ID}"
```

**Nota:** Estes valores são referência do último evento. Atualizar conforme o evento ativo no momento da execução.
