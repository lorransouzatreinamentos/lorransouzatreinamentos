---
name: swarm-simulation
description: "Projeta e executa simulações multi-agente com MiroFish — grafos de conhecimento, personas OASIS, simulação social, relatórios ReACT. Use quando precisar simular cenários, prever reações de mercado, testar narrativas, ou analisar dinâmicas de grupo."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch"]
---

# Swarm Simulation

Projeta simulações multi-agente usando o framework MiroFish para predição de cenários complexos.

## Pipeline (5 Fases)

### 1. Graph Building
- Input: PDF, MD, ou TXT com contexto do cenário
- LLM gera ontologia: 10 entity types (8 específicos + 2 fallback)
- Zep Cloud constrói grafo de conhecimento

### 2. Environment Setup
- Entidades → Agentes com persona (300+ chars cada)
- Atributos: age, gender, MBTI, profession, interests, stance
- Formatos OASIS: Twitter (followers) + Reddit (karma)

### 3. Simulation
- Config: duração, rounds, agentes/hora, timezone
- Twitter + Reddit em paralelo
- Ações: CREATE_POST, LIKE, REPOST, COMMENT, FOLLOW, etc
- Zep atualiza grafo DURANTE simulação

### 4. Report (ReACT)
- Planning → Think → Act (tools) → Reflect → Write
- Tools: InsightForge, PanoramaSearch, QuickSearch
- Output: report.md com análise profunda

### 5. Deep Interaction
- Entrevistar qualquer agente pós-simulação
- Agente responde em persona com memória

## Quando Usar
- Simular reações a lançamento antes de gastar dinheiro
- Testar diferentes narrativas/copy/ofertas
- Predizer comportamento de mercado
- Avaliar product-market fit
- Simular cenários de crise

## Stack
- MiroFish: `~/telegram-scraper/mirofish-repo/`
- Docker: `docker-compose up`
- Zep Cloud: account em zep.ai
- LLM: qualquer provider OpenAI-compatible

## Setup Rápido
```bash
cd ~/telegram-scraper/mirofish-repo
cp .env.example .env
# Editar .env com API keys (LLM + Zep)
docker-compose up -d
# Acessa: http://localhost:5173
```
