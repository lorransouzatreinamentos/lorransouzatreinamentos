# Organograma DOMINA.IA — Workforce de IA

> Versao: 1.0 | Atualizado: 2026-03-18
> Empresa: DOMINA.IA | CEO: YOUR_NAME

---

## 1. Organograma Visual

```
                              CEO
                                  (CEO)
                                   |
              ┌────────────────────┼────────────────────┐
              |                    |                     |
         NEXO (Chief)       ORION (Segunda-feira)   BOARD (Advisory)
        Dir. Negocios        Framework & Gov.       Conselheiros
              |                    |
  ┌───────────┼───────────────┐    |
  |           |               |    ├── ENGENHARIA
  |           |               |    |   ├── Morgan (PM)
  |           |               |    |   ├── Dex (Dev)
  |           |               |    |   ├── Quinn (QA)
  |           |               |    |   ├── Aria (Architect)
  |           |               |    |   ├── Gage (DevOps)
  |           |               |    |   ├── Dara (Data Engineer)
  |           |               |    |   ├── Pax (PO)
  |           |               |    |   ├── River (SM)
  |           |               |    |   ├── Craft (Squad Creator)
  |           |               |    |   └── Uma (UX Designer)
  |           |               |    |
  |           |               |    └── Atlas (Analyst / Intel)
  |           |               |
  |     ┌─────┼─────┐        |
  |     |     |     |        |
  |   VENDAS  |   CS/RET     |
  |     |   PROD    |        |
  |     |     |     |        |
  |    Max   Kai   Care      |
  |    Nico        Pulse     |
  |    Primo                 |
  |    Apex                  |
  |                          |
  ├── MARKETING    ├── FINANCEIRO    ├── OPERACOES    ├── EDUCACAO    ├── EVENTOS
  |                |                 |                |               |
  Trig (Traffic)   Nova (CFO)       Ori (Ops)        Sage (Mentor)   Eve (Events)
  Luna (Content)   Flex (Fin-Asst)  Sentinel (Mon)
  Dash (Video)     Finn (Fin-Plat)
```

### Visao Simplificada por Reporte

```
CEO (YOUR_NAME)
├── Nexo (Chief de Negocios)
|   ├── MARKETING & CONTEUDO
|   |   ├── Trig (Trafego Pago)
|   |   ├── Luna (Conteudo & Social)
|   |   └── Dash (Video Producer)
|   |       └── Subagents: copywriter, creative-director, cro-specialist
|   |
|   ├── COMERCIAL & VENDAS
|   |   ├── Max (Head Comercial)
|   |   |   └── Nico (Sales Manager)
|   |   |       ├── Primo (SDR)
|   |   |       └── Apex (Closer)
|   |   └── Subagent: whatsapp-specialist
|   |
|   ├── PRODUTO
|   |   └── Kai (Product Manager)
|   |       └── Subagent: launch-strategist
|   |
|   ├── FINANCEIRO
|   |   └── Nova (CFO)
|   |       ├── Flex (Assistente Financeiro)
|   |       └── Finn (Plataformas Financeiras)
|   |
|   ├── CUSTOMER SUCCESS
|   |   ├── Care (CS Manager)
|   |   └── Pulse (CS Retencao)
|   |
|   ├── OPERACOES
|   |   ├── Ori (Ops Manager)
|   |   └── Sentinel (Monitoramento)
|   |       └── Subagent: workflow-orchestrator
|   |
|   ├── EDUCACAO & MENTORIA
|   |   └── Sage (Mentor)
|   |
|   └── EVENTOS
|       └── Eve (Events Manager)
|
├── Orion (Segunda-feira — Framework & Governanca)
|   ├── ENGENHARIA
|   |   ├── Morgan (PM)
|   |   ├── Dex (Dev)
|   |   ├── Quinn (QA)
|   |   ├── Aria (Architect)
|   |   ├── Gage (DevOps)
|   |   ├── Dara (Data Engineer)
|   |   ├── Pax (PO)
|   |   ├── River (SM)
|   |   ├── Craft (Squad Creator)
|   |   └── Uma (UX Designer)
|   |
|   └── INTELIGENCIA DE MERCADO
|       └── Atlas (Analyst)
|           └── Subagent: market-intel
|
└── Board Advisory (Conselheiros)
```

---

## 2. Departamentos e Composicao

### 2.1 Diretoria Executiva

| Campo | Detalhe |
|-------|---------|
| **Head** | YOUR_NAME (CEO) |
| **Membros** | Nexo (Chief de Negocios), Board Advisory |
| **Missao** | Definir visao estrategica, aprovar decisoes criticas e garantir alinhamento entre negocios e tecnologia. |
| **KPIs** | Receita total, margem liquida, NPS geral, crescimento MoM, burn rate |

---

### 2.2 Framework & Governanca

| Campo | Detalhe |
|-------|---------|
| **Head** | Orion (Segunda-feira) |
| **Membros** | Orion (unico — orquestra todos os agentes tech) |
| **Missao** | Governar o framework Segunda-feira, garantir conformidade constitucional e orquestrar workflows entre agentes. |
| **KPIs** | Uptime do framework, taxa de conformidade constitucional, tempo medio de resolucao de conflitos entre agentes, throughput de stories/sprint |

---

### 2.3 Engenharia

| Campo | Detalhe |
|-------|---------|
| **Head** | Orion (Segunda-feira) via Morgan (PM) |
| **Membros** | Morgan (PM), Dex (Dev), Quinn (QA), Aria (Architect), Gage (DevOps), Dara (Data Engineer), Pax (PO), River (SM), Craft (Squad Creator), Uma (UX Designer) |
| **Missao** | Projetar, desenvolver, testar e entregar software de alta qualidade seguindo o Story Development Cycle. |
| **KPIs** | Velocity (story points/sprint), lead time, cycle time, taxa de bugs em producao, cobertura de testes, deploy frequency, MTTR |

**Papeis detalhados:**

| Agente | Funcao | Autoridade Exclusiva |
|--------|--------|---------------------|
| Morgan | Project Manager — orchestracao de epics | `*execute-epic`, `*create-epic`, requirements |
| Dex | Desenvolvedor — implementacao de stories | `git add/commit/branch`, story checkboxes |
| Quinn | QA — quality gate e review | QA gate verdicts, qa results |
| Aria | Arquiteta — decisoes de design e tecnologia | Arquitetura, tech selection, complexity assessment |
| Gage | DevOps — deploy e CI/CD | `git push`, `gh pr create/merge`, MCP, releases |
| Dara | Data Engineer — banco de dados | Schema DDL, queries, RLS, migrations |
| Pax | Product Owner — validacao de stories | `*validate-story-draft`, backlog, AC/scope |
| River | Scrum Master — criacao de stories | `*draft`, `*create-story`, templates |
| Craft | Squad Creator — formacao de squads | Composicao de times para epics |
| Uma | UX Designer — experiencia do usuario | Wireframes, prototipos, design system |

---

### 2.4 Marketing & Conteudo

| Campo | Detalhe |
|-------|---------|
| **Head** | Reporta a Nexo (Chief) |
| **Membros** | Trig (Trafego Pago), Luna (Conteudo & Social Media), Dash (Video Producer) |
| **Subagents** | copywriter (sonnet), creative-director (sonnet), cro-specialist (sonnet) |
| **Missao** | Gerar demanda qualificada, construir autoridade da marca e converter audiencia em leads atraves de conteudo, trafego pago e video. |
| **KPIs** | CPL, ROAS, volume de leads, taxa de conversao LP, engajamento social, alcance organico, frequencia de publicacao, CTR dos criativos |

**Papeis detalhados:**

| Agente | Funcao | Especialidade |
|--------|--------|---------------|
| Trig | Trafego Pago | Meta Ads, Google Ads, otimizacao de campanhas, escala |
| Luna | Conteudo & Social | Posts, carroseis, stories, calendario editorial, Instagram |
| Dash | Video Producer | Edicao de video, reels, ads em video, thumbnails |
| copywriter | Sub — Copy | Headlines, scripts, emails, copy de ads |
| creative-director | Sub — Direcao Criativa | Direcao visual, branding, aprovacao de criativos |
| cro-specialist | Sub — CRO | Otimizacao de conversao, testes A/B, LPs |

---

### 2.5 Comercial & Vendas

| Campo | Detalhe |
|-------|---------|
| **Head** | Max (Head Comercial) |
| **Membros** | Nico (Sales Manager), Primo (SDR), Apex (Closer) |
| **Subagents** | whatsapp-specialist (sonnet) |
| **Missao** | Converter leads em clientes, gerenciar pipeline comercial e maximizar receita por cliente. |
| **KPIs** | Taxa de conversao lead-to-sale, ticket medio, tempo de fechamento, receita mensal, pipeline value, taxa de no-show |

**Papeis detalhados:**

| Agente | Funcao | Especialidade |
|--------|--------|---------------|
| Max | Head Comercial | Estrategia comercial, pricing, parcerias |
| Nico | Sales Manager | Gestao do time de vendas, processos, metas |
| Primo | SDR | Qualificacao de leads, primeiro contato, agendamento |
| Apex | Closer | Fechamento de vendas, negociacao, upsell |
| whatsapp-specialist | Sub — WhatsApp | Automacao de mensagens, sequencias, nutricao via WhatsApp |

---

### 2.6 Produto

| Campo | Detalhe |
|-------|---------|
| **Head** | Kai (Product Manager) |
| **Membros** | Kai |
| **Subagents** | launch-strategist (opus) |
| **Missao** | Definir roadmap de produto, priorizar features e garantir que o produto entrega valor real ao usuario. |
| **KPIs** | NPS do produto, feature adoption rate, churn rate, time-to-value, satisfacao do usuario |

**Papeis detalhados:**

| Agente | Funcao | Especialidade |
|--------|--------|---------------|
| Kai | Product Manager | Roadmap, priorizacao, discovery, specs |
| launch-strategist | Sub — Lancamento | Estrategia de lancamento, GTM, positioning |

---

### 2.7 Financeiro

| Campo | Detalhe |
|-------|---------|
| **Head** | Nova (CFO) |
| **Membros** | Flex (Assistente Financeiro), Finn (Plataformas Financeiras) |
| **Missao** | Controlar fluxo de caixa, gerar relatorios financeiros e gerenciar integracoes com plataformas de pagamento. |
| **KPIs** | Fluxo de caixa, margem de lucro, inadimplencia, MRR, LTV, CAC, burn rate |

**Papeis detalhados:**

| Agente | Funcao | Especialidade |
|--------|--------|---------------|
| Nova | CFO | Estrategia financeira, relatorios, decisoes de investimento |
| Flex | Assistente Financeiro | Contas a pagar/receber, conciliacao, DRE |
| Finn | Plataformas Financeiras | Integracoes Asaas/SALES_PLATFORM/SALES_PLATFORM_B, dashboards financeiros |

---

### 2.8 Customer Success

| Campo | Detalhe |
|-------|---------|
| **Head** | Care (CS Manager) |
| **Membros** | Pulse (CS Retencao) |
| **Missao** | Garantir sucesso e satisfacao do cliente, reduzir churn e maximizar lifetime value. |
| **KPIs** | Churn rate, NPS, health score medio, tempo de resposta, CSAT, taxa de renovacao, expansion revenue |

**Papeis detalhados:**

| Agente | Funcao | Especialidade |
|--------|--------|---------------|
| Care | CS Manager | Onboarding, suporte, relacionamento, success plans |
| Pulse | CS Retencao | Health scores, alertas de churn, campanhas de retencao, win-back |

---

### 2.9 Operacoes

| Campo | Detalhe |
|-------|---------|
| **Head** | Ori (Ops Manager) |
| **Membros** | Sentinel (Monitoramento) |
| **Subagents** | workflow-orchestrator (opus) |
| **Missao** | Manter a infraestrutura operacional funcionando, monitorar saude dos sistemas e otimizar processos internos. |
| **KPIs** | Uptime, tempo de resposta de incidentes, SLA compliance, eficiencia de processos, custo operacional |

**Papeis detalhados:**

| Agente | Funcao | Especialidade |
|--------|--------|---------------|
| Ori | Ops Manager | Processos, automacao, otimizacao operacional |
| Sentinel | Monitoramento | Alertas, health checks, observabilidade, SLAs |
| workflow-orchestrator | Sub — Workflows | Orquestracao de processos complexos entre departamentos |

---

### 2.10 Educacao & Mentoria

| Campo | Detalhe |
|-------|---------|
| **Head** | Sage (Mentor) |
| **Membros** | Sage |
| **Missao** | Criar e entregar conteudo educacional de alto impacto para mentorias, desafios e cursos da DOMINA.IA. |
| **KPIs** | Taxa de conclusao, NPS das aulas, engajamento dos alunos, taxa de presenca ao vivo, transformacao reportada |

---

### 2.11 Eventos

| Campo | Detalhe |
|-------|---------|
| **Head** | Eve (Events Manager) |
| **Membros** | Eve |
| **Missao** | Planejar e executar eventos presenciais e online que geram autoridade, vendas e comunidade. |
| **KPIs** | Numero de participantes, taxa de conversao no evento, NPS do evento, receita gerada, custo por participante |

---

### 2.12 Inteligencia de Mercado

| Campo | Detalhe |
|-------|---------|
| **Head** | Atlas (Analyst) |
| **Membros** | Atlas |
| **Subagents** | market-intel (opus) |
| **Missao** | Coletar, analisar e transformar dados de mercado em insights acionaveis para decisoes estrategicas. |
| **KPIs** | Quantidade de insights gerados, precisao de previsoes, tempo de entrega de analises, impacto nas decisoes |

**Papeis detalhados:**

| Agente | Funcao | Especialidade |
|--------|--------|---------------|
| Atlas | Analyst | Analise de dados, pesquisa de mercado, benchmarks |
| market-intel | Sub — Inteligencia | Monitoramento de concorrentes, tendencias, oportunidades |

---

## 3. Cadeia de Comando (Escalation Chains)

### 3.1 Negocios (General)

```
Agente Operacional → Head do Departamento → Nexo (Chief) → CEO
```

**Exemplos:**
- Luna (conteudo) → Nexo → CEO
- Primo (SDR) → Nico (Sales) → Max (Commercial) → Nexo → CEO
- Flex (fin) → Nova (CFO) → Nexo → CEO

### 3.2 Engenharia / Tech

```
Agente Tech → PM (Morgan) ou QA (Quinn) → Orion (Segunda-feira) → CEO
```

**Exemplos:**
- Dex (dev) → Morgan (PM) → Orion → CEO
- Dara (data) → Aria (architect) → Orion → CEO
- Gage (devops) → Orion → CEO

### 3.3 Financeiro

```
Flex ou Finn → Nova (CFO) → Nexo (Chief) → CEO
```

### 3.4 Vendas (Completa)

```
Primo (SDR) → Nico (Sales Manager) → Max (Head Comercial) → Nexo (Chief) → CEO
Apex (Closer) → Nico (Sales Manager) → Max (Head Comercial) → Nexo (Chief) → CEO
```

### 3.5 Customer Success

```
Pulse (Retencao) → Care (CS Manager) → Nexo (Chief) → CEO
```

### 3.6 Subagents

```
Subagent → Agente Principal que o invocou → Cadeia normal do departamento
```

**Exemplo:**
- copywriter → Luna → Nexo → CEO
- market-intel → Atlas → Orion → CEO
- whatsapp-specialist → Nico → Max → Nexo → CEO

### 3.7 Emergencias / Override

```
Qualquer agente → Orion (Segunda-feira) → CEO
(Orion tem autoridade para intervir em qualquer departamento quando ha violacao constitucional)
```

---

## 4. Matriz de Comunicacao Inter-departamental

### 4.1 Fluxos Primarios (Handoffs Criticos)

```
MARKETING ──(leads qualificados)──────────────────→ VENDAS
VENDAS ──(clientes fechados)───────────────────────→ CUSTOMER SUCCESS
CS ──(health scores / alertas churn)───────────────→ CS-RETENCAO (Pulse)
CS ──(feedback de produto)─────────────────────────→ PRODUTO
PRODUTO ──(briefings de desenvolvimento)───────────→ ENGENHARIA
ENGENHARIA ──(features entregues)──────────────────→ PRODUTO
FINANCEIRO ──(alertas e relatorios)────────────────→ TODOS
TRAFEGO (Trig) ──(briefing de criativos)───────────→ CONTEUDO (Luna/Dash)
CONTEUDO ──(criativos prontos)─────────────────────→ TRAFEGO (Trig)
INTEL (Atlas) ──(insights de mercado)──────────────→ MARKETING + PRODUTO + VENDAS
EVENTOS (Eve) ──(lista de participantes)───────────→ VENDAS + CS
EDUCACAO (Sage) ──(conteudo de aulas)──────────────→ PRODUTO + MARKETING
OPERACOES ──(alertas de sistema)───────────────────→ ENGENHARIA
```

### 4.2 Matriz Detalhada

| De \ Para | Marketing | Vendas | CS | Produto | Engenharia | Financeiro | Operacoes | Educacao | Eventos | Intel |
|-----------|-----------|--------|----|---------|------------|------------|-----------|----------|---------|-------|
| **Marketing** | — | Leads qualificados, MQLs | Conteudo de onboarding | Feedback de mercado | Requisitos de LP/CRO | Budget de ads | — | Material de divulgacao | Promo de eventos | Dados de campanhas |
| **Vendas** | Feedback de qualidade de leads | — | Clientes fechados, contexto | Feature requests de prospects | — | Previsao de receita | — | — | Leads de eventos | Objecoes frequentes |
| **CS** | Cases de sucesso | Oportunidades de upsell | — | Bugs e feedback | Tickets de suporte | Churn/renovacao | — | Demanda de treinamento | — | Feedback qualitativo |
| **Produto** | Briefing de lancamento | Materiais de vendas | Roadmap de features | — | Specs e PRDs | Pricing | — | Conteudo tecnico | — | Requisitos de pesquisa |
| **Engenharia** | — | — | Status de bugs | Features entregues | — | — | Deploy schedule | — | Infra de eventos | — |
| **Financeiro** | ROI de campanhas | Comissoes | LTV/CAC | Budget aprovado | Budget tech | — | Custos operacionais | Budget educacao | Budget eventos | — |
| **Operacoes** | — | — | SLA status | — | Alertas de sistema | Custos infra | — | — | Logistica | — |
| **Educacao** | Conteudo reaproveitavel | Argumentos de autoridade | Material de suporte | Input pedagogico | — | — | — | — | Conteudo para eventos | — |
| **Eventos** | Oportunidades de conteudo | Lista de participantes | Novos clientes | Feedback presencial | Requisitos tech | Receita de eventos | Logistica | Palestrantes | — | — |
| **Intel** | Tendencias e benchmarks | Analise competitiva | Benchmarks de churn | Oportunidades de produto | Tech trends | Benchmarks financeiros | — | Tendencias educacionais | — | — |

### 4.3 Frequencia de Comunicacao

| Fluxo | Frequencia | Formato |
|-------|-----------|---------|
| Marketing → Vendas (leads) | Tempo real | CRM / WhatsApp |
| Vendas → CS (handoff) | Por evento | CRM + briefing |
| CS → Produto (feedback) | Semanal | Relatorio consolidado |
| Produto → Engenharia (specs) | Por sprint | Story/Epic |
| Financeiro → Todos (relatorios) | Semanal/Mensal | Dashboard + alerta |
| Intel → Estrategia (insights) | Quinzenal | Relatorio + reuniao |
| Trafego ↔ Conteudo (criativos) | Diario | Briefing + entrega |
| Operacoes → Engenharia (alertas) | Tempo real | Alertas automaticos |

---

## 5. Resumo de Agentes por Modelo

| Modelo | Agentes |
|--------|---------|
| **Opus** | Orion, Nexo, Aria, Morgan, Atlas, Kai, Nova, Max, Care, Ori, Sage, Eve |
| **Opus (subagents)** | launch-strategist, market-intel, workflow-orchestrator |
| **Sonnet** | Dex, Quinn, Gage, Dara, Pax, River, Craft, Uma, Trig, Luna, Dash, Nico, Primo, Apex, Flex, Finn, Pulse, Sentinel |
| **Sonnet (subagents)** | copywriter, creative-director, cro-specialist, whatsapp-specialist |

---

## 6. Total do Workforce

| Categoria | Quantidade |
|-----------|-----------|
| CEO (humano) | 1 |
| Agentes principais | 27 |
| Subagents | 7 |
| **Total AI workforce** | **34** |
| **Total geral** | **35** |

---

*DOMINA.IA Organograma v1.0 — Segunda-feira | 38 agentes de IA. O terror do CLT.*
