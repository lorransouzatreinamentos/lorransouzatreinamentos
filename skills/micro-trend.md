---
name: micro-trend
description: "Scout de micro-tendências — varre web, Reddit, HN por keywords emergentes no nicho especificado. Retorna top 10 com confidence score e fontes."
tools: ["Read", "Write", "WebSearch", "WebFetch"]
---

# /micro-trend — Scout de Micro-Tendências

> **Tipo:** Skill de pesquisa | **Agente padrão:** @market-intel
> **Input:** Nicho ou tópico a monitorar
> **Output:** Tabela CSV com top 10 tendências + fontes + confidence

## Objetivo

Identificar sinais fracos de tendências emergentes antes que virem mainstream. Útil para posicionamento de conteúdo, produtos e narrativa.

---

## Processo

### 1. Coleta (multi-fonte)
Varrer as seguintes fontes dos últimos 7 dias:

| Fonte | Método | O que buscar |
|-------|--------|-------------|
| Web | WebSearch | Notícias, artigos, lançamentos |
| Reddit | MCP Reddit (get_subreddit_hot/new) | Posts com alto engajamento |
| Hacker News | MCP HN (getTopStories, getBestStories) | Discussões técnicas |
| RSS feeds | MCP RSS (se configurado) | Publicações especializadas |

### 2. Filtragem
Para cada sinal encontrado:
- Eliminar ruído (posts genéricos, spam, conteúdo reciclado)
- Agrupar sinais similares em clusters
- Priorizar: velocidade de crescimento > volume absoluto

### 3. Classificação
Para cada tendência identificada, atribuir:
- **Keyword** — termo ou expressão principal
- **Justificativa** — por que é tendência (1 linha)
- **Fonte** — de onde veio o sinal (URL)
- **Volume** — quantas menções/sinais encontrados
- **Velocidade** — crescimento relativo (acelerando/estável/desacelerando)
- **Confidence** — score 0.0-1.0 baseado em consistência entre fontes

### 4. Output

Entregar tabela formatada:

```
| # | Keyword | Justificativa | Fonte | Confidence |
|---|---------|--------------|-------|------------|
| 1 | [termo] | [1 linha] | [URL] | 0.85 |
```

+ Resumo executivo (3-5 linhas) sobre o panorama geral do nicho.

---

## Regras
- Mínimo 3 fontes diferentes para confidence > 0.7
- Fonte única = confidence máximo 0.5
- SEMPRE datar as fontes (últimos 7 dias apenas)
- Ignorar tendências que já são mainstream (buscar o NOVO)
- Output em português brasileiro com acentos
