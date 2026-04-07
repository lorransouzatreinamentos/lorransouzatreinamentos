# Protocolo de Handoff — Passagem de Bastão entre Agentes

> **Severidade:** MUST (quando delega) | **Aplica-se a:** Todos os agentes
> **Origem:** Rainmaker Funnel Squad + Teammate Mode — Segunda-feira v6.3

## Princípio

Nenhuma tarefa termina em silêncio. Quando um agente conclui e o trabalho deve continuar com outro agente, o handoff é obrigatório.

**Regra de ouro:** "Quem termina, passa o bastão com contexto completo."

---

## Formato Obrigatório

```
=== HANDOFF @[origem] → @[destino] ===
TAREFA CONCLUÍDA: [nome/descrição]
OUTPUTS:
  - [entregável 1]
  - [entregável 2]
RESUMO: [2-3 frases do que foi feito]
PRÓXIMA AÇÃO: @[destino] deve [ação específica]
APROVAÇÃO NECESSÁRIA? [Sim/Não — se sim, o quê]
```

## Quando Usar

| Situação | Handoff? |
|----------|---------|
| Agente termina e próximo passo é de outro agente | **SIM** |
| Agente termina e trabalho acabou | NÃO — apenas report final |
| Agente precisa de input de outro agente no meio da tarefa | **SIM** (parcial) |
| CEO muda de agente manualmente | NÃO — CEO já tem contexto |

## Cadeia de Handoff Comum

```
@market-intel → @content (tendência → criar conteúdo)
@content → @creative-director (brief → criar visual)
@creative-director → @traffic (criativo → lançar campanha)
@traffic → @analyst (campanha → analisar resultados)
@analyst → @offer-engineer (dados → ajustar oferta)
```

## Regras
- Handoff vai na mailbox do destinatário E no broadcast se relevante para todos
- Se agente destino não responder em 24h → escalar para @aios-master
- Handoff NUNCA perde informação — todo contexto necessário incluído
- Manter conciso — max 10 linhas
