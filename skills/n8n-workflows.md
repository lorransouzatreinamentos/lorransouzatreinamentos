---
name: n8n-workflows
description: "Biblioteca de 597 workflows n8n prontos — AI agents, multi-agent orchestration, social media, RAG, CRM, WhatsApp, voice, content creation. Use quando precisar de automação n8n, templates de workflow, ou padrões de integração."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# n8n Workflows Library

Biblioteca de 597 workflows n8n extraídos do INEMA.N8N, categorizados por tipo.

## Localização
```
~/telegram-scraper/output/INEMA_N8N/media/*.json
```

## Categorias (597 workflows)

| Categoria | Qtd | Exemplo Principal |
|-----------|-----|------------------|
| **AI/LLM Agents** | 172 | `MultiAgentes_v2.json` |
| **Multi-Agent Orchestration** | 114 | `15) Orchestrator Architecture.json` |
| **Social Media** | 87 | `2_1_Cross_Platform_Content_Generator.json` |
| **Content & Video** | 75 | `14_4_Faceless_Video_Generator*.json` |
| **RAG & Knowledge** | 52 | `AGENTIC GRAPH RAG.json` |
| **CRM/Leads/Sales** | 26 | `Agente_vendedor_TOP.json` |
| **WhatsApp** | 23 | `🔥 WhatsApp Operating System.json` |
| **Email/Newsletter** | 20 | `AI Newsletter System.json` |
| **Voice/Audio** | 22 | `1. Retell Outbound.json` |
| **Data Processing** | 12 | `9) API Calls in n8n.json` |

## Top 5 Para Começar
1. `MultiAgentes_v2.json` — Framework multi-agent
2. `🔥 WhatsApp Operating System.json` — WhatsApp bot completo
3. `AI_Agent_Workflow.json` — Agent + memória (padrão base)
4. `2_1_Cross_Platform_Content_Generator.json` — Content multi-plataforma
5. `11) RAG Workflow vs RAG Agent.json` — RAG patterns

## Padrão Arquitetural Base
```
Trigger (Webhook/Chat)
  → Edit Fields (preparar dados)
  → AI Agent + LLM Model + Window Buffer Memory
  → Action Nodes (Airtable, Google, APIs)
  → Response
```

## Como Importar
```bash
# Via n8n CLI
n8n import:workflow --input=workflow.json

# Via API
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: $KEY" \
  -d @workflow.json
```

## Integrações Mais Comuns
Google Sheets/Drive, OpenAI, Airtable, Apify, WhatsApp (Unipile), Telegram, Gmail, Retell AI
