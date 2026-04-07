---
name: predict
description: "Sugestões preditivas — analisa padrões de uso, resultados e contexto para antecipar próximas ações do CEO. Inspirado nos Silent Forks do Claude Code."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# /predict — Sugestões Preditivas

> **Tipo:** Skill de antecipação | **Agente padrão:** @aios-master
> **Trigger:** Final de cada sessão longa, ou sob demanda
> **Output:** Lista de ações prováveis + preparação prévia

## Objetivo

Antecipar o que o CEO vai precisar em seguida, baseado em padrões de comportamento, estado do negócio e calendário. Preparar contexto e recursos ANTES de ser pedido.

---

## Processo

### 1. Analisar Estado Atual
Ler e cruzar:
- `~/feedback-loop/results.json` — campanhas ativas, métricas
- `~/broadcast/signals.json` — sinais pendentes
- `~/broadcast/mailbox/*.json` — mensagens não processadas
- `~/observations/opportunities.md` — oportunidades em aberto
- Memórias recentes (últimos 7 dias)

### 2. Analisar Padrões Temporais
- **Dia da semana:** segunda = planejamento, sexta = review, domingo = conteúdo
- **Fase do lançamento:** captação → evento → cart open → pós-venda
- **Ciclo mensal:** início = estratégia, meio = execução, fim = análise

### 3. Analisar Contexto do Lançamento Ativo
Se há lançamento em andamento (ex: AI FIRST):
- Quantos dias faltam para o evento?
- Campanhas estão performando? Precisam de ajuste?
- Conteúdo orgânico está alinhado com a captação?
- WhatsApp Bot está configurado e funcional?

### 4. Gerar Predições

Para cada predição, estruturar:

```markdown
### Predição #N — [Ação provável]
- **Probabilidade:** X% (baseado em: [evidência])
- **Timing:** [quando o CEO provavelmente vai pedir]
- **Preparação:** [o que posso adiantar agora]
- **Recursos necessários:** [dados, arquivos, acessos]
```

### 5. Pré-carregar Recursos
Para predições com >70% de probabilidade:
- Ler arquivos relevantes
- Preparar dados necessários
- Gerar rascunhos se aplicável
- Deixar contexto pronto para execução imediata

## Exemplos de Predições

| Contexto | Predição | Preparação |
|----------|----------|------------|
| Campanha rodando há 2 dias | "Vai pedir relatório de performance" | Puxar dados da API, gerar tabela |
| Evento em 5 dias | "Vai revisar conteúdo das lives" | Ler roteiros, verificar agenda |
| Domingo à noite | "Vai planejar conteúdo da semana" | Rodar /micro-trend, preparar brief |
| Post performou muito bem | "Vai querer replicar o formato" | Analisar elementos, sugerir variações |
| CPL subiu | "Vai querer pausar ou ajustar" | Preparar comparativo, sugerir ação |

## Output

```markdown
# Predições — [DATA]

## 🎯 Alta Probabilidade (>70%)
1. [predição + preparação pronta]

## 📊 Média Probabilidade (40-70%)
1. [predição + recursos identificados]

## 💭 Baixa Probabilidade (<40%)
1. [predição registrada como observação]
```

---

## Regras
- Predições DEVEM ser baseadas em dados, não em suposição genérica
- Não executar ações — apenas preparar e sugerir
- Atualizar predições quando contexto muda
- Se predição se confirma → registrar como padrão no feedback loop
- Se predição falha → ajustar modelo mental
