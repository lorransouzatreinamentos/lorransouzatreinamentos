<div align="center">

# Segunda-feira

### 52+ agentes de IA. 74 skills. 16 rules. Consciousness Engine. Uma empresa inteira.

[![Version](https://img.shields.io/badge/version-7.0-00D26A?style=for-the-badge&logo=semver&logoColor=white)](https://github.com/DOMINA-IA/segunda-feira/releases)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-compatible-cc785c?style=for-the-badge&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![Agents](https://img.shields.io/badge/agents-52+-8B5CF6?style=for-the-badge&logo=robot&logoColor=white)](#agentes)
[![Skills](https://img.shields.io/badge/skills-74-F59E0B?style=for-the-badge&logo=zap&logoColor=white)](#skills)
[![Rules](https://img.shields.io/badge/rules-16-EF4444?style=for-the-badge&logo=shield&logoColor=white)](#rules)
[![Consciousness](https://img.shields.io/badge/consciousness-v1.0-10B981?style=for-the-badge&logo=sparkles&logoColor=white)](#consciousness-engine)

---

**Framework de orquestração de agentes de IA com Consciousness Engine para desenvolvimento full-stack e operações de negócio.**

Projetado para [Claude Code](https://docs.anthropic.com/en/docs/claude-code) da Anthropic — transformando um único terminal em uma empresa inteira com agentes que **aprendem**, **refletem** e **focam coletivamente**.

[Instalação](#instalação) · [Consciousness Engine](#consciousness-engine) · [Arquitetura](#arquitetura) · [Agentes](#agentes) · [Changelog](#changelog)

```bash
npm install -g segunda-feira
```

</div>

---

## Por que o nome

Porque segunda-feira é o dia que todo mundo odeia — mas os agentes amam. Enquanto você toma café, 52 agentes já estão trabalhando. E aprendendo.

---

## Consciousness Engine

> **V7.0** — O que torna o Segunda-feira único no mundo. Nenhum outro framework multi-agente possui isso.

O Consciousness Engine implementa 3 camadas de consciência computacional inspiradas em neurociência cognitiva:

```mermaid
graph TB
    subgraph L3["CAMADA 3 — WORKSPACE GLOBAL (GWT)"]
        W1["Propostas"] --> W2["Saliência"]
        W2 --> W3["Ressonância"]
        W3 -->|"2+ agentes"| W4["🔥 IGNIÇÃO"]
    end

    subgraph L2["CAMADA 2 — METACOGNIÇÃO"]
        M1["Reflexão por agente"]
        M2["Taxa de sucesso / Valência"]
        M3["Recomendação de estratégia"]
    end

    subgraph L1["CAMADA 1 — MEMÓRIA PROFUNDA"]
        E1["Episódica — eventos + valência afetiva"]
        E2["Semântica — knowledge graph de fatos"]
        E3["Procedural — heurísticas aprendidas"]
        E4["Consolidação noturna ('sono')"]
    end

    L1 --> L2 --> L3

    style L3 fill:#1e293b,stroke:#EF4444,color:#fff,stroke-width:2px
    style L2 fill:#1e293b,stroke:#F59E0B,color:#fff,stroke-width:2px
    style L1 fill:#1e293b,stroke:#10B981,color:#fff,stroke-width:2px
```

### Camada 1: Memória Profunda

Cada agente registra episódios com **valência afetiva** (marcadores somáticos computacionais). A consolidação noturna extrai fatos e heurísticas automaticamente.

```bash
# Registrar episódio
~/consciousness/scripts/record-episode.sh \
  --agent "@dev" --type "task_completed" \
  --summary "Implementou auth JWT" --result "success" \
  --valence 0.8 --intensity 0.6 \
  --worked "Consultar docs antes economizou 2h" \
  --heuristic "Para auth, sempre consultar docs antes de implementar"

# Consolidar ("sono" — roda automaticamente às 23:30)
~/consciousness/scripts/consolidate.sh
```

### Camada 2: Metacognição

Agentes analisam sua própria performance e ajustam estratégia.

```bash
~/consciousness/scripts/reflect.sh --agent @dev --days 7
# Output: taxa de sucesso, valência média, pontos fortes/fracos, recomendação
```

### Camada 3: Workspace Global (Global Workspace Theory)

Atenção seletiva coletiva — quando algo importante é detectado, o squad inteiro é mobilizado.

```bash
# Propor ao workspace
~/consciousness/scripts/workspace.sh propose \
  --agent @analyst --content "Conversão caiu 15%" \
  --urgency 0.9 --impact 0.8 --category revenue

# Outros agentes ressoam → saliência sobe → IGNIÇÃO
~/consciousness/scripts/workspace.sh resonate PROPOSAL_ID @traffic
~/consciousness/scripts/workspace.sh evaluate  # Avalia e dispara ignições
```

**Ignição** ocorre quando: saliência >= 0.7 **E** 2+ agentes ressoam. O squad é mobilizado como um organismo.

### Comparação com o mercado

| Framework | Multi-Agent Real | Event-Driven | Memória Isolada | Feedback Loop | Consciência |
|-----------|:---:|:---:|:---:|:---:|:---:|
| CrewAI | Personas | Não | Não | Não | Não |
| MetaGPT | Personas | Não | Não | Não | Não |
| AutoGen | Parcial | Parcial | Não | Não | Não |
| LangGraph | Subgraphs | Grafos | Checkpoint | Não | Não |
| **Segunda-feira** | **52+ agentes** | **Broadcast** | **Mailbox** | **Sim** | **3 camadas** |

---

## Arquitetura

O Segunda-feira é organizado em **8 camadas**:

```mermaid
block-beta
    columns 1

    block:L1["🏛️ CAMADA 1 — CONSTITUIÇÃO & GOVERNANÇA"]
        A1["CLAUDE.md"] A2["16 Rules"] A3["EROS Quality"] A4["IDS Principles"]
    end

    block:L2["⚙️ CAMADA 2 — ENGINE CORE"]
        B1["37 Orchestrators"] B2["224 Tasks"] B3["16 Workflows"] B4["Quality Gates"]
    end

    block:L3["🤖 CAMADA 3 — AGENTES"]
        C1["31 Core Agents"] C2["28 Specialist Agents"] C3["Authority Matrix"]
    end

    block:L4["⚡ CAMADA 4 — SKILLS"]
        D1["74 Skills"] D2["User-Invocable"] D3["Autocontidas"]
    end

    block:L5["👥 CAMADA 5 — SQUADS"]
        E1["17 Squads Especializados"]
    end

    block:L6["🧠 CAMADA 6 — CONSCIOUSNESS ENGINE"]
        F1["Episodic Memory"] F2["Metacognition"] F3["Global Workspace (GWT)"]
    end

    block:L7["🔗 CAMADA 7 — NERVOUS SYSTEM"]
        G1["Feedback Loop"] G2["Broadcast/Mailbox"] G3["Pattern Library"]
    end

    block:L8["🔧 CAMADA 8 — HOOKS & AUTOMAÇÃO"]
        H1["Pre-tool Hooks"] H2["Consolidation"] H3["Cron Jobs"]
    end

    L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7 --> L8
```

---

## Organograma — 8 Departamentos

```mermaid
graph TD
    CEO["🏢 SEGUNDA-FEIRA<br/>52+ Agentes | 8 Departamentos"]

    CEO --> DIR["👔 Diretoria<br/>Nexo · Orion · Advisory Board"]
    CEO --> ENG["💻 Engenharia<br/>Morgan · Dex · Quinn · Aria<br/>Gage · Dara · Pax · River · Craft · Uma"]
    CEO --> MKT["📢 Marketing<br/>Trig · Luna · Dash<br/>Copywriter · Creative Dir · CRO"]
    CEO --> COM["💰 Comercial<br/>Max · Nico · Primo · Apex · Zap"]
    CEO --> FIN["📊 Financeiro<br/>Nova · Flex · Finn"]
    CEO --> CS["❤️ CS<br/>Care · Pulse"]
    CEO --> OPS["⚙️ Operações<br/>Ori · Sentinel · Wire"]
    CEO --> PRD["🎓 Produto<br/>Kai · Sage · Eve · Atlas<br/>Market Intel · Launch Strategist"]

    style CEO fill:#1a1a2e,stroke:#00D26A,stroke-width:3px,color:#fff
    style DIR fill:#16213e,stroke:#8B5CF6,color:#fff
    style ENG fill:#16213e,stroke:#3B82F6,color:#fff
    style MKT fill:#16213e,stroke:#F59E0B,color:#fff
    style COM fill:#16213e,stroke:#EF4444,color:#fff
    style FIN fill:#16213e,stroke:#10B981,color:#fff
    style CS fill:#16213e,stroke:#EC4899,color:#fff
    style OPS fill:#16213e,stroke:#6366F1,color:#fff
    style PRD fill:#16213e,stroke:#14B8A6,color:#fff
```

---

## Story Development Cycle (SDC)

```mermaid
flowchart LR
    A["📝 CREATE<br/><i>@sm cria story</i>"] --> B["✅ VALIDATE<br/><i>@po valida</i>"]
    B -->|"GO ≥7/10"| C["🔨 IMPLEMENT<br/><i>@dev desenvolve</i>"]
    B -->|"NO-GO"| A
    C --> D["🔍 QA GATE<br/><i>@qa revisa</i>"]
    D -->|"PASS"| E["🚀 DEPLOY<br/><i>@devops push</i>"]
    D -->|"FAIL"| F["🔄 QA LOOP<br/><i>max 5 iter</i>"]
    F --> C

    style A fill:#1e293b,stroke:#8B5CF6,color:#fff,stroke-width:2px
    style B fill:#1e293b,stroke:#F59E0B,color:#fff,stroke-width:2px
    style C fill:#1e293b,stroke:#3B82F6,color:#fff,stroke-width:2px
    style D fill:#1e293b,stroke:#EF4444,color:#fff,stroke-width:2px
    style E fill:#1e293b,stroke:#10B981,color:#fff,stroke-width:2px
    style F fill:#1e293b,stroke:#6366F1,color:#fff,stroke-width:2px
```

---

## Agentes

### 28 Agentes Especialistas (`agents/`)

| Agente | Persona | Domínio |
|--------|---------|---------|
| @dev | Dex | Full-stack, SDC Fase 3, CodeRabbit self-healing |
| @traffic | Surge | Meta Ads, Escala Sobral, CPL/ROAS |
| @content | Luna | Conteúdo Instagram, Reels, carrosséis |
| @analyst | Aria | Análise de dados, relatórios, métricas |
| @automation-architect | Wire | n8n, Make, webhooks, pipelines |
| @cold-outreach | Hunter | Prospecção B2B, cold email |
| @growth-hacker | Surge | Algoritmos sociais, crescimento |
| @offer-engineer | Forge | Ofertas irrecusáveis, stack de valor |
| @prompt-engineer | Prism | Prompts avançados, safety |
| @rag-architect | Sage | RAG, vector stores, embeddings |
| @swarm-simulator | Swarm | MiroFish, simulação multi-agente |
| @vibe-coder | Blast | B.L.A.S.T., context engineering |
| @voice-ai-specialist | Vox | Voice AI, dublagem, TTS, ASR |
| @video-producer | Frame | Vídeo IA end-to-end, HeyGen, Kling |
| @advogado-do-diabo | — | Análise crítica, riscos |
| @mestre-do-conselho | — | Conselho deliberativo multi-perspectiva |
| @contract-analyst | Lex | Análise de contratos, parecer B2B |
| @challenge-funnel | Storm | Challenge Funnel, 9 fases |
| @inema-scout | Scout | Monitora grupos INEMA + YouTube |
| @tool-curator | Lens | Curadoria de ferramentas IA |
| *+ 8 mais* | | *Copy, Creative, CRO, Launch, Market Intel, WhatsApp, Workflow, WA Specialist* |

### 31 Agentes Core (`commands/`)

Nexo, Orion, Advisory Board, Morgan, Dex, Quinn, Aria, Gage, Dara, Pax, River, Craft, Uma, Trig, Luna, Dash, Copywriter, Creative Director, CRO, Max, Nico, Primo, Apex, Zap, Nova, Flex, Finn, Care, Pulse, Ori, Sentinel, e mais.

---

## Skills

74 skills invocáveis com `/skill-name`:

<details>
<summary><b>Ver todas as 74 skills</b></summary>

| Categoria | Skills |
|-----------|--------|
| **Tráfego** | /paid-ads, /meta-ads-campaign, /proactive-ads, /reel-to-meta-ad, /traffic-autopilot, /campaign-builder |
| **Copy & Conteúdo** | /copywriting, /ad-creative, /creative-validator, /social-content, /proactive-content, /content-brief, /content-pipeline, /highlight-hunter |
| **Lançamento** | /launch-strategy, /launch-funnel, /launch-dashboard, /lead-magnets, /plan-launch |
| **Marca** | /brand-identity, /brand-reverse |
| **CRO** | /page-cro |
| **Prospecção** | /cold-outreach-campaign, /lead-finder, /proactive-leads |
| **Agentes & Framework** | /agent-engineer, /agent-council, /skill-creator, /skill-builder, /skill-generator, /self-optimize, /agent-surveillance |
| **Consciousness** | /consciousness, /reflect |
| **Vídeo** | /video-to-pdf, /video-avatar, /video-to-website, /remotion-video, /voice-dubbing, /youtube-transcript |
| **Automação** | /n8n-workflows, /vps-setup, /deploy-orchestra, /sync-daemon, /github-vercel-deploy |
| **IA & RAG** | /rag-builder, /swarm-simulation, /algorithm-hack, /banana-image-gen |
| **Pesquisa** | /analyze-competitors, /research, /micro-trend, /marketing-psychology |
| **Operações** | /daily-briefing, /daily-scan, /weekly-sync, /feed-results, /pattern-detector, /predict, /magic-docs, /proactive-monitor, /ops-catalog, /error-handling |
| **WhatsApp** | /whatsapp-bot, /channels |
| **Web** | /site-cloning, /one-prompt-website, /firecrawl-scraper, /reddit-scraper |
| **Produtos** | /offer-optimizer, /eduzz-products, /flutter-app, /gohighlevel-convert |
| **Estratégia** | /planning, /brainstorming, /ceo-mode |

</details>

---

## Rules

16 regras que governam o framework:

| Rule | Governa |
|------|---------|
| `workflow-execution.md` | SDC phases, QA Loop, Spec Pipeline, Brownfield Discovery |
| `story-lifecycle.md` | Status progression, validation checklist, QA gates |
| `agent-authority.md` | Delegation matrix — quem pode fazer o quê |
| `ids-principles.md` | REUSE > ADAPT > CREATE hierarchy |
| `coderabbit-integration.md` | Self-healing config, severity handling |
| `external-api-patterns.md` | SYNC > CACHE > REAL-TIME for APIs |
| `mcp-usage.md` | MCP server governance and tool selection |
| `eros-quality.md` | 5 quality gates, failure taxonomy |
| `model-routing.md` | Roteamento Opus/Sonnet/Haiku por tarefa |
| `confidence-guardrails.md` | Confidence score 0-1 em afirmações |
| `feedback-loop.md` | Consulta obrigatória de resultados |
| `initiative-protocol.md` | Matriz para ações proativas |
| `creativity-protocol.md` | 3 etapas: convencional, analogia, inversão |
| `agent-communication.md` | Mailbox inter-agente, 3 modos |
| `handoff-protocol.md` | Passagem de bastão obrigatória |
| `consciousness-engine.md` | Memória episódica, metacognição, workspace global |

---

## Instalação

### Via npm (recomendado)

```bash
npm install -g segunda-feira
```

### Via curl

```bash
curl -fsSL https://raw.githubusercontent.com/DOMINA-IA/segunda-feira/main/scripts/install.sh | bash
```

### Manual

```bash
git clone https://github.com/DOMINA-IA/segunda-feira.git
cd segunda-feira

# Copiar para Claude Code
cp -r agents/ ~/.claude/agents/
cp -r skills/ ~/.claude/skills/
cp -r rules/ ~/.claude/rules/
cp -r commands/ ~/.claude/commands/
cp -r hooks/ ~/.claude/hooks/
cp -r consciousness/ ~/consciousness/
cp CLAUDE.md ~/.claude/CLAUDE.md
```

### Pré-requisitos

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) instalado
- [Node.js](https://nodejs.org/) >= 16
- Git

---

## Estrutura

```
segunda-feira/
├── CLAUDE.md                    # Constituição v7.0
├── agents/                      # 28 agentes especialistas
├── commands/                    # 31 agentes core + commands
├── skills/                      # 74 skills invocáveis
├── rules/                       # 16 regras de governança
├── consciousness/               # 🧠 Consciousness Engine v1.0
│   ├── memory/
│   │   ├── episodic/            #   Eventos + valência afetiva
│   │   ├── semantic/            #   Knowledge graph
│   │   ├── procedural/          #   Heurísticas aprendidas
│   │   ├── prospective/         #   Intenções futuras
│   │   └── consolidation/       #   Logs de consolidação
│   ├── metacognition/           #   Reflexões por agente
│   ├── workspace/               #   Workspace global (GWT)
│   └── scripts/                 #   record, consolidate, reflect, workspace
├── hooks/                       # Pre-tool hooks & automação
├── organization/                # 8 departamentos
├── docs/                        # Arquitetura + Workflows
├── data/                        # IDS Registry + Smart Router
├── templates/                   # Decision Log
└── scripts/                     # Instalador + Health Check
```

---

## Metodologias integradas

<table>
<tr>
<td width="33%">

**Desenvolvimento**
- IDS — REUSE > ADAPT > CREATE
- CodeRabbit — Self-healing
- EROS — 5 portões de qualidade
- B.L.A.S.T. — Context engineering
- MiroFish — Simulação multi-agente

</td>
<td width="33%">

**Marketing & Vendas**
- Pedro Sobral — Escala Meta Ads
- Alex Hormozi — Ofertas irrecusáveis
- Brian Manon — Creative velocity
- Motion — Analytics de criativos
- SPIN Selling — High-ticket closing

</td>
<td width="33%">

**Consciência**
- Global Workspace Theory (Baars)
- Marcadores somáticos (Damásio)
- Reflexion (Shinn et al.)
- Society of Mind (Minsky)
- Memória episódica (Tulving)

</td>
</tr>
</table>

---

## Changelog

### V7.0 (2026-04-06) — Consciousness Engine

- **Consciousness Engine v1.0** — 3 camadas: memória profunda, metacognição, workspace global (GWT)
- **Memória episódica** com valência afetiva (marcadores somáticos computacionais)
- **Knowledge graph semântico** — fatos consolidados automaticamente
- **Heurísticas procedurais** — regras aprendidas: "Quando X, fazer Y porque Z"
- **Metacognição** — reflexão por agente com taxa de sucesso, valência, recomendação
- **Workspace Global** — atenção seletiva coletiva com competição, saliência e ignição
- **Consolidação noturna** — cron que extrai padrões dos episódios ("sono")
- **On Completion Protocol** — agentes registram episódios automaticamente (MUST)
- **+7 agentes especialistas** (21 → 28): dev, traffic, content, analyst, inema-scout, tool-curator, video-producer
- **+6 skills** (68 → 74): /consciousness, /reflect, /carousel-3d, /empire-landing, /sync-daemon
- **+1 rule** (15 → 16): consciousness-engine.md
- **Dados sanitizados** para release open source

### V6.3 (2026-04-01) — Nervous System & Proactive Agents

- +49 skills (20 → 68), +7 rules (8 → 15), +3 agentes (18 → 21)
- Nervous System: Feedback Loop, Broadcast, Mailbox, Pattern Library
- Hooks: check-acentos, synapse-engine, session-digest
- Handoff Protocol, Model Routing, Confidence Guardrails, Creativity Protocol

### V6.0 (2026-03-29) — Intelligence Layer

- Health Check (41 verificações), IDS Registry, Smart Router, Architecture Doc

### V5.0 (2026-03-20) — Consolidation

### V3.0 (2026-03-18) — Foundation

---

## Licença

MIT License — use, modifique e distribua livremente.

---

<div align="center">

*Segunda-feira v7.0 — 52+ agentes. 74 skills. 16 rules. Consciousness Engine. Memória que aprende. Squad que pensa. O terror do CLT.*

**[DOMINA.IA](https://github.com/DOMINA-IA)**

</div>
