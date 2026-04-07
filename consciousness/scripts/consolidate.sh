#!/bin/bash
# =============================================================================
# consolidate.sh — Processo de consolidação ("sono") da memória
# Parte da Camada 1: Memória Profunda (Consciousness Engine)
#
# Analogia: Como o cérebro humano durante o sono, este processo:
# 1. Generaliza episódios repetidos → fatos semânticos
# 2. Extrai heurísticas de padrões → memória procedural
# 3. Fortalece conexões entre episódios relacionados
# 4. Arquiva episódios antigos irrelevantes
# 5. Detecta intenções prospectivas
#
# Uso: ./consolidate.sh [--dry-run] [--agent @dev] [--days 7]
# Recomendado: cron diário às 23:30 (após magic-docs-update)
# =============================================================================

set -euo pipefail

CONSCIOUSNESS_DIR="$HOME/consciousness"
EPISODIC_DIR="$CONSCIOUSNESS_DIR/memory/episodic"
SEMANTIC_FILE="$CONSCIOUSNESS_DIR/memory/semantic/knowledge-graph.json"
PROCEDURAL_FILE="$CONSCIOUSNESS_DIR/memory/procedural/heuristics.jsonl"
PROSPECTIVE_FILE="$CONSCIOUSNESS_DIR/memory/prospective/intentions.json"
CONSOLIDATION_DIR="$CONSCIOUSNESS_DIR/memory/consolidation"
LOG_FILE="$CONSOLIDATION_DIR/consolidation-$(date +%Y-%m-%d).log"

DRY_RUN=false
TARGET_AGENT=""
DAYS=7

# Parse argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true; shift;;
    --agent) TARGET_AGENT="${2#@}"; shift 2;;
    --days) DAYS="$2"; shift 2;;
    *) shift;;
  esac
done

mkdir -p "$CONSOLIDATION_DIR"

log() {
  local msg="[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log "=== CONSOLIDAÇÃO INICIADA ==="
log "Modo: $(if $DRY_RUN; then echo 'DRY-RUN'; else echo 'PRODUÇÃO'; fi)"
log "Período: últimos ${DAYS} dias"
if [[ -n "$TARGET_AGENT" ]]; then
  log "Agente alvo: @${TARGET_AGENT}"
fi

# ─── FASE 1: INVENTÁRIO ─────────────────────────────────────────────
log ""
log "--- Fase 1: Inventário de episódios ---"

TOTAL_EPISODES=0
TOTAL_RAW=0
AGENTS_WITH_EPISODES=()

for EPISODE_FILE in "$EPISODIC_DIR"/*.jsonl; do
  [[ -f "$EPISODE_FILE" ]] || continue
  AGENT_NAME=$(basename "$EPISODE_FILE" .jsonl)

  # Filtrar por agente se especificado
  if [[ -n "$TARGET_AGENT" && "$AGENT_NAME" != "$TARGET_AGENT" ]]; then
    continue
  fi

  COUNT=$(wc -l < "$EPISODE_FILE" | tr -d ' ')
  RAW_COUNT=$(grep -c '"consolidation_status":"raw"' "$EPISODE_FILE" || true)
  RAW_COUNT=${RAW_COUNT:-0}
  RAW_COUNT=$(echo "$RAW_COUNT" | tr -d '[:space:]')

  TOTAL_EPISODES=$((TOTAL_EPISODES + COUNT))
  TOTAL_RAW=$((TOTAL_RAW + RAW_COUNT))
  AGENTS_WITH_EPISODES+=("$AGENT_NAME")

  log "  @${AGENT_NAME}: ${COUNT} episódios (${RAW_COUNT} não processados)"
done

log "Total: ${TOTAL_EPISODES} episódios, ${TOTAL_RAW} não processados"

if [[ $TOTAL_RAW -eq 0 ]]; then
  log "Nenhum episódio novo para consolidar. Encerrando."
  exit 0
fi

# ─── FASE 2: EXTRAÇÃO DE PADRÕES ────────────────────────────────────
log ""
log "--- Fase 2: Extração de padrões recorrentes ---"

PATTERNS_FOUND=0

for AGENT_NAME in "${AGENTS_WITH_EPISODES[@]}"; do
  EPISODE_FILE="$EPISODIC_DIR/${AGENT_NAME}.jsonl"

  # Extrair heurísticas não vazias de episódios raw
  HEURISTICS=$(grep '"consolidation_status":"raw"' "$EPISODE_FILE" | \
    python3 -c "
import sys, json
seen = {}
for line in sys.stdin:
    try:
        ep = json.loads(line.strip())
        h = ep.get('lessons', {}).get('heuristic', '')
        if h and h not in seen:
            seen[h] = {
                'agent': ep.get('agent', ''),
                'type': ep.get('type', ''),
                'result': ep.get('outcome', {}).get('result', ''),
                'valence': ep.get('valence', {}).get('score', 0)
            }
    except: pass
for h, meta in seen.items():
    print(json.dumps({'heuristic': h, 'meta': meta}))
" 2>/dev/null || true)

  if [[ -n "$HEURISTICS" ]]; then
    HEUR_COUNT=$(echo "$HEURISTICS" | wc -l | tr -d ' ')
    log "  @${AGENT_NAME}: ${HEUR_COUNT} heurísticas extraídas"
    PATTERNS_FOUND=$((PATTERNS_FOUND + HEUR_COUNT))
  fi

  # Detectar episódios negativos recorrentes (mesmo tipo de falha)
  RECURRING_FAILURES=$(grep '"consolidation_status":"raw"' "$EPISODE_FILE" | \
    python3 -c "
import sys, json
from collections import Counter
failures = []
for line in sys.stdin:
    try:
        ep = json.loads(line.strip())
        if ep.get('outcome', {}).get('result') == 'failure':
            task = ep.get('context', {}).get('task', 'unknown')
            failures.append(task)
    except: pass
recurring = {k: v for k, v in Counter(failures).items() if v >= 2}
for task, count in recurring.items():
    print(f'ALERTA: @${AGENT_NAME} falhou {count}x em \"{task}\"')
" 2>/dev/null || true)

  if [[ -n "$RECURRING_FAILURES" ]]; then
    log "$RECURRING_FAILURES"
  fi
done

log "Padrões encontrados: ${PATTERNS_FOUND}"

# ─── FASE 3: CONSOLIDAÇÃO SEMÂNTICA ─────────────────────────────────
log ""
log "--- Fase 3: Consolidação semântica ---"

# Extrair fatos de episódios com alta confiança (valência alta + sucesso)
FACTS_EXTRACTED=0

for AGENT_NAME in "${AGENTS_WITH_EPISODES[@]}"; do
  EPISODE_FILE="$EPISODIC_DIR/${AGENT_NAME}.jsonl"

  NEW_FACTS=$(grep '"consolidation_status":"raw"' "$EPISODE_FILE" | \
    python3 -c "
import sys, json
for line in sys.stdin:
    try:
        ep = json.loads(line.strip())
        result = ep.get('outcome', {}).get('result', '')
        valence = ep.get('valence', {}).get('score', 0)
        worked = ep.get('lessons', {}).get('what_worked', '')
        # Fatos de alta confiança: sucesso + valência positiva + lição clara
        if result == 'success' and valence > 0.3 and worked:
            fact = {
                'id': 'fact_' + ep['id'],
                'source': ep['id'],
                'agent': ep.get('agent', ''),
                'statement': worked,
                'confidence': min(0.5 + abs(valence) * 0.3, 0.95),
                'validated_count': 1,
                'created': ep.get('timestamp', ''),
                'category': ep.get('type', 'general')
            }
            print(json.dumps(fact))
    except: pass
" 2>/dev/null || true)

  if [[ -n "$NEW_FACTS" ]]; then
    FACT_COUNT=$(echo "$NEW_FACTS" | wc -l | tr -d ' ')
    FACTS_EXTRACTED=$((FACTS_EXTRACTED + FACT_COUNT))
    log "  @${AGENT_NAME}: ${FACT_COUNT} fatos extraídos"

    if ! $DRY_RUN; then
      # Adicionar fatos ao knowledge graph
      python3 -c "
import json, sys

kg_path = '$SEMANTIC_FILE'
with open(kg_path, 'r') as f:
    kg = json.load(f)

new_facts_text = '''$(echo "$NEW_FACTS")'''
for line in new_facts_text.strip().split('\n'):
    if line:
        try:
            fact = json.loads(line)
            # Evitar duplicatas
            existing_ids = {f['id'] for f in kg['facts']}
            if fact['id'] not in existing_ids:
                kg['facts'].append(fact)
        except: pass

kg['_last_consolidation'] = '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'

with open(kg_path, 'w') as f:
    json.dump(kg, f, indent=2, ensure_ascii=False)
" 2>/dev/null || log "  AVISO: Falha ao gravar knowledge graph"
    fi
  fi
done

log "Fatos extraídos: ${FACTS_EXTRACTED}"

# ─── FASE 4: MARCAR COMO PROCESSADOS ────────────────────────────────
log ""
log "--- Fase 4: Marcando episódios como processados ---"

if ! $DRY_RUN; then
  for AGENT_NAME in "${AGENTS_WITH_EPISODES[@]}"; do
    EPISODE_FILE="$EPISODIC_DIR/${AGENT_NAME}.jsonl"

    if [[ -f "$EPISODE_FILE" ]]; then
      # Marcar raw → processed
      sed -i.bak 's/"consolidation_status":"raw"/"consolidation_status":"processed"/g' "$EPISODE_FILE"
      rm -f "${EPISODE_FILE}.bak"
      log "  @${AGENT_NAME}: episódios marcados como processados"
    fi
  done
else
  log "  [DRY-RUN] Nenhuma alteração feita"
fi

# ─── FASE 5: RELATÓRIO ──────────────────────────────────────────────
log ""
log "=== CONSOLIDAÇÃO COMPLETA ==="
log "Resumo:"
log "  Agentes processados: ${#AGENTS_WITH_EPISODES[@]}"
log "  Episódios analisados: ${TOTAL_RAW}"
log "  Padrões extraídos: ${PATTERNS_FOUND}"
log "  Fatos consolidados: ${FACTS_EXTRACTED}"
log "  Log: ${LOG_FILE}"

# Emitir sinal de consolidação completa
if ! $DRY_RUN && [[ -f "$HOME/broadcast/signals.json" ]]; then
  python3 -c "
import json
from datetime import datetime

sig_path = '$HOME/broadcast/signals.json'
with open(sig_path, 'r') as f:
    signals = json.load(f)

new_signal = {
    'id': 'sig_consolidation_$(date +%Y%m%d)',
    'type': 'CONSOLIDATION_COMPLETE',
    'from': '@consciousness',
    'data': {
        'episodes_processed': $TOTAL_RAW,
        'patterns_found': $PATTERNS_FOUND,
        'facts_extracted': $FACTS_EXTRACTED,
        'agents': $(python3 -c "import json; print(json.dumps([a for a in '${AGENTS_WITH_EPISODES[*]}'.split()]))" 2>/dev/null || echo '[]')
    },
    'confidence': 0.95,
    'timestamp': datetime.utcnow().isoformat() + 'Z',
    'consumed_by': [],
    'ttl_days': 3
}

signals['active_signals'].append(new_signal)

with open(sig_path, 'w') as f:
    json.dump(signals, f, indent=2, ensure_ascii=False)
" 2>/dev/null && log "Sinal CONSOLIDATION_COMPLETE emitido" || true
fi
