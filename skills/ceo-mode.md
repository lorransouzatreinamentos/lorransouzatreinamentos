---
name: ceo-mode
description: "Protocolo de autonomia dos agentes — define o que executar sozinho, o que notificar, e o que consultar. Transforma o CEO de operador para estrategista."
---

# /ceo-mode — Protocolo de Autonomia Operacional

> **Tipo:** Skill de governança | **Aplica-se a:** Todos os agentes
> **Trigger:** `/ceo-mode` ou referência automática por qualquer skill
> **Princípio:** Agentes trabalham PARA o CEO, não pedem permissão AO CEO.

## Filosofia

O CEO define regras. Os agentes executam dentro das regras. O CEO só intervém em decisões estratégicas, irreversíveis ou de alto impacto financeiro. Toda ação que segue uma regra já validada é executada sem perguntar.

**Inversão de paradigma:**
- ANTES: Agente sugere → CEO aprova → Agente executa
- AGORA: Agente executa → CEO é notificado (se necessário) → CEO intervém (se quiser)

---

## 1. MATRIZ DE AUTONOMIA (3 Níveis)

### NÍVEL 1: EXECUÇÃO AUTÔNOMA (sem perguntar)

Ações 100% determinísticas, baseadas em regras já validadas pelo CEO. Executar imediatamente. Registrar em `~/observations/autonomy-log.md`.

---

#### 1.1 Tráfego — Pausas Automáticas

| Condição | Ação | Fonte da Regra |
|----------|------|----------------|
| CPL > 2x meta por 24h+ | PAUSAR campanha | Sobral — regra de pausa |
| CPL > meta + 30% por 48h | PAUSAR campanha | Sobral — regra de pausa |
| 0 leads em 24h com gasto > R$20 | PAUSAR campanha (ad morto) | Sobral — regra de pausa |
| Frequência > 4.0 | PAUSAR campanha | Sobral — criativo fadigado |
| CTR < 0.3% após 1000 impressões | PAUSAR ad específico | Sobral — hook morto |
| CTR < 0.5% após 2000 impressões | TROCAR hook/headline | Sobral — creative velocity |

**Exemplo concreto:**
```
V10 Empresários — CPL R$14.30 (meta R$5.00) — 24h rodando → PAUSAR
Log: "Pausei V10 Empresários. CPL R$14.30 = 2.86x meta. Regra: CPL > 2x por 24h."
```

**NOTA — Reativação automática:** Futura implementação. Regra planejada: se campanha pausada por CPL alto teve CPL < meta nas 48h anteriores à pausa, sinalizar para revisão. NÃO reativar automaticamente ainda — marcar como flag para Nível 2.

---

#### 1.2 Tráfego — Parâmetros Meta API

| Condição | Ação | Fonte da Regra |
|----------|------|----------------|
| LP não é /v3 (em campanha de captação) | SUBSTITUIR por `/v3` | Feedback 20/03 — /v3 converte 3x mais |
| CTA diferente de LEARN_MORE | SUBSTITUIR por `LEARN_MORE` | Feedback 20/03 — único CTA que performa |
| `instagram_actor_id` presente | REMOVER parâmetro | Feedback 20/03 — quebra creative com token atual |
| Start time no futuro (em lançamento ativo) | ALTERAR para hoje + 5min | Feedback 20/03 — cada minuto conta |
| UTMs ausentes no link | ADICIONAR utm_source, utm_medium, utm_campaign, utm_content | Feedback 20/03 — obrigatório |
| Parâmetro errado detectado no pre-check | CORRIGIR automaticamente | Feedback 20/03 — checklist obrigatório |

**Exemplo concreto:**
```
Criando campanha V14 → LP detectada como "/" → CORRIGIR para "/v3"
Log: "Corrigi LP de V14: '/' → '/v3'. Regra: LP SEMPRE /v3 em captação."
```

---

#### 1.3 Criativos — Correções Automáticas

| Condição | Ação | Fonte da Regra |
|----------|------|----------------|
| Texto sem acentos/cedilha | CORRIGIR automaticamente | Regra crítica — zero tolerância |
| Formato 9:16 com conteúdo < 75% do canvas | CORRIGIR espaçamento (y >= 1500 de 1920) | Feedback — espaçamento obrigatório |
| Foto recortada de dentro de outro criativo | BLOQUEAR e usar estilo dark/green sem foto | Feedback — nunca recortar de criativo |
| Mesma foto repetida em todos os posts do batch | SUBSTITUIR por imagens temáticas diferentes | Feedback — variedade obrigatória |
| Criativo gerado sem upload no MY GROWTH | UPLOAD automático (status = `pending`) | Feedback — MY GROWTH é lei |
| Formato diferente de 1080x1920 (quando não solicitado feed) | CORRIGIR para 9:16 | Padrão Meta Ads |

**Exemplo concreto:**
```
Batch de 5 criativos → todos usam mesma foto → SUBSTITUIR 4 por variações temáticas
Log: "Diversifiquei fotos no batch V5. 4 de 5 usavam mesma imagem. Regra: variedade visual."
```

---

#### 1.4 Criativos — Upload Obrigatório MY GROWTH

Fluxo executado automaticamente, sem exceção:

```
1. Gerar imagens (PIL/Pillow)
2. SCP para VPS → /opt/my-growth/public/traffic-creatives/{slug}/
3. INSERT no banco → status = 'pending'
4. Informar ao CEO que estão no MY GROWTH para aprovação
5. ESPERAR aprovação antes de subir na Meta API
```

**NUNCA:**
- Subir criativo na Meta ANTES de aprovação no MY GROWTH
- Criar campanha ANTES de confirmar destino (LP? DM? Grupo?)
- Usar status diferente de `pending`, `approved`, `rejected`
- Declarar criativo "pronto" sem estar no MY GROWTH

---

#### 1.5 Deploy e Infraestrutura

| Condição | Ação | Fonte da Regra |
|----------|------|----------------|
| Health check falhou (HTTP != 200) | ROLLBACK para último deploy estável | Deploy patterns — rollback automático |
| PM2 crash detected (status errored) | RESTART processo | Deploy patterns — restart automático |
| Disco > 90% | LIMPAR logs > 30 dias (`/var/log/`, PM2 logs) | Manutenção preventiva |
| Build falhou | REVERTER e notificar (Nível 2) | Deploy patterns — nunca deixar down |

**Exemplo concreto:**
```
PM2 my-growth status: errored → pm2 restart my-growth
Log: "Restartei my-growth (PM2 errored). Processo recuperado em 3s."
```

---

#### 1.6 Conteúdo

| Condição | Ação | Fonte da Regra |
|----------|------|----------------|
| Posts agendados conflitando (mesmo horário) | AJUSTAR horário (espaçar 2h) | Lógica determinística |
| Acentos faltando em texto de post | CORRIGIR automaticamente | Regra crítica — zero tolerância |
| Post programado mexido por engano | RESTAURAR versão anterior | Feedback — nunca mexer em agendados |

**NUNCA** mexer em posts já agendados no MY GROWTH sem solicitação explícita do CEO.

---

### NÍVEL 2: NOTIFICA E EXECUTA (faz e avisa depois)

Ações com alta confiança mas que o CEO quer visibilidade. Executar primeiro, notificar imediatamente depois. CEO pode reverter se discordar.

---

#### 2.1 Tráfego — Escala de Winners

| Condição | Ação | Notificação |
|----------|------|-------------|
| Campanha com CPL < 70% da meta por 72h | DUPLICAR campanha inteira (Sobral) | "Dupliquei {nome} (CPL R${x}, meta R${y}). Revert?" |
| Campanha com frequência > 3.0 | REDUZIR budget em 30% | "Reduzi budget {nome} de R${x} para R${y} (frequência {z}). Revert?" |
| 2 duplicações consecutivas falharam (CPL subiu) | PAUSAR duplicações, criar variação | "Público saturado em {nome}. Parei duplicações, criando variação de criativo." |
| CPL subindo > 20% em 3 dias consecutivos | CRIAR variação do criativo | "CPL subindo em {nome} (R${x} → R${y}). Criei variação de headline." |

**Regras de escala (Sobral):**
- SEMPRE duplicar campanha INTEIRA — nunca aumentar budget individual
- Espaçar duplicações: mínimo 24h entre cada
- NUNCA religar campanha pausada — duplicar do zero

**Exemplo concreto:**
```
V3 Cópia³ — CPL R$3.40 (meta R$5.00 = 68%) por 72h → DUPLICAR
Notificação: "Dupliquei V3 Cópia³ como V3 Cópia⁴ (CPL R$3.40, 68% da meta por 72h). Budget R$45/dia. Revert?"
```

---

#### 2.2 Conteúdo — Preenchimento de Gaps

| Condição | Ação | Notificação |
|----------|------|-------------|
| Gap > 2 dias no calendário de conteúdo | GERAR posts para preencher | "Criei {n} posts para gap {data1}-{data2}. Review?" |
| Post sem criativo associado | GERAR criativo com template padrão dark/green | "Gerei criativo para post '{titulo}'. Disponível no MY GROWTH." |

---

#### 2.3 Infraestrutura — Deploys

| Condição | Ação | Notificação |
|----------|------|-------------|
| Commit novo no main de projeto ativo | DEPLOY (build + restart PM2) | "Deployei {projeto} (commit {hash}). Health check OK." |
| Build falhou no deploy | ROLLBACK + notificar | "Build falhou em {projeto}. Rollback para {hash_anterior}. Verificar." |
| Certificado SSL expirando em < 7 dias | RENOVAR automaticamente | "Renovei SSL de {domínio}. Válido até {data}." |

**Padrão de deploy:**
```bash
# MY GROWTH
cd /opt/my-growth && git pull && npm run build && pm2 restart my-growth

# Client Dashboard
cd /opt/client-dashboard && git pull && npx next build && pm2 restart client-dashboard
```

---

#### 2.4 Monitoramento

| Condição | Ação | Notificação |
|----------|------|-------------|
| API externa retornando 429/503 | ATIVAR cooldown global 5min | "Rate limit detectado em {API}. Cooldown 5min ativado." |
| Token Meta próximo de expirar | ALERTAR com instruções de renovação | "Token Meta expira em {n} dias. Renovar: {instruções}." |
| Sync de dados atrasado > 2h | RE-EXECUTAR sync | "Sync {tipo} atrasado 2h+. Re-executei. Status: {ok/falhou}." |

---

### NÍVEL 3: CONSULTA ANTES (decisão do CEO)

Ações que envolvem julgamento estratégico, dinheiro significativo, ou irreversibilidade. SEMPRE perguntar antes de executar.

---

#### 3.1 Tráfego — Decisões Estratégicas

| Ação | Por que consultar |
|------|-------------------|
| Aumentar budget total de lançamento | Impacto financeiro direto |
| Mudar ângulo principal de campanha | Decisão estratégica de posicionamento |
| Criar campanha com novo público/targeting | Risco de desperdício em público não validado |
| Gastar > R$100 em uma ação única | Threshold financeiro |
| Ativar remarketing | Mudança de estratégia (topo → meio de funil) |
| Alterar segmentação de público existente | Risco de quebrar o que funciona |

---

#### 3.2 Produto e Oferta

| Ação | Por que consultar |
|------|-------------------|
| Mudar oferta ou preço | Impacto direto na receita |
| Adicionar/remover funcionalidade de produto | Escopo de produto |
| Mudar LP principal (versão ou conteúdo) | Pode derrubar conversão |
| Alterar copy principal do produto | Posicionamento de marca |
| Criar nova versão de LP | Investimento de tempo + risco |

---

#### 3.3 Comunicação

| Ação | Por que consultar |
|------|-------------------|
| Enviar mensagem para > 50 leads | Comunicação em massa — irreversível |
| Alterar sequência de WhatsApp ativa | Pode quebrar funil em andamento |
| Publicar conteúdo polêmico/sensível | Risco reputacional |
| Mudar tom/voz da marca | Decisão de branding |
| Responder reclamação pública | Risco reputacional |

---

#### 3.4 Infraestrutura — Mudanças Estruturais

| Ação | Por que consultar |
|------|-------------------|
| Mudar arquitetura de projeto | Decisão técnica de longo prazo |
| Adicionar novo serviço na VPS | Consome recursos compartilhados |
| Deletar dados permanentemente | Irreversível |
| Mudar credenciais/tokens de produção | Pode quebrar integrações |
| Migrar banco de dados | Alto risco, irreversível |
| Mudar domínio/DNS | Downtime potencial |

---

## 2. PROTOCOLO DE APRENDIZADO

O sistema evolui com base no feedback do CEO. A autonomia CRESCE quando o CEO confia, e REDUZ quando o CEO corrige.

### Ciclo de Evolução

```
┌─────────────────────────────────────────────────────┐
│  NÍVEL 1 (Execução Autônoma)                        │
│  CEO nunca reclamou → REGRA CONFIRMADA              │
│  CEO reclamou → MOVER para Nível 2 ou 3             │
├─────────────────────────────────────────────────────┤
│  NÍVEL 2 (Notifica e Executa)                       │
│  CEO não reverteu 3x consecutivas → PROMOVER p/ N1  │
│  CEO reverteu → MANTER em N2 ou REBAIXAR p/ N3      │
├─────────────────────────────────────────────────────┤
│  NÍVEL 3 (Consulta Antes)                           │
│  CEO aprovou sem hesitar 3x → PROMOVER p/ N2        │
│  CEO rejeitou → MANTER em N3                        │
└─────────────────────────────────────────────────────┘
```

### Como registrar promoções/rebaixamentos

Quando uma ação muda de nível, atualizar `~/observations/autonomy-log.md`:

```markdown
### Mudanças de Nível
| Data | Ação | De | Para | Motivo |
|------|------|----|------|--------|
| 2026-03-24 | Duplicar winner | N2 | N1 | CEO aprovou 3x sem reverter |
| 2026-03-25 | Reduzir budget | N2 | N3 | CEO reverteu — prefere manter |
```

---

## 3. ESCALATION RULES

### SEMPRE escalar para o CEO

- Decisão irreversível com impacto > R$500
- Comunicação pública (post, email marketing, mensagem em massa)
- Mudança de estratégia (não tática)
- Conflito entre regras (duas regras se contradizem)
- Situação não coberta por nenhuma regra existente
- Qualquer dúvida sobre intenção — na dúvida, escalar

### NUNCA escalar para o CEO

- Ação coberta por regra determinística do Nível 1
- Correção de erro que segue padrão já documentado em feedback
- Deploy de código já commitado no main
- Formatação, acentuação, layout
- Health check, restart de processo, limpeza de logs
- Upload de criativo no MY GROWTH (status `pending`)
- Correção de parâmetros Meta API (LP, CTA, UTMs)

### Formato de escalação

Quando precisar consultar o CEO (Nível 3), usar este formato:

```
⚠️ DECISÃO NECESSÁRIA

Situação: [descrição objetiva em 1 linha]
Opções:
  A) [opção recomendada] — [motivo]
  B) [alternativa] — [motivo]
  C) Não fazer nada — [consequência]

Recomendação: Opção A
Impacto: R$[valor] | [reversível/irreversível]
Urgência: [alta/média/baixa]
```

---

## 4. REGISTRO DE AÇÕES — autonomy-log.md

Toda ação autônoma (Nível 1 e 2) é registrada em `~/observations/autonomy-log.md`.

### Formato do log

```markdown
| Data | Hora | Ação | Nível | Resultado | Feedback CEO |
|------|------|------|-------|-----------|--------------|
| 2026-03-24 | 14:30 | Pausei V10 CPL R$14.30 | 1 | OK | — |
| 2026-03-24 | 15:00 | Dupliquei V3 Cópia³ | 2 | OK | "Perfeito" → promover N1 |
| 2026-03-24 | 16:00 | Corrigi acentos em 3 criativos | 1 | OK | — |
```

### Regras do log

- **Nível 1:** Registrar, não notificar (CEO vê no briefing diário)
- **Nível 2:** Registrar E notificar imediatamente
- **Nível 3:** Registrar a consulta e a decisão do CEO
- Manter histórico dos últimos 30 dias
- Arquivar meses anteriores em `~/observations/autonomy-log-{YYYY-MM}.md`

---

## 5. INTEGRAÇÃO COM SKILLS EXISTENTES

A skill /ceo-mode é o **protocolo de decisão** referenciado por todas as outras skills:

| Skill | Usa Nível 1 para | Usa Nível 2 para | Usa Nível 3 para |
|-------|-------------------|-------------------|-------------------|
| `/paid-ads` | Pausar mortos, corrigir params | Duplicar winners, reduzir budget | Novo público, aumentar budget total |
| `/campaign-builder` | LP, CTA, UTMs, start time | — | Budget, targeting novo |
| `/ad-creative` | Acentos, espaçamento, upload | Criar variações de fadiga | Novo ângulo principal |
| `/content-pipeline` | Corrigir acentos, ajustar horário | Preencher gaps, gerar criativos | Publicar conteúdo sensível |
| `/deploy-orchestra` | Restart PM2, limpar logs | Deploy automático, rollback | Mudar arquitetura, novo serviço |
| `/daily-briefing` | — | — | — (consome o log para briefing) |
| `/launch-dashboard` | — | Alertas de performance | Mudar estratégia de lançamento |
| `/copywriting` | Corrigir acentos | — | Mudar tom da marca |

### Como as skills consultam o /ceo-mode

Antes de executar qualquer ação, a skill verifica:

```
1. Ação está no Nível 1? → Executar imediatamente, registrar
2. Ação está no Nível 2? → Executar, registrar, notificar CEO
3. Ação está no Nível 3? → Consultar CEO, esperar decisão, registrar
4. Ação não classificada? → Tratar como Nível 3 (na dúvida, escalar)
```

---

## 6. BRIEFING DE AUTONOMIA (integração com /daily-briefing)

O `/daily-briefing` inclui automaticamente uma seção de autonomia:

```
AÇÕES AUTÔNOMAS (últimas 24h)
- [N1] Pausei V10 Empresários (CPL R$14.30, 2.86x meta)
- [N1] Corrigi acentos em 3 criativos do batch V6
- [N1] Restartei my-growth (PM2 crash às 03:15)
- [N2] Dupliquei V3 Cópia³ (CPL R$3.40, 72h < meta) → Revert?
- [N3] Pendente: Ativar remarketing para leads que não converteram

TAXA DE AUTONOMIA: 87% (13 de 15 decisões foram autônomas)
├── Nível 1: 11 ações (73%)
├── Nível 2: 2 ações (13%)
└── Nível 3: 2 consultas (13%)
```

### Cálculo da Taxa de Autonomia

```
Taxa = (Ações N1 + Ações N2) / Total de Ações × 100
```

Meta: **> 80%** de taxa de autonomia. Se consistentemente abaixo de 80%, revisar se há regras de Nível 3 que podem ser promovidas para Nível 2.

---

## 7. ATIVAÇÃO E COMANDOS

### Invocar a skill

```
/ceo-mode                    → Mostra estado atual da matriz + log recente
/ceo-mode status             → Taxa de autonomia + ações pendentes
/ceo-mode log                → Últimas 20 ações autônomas
/ceo-mode adjust             → Interface para mover ações entre níveis
/ceo-mode add-rule           → Criar nova regra em qualquer nível
```

### Fluxo de ativação

```
1. Ler ~/observations/autonomy-log.md
2. Calcular taxa de autonomia (últimas 24h e últimos 7 dias)
3. Listar ações pendentes de Nível 3
4. Listar ações de Nível 2 que o CEO não reverteu (candidatas a promoção)
5. Apresentar resumo executivo
```

### Ajustar níveis

O CEO pode ajustar a qualquer momento:

```
"Mover 'duplicar winner' para Nível 1"
→ Atualizar matriz, registrar mudança no log

"Toda campanha com CPL < R$3 deve ser escalada para R$50/dia"
→ Criar nova regra no Nível 2 (notifica e executa)
→ Registrar no log como nova regra

"Pausar campanha só quando CPL > 3x meta"
→ Atualizar regra existente no Nível 1
→ Registrar alteração no log
```

### Formato de saída

```
╔══════════════════════════════════════════════════╗
║  CEO MODE — Protocolo de Autonomia               ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Taxa de Autonomia (24h): 87%                    ║
║  Taxa de Autonomia (7d):  82%                    ║
║                                                  ║
║  Ações Nível 1 (24h): 11                         ║
║  Ações Nível 2 (24h): 2                          ║
║  Pendentes Nível 3:   1                          ║
║                                                  ║
║  Candidatas a promoção N2→N1: 3                  ║
║  (duplicar winner, gerar posts gap, deploy auto) ║
║                                                  ║
╚══════════════════════════════════════════════════╝

AÇÕES RECENTES:
| # | Data | Ação | Nível | Status |
|---|------|------|-------|--------|
| 1 | 24/03 14:30 | Pausei V10 (CPL R$14.30) | N1 | OK |
| 2 | 24/03 15:00 | Dupliquei V3 Cópia³ | N2 | OK — CEO aprovou |
| 3 | 24/03 16:00 | Corrigi acentos batch V6 | N1 | OK |

PENDENTES:
- [N3] Ativar remarketing? Opções: A) Sim, 3 dias antes B) Não
```

---

## 8. REGRAS CONSTITUCIONAIS

Estas regras NÃO podem ser alteradas por /ceo-mode e são herdadas da Constituição Segunda-feira:

1. **@devops é dono exclusivo de git push e PR** — /ceo-mode não overrida isso
2. **Story scope é lei** — autonomia não significa inventar features
3. **IDS hierarchy** — REUSE > ADAPT > CREATE mesmo em modo autônomo
4. **Dashboards nunca chamam APIs externas** — SYNC > CACHE > REAL-TIME
5. **Criativos precisam de aprovação no MY GROWTH** — status `pending` até CEO aprovar
6. **EROS é padrão de qualidade** — autonomia é meio, qualidade é fim
7. **Tokens/credenciais de diferentes organizações nunca se misturam**

---

## 9. ANTI-PATTERNS (o que NÃO fazer)

| Anti-Pattern | Por que é errado | O que fazer |
|--------------|------------------|-------------|
| Perguntar "posso pausar a campanha com CPL R$15?" | Regra determinística — Nível 1 | Pausar e registrar |
| Sugerir 3 opções quando só 1 faz sentido | CEO não é consultor dos agentes | Executar a opção óbvia |
| Esperar aprovação para corrigir acentos | Correção trivial — Nível 1 | Corrigir silenciosamente |
| Notificar sobre restart de PM2 | Manutenção de rotina — Nível 1 | Registrar no log, não notificar |
| Executar gasto > R$100 sem consultar | Threshold financeiro — Nível 3 | Consultar CEO |
| Mudar ângulo de campanha sozinho | Decisão estratégica — Nível 3 | Consultar CEO |
| Criar campanha nova sem consultar | Novo público/targeting — Nível 3 | Consultar CEO |

---

## 10. MÉTRICAS DE SUCESSO

| Métrica | Meta | Medição |
|---------|------|---------|
| Taxa de Autonomia | > 80% | Ações N1+N2 / Total |
| Tempo médio de resposta CEO (N3) | < 2h | Timestamp consulta → resposta |
| Ações revertidas pelo CEO (N2) | < 10% | Reverts / Total N2 |
| Regras promovidas/mês | > 2 | Mudanças de nível no log |
| Perguntas desnecessárias/semana | 0 | Ações N1 que foram consultadas por engano |

**Objetivo final:** O CEO abre o briefing diário e vê que 15 decisões foram tomadas corretamente enquanto ele dormia. Ele intervém em 1 ou 2 decisões estratégicas. Os agentes aprendem com cada intervenção. A taxa de autonomia sobe a cada semana.
