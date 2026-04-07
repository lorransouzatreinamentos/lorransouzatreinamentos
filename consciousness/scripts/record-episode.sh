#!/bin/bash
# =============================================================================
# record-episode.sh — Registra episódio na memória episódica de um agente
# Parte da Camada 1: Memória Profunda (Consciousness Engine)
#
# Uso:
#   ./record-episode.sh --agent "@dev" --type "task_completed" \
#     --summary "Implementou RLS no módulo de pagamentos" \
#     --result "success" --valence 0.7 --intensity 0.5 \
#     --worked "Consultar @data-engineer antes salvou tempo" \
#     --failed "" \
#     --heuristic "Quando story envolve RLS, pré-consultar @data-engineer" \
#     [--story "3.2"] [--task "Implementar RLS"] [--duration 45] \
#     [--participants "@data-engineer,@qa"]
#
# O episódio é gravado em ~/consciousness/memory/episodic/{agent}.jsonl
# =============================================================================

set -euo pipefail

EPISODIC_DIR="$HOME/consciousness/memory/episodic"
PROCEDURAL_FILE="$HOME/consciousness/memory/procedural/heuristics.jsonl"

# Defaults
AGENT=""
TYPE="task_completed"
SUMMARY=""
RESULT="success"
VALENCE=0.0
INTENSITY=0.5
WORKED=""
FAILED=""
HEURISTIC=""
STORY=""
TASK=""
DURATION=0
PARTICIPANTS=""
METRICS="{}"

# Parse argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    --agent) AGENT="$2"; shift 2;;
    --type) TYPE="$2"; shift 2;;
    --summary) SUMMARY="$2"; shift 2;;
    --result) RESULT="$2"; shift 2;;
    --valence) VALENCE="$2"; shift 2;;
    --intensity) INTENSITY="$2"; shift 2;;
    --worked) WORKED="$2"; shift 2;;
    --failed) FAILED="$2"; shift 2;;
    --heuristic) HEURISTIC="$2"; shift 2;;
    --story) STORY="$2"; shift 2;;
    --task) TASK="$2"; shift 2;;
    --duration) DURATION="$2"; shift 2;;
    --participants) PARTICIPANTS="$2"; shift 2;;
    --metrics) METRICS="$2"; shift 2;;
    *) echo "Argumento desconhecido: $1"; exit 1;;
  esac
done

# Validação
if [[ -z "$AGENT" || -z "$SUMMARY" ]]; then
  echo "Erro: --agent e --summary são obrigatórios"
  echo "Uso: ./record-episode.sh --agent '@dev' --summary 'Descrição do evento'"
  exit 1
fi

# Limpar nome do agente (remover @)
AGENT_CLEAN="${AGENT#@}"

# Gerar ID e timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
DATE_COMPACT=$(date -u +"%Y%m%d%H%M%S")
EP_ID="ep_${AGENT_CLEAN}_${DATE_COMPACT}"

# Determinar label da valência
if (( $(echo "$VALENCE > 0.3" | bc -l) )); then
  VALENCE_LABEL="positive"
elif (( $(echo "$VALENCE < -0.3" | bc -l) )); then
  VALENCE_LABEL="negative"
else
  VALENCE_LABEL="neutral"
fi

# Converter participants para array JSON
if [[ -n "$PARTICIPANTS" ]]; then
  PARTICIPANTS_JSON=$(echo "$PARTICIPANTS" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | tr '\n' ',' | sed 's/,$//')
  PARTICIPANTS_JSON="[$PARTICIPANTS_JSON]"
else
  PARTICIPANTS_JSON="[]"
fi

# Construir episódio JSON
EPISODE=$(cat <<EOF
{"id":"${EP_ID}","agent":"@${AGENT_CLEAN}","timestamp":"${TIMESTAMP}","type":"${TYPE}","summary":"${SUMMARY}","context":{"story_id":"${STORY}","task":"${TASK}","participants":${PARTICIPANTS_JSON},"duration_minutes":${DURATION}},"outcome":{"result":"${RESULT}","metrics":${METRICS}},"valence":{"score":${VALENCE},"label":"${VALENCE_LABEL}","intensity":${INTENSITY},"reason":"${WORKED}${FAILED:+ | Falha: $FAILED}"},"lessons":{"what_worked":"${WORKED}","what_failed":"${FAILED}","heuristic":"${HEURISTIC}"},"consolidation_status":"raw"}
EOF
)

# Garantir diretório existe
mkdir -p "$EPISODIC_DIR"

# Gravar episódio (append JSONL)
echo "$EPISODE" >> "${EPISODIC_DIR}/${AGENT_CLEAN}.jsonl"

# Se tem heurística, registrar também na memória procedural
if [[ -n "$HEURISTIC" ]]; then
  HEUR_ENTRY=$(cat <<EOF
{"id":"heur_${DATE_COMPACT}","source_episode":"${EP_ID}","agent":"@${AGENT_CLEAN}","heuristic":"${HEURISTIC}","confidence":0.5,"times_validated":1,"created":"${TIMESTAMP}","last_validated":"${TIMESTAMP}"}
EOF
)
  echo "$HEUR_ENTRY" >> "$PROCEDURAL_FILE"
  echo "  + Heurística registrada: ${HEURISTIC}"
fi

echo "Episódio registrado: ${EP_ID}"
echo "  Agente: @${AGENT_CLEAN}"
echo "  Tipo: ${TYPE}"
echo "  Resultado: ${RESULT}"
echo "  Valência: ${VALENCE} (${VALENCE_LABEL}, intensidade ${INTENSITY})"
echo "  Arquivo: ${EPISODIC_DIR}/${AGENT_CLEAN}.jsonl"
