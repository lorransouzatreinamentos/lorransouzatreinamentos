---
description: "Análise competitiva completa de concorrentes no nicho IA/mentoria"
argument-hint: "<competitor Instagram handle or name>"
allowed-tools: ["Bash", "Read", "Write", "Glob", "Grep", "WebFetch", "WebSearch", "Agent"]
---

# Análise Competitiva

Analise o concorrente: $ARGUMENTS

## Contexto
- **Nosso negócio:** DOMINA.IA — YOUR_NAME (@your-handle)
- **Nicho:** Ferramentas com IA, mentoria, eventos presenciais e online
- **Produto atual:** Desafio "O Mercado Invisível da IA" + Mentoria DOMINA.IA

## Instruções de Execução

### Passo 1: Coleta de Informações
- Use WebSearch para buscar informações públicas sobre o concorrente:
  - "[nome/handle] instagram"
  - "[nome/handle] curso IA" ou "[nome/handle] mentoria"
  - "[nome/handle] lançamento" ou "[nome/handle] desafio"
  - "[nome/handle] reclame aqui" ou "[nome/handle] review"
- Use WebFetch para acessar páginas públicas (LP, site, bio links)
- Busque no Reddit/HN se relevante (concorrentes internacionais)

### Passo 2: Análise de Conteúdo
Mapeie a estratégia de conteúdo:
- **Formatos usados**: Reels, carrossel, stories, lives, posts estáticos
- **Frequência de postagem**: posts/semana estimado
- **Temas principais**: quais assuntos mais aborda
- **Estilo de comunicação**: técnico, motivacional, educacional, entretenimento
- **Engajamento aparente**: comentários, compartilhamentos (quando visível)
- **Funil de conteúdo**: como leva do conteúdo para a venda

### Passo 3: Análise de Oferta
Mapeie a estrutura de produtos/serviços:
- **Produto principal**: nome, formato, duração
- **Preço**: ticket médio (se disponível publicamente)
- **Produto de entrada**: isca digital, desafio gratuito, webinar
- **Upsell/Backend**: mentoria, consultoria, comunidade
- **Bônus**: o que oferece como diferencial
- **Garantia**: tipo e prazo
- **Prova social**: depoimentos, cases, números

### Passo 4: Análise de Ads (quando visível)
- Busque na Meta Ad Library: https://www.facebook.com/ads/library/
- **Ângulos criativos**: quais ganchos usa nos anúncios
- **Formatos de ad**: vídeo, estático, carrossel
- **Copy patterns**: headlines, CTAs, urgência
- **Targeting hints**: pelo conteúdo do ad, qual público-alvo
- **Volume de ads ativos**: quantos anúncios rodando

### Passo 5: Análise de Posicionamento
- **Proposta de valor única**: o que promete que ninguém mais promete
- **Tom de voz**: autoridade, amizade, provocação, inspiração
- **Público-alvo aparente**: perfil demográfico e psicográfico
- **Diferenciação**: como se posiciona vs mercado geral
- **Narrativa**: qual história conta sobre si mesmo

### Passo 6: SWOT Comparativo

```markdown
## SWOT — [Concorrente] vs DOMINA.IA

### Forças do Concorrente (que devemos aprender)
- ...

### Fraquezas do Concorrente (que podemos explorar)
- ...

### Oportunidades para DOMINA.IA
- ...

### Ameaças para DOMINA.IA
- ...
```

### Passo 7: Relatório Final
Gere o relatório completo:

```markdown
# Análise Competitiva: [Nome do Concorrente]
**Data:** [YYYY-MM-DD]
**Handle:** @[handle]
**Analisado por:** Market Intel Agent

## Perfil do Concorrente
- Nome: ...
- Nicho: ...
- Audiência estimada: ...
- Tempo de mercado: ...

## Estratégia de Conteúdo
[Detalhamento do Passo 2]

## Estrutura de Oferta
[Detalhamento do Passo 3]

## Estratégia de Ads
[Detalhamento do Passo 4]

## Posicionamento
[Detalhamento do Passo 5]

## SWOT Comparativo
[Detalhamento do Passo 6]

## Recomendações para DOMINA.IA

### O que copiar/adaptar
1. ...

### O que fazer diferente
1. ...

### Ações imediatas
1. [ ] ...
2. [ ] ...
3. [ ] ...

### Ações de médio prazo
1. [ ] ...
2. [ ] ...
```

- Exiba o relatório completo no chat
- Salve em `~/research/competitors/{YYYY-MM-DD}-{competitor-slug}.md`
