---
name: weekly-sync
description: "Sync semanal entre agentes — cada domínio reporta status, cruzam-se dependências, gera-se plano da semana seguinte. O stand-up do time de IA."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# /weekly-sync — Sincronização Semanal entre Agentes

> **Tipo:** Skill de coordenação | **Agente padrão:** @aios-master
> **Frequência:** Semanal (domingo à noite ou segunda de manhã)
> **Output:** Relatório semanal + plano da próxima semana

## Objetivo

Coordenar todos os domínios do negócio em um único relatório semanal. Identificar dependências cruzadas, conflitos e oportunidades que só aparecem quando se olha o todo.

---

## Processo

### 1. Coleta de Status por Domínio

Para cada área, coletar:

| Domínio | Fonte de Dados | Métricas |
|---------|---------------|----------|
| **Tráfego** | results.json, campanhas ativas | CPL, leads, spend, ROAS |
| **Conteúdo** | MY GROWTH, posts agendados | Posts publicados, engajamento, gaps |
| **Vendas** | WhatsApp Bot, CRM | Leads qualificados, conversões |
| **Produto** | Plataformas, feedback clientes | NPS, churn, feature requests |
| **Operacional** | VPS, serviços | Uptime, erros, deploys |

### 2. Análise Cruzada

Cruzar dados entre domínios para detectar:
- **Desalinhamento**: tráfego subindo mas conversão caindo → problema na oferta?
- **Dependência bloqueada**: conteúdo precisa de criativo que @creative-director não entregou
- **Sinergia**: ângulo campeão no tráfego que @content ainda não explorou
- **Risco**: métrica piorando que ninguém notou isoladamente

### 3. Consumir e Limpar Sinais

- Ler ~/broadcast/signals.json
- Processar sinais ativos (marcar como consumed)
- Arquivar sinais com mais de 7 dias
- Identificar sinais não consumidos (ninguém agiu)

### 4. Gerar Plano da Semana

Para cada domínio, definir:
- **Prioridade 1**: o que DEVE acontecer (bloqueante)
- **Prioridade 2**: o que DEVERIA acontecer (importante)
- **Prioridade 3**: o que PODERIA acontecer (nice-to-have)

### 5. Atualizar Pattern Library

- Novos padrões descobertos na semana → ~/patterns/
- Padrões invalidados → remover ou marcar como "deprecated"

## Output

```markdown
# Weekly Sync — Semana [DATA]

## Scorecard
| Métrica | Semana Anterior | Esta Semana | Tendência |
|---------|----------------|-------------|-----------|
| Leads | X | X | ↑/↓/→ |
| CPL | R$X | R$X | ↑/↓/→ |
| Posts | X | X | ↑/↓/→ |
| Conversões | X | X | ↑/↓/→ |

## Destaques
- 🏆 Vitória: [o que funcionou melhor]
- ⚠️ Alerta: [o que precisa de atenção]
- 💡 Descoberta: [padrão novo identificado]

## Dependências Cruzadas
- [domínio A] precisa de [domínio B] para [ação]

## Plano Próxima Semana
### Tráfego: [prioridade 1]
### Conteúdo: [prioridade 1]
### Vendas: [prioridade 1]
### Operacional: [prioridade 1]

## Sinais Pendentes (não consumidos)
- [sinal] — emitido por [agente] em [data]
```
