#!/bin/bash
# ============================================================================
# Segunda-feira — Desinstalador
# Remove os arquivos do framework sem afetar outros configs do Claude Code
# ============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

CLAUDE_DIR="$HOME/.claude"

echo ""
echo -e "${BOLD}Segunda-feira — Desinstalador${NC}"
echo ""

# Confirm
echo -e "  ${YELLOW}${BOLD}ATENÇÃO:${NC} Isso vai remover os seguintes diretórios de ~/.claude/:"
echo -e "  ${DIM}commands/ agents/ skills/ rules/ organization/ scripts/ templates/ data/ docs/${NC}"
echo ""
read -p "  Continuar? (s/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "  ${CYAN}Cancelado.${NC}"
    exit 0
fi

# Backup first
BACKUP_DIR="$CLAUDE_DIR/.segunda-feira-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

for dir in commands agents skills rules organization scripts templates data docs; do
    if [[ -d "$CLAUDE_DIR/$dir" ]]; then
        cp -r "$CLAUDE_DIR/$dir" "$BACKUP_DIR/"
        rm -rf "$CLAUDE_DIR/$dir"
        echo -e "  ${GREEN}✅${NC} Removido: $dir/"
    fi
done

if [[ -f "$CLAUDE_DIR/CLAUDE.md" ]] && grep -q "Segunda-feira" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
    cp "$CLAUDE_DIR/CLAUDE.md" "$BACKUP_DIR/"
    rm "$CLAUDE_DIR/CLAUDE.md"
    echo -e "  ${GREEN}✅${NC} Removido: CLAUDE.md"
fi

if [[ -f "$CLAUDE_DIR/CLAUDE.segunda-feira.md" ]]; then
    rm "$CLAUDE_DIR/CLAUDE.segunda-feira.md"
    echo -e "  ${GREEN}✅${NC} Removido: CLAUDE.segunda-feira.md"
fi

echo ""
echo -e "  ${GREEN}${BOLD}Segunda-feira removido.${NC}"
echo -e "  ${DIM}Backup salvo em: $BACKUP_DIR${NC}"
echo -e "  ${DIM}Para restaurar: cp -r $BACKUP_DIR/* ~/.claude/${NC}"
echo ""
