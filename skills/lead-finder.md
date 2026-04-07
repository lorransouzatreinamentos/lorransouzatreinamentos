---
name: lead-finder
description: "Busca leads com intenção de compra em Reddit, HN e web. Classifica por intenção 0-1, extrai snippet e link."
tools: ["Read", "Write", "WebSearch", "WebFetch"]
---

# /lead-finder — Busca de Leads com Intenção de Compra

> **Tipo:** Skill de prospecção | **Agente padrão:** @cold-outreach
> **Input:** Produto/serviço + nicho
> **Output:** Tabela de leads qualificados com intenção score

## Objetivo

Encontrar pessoas que estão ATIVAMENTE buscando soluções relacionadas ao produto/serviço especificado. Foco em intenção de compra, não apenas interesse.

---

## Processo

### 1. Definição de Sinais de Intenção
Mapear queries que indicam intenção de compra:
- "alguém recomenda...", "qual o melhor...", "preciso de...", "quanto custa..."
- "estou procurando...", "existe algum...", "vale a pena..."
- Variações em inglês se nicho for internacional

### 2. Busca Multi-Plataforma

| Plataforma | Buscar | Período |
|-----------|--------|---------|
| Reddit | Subreddits relevantes — posts e comentários | 14 dias |
| Hacker News | Ask HN, Show HN, comentários | 14 dias |
| Web | Fóruns, Quora, comunidades | 14 dias |

### 3. Classificação por Intenção

| Score | Significado | Exemplo |
|-------|-------------|---------|
| 0.9-1.0 | Pronto para comprar | "Preciso de X urgente, orçamento Y" |
| 0.7-0.8 | Avaliando opções | "Qual o melhor X para Y?" |
| 0.5-0.6 | Pesquisando | "O que vocês usam para X?" |
| 0.3-0.4 | Interesse vago | "Alguém já ouviu falar de X?" |
| 0.0-0.2 | Sem intenção clara | Menção casual |

### 4. Output

```
| # | Plataforma | Pergunta/Post | Link | Snippet | Intenção |
|---|-----------|--------------|------|---------|----------|
| 1 | Reddit | [título] | [URL] | [trecho relevante] | 0.85 |
```

+ Resumo: X leads encontrados, Y com alta intenção (>0.7), Z com média (0.5-0.7)
+ Sugestão de abordagem para os top 5 leads

---

## Regras
- Foco em INTENÇÃO, não em volume
- Ordenar por intenção (maior primeiro)
- Máximo 20 resultados (qualidade > quantidade)
- Incluir sugestão de approach para cada lead >0.7
- Output em português brasileiro com acentos
