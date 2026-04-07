---
description: "Briefing executivo diário — consolida observações, sugestões proativas e padrões detectados em resumo conciso de 20 linhas"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep"]
---

# /daily-briefing — Briefing Executivo Diário

> **Tipo:** Skill autocontida | **Agente padrão:** @aios-master
> **Trigger:** Início de conversa ou comando `/daily-briefing`

## Objetivo

Consolidar observações pendentes e sugestões proativas em um briefing executivo conciso (máximo 20 linhas) para o usuário.

---

## Execução

### Passo 1 — Coletar Observações

Ler os seguintes arquivos em `~/observations/`. Se um arquivo não existir, ignorar silenciosamente (não criar, não reclamar):

| Arquivo | O que extrair |
|---------|---------------|
| `server-health.md` | Alertas de infraestrutura (status VPS, PM2, disco, memória) |
| `ads-performance.md` | CPL médio, budget restante, campanhas com problema |
| `content-calendar.md` | Posts agendados, próximo gap no calendário |
| `leads-pipeline.md` | Leads novos, leads sem follow-up |
| `patterns-detected.md` | Padrões ativos (seção `## Ativos`) |
| `suggestions-queue.md` | Sugestões pendentes (seção `## Pendentes`) |

### Passo 2 — Classificar Itens

Classificar cada item coletado em uma das categorias:

1. **AÇÃO URGENTE** — Requer decisão imediata (servidor down, budget estourando, lead quente esfriando)
2. **STATUS** — Informativo, sem ação necessária agora
3. **SUGESTÃO** — Baseada em padrão detectado, pode ser executada ou descartada
4. **PADRÃO** — Insight identificado pelo pattern-detector

### Passo 3 — Montar Briefing

Apresentar no formato abaixo. Omitir seções vazias. Máximo 20 linhas no total:

```
BRIEFING SEGUNDA-FEIRA — [data atual DD/MM/AAAA]

AÇÕES URGENTES (precisa de decisão)
- [item com contexto mínimo para decidir]

STATUS GERAL
- Servidores: [status] | [detalhe se houver alerta]
- Campanhas: CPL médio R$X.XX | Budget restante R$X
- Conteúdo: X posts agendados | próximo gap: [data]
- Leads: X novos | X sem follow-up

SUGESTÕES PROATIVAS
- [sugestão acionável com base em dados]

PADRÕES DETECTADOS
- [insight com nível de confiança]
```

**Regras de formatação:**
- Se não houver ações urgentes, omitir a seção inteira
- Se não houver dados de uma área (ex: sem ads-performance.md), mostrar como "sem dados"
- Cada linha deve ser autoexplicativa — sem necessidade de contexto adicional
- Números sempre formatados: R$ com vírgula, porcentagens com 1 casa decimal

### Passo 4 — Marcar Sugestões como Apresentadas

Após apresentar o briefing, atualizar `~/observations/suggestions-queue.md`:

1. Mover itens da seção `## Pendentes` para `## Apresentadas`
2. Adicionar data de apresentação: `- [AAAA-MM-DD] [texto da sugestão]`
3. Manter o item original na seção Pendentes comentado ou removido

### Passo 5 — Perguntar Sobre Sugestões

Após o briefing, perguntar de forma concisa:

```
Quer que eu execute alguma sugestão? (número ou "pular")
```

Se o usuário aprovar:
- Executar a sugestão
- Mover de `## Apresentadas` para `## Executadas` com data

Se o usuário rejeitar:
- Mover de `## Apresentadas` para `## Descartadas` com data e motivo (se fornecido)

---

## Regras

- **Concisão acima de tudo** — o briefing é para leitura rápida, não relatório
- **Dados reais apenas** — nunca inventar números ou status; se não tem dado, dizer "sem dados"
- **Sem arquivo, sem seção** — se ~/observations/X.md não existe, omitir a área correspondente
- **Autonomia na montagem** — não perguntar o que incluir; incluir tudo que for relevante
- **Acentuação obrigatória** — todo texto em português com acentos e cedilha corretos
