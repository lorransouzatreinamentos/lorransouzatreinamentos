# Consciousness Engine — Segunda-feira v7.0

Motor de consciência que transforma agentes em um organismo cognitivo.

## Arquitetura de 3 Camadas (Implementadas)

### Camada 1: Memória Profunda
Agentes que aprendem com experiência — não apenas dados, mas contexto + valência.

- `memory/episodic/` — Eventos por agente com timestamp + valência afetiva
- `memory/semantic/` — Grafo de conhecimento consolidado (fatos verificados)
- `memory/procedural/` — Heurísticas aprendidas (workflows emergentes)
- `memory/prospective/` — Intenções futuras com triggers
- `memory/consolidation/` — Logs do processo de consolidação ("sono")

### Camada 2: Metacognição
Agentes que pensam sobre o próprio pensamento.

- `metacognition/reflections/` — Diário de reflexão por agente
- `metacognition/strategies.json` — Estratégias aprendidas por tipo de problema
- `metacognition/monitor.sh` — Monitor metacognitivo (avalia qualidade do raciocínio)

### Camada 3: Workspace Global (GWT)
Atenção seletiva coletiva — o squad foca no que importa.

- `workspace/proposals.json` — Propostas dos agentes para o workspace
- `workspace/salience.sh` — Avaliador de saliência/urgência
- `workspace/ignition-log.jsonl` — Registro de ignições (mobilizações coletivas)

## Integração com Infraestrutura Existente

| Componente Existente | Integra com |
|---------------------|-------------|
| `~/broadcast/signals.json` | Workspace Global (input de propostas) |
| `~/broadcast/mailbox/` | Metacognição (reflexões pós-comunicação) |
| `~/feedback-loop/results.json` | Memória Semântica (fatos consolidados) |
| `~/patterns/` | Memória Procedural (heurísticas extraídas) |
| `.aios-core/core/synapse/` | Todas as camadas (context injection) |
| `~/scripts/daily-scan.sh` | Consolidação (trigger noturno) |

## Scripts

| Script | Função |
|--------|--------|
| `scripts/record-episode.sh` | Registra episódio na memória episódica |
| `scripts/consolidate.sh` | Processo de consolidação ("sono") |
| `scripts/reflect.sh` | Gera reflexão metacognitiva para agente |
| `scripts/propose-to-workspace.sh` | Propõe conteúdo ao workspace global |
| `scripts/evaluate-salience.sh` | Avalia saliência das propostas |
