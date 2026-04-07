---
description: "Pesquisa profunda sobre qualquer tópico usando múltiplas fontes — web, RSS, Reddit, HN"
argument-hint: "<tópico>"
allowed-tools: ["Bash", "Read", "Write", "Glob", "Grep", "WebFetch", "WebSearch", "Agent"]
---

# Pesquisa Profunda

Execute uma pesquisa abrangente sobre o tópico: $ARGUMENTS

## Instruções de Execução

### Passo 1: Web Search — Informações Atuais
- Use WebSearch para buscar as informações mais recentes sobre o tópico
- Faça pelo menos 3 buscas com variações de keywords:
  - Busca principal: o tópico exato
  - Busca de tendências: "[tópico] trends 2026"
  - Busca de ferramentas/soluções: "[tópico] tools solutions"
- Priorize fontes confiáveis e recentes (últimos 6 meses)

### Passo 2: Reddit — Insights da Comunidade
- Use as ferramentas MCP do Reddit para buscar discussões relevantes
- Subreddits prioritários por área:
  - **IA/Tech**: r/artificial, r/MachineLearning, r/ChatGPT, r/LocalLLaMA
  - **Marketing**: r/digital_marketing, r/PPC, r/socialmedia, r/Entrepreneur
  - **Dev**: r/webdev, r/nextjs, r/node, r/programming
  - **Negócios**: r/smallbusiness, r/SaaS, r/startups
- Busque posts com alto engagement (upvotes > 50)
- Capture sentimento geral da comunidade

### Passo 3: Hacker News — Perspectiva Tech
- Use as ferramentas MCP do HN para buscar discussões
- Priorize: top stories e ask HN relacionados ao tópico
- Capture insights técnicos e opiniões de especialistas
- Note controvérsias ou debates relevantes

### Passo 4: RSS Feeds — Tendências da Indústria
- Use as ferramentas MCP de RSS para verificar feeds relevantes:
  - Tech: https://techcrunch.com/feed/, https://www.theverge.com/rss/index.xml
  - IA: https://openai.com/blog/rss/, https://blog.google/technology/ai/rss/
  - Marketing: https://blog.hubspot.com/marketing/rss.xml
- Filtre artigos relevantes ao tópico dos últimos 30 dias

### Passo 5: Síntese e Análise
Compile todos os dados em uma análise estruturada:
- **Consenso**: o que todas as fontes concordam?
- **Divergências**: onde há opiniões conflitantes?
- **Tendências**: para onde o mercado está indo?
- **Oportunidades**: gaps que podem ser explorados
- **Riscos**: ameaças ou problemas identificados

### Passo 6: Contexto DOMINA.IA
Conecte os achados com o negócio:
- Como isso afeta a DOMINA.IA?
- Oportunidades de conteúdo/produto?
- Ameaças competitivas?
- Ações recomendadas para YOUR_NAME

### Passo 7: Salvar Relatório
Gere o relatório e salve em `~/research/`:

```markdown
# Pesquisa: [Tópico]
**Data:** [YYYY-MM-DD]
**Fontes consultadas:** [N] web | [N] Reddit | [N] HN | [N] RSS

## Resumo Executivo
[3-5 bullet points com os principais achados]

## Achados Detalhados

### Web Search
[Principais informações encontradas]

### Comunidade (Reddit)
[Sentimento, insights, discussões relevantes]

### Hacker News
[Perspectiva técnica, debates]

### Tendências (RSS/Blogs)
[Artigos e tendências recentes]

## Análise

### Consenso do Mercado
[O que todos concordam]

### Divergências e Debates
[Onde há discordância]

### Tendências Emergentes
[Para onde está indo]

## Aplicação — DOMINA.IA
- Oportunidades: ...
- Ameaças: ...
- Ações recomendadas: ...

## Fontes
[Lista de todas as URLs consultadas]
```

- Crie o diretório `~/research/` se não existir
- Salve como `~/research/{YYYY-MM-DD}-{tópico-slug}.md`
- Exiba o resumo executivo no chat
