#!/bin/bash
# =============================================================================
# reflect.sh — Wrapper para reflexão metacognitiva
# Parte da Camada 2: Metacognição (Consciousness Engine)
#
# Uso: ./reflect.sh --agent @dev [--days 7]
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
python3 "$SCRIPT_DIR/reflect.py" "$@"
