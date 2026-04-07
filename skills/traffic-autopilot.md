---
description: "Autopiloto de tráfego pago — monitora campanhas Meta Ads, aplica regras Sobral/Hormozi/Manon/Motion, pausa/duplica automaticamente, notifica via Telegram"
allowed-tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "Agent", "mcp__plugin_telegram_telegram__reply"]
---

# /traffic-autopilot — Autopiloto de Tráfego Pago

> **Tipo:** Skill autocontida | **Agente padrão:** @aios-master
> **Trigger:** Comando `/traffic-autopilot` ou execução agendada via cron
> **Descrição:** Monitora campanhas Meta Ads, aplica regras Sobral, pausa/duplica automaticamente, notifica decisões estratégicas via Telegram

---

## Objetivo

Eliminar 14-21h/semana de gestão manual de campanhas Meta Ads. A skill coleta dados de performance, aplica regras operacionais validadas (Sobral, Hormozi, Manon, Motion), executa ações automáticas em campanhas que atingem critérios claros e solicita aprovação via Telegram para decisões estratégicas.

---

## Parâmetros de Entrada

| Parâmetro | Default | Descrição |
|-----------|---------|-----------|
| `cpl_meta` | `5.00` | CPL alvo em reais |
| `modo` | `auto` | `auto` (executa ações) ou `dry-run` (apenas relatório) |
| `periodo` | `hoje` | Período de análise: `hoje`, `48h`, `7d` |
| `campanha_id` | `todas` | ID específico ou `todas` |

---

## Execução

### Passo 1 — Coleta de Dados

#### Opção A: Via VPS MY GROWTH (SQLite sincronizado)

```bash
ssh ${VPS_USER}@${VPS_IP} "cd /opt/my-growth && sqlite3 database.sqlite3 \"
  SELECT
    c.campaign_id,
    c.name,
    c.status,
    c.daily_budget,
    c.effective_status,
    COALESCE(SUM(i.spend), 0) as spend,
    COALESCE(SUM(i.leads), 0) as leads,
    CASE WHEN COALESCE(SUM(i.leads), 0) > 0
      THEN ROUND(COALESCE(SUM(i.spend), 0) / SUM(i.leads), 2)
      ELSE 0 END as cpl,
    ROUND(AVG(i.ctr), 2) as ctr,
    ROUND(AVG(i.cpm), 2) as cpm,
    ROUND(AVG(i.frequency), 2) as frequency,
    COALESCE(SUM(i.impressions), 0) as impressions,
    COALESCE(SUM(i.reach), 0) as reach
  FROM campaigns c
  LEFT JOIN campaign_insights i ON c.campaign_id = i.campaign_id
  WHERE i.date_start >= date('now', '-2 days')
  GROUP BY c.campaign_id
  ORDER BY spend DESC;
\""
```

> **IMPORTANTE:** Antes de executar, verificar schema real com:
> ```bash
> ssh ${VPS_USER}@${VPS_IP} "cd /opt/my-growth && sqlite3 database.sqlite3 '.schema campaigns' && sqlite3 database.sqlite3 '.schema campaign_insights'"
> ```
> Nunca chutar nomes de colunas — SEMPRE consultar schema antes.

#### Opção B: Via Meta Marketing API (direta)

```bash
curl -G "https://graph.facebook.com/v21.0/${META_AD_ACCOUNT}/insights" \
  --data-urlencode "fields=campaign_id,campaign_name,spend,actions,ctr,cpm,frequency,impressions,reach" \
  --data-urlencode "level=campaign" \
  --data-urlencode "time_range={'since':'$(date -v-2d +%Y-%m-%d)','until':'$(date +%Y-%m-%d)'}" \
  --data-urlencode "filtering=[{'field':'campaign.effective_status','operator':'IN','value':['ACTIVE','PAUSED']}]" \
  --data-urlencode "access_token=$META_ACCESS_TOKEN"
```

> **Nota:** Token expira frequentemente. Se 401/190, renovar no Meta Business Suite.

#### Dados coletados por campanha:

| Campo | Uso |
|-------|-----|
| `campaign_id` | Identificação única |
| `name` | Nome legível |
| `status` / `effective_status` | ACTIVE, PAUSED, etc. |
| `daily_budget` | Budget diário configurado |
| `spend` | Gasto no período |
| `leads` | Conversões (Lead) |
| `cpl` | Custo por lead calculado |
| `ctr` | Click-through rate |
| `cpm` | Custo por mil impressões |
| `frequency` | Frequência média |
| `impressions` | Total de impressões |
| `reach` | Alcance único |

---

### Passo 2 — Classificação por Regras Sobral

Para cada campanha ATIVA, calcular o ratio `CPL / CPL_META` e classificar:

#### Tabela de Decisão Principal

| CPL vs Meta | Ratio | Classificação | Ação | Automática? |
|-------------|-------|---------------|------|-------------|
| CPL < 80% da meta | < 0.80 | **WINNER** | Candidata a duplicação | Sugestão via Telegram |
| CPL 80-100% da meta | 0.80 - 1.00 | **SAUDÁVEL** | Manter rodando | Nenhuma |
| CPL 100-130% da meta | 1.00 - 1.30 | **OBSERVAR** | Monitorar 24h | Nenhuma |
| CPL 130-200% da meta por 48h | 1.30 - 2.00 | **PAUSAR** | Pausar campanha | **SIM** |
| CPL > 200% da meta | > 2.00 | **PAUSAR IMEDIATO** | Pausar campanha | **SIM** |
| 0 leads com gasto > R$20 em 24h | — | **AD MORTO** | Pausar campanha | **SIM** |

#### Sinais Complementares

| Sinal | Limiar | Classificação | Ação |
|-------|--------|---------------|------|
| Frequência > 3.0 | > 3.0 | **FADIGA ALERTA** | Alertar via Telegram |
| Frequência > 3.5 | > 3.5 | **FADIGA CRÍTICA** | Pausar ou criar variação |
| CTR < 0.5% | < 0.5% | **CRIATIVO FRACO** | Considerar troca de hook/headline |
| CTR cai > 30% vs média 7d | queda > 30% | **FADIGA EMERGENTE** | Alertar + preparar variação |
| CPL sobe > 20% por 3 dias consecutivos | tendência | **DEGRADAÇÃO** | Alertar + avaliar pausa |
| CPM sobe sem mudança de budget | anômalo | **LEILÃO CARO** | Informativo |

#### Nota Sobral da Conta

Calcular automaticamente:

```
- CPL médio das ativas vs meta
- % de campanhas dentro da meta
- Diversificação de criativos (quantos ângulos diferentes)
- % de budget em winners vs testes
- Connect rate (leads / cliques na LP) se disponível

Score:
  8-10: CPL abaixo da meta, escala limpa, criativos diversificados
  6-7:  CPL próximo da meta, dependência de 1 criativo, fase de teste OK
  4-5:  CPL acima da meta, desperdício > 30% em testes ruins
  0-3:  Sem criativo validado, sem estrutura, queimando dinheiro
```

---

### Passo 3 — Execução de Ações Automáticas

#### Ações que NÃO precisam de confirmação (executar imediatamente):

| Condição | Ação | Comando |
|----------|------|---------|
| CPL > 2x meta (qualquer período) | PAUSAR | `curl -X POST "https://graph.facebook.com/v21.0/{campaign_id}" -d "status=PAUSED" -d "access_token=$TOKEN"` |
| CPL > 1.3x meta por 48h+ | PAUSAR | Mesmo acima |
| 0 leads + gasto > R$20 em 24h | PAUSAR | Mesmo acima |
| CPL > 3x meta | PAUSAR (regra autonomia lançamento) | Mesmo acima — decisão óbvia |
| Ad individual com 0 leads + > R$15 gastos | PAUSAR AD | `curl -X POST "https://graph.facebook.com/v21.0/{ad_id}" -d "status=PAUSED" -d "access_token=$TOKEN"` |

**Princípio de autonomia:** "Se o Sobral faria sem pensar duas vezes, a skill faz sem perguntar."

#### Registro obrigatório de TODA ação automática:

Append em `~/observations/ads-actions-log.md`:

```markdown
## [YYYY-MM-DD HH:MM] — Ação Automática

| Campo | Valor |
|-------|-------|
| Campanha | {nome} ({id}) |
| Ação | PAUSAR |
| Motivo | CPL R$XX.XX (meta R$5.00) — ratio {X.Xx} por {N}h |
| Métricas | Gasto: R$XX | Leads: X | CTR: X.X% | Freq: X.X |
| Regra aplicada | Sobral — CPL > 200% meta |
```

#### Notificação Telegram para ações automáticas:

Usar o plugin Telegram MCP (mcp__plugin_telegram_telegram):

```
⏸️ PAUSEI: {nome campanha}
CPL R${cpl} (meta R$${cpl_meta}) — ratio {ratio}x
Gasto: R${spend} | Leads: {leads} | Freq: {frequency}
Regra: {regra aplicada}
```

---

### Passo 4 — Sugestões que Precisam de Aprovação

Enviar via Telegram e aguardar resposta:

#### 4.1 Duplicar Winner

**Condição:** CPL < 80% da meta por 48h+

```
🔥 WINNER: {nome campanha}
CPL R${cpl} (meta R$${cpl_meta}) — {leads} leads em 48h
Candidata a DUPLICAÇÃO.

⚠️ Regras de duplicação:
- Duplicar campanha INTEIRA (não apenas ad set)
- NÃO aumentar budget (manter R${daily_budget}/dia)
- Espaçar 24h da última duplicação
- Se 2 duplicações falharem → público saturado → trocar ângulo

Duplicar? Responda SIM ou NÃO
```

**REGRA CRÍTICA:** Ao duplicar, NUNCA aumentar orçamento da cópia. Manter exatamente o mesmo budget da campanha original. Aumentar budget individual piora o CPL (validado 3x no Desafio MI).

#### 4.2 Escalar Budget

**Condição:** CPL consistentemente < meta por 72h+ e sem duplicação recente

```
📈 ESCALA: {nome campanha}
CPL R${cpl} estável por 72h | {leads} leads
Budget atual: R${budget_atual}/dia

Opções:
A) Duplicar campanha (recomendado Sobral)
B) Aumentar 20% → R${budget_novo}/dia (máximo Manon)
C) Manter como está

Responda A, B ou C
```

> **Nota Manon:** Máximo 20% de aumento a cada 24-48h. Aumentos maiores resetam o aprendizado do algoritmo. Advantage+ tolera até 30%.

#### 4.3 Criar Novo Criativo / Ângulo

**Condição:** Frequência > 3.0 em winner ou CTR caindo > 30%

```
⚠️ FADIGA: {nome campanha}
Frequência: {frequency} (limite 3.0) | CTR caiu {X}%
Ângulo atual: "{ângulo}"

Recomendação Motion:
1. Primeiro: testar nova variação VISUAL do mesmo ângulo
2. Se 2 variações falharem: trocar o ângulo completamente

Criar variação do criativo? Responda SIM ou NÃO
```

#### 4.4 Religar Campanha (SEMPRE pedir confirmação)

```
🚫 NUNCA religar campanha pausada — regra Sobral.
Para reativar o público de {nome campanha}, devo:
→ DUPLICAR do zero com mesma configuração

Confirma duplicação? Responda SIM ou NÃO
```

---

### Passo 5 — Relatório Consolidado (Análise 4 Players)

Gerar relatório completo com perspectiva de cada especialista:

```markdown
# RELATÓRIO TRAFFIC AUTOPILOT — [DD/MM/AAAA HH:MM]

## Resumo Executivo

| Métrica | Valor | Meta | Status |
|---------|-------|------|--------|
| Gasto total (período) | R$XXX | R$XXX | ✅/⚠️/❌ |
| Leads totais | XXX | XXX | ✅/⚠️/❌ |
| CPL médio (ativas) | R$X.XX | R$X.XX | ✅/⚠️/❌ |
| Budget restante | R$XXX | — | — |
| Campanhas ativas | X | — | — |
| Winners | X | — | — |
| Pausadas hoje | X | — | — |

## Nota Sobral da Conta: X.X/10

[Justificativa em 2-3 linhas]

## Campanhas — Status Individual

| Campanha | CPL | Leads | Gasto | Class. | Ação |
|----------|-----|-------|-------|--------|------|
| ... | ... | ... | ... | WINNER/SAUDÁVEL/OBSERVAR/PAUSAR | ... |

## Análise dos 4 Players

### Pedro Sobral — Execução e Escala
- **Nota da conta:** X/10
- **Diagnóstico:** [análise direta sobre CPL, escala, timing de decisões]
- **Ação prática:** [o que Sobral faria agora]
- **Escala:** [duplicar quem? pausar quem? quanto tempo esperar?]

### Alex Hormozi — Oferta e Unit Economics
- **LTV vs CAC:** [se CPL = R$X e produto = R$Y, precisa Z leads para 1 venda]
- **ROAS projetado:** [cálculo: leads × taxa conversão × ticket / gasto total]
- **Oferta:** [a oferta está forte o suficiente? Grand Slam Offer check]
- **Follow-up:** [sequência de 5 toques está ativa? Show-up rate?]

### Brian Manon — Creative Velocity e Escala
- **Criativos novos/semana:** [atual vs recomendado para o budget]
- **Variações ativas:** [quantidade vs recomendado]
- **Fadiga detectada:** [quais criativos estão morrendo]
- **Canibalização:** [se CPL sobe em TODAS as duplicações = público saturado]
- **Próximo teste:** [o que testar: headline, imagem, formato?]

### Motion — Hierarquia de Impacto
- **Fase atual:** [Pre-Flight / Competitive / Scaling]
- **Hierarquia:** Oferta > Ângulo > Formato > Copy > Design
- **Próximo teste de maior impacto:** [o que mover na hierarquia]
- **Winners confirmados:** [CTR > 1% E CPL < meta = aprovado]

## Ações Executadas (automáticas)

| Hora | Campanha | Ação | Motivo |
|------|----------|------|--------|
| ... | ... | ... | ... |

## Ações Pendentes (aguardando aprovação)

| # | Campanha | Ação Sugerida | Motivo |
|---|----------|---------------|--------|
| 1 | ... | DUPLICAR | CPL R$X.XX winner por 48h |
| 2 | ... | CRIAR VARIAÇÃO | Frequência X.X |
```

---

### Passo 6 — Registro em ~/observations/

#### 6.1 Registro de performance: `~/observations/ads-performance.md`

Append com timestamp:

```markdown
---
## [YYYY-MM-DD HH:MM] — Traffic Autopilot

**Nota Sobral:** X.X/10 | **CPL médio:** R$X.XX | **Leads:** X | **Gasto:** R$X.XX
**Winners:** X campanhas | **Pausadas:** X campanhas | **Em observação:** X

| Campanha | CPL | Leads | Status | Ação |
|----------|-----|-------|--------|------|
| ... | ... | ... | ... | ... |

**Tendência 7d:** CPL [subindo/estável/caindo] | Leads/dia [subindo/estável/caindo]
```

#### 6.2 Registro de ações: `~/observations/ads-actions-log.md`

Cada ação automática ou aprovada é registrada conforme formato do Passo 3.

---

## Regras Operacionais Completas (Referência)

### Regras de Escala (Sobral)

1. **DUPLICAR campanha inteira** — nunca aumentar budget individual
2. **Espaçar duplicações:** mínimo 24h entre cada
3. **Se 2 duplicações falharem:** público saturado — trocar ângulo/criativo
4. **Nunca religar campanha pausada** — duplicar do zero
5. **Budget da cópia = budget da original** — NÃO aumentar ao duplicar

### Regras de Pausa

1. **CPL > 2x meta por 24h:** PAUSA imediata
2. **CPL > meta + 30% por 48h:** PAUSA
3. **Frequência > 3.5:** criativo cansando, pausar ou criar variação
4. **0 leads em 24h com > R$20 gasto:** PAUSA (ad morto)
5. **CTR < 0.5%:** trocar hook/headline
6. **Nunca religar campanha pausada** — sempre duplicar do zero

### Regras de Análise

- **Monitorar 2x/dia** (11h e 18h)
- **Connect Rate < 70%:** checar velocidade da LP
- **Mínimo 5-6 ads ativos** na reta final de lançamento
- **Diversificar ângulos ANTES do criativo fadigar** (não esperar morrer)
- **Mesmo winner absoluto morre** se rodar 10+ dias em muitas campanhas
- **Manter 2-3 ângulos diferentes** rodando simultaneamente
- **Ângulo de ganância/dinheiro** é universalmente forte para captação gratuita

### Regras de Criação de Campanha (Meta API)

1. **LP sempre /v3** (ou versão validada mais recente) — não perguntar
2. **CTA sempre LEARN_MORE** — não usar SIGN_UP, SUBSCRIBE, APPLY_NOW
3. **NÃO usar instagram_actor_id** — Meta resolve via Page vinculada
4. **Start time = AGORA** em lançamento ativo — nunca agendar para amanhã sem motivo
5. **UTMs obrigatórios:** `utm_source=meta_ads&utm_medium=cpc&utm_campaign={versão}&utm_content={peça}`
6. **Consultar schema do DB ANTES** de inserir qualquer dado — nunca chutar nomes de colunas
7. **Ao copiar campanha anterior:** validar TODOS os campos (LP, CTA, valores, datas, nomes)
8. **bid_strategy LOWEST_COST_WITHOUT_CAP** na campanha, não no adset
9. **Advantage+ sem interesses** é mais seguro que targeting com interest IDs

### Regras de Autonomia em Lançamento

**Fazer sem perguntar:**
- Start time = agora
- Pausar campanhas com CPL > 3x meta
- Pausar ads com 0 leads e > R$15 gastos
- LP sempre /v3
- Upload automático para MY GROWTH

**Pedir confirmação:**
- Aumentar budget total além do combinado
- Criar ângulo completamente novo (vs variação do winner)
- Pausar campanhas que estão DENTRO da meta
- Mudar página de destino para URL diferente
- Qualquer ação irreversível na conta de ads

### Transição de Ângulos

- Diversificar ângulos PROATIVAMENTE a partir do dia 5-7
- Manter 2-3 ângulos diferentes rodando simultaneamente
- Ângulo não é criativo — variar execução visual mantendo o mesmo ângulo funciona melhor
- Primeiro: testar nova variação VISUAL do mesmo ângulo (Motion Fase 2)
- Se 2 variações falharem: trocar o ângulo completamente

### Creative Velocity (Manon)

| Budget Mensal | Criativos Novos/Semana | Variações/Semana |
|---------------|----------------------|------------------|
| < R$5K | 2-3 | 4-6 |
| R$5K-R$20K | 5-8 | 10-15 |
| R$20K-R$100K | 10-15 | 20-30 |
| > R$100K | 15-25 | 30-50 |

### Sinais de Fadiga de Criativo (Manon)

1. CPL sobe > 20% em 3 dias consecutivos
2. CTR cai > 30% vs média histórica
3. Frequência > 3.5 no período
4. CPM sobe sem mudança de budget

**Ação:** Não pausar imediatamente. Primeiro testar nova variação do mesmo ângulo. Se 2 variações falharem, trocar o ângulo.

### Framework Motion — 3 Fases de Teste

| Fase | Objetivo | Budget | Tempo | Métrica |
|------|----------|--------|-------|---------|
| Pre-Flight | Validar conceito | R$10-20/dia | 48-72h | CTR + CPL |
| Competitive | Encontrar melhor execução | 2-3x Fase 1 | 5-7 dias | Top 2-3 variações |
| Scaling | Maximizar resultado | Duplicar winners | Até fadiga | CPL < meta |

**Hierarquia de impacto em performance:**
1. **Oferta** (maior impacto)
2. **Ângulo/Hook**
3. **Formato** (vídeo vs imagem vs carrossel)
4. **Copy** (headline + body text)
5. **Design/Execução** (menor impacto)

**Sempre testar conceitos/ângulos ANTES de variações visuais.**

### Hormozi — Unit Economics

**Fórmula Grand Slam Offer:**
```
Valor = (Resultado Sonhado × Probabilidade Percebida) ÷ (Tempo × Esforço)
```

**Follow-up 5 toques pós-lead:**
1. Imediato: Confirmação + entrega do lead magnet
2. D+1: Conteúdo de valor relacionado
3. D+2: Case/prova social
4. D+3: Objeção principal respondida
5. D+5: Oferta com urgência

---

## Modos de Execução

### Modo `auto` (padrão)

Executa Passos 1-6 completos. Pausa campanhas que atingem critérios, envia sugestões via Telegram, gera relatório, registra em ~/observations/.

### Modo `dry-run`

Executa Passos 1-2 e 5-6. Não executa ações reais (Passo 3). Apenas classifica, gera relatório e registra. Útil para revisar antes de ativar modo auto.

### Modo `report-only`

Apenas Passos 1 e 5. Coleta dados e gera relatório consolidado sem classificação de ações.

---

## Agendamento Recomendado

| Horário | Modo | Objetivo |
|---------|------|----------|
| 11:00 | `auto` | Check matinal — pausar mortos da madrugada |
| 18:00 | `auto` | Check vespertino — avaliar performance do dia |
| 23:00 | `dry-run` | Relatório noturno — preparar decisões do dia seguinte |

---

## Dependências

| Recurso | Obrigatório? | Fallback |
|---------|-------------|----------|
| SSH para VPS (${VPS_IP}) | Sim (Opção A) | Meta Marketing API (Opção B) |
| Meta Marketing API token | Sim (Opção B) | Dados do DB local |
| Plugin Telegram MCP | Sim (notificações) | Registrar em ~/observations/ sem notificar |
| ~/observations/ | Sim | Criar diretório se não existir |

---

## Checklist Pré-Execução

```
[ ] VPS acessível via SSH OU token Meta API válido
[ ] Plugin Telegram MCP conectado
[ ] Diretório ~/observations/ existe
[ ] CPL meta definido (default R$5.00)
[ ] Modo selecionado (auto/dry-run/report-only)
```
