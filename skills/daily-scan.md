---
name: daily-scan
description: "Scan proativo diário — verifica campanhas, conteúdo, tendências e oportunidades. Gera briefing com ações sugeridas. O agente que pensa antes de você pedir."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebSearch", "WebFetch"]
---

# /daily-scan — Scan Proativo Diário

> **Tipo:** Skill de monitoramento | **Agente padrão:** @aios-master
> **Frequência:** Diária (ideal: 08h) ou sob demanda
> **Output:** Briefing executivo + ações sugeridas + sinais emitidos

## Objetivo

Substituir a necessidade do CEO verificar manualmente cada área do negócio. O scan identifica problemas, oportunidades e ações pendentes ANTES que alguém peça.

---

## Processo (5 áreas)

### 1. Tráfego e Campanhas (@traffic)
- Ler ~/feedback-loop/results.json — campanhas ativas
- Verificar: CPL subindo? Orçamento acabando? Campanha pausada que deveria estar ativa?
- Se campanha com CPL > 2x média → sugerir pausar
- Se ângulo com CPL < média → sugerir escalar (duplicar, não aumentar orçamento)

### 2. Conteúdo e Agenda (@content)
- Verificar calendário de posts no MY GROWTH
- Gaps: tópico sem conteúdo há mais de 7 dias?
- Posts agendados: estão ok? Algum com problema?
- Tendências: algo novo no nicho que vale conteúdo?

### 3. Tendências e Mercado (@market-intel)
- WebSearch rápida por: "IA + [nicho]" nas últimas 24h
- Verificar se concorrentes fizeram movimentos relevantes
- Novas ferramentas ou atualizações de modelos

### 4. Operacional (@ops)
- VPS: serviços rodando? (MY GROWTH, WhatsApp Bot, Client Dashboard)
- Erros: algo quebrou desde ontem?
- Backlog: tarefas pendentes de sessões anteriores?

### 5. Oportunidades
- Cruzar dados de todas as áreas acima
- Identificar oportunidades que nenhuma área isolada veria
- Registrar em ~/observations/opportunities.md

## Output — Briefing Executivo

```markdown
# Daily Scan — [DATA]

## 🔴 Ações Urgentes
- [ação que precisa de atenção AGORA]

## 🟡 Ações Sugeridas
- [ação recomendada com justificativa]

## 🟢 Tudo OK
- [áreas que estão funcionando bem]

## 📊 Métricas Rápidas
- CPL médio: R$X.XX | Leads últimos 7d: X
- Posts agendados: X | Gap de conteúdo: X dias
- Serviços ativos: X/X

## 💡 Oportunidades Detectadas
- [oportunidade] — confidence: X.X — [ação sugerida]

## 📡 Sinais Emitidos
- [sinal] → [destinatário]
```

## Protocolo de Iniciativa

| Confidence | Risco | Ação |
|-----------|-------|------|
| > 0.8 | Baixo | Executar e NOTIFICAR |
| 0.5-0.8 | Médio | Propor e aguardar |
| < 0.5 | Alto | Registrar como observação |

---

## Regras
- NUNCA executar ações de risco alto sem aprovação (pausar campanha, mudar orçamento)
- Ações de risco baixo podem ser executadas automaticamente (agendar post, emitir sinal)
- Briefing deve caber em 1 tela (conciso, não verboso)
- Priorizar: urgente > importante > interessante
