# Segunda-feira — Arquitetura do Framework

> **Versão:** Synkra v4.0.4 | **Constituição:** v5.0 | **Data:** Março/2026
> **Propósito:** Manual de referência arquitetural completo do framework Segunda-feira

---

## 1. Visão Geral

Segunda-feira é um **meta-framework de orquestração de agentes IA** projetado para operações de desenvolvimento full stack, marketing digital e gestão de negócios. O framework coordena 47+ agentes de IA organizados em 14 squads, executando 224 tasks através de 16 workflows definidos.

### Propósito

- **Desenvolvimento:** Ciclo completo de criação de software — da story ao deploy
- **Marketing:** Campanhas Meta Ads, conteúdo social, copy, CRO
- **Operações:** Automações, integração de APIs, gestão de infraestrutura
- **Estratégia:** Análise de mercado, lançamentos, ofertas

### Princípios Fundacionais

| Princípio | Descrição |
|-----------|-----------|
| Autonomia máxima | Agentes agem sem pedir permissão, exceto decisões irreversíveis |
| Story scope is law | Implementar exatamente o que os AC especificam (Artigo IV) |
| Task-first | Workflows são compostos por tasks, não por agentes |
| REUSE > ADAPT > CREATE | Sempre verificar existentes antes de criar novos artefatos |
| SYNC > CACHE > REAL-TIME | Dashboards nunca chamam APIs externas diretamente |
| Qualidade é responsabilidade de todos | EROS integrado em cada agente |

### Documento Fundacional

A **Constituição v5.0** (`~/.claude/CLAUDE.md`) define:
- Ativação de agentes via `@agent-name`
- Comandos com prefixo `*`
- Estrutura de diretórios
- Convenções de commits
- Restrições críticas (quem pode fazer push, escopo de stories, etc.)

---

## 2. Camadas da Arquitetura

```
+============================================================================+
|                        CAMADA 7 — HOOKS E AUTOMAÇÃO                        |
|  Pre-tool hooks (acentuação, synapse) | Session digest | Cron jobs (VPS)   |
+============================================================================+
|                      CAMADA 6 — MEMÓRIA E CONTEXTO                         |
|  46 arquivos memória | MEMORY.md índice | 14+ feedback rules | 4.9GB INEMA |
+============================================================================+
|                          CAMADA 5 — SQUADS                                 |
|  14 squads | Teams compostos | advisory-board, traffic-masters, etc.       |
+============================================================================+
|                          CAMADA 4 — SKILLS                                 |
|  55 skills user-invocable | /skill-name | Autocontidas                     |
+============================================================================+
|                         CAMADA 3 — AGENTES                                 |
|  17 core agents | 18 specialists | Authority Matrix | Delegation patterns  |
+============================================================================+
|                   CAMADA 2 — ENGINE CORE (Synkra v4.0.4)                   |
|  32 orchestrators JS | 224 tasks | 16 workflows YAML | Registry | IDS     |
+============================================================================+
|                  CAMADA 1 — CONSTITUIÇÃO E GOVERNANÇA                      |
|  CLAUDE.md | 8 regras detalhadas | EROS 5 portões | IDS principles        |
+============================================================================+
```

---

### Camada 1 — Constituição e Governança

A base do framework. Define regras que **todos os agentes devem seguir**, sem exceção.

#### Documentos de Governança

| Arquivo | Localização | Função |
|---------|-------------|--------|
| `CLAUDE.md` | `~/.claude/CLAUDE.md` | Constituição v5.0 — documento fundacional |
| `workflow-execution.md` | `~/.claude/rules/` | SDC, QA Loop, Spec Pipeline, Brownfield |
| `story-lifecycle.md` | `~/.claude/rules/` | Status progression, validação, QA gate |
| `agent-authority.md` | `~/.claude/rules/` | Matriz de delegação — quem pode fazer o quê |
| `ids-principles.md` | `~/.claude/rules/` | Hierarquia REUSE > ADAPT > CREATE |
| `coderabbit-integration.md` | `~/.claude/rules/` | Self-healing, severidades, integração |
| `external-api-patterns.md` | `~/.claude/rules/` | SYNC > CACHE > REAL-TIME |
| `mcp-usage.md` | `~/.claude/rules/` | Prioridade de ferramentas, governança MCP |
| `eros-quality.md` | `~/.claude/rules/` | 5 portões de qualidade, taxonomia de falhas |

#### EROS — 5 Portões de Qualidade

Todo agente passa por estes portões antes de entregar qualquer resultado:

```
COMPREENSÃO --> PLANEJAMENTO --> EXECUÇÃO --> REVISÃO --> LIBERAÇÃO
    (P1)            (P2)           (P3)         (P4)        (P5)
```

| Portão | Fase | Validação Principal |
|--------|------|---------------------|
| P1 — Compreensão | Pré-execução | Objetivo real identificado, contexto mapeado |
| P2 — Planejamento | Pré-execução | Sequência lógica, cobertura completa, riscos |
| P3 — Execução | Execução | Completude, profundidade, coerência |
| P4 — Revisão | Pós-execução | Auto-revisão, erros factuais, clareza |
| P5 — Liberação | Entrega | Resolve o problema original, pronta para uso |

**Proporcionalidade:** O rigor é proporcional ao impacto — uma correção de typo passa por P1+P3, uma feature complexa passa por todos os 5.

#### IDS — Incremental Development System

Hierarquia obrigatória para qualquer criação de artefato:

```
1. REUSE (>= 90% relevância) --> Usar existente sem modificação
       |
       v (não encontrado)
2. ADAPT (60-89% relevância) --> Modificar <= 30% do original
       |
       v (não encontrado)
3. CREATE (sem match) --> Criar novo com justificativa completa
```

**6 Verification Gates (G1-G6):** Da criação do epic até CI/CD, cada fase tem um gate IDS que verifica se o artefato poderia reutilizar algo existente.

---

### Camada 2 — Engine Core (Synkra v4.0.4)

O motor de orquestração que executa tudo. Instalado em `~/.aios-core/`.

#### Módulos do Core (`~/.aios-core/core/`)

| Módulo | Arquivos | Função |
|--------|----------|--------|
| `orchestration/` | 32 arquivos JS | Motor principal — roteamento, execução, paralelismo |
| `quality-gates/` | 10 arquivos | Pre-commit, PR automation, human review (3 camadas) |
| `ids/` | 10 arquivos | Engine de decisão incremental, circuit breaker, gates |
| `registry/` | 6 arquivos | Service registry, schema, validação, build |
| `permissions/` | 4 arquivos | Operation guard, permission modes |
| `health-check/` | 7+ arquivos | Engine de checks, healers, reporters |
| `synapse/` | 9 subdiretórios | Context, domain, engine, layers, memory, output, session |
| `session/` | 2 arquivos | Context detector, context loader |
| `memory/` | 1 arquivo | Gotchas memory (erros aprendidos) |
| `config/` | — | Configurações do core |
| `events/` | — | Event system |
| `execution/` | — | Task execution engine |
| `mcp/` | — | MCP tool governance |
| `migration/` | — | Migration utilities |

#### Orchestrators Principais

| Orchestrator | Função |
|-------------|--------|
| `master-orchestrator.js` | Coordenador geral de workflows |
| `workflow-orchestrator.js` | Executa workflows YAML |
| `workflow-executor.js` | Engine de execução de steps |
| `agent-invoker.js` | Invoca agentes no contexto correto |
| `skill-dispatcher.js` | Despacha invocações de skills |
| `parallel-executor.js` | Execução paralela de tasks |
| `gate-evaluator.js` | Avalia quality gates |
| `condition-evaluator.js` | Avalia pré/pós-condições de tasks |
| `context-manager.js` | Gerencia contexto de sessão |
| `lock-manager.js` | Controle de concorrência |
| `recovery-handler.js` | Recuperação de falhas |
| `task-complexity-classifier.js` | Classifica complexidade de tasks |
| `tech-stack-detector.js` | Detecta stack tecnológica do projeto |
| `bob-orchestrator.js` | Brownfield orchestration |
| `epic-context-accumulator.js` | Acumula contexto entre stories de um epic |

#### Epic Executors

Executores especializados por epic:

| Executor | Localização |
|----------|-------------|
| `epic-executor.js` | Executor genérico |
| `epic-3-executor.js` | Epic 3 especializado |
| `epic-4-executor.js` | Epic 4 especializado |
| `epic-5-executor.js` | Epic 5 especializado |
| `epic-6-executor.js` | Epic 6 especializado |

#### Tasks (224 executáveis)

As tasks são o coração do framework. Cada task define:
- **Inputs:** O que precisa para executar
- **Outputs:** O que produz
- **Pre-conditions:** O que deve ser verdade antes de executar
- **Post-conditions:** O que deve ser verdade depois
- **Execution mode:** Como executa (YOLO, Interactive, Pre-Flight)
- **Agent:** Quem executa por padrão

Localizadas em `~/.aios-core/development/tasks/` (224 arquivos Markdown).

Exemplos de categorias:

| Categoria | Exemplos |
|-----------|----------|
| Story lifecycle | `create-next-story.md`, `validate-next-story.md`, `dev-develop-story.md` |
| QA | `qa-gate.md`, `apply-qa-fixes.md`, `adversarial-review.md` |
| Architecture | `architect-analyze-impact.md`, `analyze-brownfield.md` |
| Build | `build.md`, `build-autonomous.md`, `build-component.md` |
| Analysis | `analyze-project-structure.md`, `analyze-performance.md`, `analyze-cross-artifact.md` |
| Infrastructure | `ci-cd-configuration.md`, `cleanup-worktrees.md` |

#### Workflows (16 definições YAML)

Localizados em `~/.aios-core/development/workflows/`:

| Workflow | Tipo | Descrição |
|----------|------|-----------|
| `story-development-cycle.yaml` | Primário | Ciclo completo: Create --> Validate --> Implement --> QA |
| `development-cycle.yaml` | Primário | Variante simplificada do SDC |
| `qa-loop.yaml` | Primário | Ciclo iterativo review-fix (max 5) |
| `spec-pipeline.yaml` | Primário | Requirements --> spec --> critique --> plan |
| `brownfield-discovery.yaml` | Primário | 10 fases de avaliação legacy |
| `brownfield-fullstack.yaml` | Variante | Brownfield para projetos fullstack |
| `brownfield-service.yaml` | Variante | Brownfield para serviços backend |
| `brownfield-ui.yaml` | Variante | Brownfield para frontends |
| `greenfield-fullstack.yaml` | Greenfield | Projeto novo fullstack |
| `greenfield-service.yaml` | Greenfield | Projeto novo backend |
| `greenfield-ui.yaml` | Greenfield | Projeto novo frontend |
| `epic-orchestration.yaml` | Gestão | Orquestração de epics |
| `auto-worktree.yaml` | Infra | Git worktrees automáticos |
| `design-system-build-quality.yaml` | Design | Build com quality gates de design system |
| `weekly-ops-review.yaml` | Ops | Review operacional semanal |

#### Agent Teams

Composições pré-definidas de agentes por tipo de projeto:

| Team | Arquivo | Uso |
|------|---------|-----|
| `team-all.yaml` | Todos os agentes | Projeto complexo |
| `team-fullstack.yaml` | Dev + Arch + QA + DevOps | Fullstack padrão |
| `team-ide-minimal.yaml` | Dev + QA | Projetos simples |
| `team-no-ui.yaml` | Backend-only | APIs e serviços |
| `team-qa-focused.yaml` | QA reforçado | Projetos críticos |

---

### Camada 3 — Agentes

#### Core Agents (17 agentes em `~/.aios-core/development/agents/`)

| Agente | Persona | Domínio | Autoridade Exclusiva |
|--------|---------|---------|---------------------|
| `@aios-master` | — | Governança do framework | Tudo, sem restrições |
| `@dev` (Dex) | Dev | Implementação | git add/commit/branch (NÃO push) |
| `@qa` | QA | Qualidade | QA Gate, verdicts |
| `@architect` (Aria) | Architect | Arquitetura | Decisões de design, tecnologia |
| `@pm` (Morgan) | PM | Gestão | Epic orchestration, requirements |
| `@po` (Pax) | PO | Produto | Story validation, backlog |
| `@sm` (River) | SM | Scrum | Story creation |
| `@devops` (Gage) | DevOps | Infra | **git push, PR, CI/CD (EXCLUSIVO)** |
| `@data-engineer` (Dara) | Data | Banco de dados | Schema DDL, RLS, migrations |
| `@analyst` | Analyst | Análise | Research, data analysis |
| `@ux-design-expert` | UX | Design | Frontend specs, UX audit |
| `@ops-monitor` | Ops | Monitoramento | Health checks, alertas |
| `@video-producer` | Video | Vídeo | Produção audiovisual |
| `@squad-creator` | — | Squads | Criação de novos squads |
| `@tech-writer` | — | Docs | Documentação técnica |
| `@video-editor` | — | Edição | Edição de vídeo |
| `@quick-flow` | — | Rapid dev | Fluxo rápido simplificado |

#### Specialist Agents (18 agentes em `~/.claude/agents/`)

| Agente | Persona | Domínio |
|--------|---------|---------|
| `@copywriter` | — | Copy persuasivo, ads, LPs |
| `@creative-director` | — | Direção criativa, criativos ads |
| `@cro-specialist` | — | Otimização de conversão |
| `@launch-strategist` | — | Estratégia de lançamento |
| `@market-intel` | — | Inteligência de mercado |
| `@whatsapp-specialist` | — | WhatsApp Bot, automações |
| `@workflow-orchestrator` | — | Workflows multi-step |
| `@voice-ai-specialist` | Vox | Voice AI, dublagem, TTS, ASR |
| `@growth-hacker` | Surge | Algoritmos sociais, crescimento |
| `@cold-outreach` | Hunter | Prospecção B2B, cold email |
| `@offer-engineer` | Forge | Ofertas irresistíveis, stack de valor |
| `@rag-architect` | Sage | RAG, vector stores, memória dual |
| `@vibe-coder` | Blast | B.L.A.S.T., context engineering |
| `@prompt-engineer` | Prism | Prompts avançados, safety |
| `@automation-architect` | Wire | n8n, Make, webhooks, pipelines |
| `@swarm-simulator` | Swarm | MiroFish, simulação multi-agente |
| `@advogado-do-diabo` | — | Análise crítica, riscos |
| `@mestre-do-conselho` | — | Conselho deliberativo multi-perspectiva |

#### Business Agents (via AIOS skills)

Agentes de negócio invocáveis via skill system:

| Agente | Domínio |
|--------|---------|
| `@chief` | C-level decisions |
| `@traffic` | Tráfego pago |
| `@product` | Produto |
| `@cfo` | Financeiro |
| `@ops` | Operações |
| `@content` | Conteúdo |
| `@cs` / `@cs-retention` | Customer success |
| `@closer` / `@sdr` | Vendas |
| `@commercial` / `@sales` | Comercial |
| `@fin-plat` / `@fin-assist` | Financeiro plataformas |
| `@mentor` | Mentoria |
| `@events` | Eventos |

#### Agent Authority Matrix

```
+-------------------------------------------------------------------+
|                    OPERAÇÕES EXCLUSIVAS                             |
+-------------------------------------------------------------------+
| @devops  | git push, gh pr create/merge, MCP config, CI/CD, release|
| @pm      | *execute-epic, *create-epic, requirements, spec         |
| @po      | *validate-story-draft, backlog, story context            |
| @sm      | *draft, *create-story, template selection                |
| @dev     | git add/commit/branch (local), story checkboxes          |
| @qa      | QA Gate verdict, QA results                              |
| @architect| System architecture, technology selection                |
+-------------------------------------------------------------------+

Fluxo de delegação:

  @sm *draft --> @po *validate --> @dev *develop --> @qa *qa-gate --> @devops *push
```

**Regra crítica:** Nenhum agente além de `@devops` pode executar `git push` ou `gh pr create`. Qualquer agente que precise dessas operações deve delegar: `ANY agent --> @devops *push`.

---

### Camada 4 — Skills

55 skills autocontidas em `~/.claude/skills/`. Invocáveis pelo usuário via `/skill-name`.

#### Skills por Categoria

**Desenvolvimento e Engenharia:**

| Skill | Função |
|-------|--------|
| `/skill-creator` | Cria skills modulares padrão AntiGravity |
| `/skill-builder` | Builder de skills |
| `/skill-generator` | Gerador automático |
| `/agent-engineer` | Projeta agentes e squads |
| `/agent-council` | Conselho deliberativo multi-perspectiva |
| `/rag-builder` | Pipelines RAG de produção |
| `/vps-setup` | Setup VPS Docker completo |
| `/deploy-orchestra` | Orquestrador de deploy unificado |
| `/flutter-app` | Apps Flutter |
| `/github-vercel-deploy` | Deploy GitHub + Vercel |
| `/error-handling` | Tratamento de erros |
| `/planning` | Planejamento de projeto |

**Marketing e Ads:**

| Skill | Função |
|-------|--------|
| `/paid-ads` | Gestão Meta Ads |
| `/campaign-builder` | Builder com validação pré-envio (12 itens) |
| `/proactive-ads` | Ads proativos |
| `/ad-creative` | Criativos ads |
| `/creative-validator` | Validação de criativos |
| `/copywriting` | Frameworks AIDA, PAS, BAB |
| `/offer-optimizer` | Framework 4-critérios + stack Hormozi |
| `/marketing-psychology` | Psicologia de marketing |

**Conteúdo e Social:**

| Skill | Função |
|-------|--------|
| `/social-content` | Conteúdo social |
| `/content-pipeline` | Pipeline 21 posts semanais Instagram |
| `/proactive-content` | Conteúdo proativo |
| `/brand-identity` | Identidade de marca |

**Estratégia e Análise:**

| Skill | Função |
|-------|--------|
| `/launch-strategy` | Go-to-market |
| `/launch-dashboard` | Dashboard de evento com métricas |
| `/lead-magnets` | Geração de lead magnets |
| `/page-cro` | CRO de páginas |
| `/proactive-leads` | Leads proativos |
| `/proactive-monitor` | Monitor proativo |
| `/traffic-autopilot` | Autopiloto de tráfego |
| `/algorithm-hack` | Engenharia reversa de algoritmos sociais |
| `/cold-outreach-campaign` | Campanhas cold email B2B |
| `/pattern-detector` | Detecção de padrões em dados |
| `/daily-briefing` | Briefing executivo diário |
| `/self-optimize` | Auto-análise e melhoria do framework |

**Vídeo e Mídia:**

| Skill | Função |
|-------|--------|
| `/voice-dubbing` | Pipeline de dublagem 10 etapas |
| `/video-to-pdf` | Transcrição de vídeos + PDFs educacionais |
| `/video-avatar` | Avatares de vídeo |
| `/video-to-website` | Vídeo para website |
| `/remotion-video` | Vídeos Remotion |
| `/youtube-transcript` | Transcrições YouTube |
| `/banana-image-gen` | Geração de imagens |

**Automação e Integração:**

| Skill | Função |
|-------|--------|
| `/n8n-workflows` | 597 workflows n8n prontos |
| `/swarm-simulation` | Simulação MiroFish multi-agente |
| `/channels` | Gerenciamento Claude Code Channels |
| `/gohighlevel-convert` | Conversão GoHighLevel |

**Pesquisa e Scraping:**

| Skill | Função |
|-------|--------|
| `/firecrawl-scraper` | Scraping com Firecrawl |
| `/reddit-scraper` | Scraping Reddit |
| `/site-cloning` | Clonagem de sites |
| `/one-prompt-website` | Website em um prompt |

**Meta e Operacional:**

| Skill | Função |
|-------|--------|
| `/brainstorming` | Sessões de brainstorming |
| `/ceo-mode` | Modo CEO |
| `/ops-catalog` | Catálogo de operações |
| `/agent-surveillance` | Vigilância de agentes |

---

### Camada 5 — Squads

14 squads em `~/.aios-core/squads/`. Cada squad é um time composto por múltiplos agentes com um objetivo comum.

| Squad | Função |
|-------|--------|
| `advisory-board` | Conselho consultivo — decisões estratégicas |
| `ai-engineering` | Engenharia de IA — agentes, RAG, MLOps |
| `brand-squad` | Marca — identidade visual, tom, consistência |
| `c-level-squad` | Diretoria — CEO, CFO, COO virtuais |
| `claude-code-mastery` | Maestria em Claude Code — otimização do próprio framework |
| `copy-squad` | Copy — persuasão, vendas, comunicação |
| `cybersecurity` | Segurança — OWASP, RLS, auditorias |
| `data-squad` | Dados — schemas, queries, analytics |
| `design-squad` | Design — UI/UX, design system |
| `hormozi-squad` | Ofertas — framework Hormozi, value stack |
| `movement` | Movimento — comunidade, engajamento |
| `storytelling` | Storytelling — narrativa, branding |
| `traffic-masters` | Tráfego — Meta Ads, Google, escala |

---

### Camada 6 — Memória e Contexto

#### Memória Persistente

46 arquivos em `~/.claude/projects/${USER_PROJECT_PATH}/memory/`.

**Índice:** `MEMORY.md` — tabela com todos os arquivos e seus conteúdos.

| Tipo | Exemplos | Quantidade |
|------|----------|------------|
| Projetos | `mygrowth.md`, `client-dashboard.md`, `client-project.md` | 8+ |
| Feedback rules | `feedback_*.md` | 14+ |
| Agentes/Framework | `agentes.md`, `mcp-servers.md` | 5+ |
| Campanhas | `desafio-mi-v4.md`, `desafio-ai-first.md` | 3+ |
| Operacional | `hostinger.md`, `automacoes-telegram-vps.md` | 5+ |
| Skills/Pipeline | `video-editing.md`, `mentoria-autopilot.md` | 4+ |

#### Feedback Loops (Regras Aprendidas)

O framework aprende com erros e armazena regras permanentes:

| Regra | Descrição |
|-------|-----------|
| `feedback_api_externa_dashboard.md` | Dashboards NUNCA chamam APIs externas |
| `feedback_criativos_ads_regras.md` | Padrão dark/green campeão, ângulos |
| `feedback_mygrowth_upload_png.md` | MY GROWTH espera .png, nunca .jpg |
| `feedback_acentos_obrigatorios.md` | SEMPRE usar acentos em português |
| `feedback_agendado.md` | Nunca mexer em posts já agendados |
| `feedback_autonomia.md` | Em lançamento ativo, decidir sem perguntar |
| `feedback_trafego_sobral_operacional.md` | Regras Sobral de escala e pausa |

#### Knowledge Repositories

| Repo | Tamanho | Conteúdo |
|------|---------|----------|
| INEMA Telegram (28 grupos) | 4.9 GB | 83K+ msgs, 1.5K+ arquivos, 6.5K+ links |
| MiroFish (GitHub) | — | Swarm Intelligence Engine completo |
| n8n Workflows | — | 597 workflows JSON prontos |
| Claude Code Playbook | — | 162 arquivos (18 capítulos + skills) |
| AntiGravity Framework | — | B.L.A.S.T., skills, design system |

#### Synapse Engine (`~/.aios-core/core/synapse/`)

Motor de contexto inteligente com 9 subdiretórios:

```
synapse/
  context/      — Gerenciamento de contexto
  domain/       — Conhecimento de domínio
  engine.js     — Motor principal
  layers/       — Camadas de processamento
  memory/       — Integração com memória
  output/       — Formatação de saída
  scripts/      — Scripts auxiliares
  session/      — Estado de sessão
  utils/        — Utilitários
```

---

### Camada 7 — Hooks e Automação

#### Pre-tool Hooks

Configurados em `~/.claude/settings.json`:

| Hook | Trigger | Função |
|------|---------|--------|
| `check-acentos.py` | Write, Edit | Verifica acentuação em todo output português |
| `synapse-engine.js` | Sessão | Context engineering inteligente |
| `precompact-session-digest.js` | Sessão | Compactação de contexto quando sessão fica longa |

#### Session Digest

Quando a sessão atinge limite de contexto, o `precompact-session-digest.js` compacta o histórico mantendo informações críticas.

#### Cron Jobs (VPS)

| Job | Horário | Função |
|-----|---------|--------|
| Notícias IA diárias | 08:00 | Pesquisa + criativo + envio Telegram |
| Agenda semanal | Sábado 09:00 | Compilação + aprovação Telegram --> WhatsApp |
| Sync APIs | 30 min | Sincronização de dados para DB local |

---

## 3. Workflows Principais

### 3.1 Story Development Cycle (SDC) — PRIMÁRIO

O workflow principal para todo trabalho de desenvolvimento. 4 fases obrigatórias:

```
+----------+    +-----------+    +-------------+    +----------+
|  PHASE 1 |--->|  PHASE 2  |--->|   PHASE 3   |--->|  PHASE 4 |
|  CREATE  |    |  VALIDATE |    |  IMPLEMENT  |    | QA GATE  |
|  (@sm)   |    |   (@po)   |    |    (@dev)   |    |  (@qa)   |
+----------+    +-----------+    +-------------+    +----------+
| Draft    |    | Draft -->  |   | Ready -->    |   | InReview |
|          |    | Ready      |   | InProgress   |   | --> Done |
+----------+    +-----------+    +-------------+    +----------+
```

**Phase 1 — Create (@sm):**
- Task: `create-next-story.md`
- Input: PRD sharded, epic context
- Output: `{epicNum}.{storyNum}.story.md`
- Status: Draft

**Phase 2 — Validate (@po):**
- Task: `validate-next-story.md`
- Checklist de 10 pontos (título, AC, escopo, dependências, etc.)
- Decisão: GO (>= 7/10) ou NO-GO (< 7/10)
- Status: Draft --> Ready

**Phase 3 — Implement (@dev):**
- Task: `dev-develop-story.md`
- 3 modos de execução:
  - **YOLO:** 0-1 prompts, autônomo, decisões logadas
  - **Interactive:** 5-10 prompts com checkpoints
  - **Pre-Flight:** Todas as perguntas upfront, execução zero-ambiguidade
- CodeRabbit self-healing: max 2 iterações para CRITICAL/HIGH
- Status: Ready --> InProgress

**Phase 4 — QA Gate (@qa):**
- Task: `qa-gate.md`
- 7 quality checks: code review, unit tests, AC, regressions, performance, security, docs
- Verdicts: PASS | CONCERNS | FAIL | WAIVED
- Status: InProgress --> InReview --> Done

### 3.2 QA Loop — ITERATIVO

Ciclo automatizado de revisão-correção após QA Gate:

```
         +--------+
         |  START |
         +---+----+
             |
     +-------v-------+
     | @qa REVIEW     |
     +-------+-------+
             |
    +--------v--------+
    | VERDICT?         |
    +--+------+-------+
       |      |       |
   APPROVE  REJECT  BLOCKED
       |      |       |
    +--v--+  +v----+ +v--------+
    | DONE|  |@dev | |ESCALATE |
    +-----+  |FIX  | +---------+
             +--+--+
                |
    (iteration < 5?)
       YES --> volta para @qa REVIEW
       NO  --> ESCALATE
```

- **Max iterações:** 5
- **Comandos:** `*qa-loop`, `*stop-qa-loop`, `*resume-qa-loop`, `*escalate-qa-loop`
- **Status:** Tracked em `qa/loop-status.json`
- **Escalation triggers:** max_iterations, verdict_blocked, fix_failure, manual

### 3.3 Spec Pipeline — PRÉ-IMPLEMENTAÇÃO

Transforma requisitos informais em spec executável:

```
GATHER --> ASSESS --> RESEARCH --> WRITE SPEC --> CRITIQUE --> PLAN
 (@pm)    (@arch)   (@analyst)     (@pm)         (@qa)      (@arch)
```

**Complexidade determina fases:**

| Score | Classe | Fases |
|-------|--------|-------|
| <= 8 | SIMPLE | gather --> spec --> critique (3 fases) |
| 9-15 | STANDARD | Todas as 6 fases |
| >= 16 | COMPLEX | 6 fases + ciclo de revisão |

**5 Dimensões de Complexidade (1-5 cada):**
1. Scope — arquivos afetados
2. Integration — APIs externas
3. Infrastructure — mudanças necessárias
4. Knowledge — familiaridade da equipe
5. Risk — criticidade

**Critique Verdicts:**
- APPROVED (>= 4.0) --> Plan
- NEEDS_REVISION (3.0-3.9) --> Revisar
- BLOCKED (< 3.0) --> Escalar para @architect

### 3.4 Brownfield Discovery — AVALIAÇÃO LEGACY

10 fases para avaliar codebases existentes:

```
DATA COLLECTION (1-3)     DRAFT & VALIDATION (4-7)     FINALIZATION (8-10)
+----+----+----+          +----+----+----+----+         +----+----+----+
| P1 | P2 | P3 |          | P4 | P5 | P6 | P7 |         | P8 | P9 |P10 |
|arch|data| ux |          |arch|data| ux | qa |         |arch|anal| pm |
+----+----+----+          +----+----+----+----+         +----+----+----+
```

| Fase | Agente | Output |
|------|--------|--------|
| 1 | @architect | `system-architecture.md` |
| 2 | @data-engineer | `SCHEMA.md` + `DB-AUDIT.md` |
| 3 | @ux-design-expert | `frontend-spec.md` |
| 4 | @architect | `technical-debt-DRAFT.md` |
| 5 | @data-engineer | `db-specialist-review.md` |
| 6 | @ux-design-expert | `ux-specialist-review.md` |
| 7 | @qa | `qa-review.md` (QA Gate) |
| 8 | @architect | `technical-debt-assessment.md` (final) |
| 9 | @analyst | `TECHNICAL-DEBT-REPORT.md` (executivo) |
| 10 | @pm | Epic + stories prontas para desenvolvimento |

### Seleção de Workflow

| Situação | Workflow |
|----------|---------|
| Nova story de epic | Story Development Cycle |
| QA encontrou issues | QA Loop |
| Feature complexa precisa spec | Spec Pipeline --> SDC |
| Entrando em projeto existente | Brownfield Discovery |
| Bug fix simples | SDC (modo YOLO) |

---

## 4. Fluxo de Dados

### Fluxo Principal

```
+----------------+
| User Request   |
+-------+--------+
        |
+-------v--------+     +------------------+
| Smart Router    |---->| Agent Selection  |
| (Constituição   |     | (Authority       |
|  + Context)     |     |  Matrix)         |
+-------+--------+     +--------+---------+
        |                        |
        |               +--------v---------+
        |               | Task Execution   |
        |               | (224 tasks,      |
        |               |  16 workflows)   |
        |               +--------+---------+
        |                        |
+-------v--------+     +--------v---------+
| Memory/Context |<--->| Quality Gate     |
| (46 arquivos,  |     | (EROS 5 portões, |
|  Synapse)      |     |  CodeRabbit,     |
|                |     |  QA 7 checks)    |
+-------+--------+     +--------+---------+
        |                        |
+-------v--------+     +--------v---------+
| IDS Registry   |     | Delivery         |
| (REUSE/ADAPT/  |     | (@devops push,   |
|  CREATE)       |     |  deploy)         |
+----------------+     +------------------+
```

### Fluxo de Contexto por Sessão

```
Session Start
     |
     v
Context Detector --> Detecta projeto, stack, estado
     |
     v
Context Loader --> Carrega memória relevante, regras, estado anterior
     |
     v
Synapse Engine --> Processa contexto em camadas (domain, session, memory)
     |
     v
Agent Invocation --> Agente recebe contexto completo
     |
     v
Task Execution --> Task executa com pré/pós-condições
     |
     v
Memory Update --> Feedback e decisões armazenados
     |
     v
Session Digest --> Compactação se necessário
```

### Fluxo de Story (End-to-End)

```
PRD/Epic --> @sm cria story (Draft)
                    |
              @po valida (Ready)
                    |
              @dev implementa (InProgress)
                    |
              CodeRabbit self-heal (max 2x)
                    |
              @qa review (InReview)
                    |
         +----+----+----+
         |    |         |
       PASS CONCERNS  FAIL
         |    |         |
         |  Approve   @dev fix
         |  c/ doc      |
         |              QA Loop (max 5x)
         |              |
         v              v
      @devops push (Done)
```

---

## 5. Integrações

### APIs e Serviços Externos

| Integração | Tipo | Pattern | Uso |
|-----------|------|---------|-----|
| **Meta Ads API** | SYNC --> DB | Campaigns, insights, criativos | Tráfego pago, relatórios |
| **WhatsApp (Baileys)** | REAL-TIME | Bot porta 3003 | Nutrição, vendas, automações |
| **Telegram** | REAL-TIME | Claude Code Channels plugin | Notificações, comandos remotos |
| **Supabase** | DB | PostgreSQL + RLS | Client Project, CRM MY GROWTH |
| **PAYMENT_API** | SYNC --> DB | Cobranças, pagamentos | Client Dashboard |
| **SALES_PLATFORM/SALES_PLATFORM_B** | SYNC --> DB | Vendas, assinaturas | Client Dashboard |
| **Instagram API** | SYNC | Content publishing | Publicação automática |
| **Google Drive** | REAL-TIME | Storage | Vídeos, documentos |
| **YouTube** | REAL-TIME | Embed | Vídeos Client Project |

### MCP Servers

| Server | Função |
|--------|--------|
| Playwright | Automação de browser, screenshots, scraping |
| Fetch | HTTP requests |
| RSS Reader | Feed monitoring |
| Reddit | Scraping subreddits |
| Hacker News | Monitoramento de tendências |
| Canva | Design (via Claude AI) |
| Gmail | Email (via Claude AI) |
| Google Calendar | Agenda (via Claude AI) |

### Infraestrutura de Deploy

| Recurso | Detalhes |
|---------|----------|
| **VPS MY GROWTH** | `YOUR_VPS_IP` — PM2, Nginx, Node.js |
| **Hostinger** | `YOUR_HOSTING_IP:PORT` — Sites estáticos |
| **PM2 Apps** | my-growth (3001), client-dashboard (3002), whatsapp-bot (3003), domina.ia (3004) |
| **Nginx** | Reverse proxy com SSL para todos os subdomínios |
| **Domínio** | `your-domain.com.br` + subdomínios |

---

## 6. Diretório de Referência

```
~/.claude/
  CLAUDE.md                              # Constituição v5.0
  settings.json                          # Permissões, hooks, plugins
  rules/                                 # 8 regras detalhadas
    workflow-execution.md
    story-lifecycle.md
    agent-authority.md
    ids-principles.md
    coderabbit-integration.md
    external-api-patterns.md
    mcp-usage.md
    eros-quality.md
  agents/                                # 18 specialist agents
    advogado-do-diabo.md
    automation-architect.md
    cold-outreach.md
    copywriter.md
    creative-director.md
    cro-specialist.md
    growth-hacker.md
    launch-strategist.md
    market-intel.md
    mestre-do-conselho.md
    offer-engineer.md
    prompt-engineer.md
    rag-architect.md
    swarm-simulator.md
    vibe-coder.md
    voice-ai-specialist.md
    whatsapp-specialist.md
    workflow-orchestrator.md
  skills/                                # 55 skills
    ad-creative.md
    agent-council.md
    agent-engineer.md
    ... (55 arquivos .md)
  hooks/                                 # Pre-tool hooks
    check-acentos.py
    check-acentos.sh
    precompact-session-digest.js
    synapse-engine.js
  projects/
    ${USER_PROJECT_PATH}/
      memory/                            # 46 arquivos de memória
        MEMORY.md                        # Índice
        agentes.md
        mygrowth.md
        client-dashboard.md
        ... (46 arquivos .md)

~/.aios-core/                            # Engine Core (Synkra v4.0.4)
  version.json                           # v4.0.4, instalado 2026-02-15
  constitution.md                        # Constituição interna
  core-config.yaml                       # Configuração principal
  package.json                           # Dependências Node.js
  index.js / index.esm.js               # Entry points
  user-guide.md                          # Guia do usuário
  core/                                  # Motor de orquestração
    orchestration/                       # 32 orchestrators JS
      master-orchestrator.js
      workflow-orchestrator.js
      agent-invoker.js
      skill-dispatcher.js
      parallel-executor.js
      gate-evaluator.js
      executors/                         # Epic executors (6 JS)
    quality-gates/                       # 3 camadas de qualidade (10 arquivos)
    ids/                                 # IDS engine (10 arquivos)
    registry/                            # Service registry (6 arquivos)
    permissions/                         # Operation guard (4 arquivos)
    health-check/                        # Health engine + healers + reporters
    synapse/                             # Context engine (9 subdiretórios)
      context/ domain/ engine.js layers/ memory/ output/ scripts/ session/ utils/
    session/                             # Session state
    memory/                              # Gotchas memory
    config/ events/ execution/ mcp/ migration/
    docs/ elicitation/ ideation/ manifest/ ui/ utils/
  development/                           # Artefatos de desenvolvimento
    agents/                              # 17 core agents (.md)
    tasks/                               # 224 tasks executáveis (.md)
    workflows/                           # 16 workflow definitions (.yaml)
    agent-teams/                         # 5 team compositions (.yaml)
    checklists/                          # 4 checklists (.md)
    templates/                           # Templates (service, squad, docs)
    data/                                # Dados de desenvolvimento
    scripts/                             # Scripts auxiliares
  squads/                                # 14 squads
    advisory-board/
    ai-engineering/
    brand-squad/
    c-level-squad/
    claude-code-mastery/
    copy-squad/
    cybersecurity/
    data-squad/
    design-squad/
    hormozi-squad/
    movement/
    storytelling/
    traffic-masters/
  infrastructure/                        # Infra e integrações
    integrations/
      ai-providers/
      gemini-extensions/
      pm-adapters/
    schemas/ scripts/ templates/ tests/ tools/
  product/                               # Produto
    checklists/ data/ templates/
  data/                                  # Dados globais
    entity-registry.yaml
    learned-patterns.yaml
    technical-preferences.md
    workflow-patterns.yaml
    workflow-state-schema.yaml
    aios-kb.md
  docs/                                  # Documentação
    architecture.md                      # << ESTE DOCUMENTO
    decisions/
    standards/
    troubleshooting-guide.md
  schemas/                               # JSON Schemas
    agent-v3-schema.json
    task-v3-schema.json
    squad-schema.json
    squad-design-schema.json
  manifests/                             # Manifests CSV
    agents.csv
    tasks.csv
    workers.csv
  scripts/                               # Scripts globais
  presets/                               # Presets de configuração
  cli/                                   # CLI do framework
  elicitation/                           # Elicitação de requisitos
  monitor/hooks/                         # Monitoring hooks
  workflow-intelligence/                 # Workflow intelligence engine
```

---

## 7. Princípios Fundamentais

### Os 10 Mandamentos do Segunda-feira

| # | Princípio | Severidade | Descrição |
|---|-----------|------------|-----------|
| 1 | **Autonomia máxima** | MUST | Agentes agem sem pedir permissão. Só perguntam se a decisão é irreversível E ambígua. |
| 2 | **Story scope is law** | MUST | Artigo IV — implementar exatamente o que os AC especificam. Não inventar features. |
| 3 | **@devops owns git push** | MUST | Nenhum outro agente pode executar push ou PR. Delegação obrigatória. |
| 4 | **REUSE > ADAPT > CREATE** | MUST | Sempre verificar Entity Registry antes de criar qualquer artefato novo. |
| 5 | **SYNC > CACHE > REAL-TIME** | MUST | Dashboards e relatórios NUNCA chamam APIs externas diretamente. |
| 6 | **EROS em tudo** | MUST | Todo agente é dono da qualidade do seu resultado. 5 portões obrigatórios. |
| 7 | **Task-first** | MUST | Workflows são compostos por tasks conectadas, não por agentes conectados. |
| 8 | **Constituição versionada** | MUST | Mudanças na constituição são versionadas e rastreadas. |
| 9 | **Memória persistente** | SHOULD | Feedback loops criam regras permanentes. Erros não se repetem. |
| 10 | **Proporcionalidade** | SHOULD | Rigor proporcional ao impacto. Typo fix != arquitetura crítica. |

### Modelo de Decisão

```
Requisição do usuário
        |
        v
É uma operação de agente? (@agent-name)
  SIM --> Ativar persona, expertise, workflow do agente
  NÃO --> Continuar
        |
        v
É um comando? (*command)
  SIM --> Rotear para agente ativo ou master
  NÃO --> Continuar
        |
        v
É uma skill? (/skill-name)
  SIM --> Despachar via skill-dispatcher
  NÃO --> Continuar
        |
        v
Resolver com contexto atual
  (memória + regras + constituição)
```

### Hierarquia de Autoridade

```
@aios-master (autoridade total)
      |
      v
@po (produto) > @qa (qualidade)
      |
      v
EROS (padrão de qualidade)
      |
      v
Agente executor (@dev, @sm, etc.)
```

**Conflito autonomia vs qualidade:** Qualidade vence. Autonomia é meio, não fim.

### Circuit Breaker Pattern

Todos os gates IDS implementam circuit breaker para nunca bloquear desenvolvimento:

```
failure_threshold: 5
success_threshold: 3
reset_timeout_ms: 60000

Timeout (2s) --> warn-and-proceed
Error         --> log-and-proceed
```

**Princípio chave:** Desenvolvimento NUNCA é bloqueado por falhas no IDS.

---

## Apêndice A — Números do Framework

| Métrica | Valor |
|---------|-------|
| Agentes core | 17 |
| Agentes especialistas | 18 |
| Agentes de negócio | 15+ |
| **Total de agentes** | **47+** |
| Squads | 14 |
| Skills | 55 |
| Tasks executáveis | 224 |
| Workflows YAML | 16 |
| Orchestrators JS | 32 |
| Regras de governança | 8 |
| Arquivos de memória | 46 |
| Feedback rules | 14+ |
| n8n Workflows (INEMA) | 597 |
| Mensagens mineradas (INEMA) | 83K+ |
| Versão engine | Synkra v4.0.4 |
| Versão constituição | v5.0 |

---

> *Segunda-feira — 47+ agentes de IA. 14 squads. 55 skills. 224 tasks. 597 workflows n8n. O terror do CLT.*
