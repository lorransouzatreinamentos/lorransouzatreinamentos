#!/bin/bash
# =============================================================================
# workspace.sh — Workspace Global (Global Workspace Theory)
# Parte da Camada 3: Atenção Seletiva Coletiva (Consciousness Engine)
#
# Implementa o ciclo GWT:
# 1. PROPOR   — Agente propõe conteúdo ao workspace
# 2. AVALIAR  — Saliência calculada (urgência × impacto × alinhamento)
# 3. IGNIÇÃO  — Se saliência alta + ressonância → mobilização coletiva
# 4. DECAIMENTO — Propostas não ressonantes decaem
#
# Uso:
#   ./workspace.sh propose --agent @analyst --content "Conversão caiu 15%" \
#     --urgency 0.9 --impact 0.8 --category revenue
#
#   ./workspace.sh evaluate    # Avalia todas as propostas pendentes
#   ./workspace.sh status      # Mostra estado atual do workspace
#   ./workspace.sh ignite ID   # Força ignição de uma proposta
#
# =============================================================================

set -euo pipefail

WORKSPACE_DIR="$HOME/consciousness/workspace"
PROPOSALS_FILE="$WORKSPACE_DIR/proposals.json"
IGNITION_LOG="$WORKSPACE_DIR/ignition-log.jsonl"
SIGNALS_FILE="$HOME/broadcast/signals.json"

mkdir -p "$WORKSPACE_DIR"

# Inicializar proposals.json se não existe
if [[ ! -f "$PROPOSALS_FILE" ]]; then
  cat > "$PROPOSALS_FILE" << 'EOF'
{
  "_schema_version": "1.0",
  "_description": "Workspace Global — propostas dos agentes para atenção coletiva",
  "active_proposals": [],
  "last_evaluation": null
}
EOF
fi

# ─── SUBCOMANDO: PROPOSE ─────────────────────────────────────────────
cmd_propose() {
  local AGENT="" CONTENT="" URGENCY=0.5 IMPACT=0.5 CATEGORY="general" DATA="{}"

  while [[ $# -gt 0 ]]; do
    case $1 in
      --agent) AGENT="${2#@}"; shift 2;;
      --content) CONTENT="$2"; shift 2;;
      --urgency) URGENCY="$2"; shift 2;;
      --impact) IMPACT="$2"; shift 2;;
      --category) CATEGORY="$2"; shift 2;;
      --data) DATA="$2"; shift 2;;
      *) shift;;
    esac
  done

  if [[ -z "$AGENT" || -z "$CONTENT" ]]; then
    echo "Erro: --agent e --content são obrigatórios"
    exit 1
  fi

  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
  PROPOSAL_ID="prop_$(date +%Y%m%d%H%M%S)_${AGENT}"

  # Calcular saliência inicial (urgência × impacto)
  SALIENCE=$(python3 -c "print(round($URGENCY * $IMPACT, 3))")

  python3 -c "
import json

with open('$PROPOSALS_FILE', 'r') as f:
    ws = json.load(f)

proposal = {
    'id': '$PROPOSAL_ID',
    'agent': '@$AGENT',
    'content': '''$CONTENT''',
    'category': '$CATEGORY',
    'urgency': $URGENCY,
    'impact': $IMPACT,
    'salience': $SALIENCE,
    'resonance': [],
    'status': 'pending',
    'timestamp': '$TIMESTAMP',
    'data': $DATA,
    'decay_factor': 1.0
}

ws['active_proposals'].append(proposal)

with open('$PROPOSALS_FILE', 'w') as f:
    json.dump(ws, f, indent=2, ensure_ascii=False)
"

  echo "Proposta registrada: $PROPOSAL_ID"
  echo "  De: @${AGENT}"
  echo "  Conteúdo: ${CONTENT}"
  echo "  Saliência: ${SALIENCE} (urgência=${URGENCY} × impacto=${IMPACT})"
}

# ─── SUBCOMANDO: RESONATE ────────────────────────────────────────────
cmd_resonate() {
  local PROPOSAL_ID="$1" AGENT="${2#@}"

  if [[ -z "$PROPOSAL_ID" || -z "$AGENT" ]]; then
    echo "Uso: workspace.sh resonate PROPOSAL_ID @agent"
    exit 1
  fi

  python3 -c "
import json

with open('$PROPOSALS_FILE', 'r') as f:
    ws = json.load(f)

for p in ws['active_proposals']:
    if p['id'] == '$PROPOSAL_ID':
        if '@$AGENT' not in p['resonance']:
            p['resonance'].append('@$AGENT')
            # Saliência aumenta com cada ressonância
            boost = 0.1 * len(p['resonance'])
            p['salience'] = min(p['salience'] + boost, 1.0)
            print(f\"@$AGENT ressoou com '{p['content'][:50]}...' (saliência: {p['salience']:.2f})\")
        else:
            print('@$AGENT já ressoou com esta proposta')
        break
else:
    print(f'Proposta {\"$PROPOSAL_ID\"} não encontrada')

with open('$PROPOSALS_FILE', 'w') as f:
    json.dump(ws, f, indent=2, ensure_ascii=False)
"
}

# ─── SUBCOMANDO: EVALUATE ────────────────────────────────────────────
cmd_evaluate() {
  echo ""
  echo "══════════════════════════════════════════════════"
  echo "  AVALIAÇÃO DO WORKSPACE GLOBAL"
  echo "══════════════════════════════════════════════════"

  python3 -c "
import json
from datetime import datetime, timedelta

with open('$PROPOSALS_FILE', 'r') as f:
    ws = json.load(f)

now = datetime.utcnow()
ignitions = []
decayed = []

for p in ws['active_proposals']:
    if p['status'] != 'pending':
        continue

    # Decaimento temporal (perde 10% de saliência por hora)
    try:
        created = datetime.fromisoformat(p['timestamp'].replace('Z', ''))
        hours_old = (now - created).total_seconds() / 3600
        p['decay_factor'] = max(0.1, 1.0 - (hours_old * 0.1))
        effective_salience = p['salience'] * p['decay_factor']
    except:
        effective_salience = p['salience']

    resonance_count = len(p.get('resonance', []))

    # Critério de ignição: saliência efetiva >= 0.7 E pelo menos 2 agentes ressoaram
    if effective_salience >= 0.7 and resonance_count >= 2:
        p['status'] = 'ignited'
        ignitions.append(p)
        print(f\"🔥 IGNIÇÃO: '{p['content'][:60]}'\")
        print(f\"   Saliência: {effective_salience:.2f} | Ressonância: {resonance_count} agentes\")
        print(f\"   Agentes: {', '.join(p['resonance'])}\")
        print()
    elif effective_salience < 0.1:
        p['status'] = 'decayed'
        decayed.append(p)
    else:
        print(f\"  ◦ '{p['content'][:60]}' — saliência: {effective_salience:.2f}, ressonância: {resonance_count}\")

ws['last_evaluation'] = now.isoformat() + 'Z'

# Limpar decaídos
ws['active_proposals'] = [p for p in ws['active_proposals'] if p['status'] != 'decayed']

with open('$PROPOSALS_FILE', 'w') as f:
    json.dump(ws, f, indent=2, ensure_ascii=False)

if not ignitions:
    print()
    print('Nenhuma ignição neste ciclo.')
else:
    print(f'Total de ignições: {len(ignitions)}')

if decayed:
    print(f'Propostas decaídas (removidas): {len(decayed)}')

# Registrar ignições no log
if ignitions:
    with open('$IGNITION_LOG', 'a') as f:
        for ig in ignitions:
            entry = {
                'id': ig['id'],
                'content': ig['content'],
                'agent': ig['agent'],
                'resonance': ig['resonance'],
                'salience': ig['salience'],
                'category': ig['category'],
                'ignited_at': now.isoformat() + 'Z'
            }
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
"

  echo "══════════════════════════════════════════════════"
}

# ─── SUBCOMANDO: STATUS ──────────────────────────────────────────────
cmd_status() {
  echo ""
  echo "══════════════════════════════════════════════════"
  echo "  ESTADO DO WORKSPACE GLOBAL"
  echo "══════════════════════════════════════════════════"

  python3 -c "
import json

with open('$PROPOSALS_FILE', 'r') as f:
    ws = json.load(f)

pending = [p for p in ws['active_proposals'] if p['status'] == 'pending']
ignited = [p for p in ws['active_proposals'] if p['status'] == 'ignited']

print(f'Propostas pendentes: {len(pending)}')
print(f'Ignições ativas: {len(ignited)}')
print(f'Última avaliação: {ws.get(\"last_evaluation\", \"nunca\")}')
print()

if pending:
    print('Pendentes (ordenadas por saliência):')
    for p in sorted(pending, key=lambda x: x['salience'], reverse=True):
        res = len(p.get('resonance', []))
        print(f\"  [{p['salience']:.2f}] @{p['agent'].replace('@','')} — {p['content'][:50]}... (ressonância: {res})\")

if ignited:
    print()
    print('Ignições ativas:')
    for p in ignited:
        print(f\"  🔥 @{p['agent'].replace('@','')} — {p['content'][:50]}...\")
        print(f\"     Agentes mobilizados: {', '.join(p['resonance'])}\")
" 2>/dev/null

  echo "══════════════════════════════════════════════════"
}

# ─── ROUTER DE SUBCOMANDOS ───────────────────────────────────────────
SUBCOMMAND="${1:-status}"
shift || true

case "$SUBCOMMAND" in
  propose) cmd_propose "$@";;
  resonate) cmd_resonate "$@";;
  evaluate) cmd_evaluate;;
  status) cmd_status;;
  *) echo "Subcomandos: propose, resonate, evaluate, status"; exit 1;;
esac
