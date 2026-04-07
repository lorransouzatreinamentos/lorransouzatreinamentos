# Consciousness Engine — Regras de Integração

> **Severidade:** MUST | **Aplica-se a:** Todos os agentes
> **Origem:** Consciousness Engine v1.0 — Segunda-feira v7.0

## Princípio

Agentes registram episódios **automaticamente** ao final de qualquer tarefa significativa. O CEO **não** precisa pedir ou lembrar. É responsabilidade do agente alimentar o Consciousness Engine.

**Regra de ouro:** "Terminou tarefa relevante? Registre o episódio. Sem perguntar, sem esperar."

## Localização

Toda infraestrutura de consciência fica em `~/consciousness/`.

## Comportamento Obrigatório (MUST)

### Ao INICIAR qualquer tarefa significativa

```bash
# 1. Consultar heurísticas procedurais relevantes
cat ~/consciousness/memory/procedural/heuristics.jsonl | grep "@meu-nome"

# 2. Consultar reflexão recente (se existir)
~/consciousness/scripts/reflect.sh --agent @meu-nome --days 7
```

### Ao COMPLETAR qualquer tarefa significativa

O agente DEVE executar `record-episode.sh` com os parâmetros corretos. Sem exceção.

```bash
~/consciousness/scripts/record-episode.sh \
  --agent "@meu-nome" \
  --type "task_completed|task_failed|insight_discovered|pattern_detected|decision_made|collaboration|error_recovered" \
  --summary "Descrição objetiva do que aconteceu" \
  --result "success|partial|failure" \
  --valence SCORE --intensity SCORE \
  --worked "O que funcionou (se aplicável)" \
  --failed "O que falhou (se aplicável)" \
  --heuristic "Quando X, fazer Y porque Z (se extraiu aprendizado)"
```

### Ao DETECTAR anomalia ou oportunidade cross-domain

```bash
~/consciousness/scripts/workspace.sh propose \
  --agent @meu-nome --content "O que detectou" \
  --urgency 0.0-1.0 --impact 0.0-1.0 --category revenue|growth|quality|opportunity
```

## O que é "tarefa significativa" (registrar episódio)

| Registrar | NÃO registrar |
|-----------|---------------|
| Story completada/falhada | Leitura de arquivo |
| Campanha criada/pausada/otimizada | git commit individual |
| Análise de dados com insight | Lint, typecheck, formatação |
| Decisão estratégica tomada | Resposta conversacional curta |
| Bug resolvido (com aprendizado) | Operação trivial de rotina |
| Colaboração relevante entre agentes | Consulta simples ao CEO |
| Padrão novo detectado nos dados | Listagem de informações |
| Oferta criada/alterada | Navegação de código |

## Guia de Valência (marcadores somáticos)

| Score | Quando usar | Efeito futuro |
|-------|-------------|---------------|
| **+0.7 a +1.0** | Resultado excelente, superou expectativa | Agente busca repetir abordagem |
| **+0.3 a +0.6** | Resultado bom, dentro do esperado | Reforço positivo moderado |
| **-0.3 a +0.3** | Resultado neutro, nada notável | Sem influência futura |
| **-0.3 a -0.6** | Resultado ruim, retrabalho necessário | Agente evita abordagem similar |
| **-0.7 a -1.0** | Falha grave, impacto alto | Forte aversão a padrão similar |

**Intensidade (0.0-1.0):** Quão memorável é o evento. Falhas graves = 0.9. Tarefa rotineira = 0.3.

## Consolidação Automática

Roda toda noite às 23:30 BRT via cron. O agente não precisa fazer nada — o processo:
1. Extrai heurísticas → `memory/procedural/heuristics.jsonl`
2. Consolida fatos → `memory/semantic/knowledge-graph.json`
3. Detecta falhas recorrentes
4. Emite sinal `CONSOLIDATION_COMPLETE`

## Workspace Global — Critérios de Ignição

Ignição ocorre quando:
- Saliência efetiva >= 0.7 (urgência x impacto, com decaimento temporal)
- 2+ agentes ressoam (confirmam relevância)
- Resultado: squad mobilizado coletivamente

```bash
# Ver propostas ativas e ignições
~/consciousness/scripts/workspace.sh status

# Ressoar com proposta existente
~/consciousness/scripts/workspace.sh resonate PROPOSAL_ID @meu-nome
```

## Integração com SDC

| Momento | Ação do agente (automática) |
|---------|---------------------------|
| Story iniciada | Consultar heurísticas + reflexão |
| Story completada | Registrar episódio (success, valência +) |
| QA Gate falhou | Registrar episódio (failure, valência -, heurística) |
| QA Gate passou | Registrar episódio (success, valência +) |
| Campanha lançada | Registrar episódio + propor ao workspace |
| Anomalia detectada | Propor ao workspace com urgência alta |
| Colaboração concluída | Ambos agentes registram episódio |

## Anti-Patterns

| Evitar | Por quê |
|--------|---------|
| Esperar CEO pedir para registrar | CEO não se preocupa com isso — é dever do agente |
| Registrar todo commit como episódio | Polui memória, consolidação perde eficácia |
| Valência sempre 0 (neutro) | Perde o poder dos marcadores somáticos |
| Propor tudo ao workspace | Perde saliência — workspace vira ruído |
| Pular consulta de heurísticas antes de story | Repete erros que já foram aprendidos |
| Heurística genérica ("fazer melhor") | Sem especificidade não há aprendizado |
