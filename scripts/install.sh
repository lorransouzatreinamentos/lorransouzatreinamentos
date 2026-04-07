#!/bin/bash
# ============================================================================
# Segunda-feira — Instalador
# Um comando. 47+ agentes. O terror do CLT.
#
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/DOMINA-IA/segunda-feira/main/scripts/install.sh | bash
#
# ============================================================================

set -euo pipefail

# --- Cores ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# --- Config ---
REPO="DOMINA-IA/segunda-feira"
REPO_URL="https://github.com/${REPO}.git"
CLAUDE_DIR="$HOME/.claude"
TMP_DIR=$(mktemp -d)
VERSION="6.3"

# --- Helpers ---
info()    { echo -e "  ${CYAN}${BOLD}INFO${NC}  $1"; }
ok()      { echo -e "  ${GREEN}${BOLD}  OK${NC}  $1"; }
warn()    { echo -e "  ${YELLOW}${BOLD}WARN${NC}  $1"; }
fail()    { echo -e "  ${RED}${BOLD}FAIL${NC}  $1"; exit 1; }
step()    { echo -e "\n${BOLD}$1${NC}"; }

cleanup() {
    rm -rf "$TMP_DIR" 2>/dev/null || true
}
trap cleanup EXIT

# --- Banner ---
echo ""
echo -e "${BOLD}"
echo '  ____                            _              __      _            '
echo ' / ___|  ___  __ _ _   _ _ __   __| | __ _       / _| ___(_)_ __ __ _ '
echo ' \___ \ / _ \/ _` | | | | '\''_ \ / _` |/ _` |_____| |_ / _ \ | '\''__/ _` |'
echo '  ___) |  __/ (_| | |_| | | | | (_| | (_| |_____|  _|  __/ | | | (_| |'
echo ' |____/ \___|\__, |\__,_|_| |_|\__,_|\__,_|     |_|  \___|_|_|  \__,_|'
echo '             |___/                                                      '
echo -e "${NC}"
echo -e "  ${DIM}v${VERSION} — 49+ agentes de IA. 68 skills. O terror do CLT.${NC}"
echo ""

# ============================================================================
# 1. CHECK PREREQUISITES
# ============================================================================
step "1/5  Verificando requisitos..."

# Check git
if command -v git &>/dev/null; then
    ok "Git instalado ($(git --version | cut -d' ' -f3))"
else
    fail "Git não encontrado. Instale: https://git-scm.com/"
fi

# Check Claude Code (optional but recommended)
if command -v claude &>/dev/null; then
    ok "Claude Code instalado"
else
    warn "Claude Code não encontrado — instale em https://docs.anthropic.com/en/docs/claude-code"
    warn "Continuando mesmo assim (os arquivos serão copiados)"
fi

# Check ~/.claude directory
if [[ -d "$CLAUDE_DIR" ]]; then
    ok "Diretório ~/.claude/ existe"
else
    info "Criando ~/.claude/"
    mkdir -p "$CLAUDE_DIR"
    ok "Diretório ~/.claude/ criado"
fi

# ============================================================================
# 2. DOWNLOAD
# ============================================================================
step "2/5  Baixando Segunda-feira v${VERSION}..."

git clone --depth 1 --quiet "$REPO_URL" "$TMP_DIR/segunda-feira" 2>/dev/null || fail "Erro ao clonar repositório"
ok "Download completo"

SRC="$TMP_DIR/segunda-feira"

# ============================================================================
# 3. BACKUP EXISTING
# ============================================================================
step "3/5  Verificando instalação existente..."

BACKUP_NEEDED=false
BACKUP_DIR="$CLAUDE_DIR/.segunda-feira-backup-$(date +%Y%m%d-%H%M%S)"

for dir in commands agents skills rules organization; do
    if [[ -d "$CLAUDE_DIR/$dir" ]] && [[ "$(ls -A "$CLAUDE_DIR/$dir" 2>/dev/null)" ]]; then
        BACKUP_NEEDED=true
        break
    fi
done

if [[ "$BACKUP_NEEDED" == true ]]; then
    warn "Instalação anterior detectada"
    info "Criando backup em ${BACKUP_DIR##*/}/"
    mkdir -p "$BACKUP_DIR"
    for dir in commands agents skills rules organization scripts templates data docs; do
        if [[ -d "$CLAUDE_DIR/$dir" ]]; then
            cp -r "$CLAUDE_DIR/$dir" "$BACKUP_DIR/" 2>/dev/null || true
        fi
    done
    if [[ -f "$CLAUDE_DIR/CLAUDE.md" ]]; then
        cp "$CLAUDE_DIR/CLAUDE.md" "$BACKUP_DIR/" 2>/dev/null || true
    fi
    ok "Backup salvo"
else
    ok "Primeira instalação — sem backup necessário"
fi

# ============================================================================
# 4. INSTALL
# ============================================================================
step "4/5  Instalando componentes..."

# Core directories
for dir in commands agents skills rules organization; do
    if [[ -d "$SRC/$dir" ]]; then
        mkdir -p "$CLAUDE_DIR/$dir"
        cp -r "$SRC/$dir"/* "$CLAUDE_DIR/$dir/" 2>/dev/null || true
        COUNT=$(find "$SRC/$dir" -type f | wc -l | tr -d ' ')
        ok "$dir/ ($COUNT arquivos)"
    fi
done

# Hooks
if [[ -d "$SRC/hooks" ]]; then
    mkdir -p "$CLAUDE_DIR/hooks"
    cp -r "$SRC/hooks"/* "$CLAUDE_DIR/hooks/" 2>/dev/null || true
    COUNT=$(find "$SRC/hooks" -type f | wc -l | tr -d ' ')
    ok "hooks/ ($COUNT arquivos) ${DIM}[V6.3]${NC}"
fi

# V6 Intelligence Layer
for dir in scripts templates data docs; do
    if [[ -d "$SRC/$dir" ]]; then
        mkdir -p "$CLAUDE_DIR/$dir"
        cp -r "$SRC/$dir"/* "$CLAUDE_DIR/$dir/" 2>/dev/null || true
        COUNT=$(find "$SRC/$dir" -type f | wc -l | tr -d ' ')
        ok "$dir/ ($COUNT arquivos) ${DIM}[V6]${NC}"
    fi
done

# Make scripts executable
if [[ -d "$CLAUDE_DIR/scripts" ]]; then
    chmod +x "$CLAUDE_DIR/scripts/"*.sh 2>/dev/null || true
fi

# CLAUDE.md — special handling
if [[ -f "$CLAUDE_DIR/CLAUDE.md" ]]; then
    # Check if it's already Segunda-feira
    if grep -q "Segunda-feira" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
        # Update existing
        cp "$SRC/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
        ok "CLAUDE.md atualizado (Segunda-feira detectado)"
    else
        # User has custom CLAUDE.md — don't overwrite, save as reference
        cp "$SRC/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.segunda-feira.md"
        warn "CLAUDE.md customizado encontrado — salvo como CLAUDE.segunda-feira.md"
        warn "Mescle manualmente se desejar: ~/.claude/CLAUDE.segunda-feira.md"
    fi
else
    cp "$SRC/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
    ok "CLAUDE.md instalado"
fi

# ============================================================================
# 5. VERIFY
# ============================================================================
step "5/5  Verificando instalação..."

AGENTS=$(find "$CLAUDE_DIR/commands" "$CLAUDE_DIR/agents" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
SKILLS=$(find "$CLAUDE_DIR/skills" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
RULES=$(find "$CLAUDE_DIR/rules" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

ok "Agentes instalados: $AGENTS"
ok "Skills instaladas: $SKILLS"
ok "Rules instaladas: $RULES"

# Run health check if available
if [[ -f "$CLAUDE_DIR/scripts/health-check.sh" ]]; then
    ok "Health check disponível: bash ~/.claude/scripts/health-check.sh"
fi

# ============================================================================
# DONE
# ============================================================================
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║       Segunda-feira v${VERSION} instalado com sucesso!      ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BOLD}Próximos passos:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Abra o Claude Code no terminal"
echo -e "  ${CYAN}2.${NC} Digite ${BOLD}@aios-master${NC} para ativar o master orchestrator"
echo -e "  ${CYAN}3.${NC} Use ${BOLD}*help${NC} para ver todos os comandos"
echo ""
echo -e "  ${BOLD}Comandos úteis:${NC}"
echo -e "  ${DIM}@dev${NC}              Ativa o engenheiro sênior"
echo -e "  ${DIM}@content${NC}          Ativa a estrategista de conteúdo"
echo -e "  ${DIM}/paid-ads${NC}         Gestão de tráfego pago"
echo -e "  ${DIM}/copywriting${NC}      Copy persuasivo"
echo -e "  ${DIM}bash ~/.claude/scripts/health-check.sh${NC}  Verifica integridade"
echo ""
echo -e "  ${DIM}Docs: https://github.com/${REPO}${NC}"
echo -e "  ${DIM}Backup: ${BACKUP_DIR:-nenhum}${NC}"
echo ""
