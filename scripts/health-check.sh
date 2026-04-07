#!/bin/bash
# ============================================================================
# Segunda-feira Framework — Health Check
# Valida integridade de agentes, skills, rules, memoria e aios-core
# Uso: bash ~/.claude/scripts/health-check.sh
# ============================================================================

set -euo pipefail

# --- Cores ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# --- Contadores ---
PASS=0
WARN=0
FAIL=0
TOTAL=0

# --- Helpers ---
check_pass() { ((PASS++)); ((TOTAL++)); echo -e "  ${GREEN}✅${NC} $1"; }
check_warn() { ((WARN++)); ((TOTAL++)); echo -e "  ${YELLOW}⚠️${NC}  $1"; }
check_fail() { ((FAIL++)); ((TOTAL++)); echo -e "  ${RED}❌${NC} $1"; }
section()    { echo -e "\n${CYAN}${BOLD}━━━ $1 ━━━${NC}"; }

# --- Paths ---
CLAUDE_DIR="$HOME/.claude"
AGENTS_DIR="$CLAUDE_DIR/agents"
SKILLS_DIR="$CLAUDE_DIR/skills"
RULES_DIR="$CLAUDE_DIR/rules"
HOOKS_DIR="$CLAUDE_DIR/hooks"
MEMORY_DIR="$CLAUDE_DIR/projects/${USER_PROJECT_PATH}/memory"
AIOS_DIR="$HOME/.aios-core"
CONSTITUTION="$CLAUDE_DIR/CLAUDE.md"

echo -e "${BOLD}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║   SEGUNDA-FEIRA — FRAMEWORK HEALTH CHECK            ║"
echo "║   $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# 1. CONSTITUICAO
# ============================================================================
section "1. CONSTITUICAO"

if [[ -f "$CONSTITUTION" ]]; then
    SIZE=$(wc -c < "$CONSTITUTION" | tr -d ' ')
    if [[ $SIZE -gt 100 ]]; then
        check_pass "CLAUDE.md existe ($SIZE bytes)"
    else
        check_warn "CLAUDE.md existe mas parece vazio ($SIZE bytes)"
    fi
    if grep -q "Segunda-feira" "$CONSTITUTION" 2>/dev/null; then
        check_pass "Contém referência 'Segunda-feira'"
    else
        check_fail "NÃO contém 'Segunda-feira' — constituição pode estar corrompida"
    fi
    # Check version
    VERSION=$(grep -o 'v[0-9]\+\.[0-9]\+' "$CONSTITUTION" | head -1 || echo "N/A")
    check_pass "Versão detectada: $VERSION"
else
    check_fail "CLAUDE.md NÃO encontrado em $CONSTITUTION"
fi

# ============================================================================
# 2. AGENTES (~/.claude/agents/)
# ============================================================================
section "2. AGENTES ESPECIALISTAS"

if [[ -d "$AGENTS_DIR" ]]; then
    AGENT_COUNT=0
    AGENT_NO_FRONTMATTER=0
    AGENT_EMPTY=0

    for f in "$AGENTS_DIR"/*.md; do
        [[ -f "$f" ]] || continue
        ((AGENT_COUNT++))

        SIZE=$(wc -c < "$f" | tr -d ' ')
        if [[ $SIZE -lt 50 ]]; then
            ((AGENT_EMPTY++))
            check_fail "Agente vazio: $(basename "$f") ($SIZE bytes)"
        fi

        if ! head -1 "$f" | grep -q "^---" 2>/dev/null; then
            ((AGENT_NO_FRONTMATTER++))
        fi
    done

    check_pass "Total de agentes: $AGENT_COUNT"

    if [[ $AGENT_NO_FRONTMATTER -gt 0 ]]; then
        check_warn "$AGENT_NO_FRONTMATTER agente(s) sem YAML frontmatter"
    else
        check_pass "Todos os agentes têm YAML frontmatter"
    fi

    if [[ $AGENT_EMPTY -eq 0 ]]; then
        check_pass "Nenhum agente vazio"
    fi
else
    check_fail "Diretório de agentes não encontrado: $AGENTS_DIR"
fi

# ============================================================================
# 3. SKILLS (~/.claude/skills/)
# ============================================================================
section "3. SKILLS"

if [[ -d "$SKILLS_DIR" ]]; then
    SKILL_COUNT=0
    SKILL_NO_FRONT=0
    SKILL_NO_DESC=0
    SKILL_EMPTY=0
    SKILL_PROBLEMS=""

    for f in "$SKILLS_DIR"/*.md; do
        [[ -f "$f" ]] || continue
        ((SKILL_COUNT++))

        SIZE=$(wc -c < "$f" | tr -d ' ')
        if [[ $SIZE -lt 50 ]]; then
            ((SKILL_EMPTY++))
            SKILL_PROBLEMS="$SKILL_PROBLEMS\n    - $(basename "$f") (vazio, $SIZE bytes)"
        fi

        if ! head -1 "$f" | grep -q "^---" 2>/dev/null; then
            ((SKILL_NO_FRONT++))
            SKILL_PROBLEMS="$SKILL_PROBLEMS\n    - $(basename "$f") (sem frontmatter)"
        else
            if ! head -10 "$f" | grep -q "description:" 2>/dev/null; then
                ((SKILL_NO_DESC++))
                SKILL_PROBLEMS="$SKILL_PROBLEMS\n    - $(basename "$f") (frontmatter sem description)"
            fi
        fi
    done

    check_pass "Total de skills: $SKILL_COUNT"

    if [[ $SKILL_NO_FRONT -gt 0 ]]; then
        check_warn "$SKILL_NO_FRONT skill(s) sem YAML frontmatter"
    else
        check_pass "Todas as skills têm YAML frontmatter"
    fi

    if [[ $SKILL_NO_DESC -gt 0 ]]; then
        check_warn "$SKILL_NO_DESC skill(s) sem campo 'description' no frontmatter"
    else
        check_pass "Todas as skills têm campo 'description'"
    fi

    if [[ $SKILL_EMPTY -gt 0 ]]; then
        check_fail "$SKILL_EMPTY skill(s) vazia(s)"
    else
        check_pass "Nenhuma skill vazia"
    fi

    if [[ -n "$SKILL_PROBLEMS" ]]; then
        echo -e "  ${YELLOW}Detalhes:${NC}$SKILL_PROBLEMS"
    fi
else
    check_fail "Diretório de skills não encontrado: $SKILLS_DIR"
fi

# ============================================================================
# 4. RULES (~/.claude/rules/)
# ============================================================================
section "4. REGRAS DE GOVERNANCA"

if [[ -d "$RULES_DIR" ]]; then
    RULE_COUNT=0
    RULE_EMPTY=0

    for f in "$RULES_DIR"/*.md; do
        [[ -f "$f" ]] || continue
        ((RULE_COUNT++))

        SIZE=$(wc -c < "$f" | tr -d ' ')
        if [[ $SIZE -lt 100 ]]; then
            ((RULE_EMPTY++))
            check_fail "Regra vazia: $(basename "$f")"
        fi
    done

    check_pass "Total de regras: $RULE_COUNT"

    if [[ $RULE_EMPTY -eq 0 ]]; then
        check_pass "Todas as regras têm conteúdo"
    fi

    # Check expected rules
    EXPECTED_RULES=("agent-authority.md" "eros-quality.md" "workflow-execution.md" "story-lifecycle.md" "ids-principles.md" "external-api-patterns.md" "mcp-usage.md" "coderabbit-integration.md")
    MISSING_RULES=0
    for rule in "${EXPECTED_RULES[@]}"; do
        if [[ ! -f "$RULES_DIR/$rule" ]]; then
            ((MISSING_RULES++))
            check_fail "Regra esperada ausente: $rule"
        fi
    done

    if [[ $MISSING_RULES -eq 0 ]]; then
        check_pass "Todas as 8 regras esperadas presentes"
    fi
else
    check_fail "Diretório de regras não encontrado: $RULES_DIR"
fi

# ============================================================================
# 5. MEMORIA
# ============================================================================
section "5. SISTEMA DE MEMORIA"

if [[ -d "$MEMORY_DIR" ]]; then
    MEM_COUNT=$(find "$MEMORY_DIR" -name "*.md" ! -name "MEMORY.md" | wc -l | tr -d ' ')
    check_pass "Total de arquivos de memória: $MEM_COUNT"

    MEMORY_INDEX="$MEMORY_DIR/MEMORY.md"
    if [[ -f "$MEMORY_INDEX" ]]; then
        INDEX_SIZE=$(wc -c < "$MEMORY_INDEX" | tr -d ' ')
        check_pass "MEMORY.md existe ($INDEX_SIZE bytes)"

        # Check for dead links (files referenced in MEMORY.md but not existing)
        DEAD_LINKS=0
        while IFS= read -r line; do
            # Extract markdown links like [Title](file.md)
            FILE_REF=$(echo "$line" | grep -o '([^)]*\.md)' | tr -d '()' || true)
            if [[ -n "$FILE_REF" && ! -f "$MEMORY_DIR/$FILE_REF" ]]; then
                ((DEAD_LINKS++))
                check_fail "Link morto no MEMORY.md: $FILE_REF"
            fi
        done < "$MEMORY_INDEX"

        if [[ $DEAD_LINKS -eq 0 ]]; then
            check_pass "Zero links mortos no MEMORY.md"
        fi

        # Check for orphan files (files not referenced in MEMORY.md)
        ORPHANS=0
        for f in "$MEMORY_DIR"/*.md; do
            [[ -f "$f" ]] || continue
            BASENAME=$(basename "$f")
            [[ "$BASENAME" == "MEMORY.md" ]] && continue

            if ! grep -q "$BASENAME" "$MEMORY_INDEX" 2>/dev/null; then
                ((ORPHANS++))
                check_warn "Arquivo órfão (não indexado): $BASENAME"
            fi
        done

        if [[ $ORPHANS -eq 0 ]]; then
            check_pass "Zero arquivos órfãos — todos indexados"
        fi
    else
        check_fail "MEMORY.md (índice) NÃO encontrado"
    fi
else
    check_fail "Diretório de memória não encontrado: $MEMORY_DIR"
fi

# ============================================================================
# 6. AIOS CORE ENGINE
# ============================================================================
section "6. AIOS CORE ENGINE"

if [[ -d "$AIOS_DIR" ]]; then
    check_pass "Diretório .aios-core/ existe"

    # Version
    if [[ -f "$AIOS_DIR/version.json" ]]; then
        VERSION=$(cat "$AIOS_DIR/version.json" 2>/dev/null | grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | grep -o '"[^"]*"$' | tr -d '"' || echo "N/A")
        check_pass "Versão Synkra: $VERSION"
    else
        check_warn "version.json não encontrado"
    fi

    # Workflows
    WF_DIR="$AIOS_DIR/development/workflows"
    if [[ -d "$WF_DIR" ]]; then
        WF_COUNT=$(find "$WF_DIR" -name "*.yaml" -o -name "*.yml" | wc -l | tr -d ' ')
        check_pass "Workflows definidos: $WF_COUNT"
    else
        check_warn "Diretório de workflows não encontrado"
    fi

    # Tasks
    TASK_DIR="$AIOS_DIR/development/tasks"
    if [[ -d "$TASK_DIR" ]]; then
        TASK_COUNT=$(find "$TASK_DIR" -type f | wc -l | tr -d ' ')
        check_pass "Tasks executáveis: $TASK_COUNT"
    else
        check_warn "Diretório de tasks não encontrado"
    fi

    # Squads
    SQUAD_DIR="$AIOS_DIR/squads"
    if [[ -d "$SQUAD_DIR" ]]; then
        SQUAD_COUNT=$(find "$SQUAD_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
        check_pass "Squads: $SQUAD_COUNT"
    else
        check_warn "Diretório de squads não encontrado"
    fi

    # Core agents
    CORE_AGENTS="$AIOS_DIR/development/agents"
    if [[ -d "$CORE_AGENTS" ]]; then
        CORE_COUNT=$(find "$CORE_AGENTS" -name "*.md" | wc -l | tr -d ' ')
        check_pass "Agentes core: $CORE_COUNT"
    else
        check_warn "Diretório de agentes core não encontrado"
    fi

    # Key files
    for KEY_FILE in "core-config.yaml" "constitution.md" "package.json"; do
        if [[ -f "$AIOS_DIR/$KEY_FILE" ]]; then
            check_pass "Arquivo chave presente: $KEY_FILE"
        else
            check_warn "Arquivo chave ausente: $KEY_FILE"
        fi
    done

    # Entity Registry (IDS)
    if [[ -f "$AIOS_DIR/data/entity-registry.yaml" ]]; then
        check_pass "IDS Entity Registry presente"
    else
        check_warn "IDS Entity Registry ausente (REUSE > ADAPT > CREATE não operacional)"
    fi

    # Smart Router
    if [[ -f "$AIOS_DIR/core/orchestration/smart-router.yaml" ]]; then
        check_pass "Smart Router presente"
    else
        check_warn "Smart Router ausente (roteamento manual de agentes)"
    fi

    # Architecture Doc
    if [[ -f "$AIOS_DIR/docs/architecture.md" ]]; then
        check_pass "Documento de arquitetura presente"
    else
        check_warn "Documento de arquitetura ausente"
    fi

    # Workflow Validation Matrix
    if [[ -f "$AIOS_DIR/docs/workflow-validation-matrix.md" ]]; then
        check_pass "Workflow Validation Matrix presente"
    else
        check_warn "Workflow Validation Matrix ausente"
    fi

    # Decision Log Template
    if [[ -f "$AIOS_DIR/development/templates/decision-log-template.md" ]]; then
        check_pass "Decision Log Template presente"
    else
        check_warn "Decision Log Template ausente"
    fi
else
    check_fail "Diretório .aios-core/ NÃO encontrado"
fi

# ============================================================================
# 7. HOOKS
# ============================================================================
section "7. HOOKS E AUTOMACAO"

if [[ -d "$HOOKS_DIR" ]]; then
    HOOK_COUNT=0
    for f in "$HOOKS_DIR"/*; do
        [[ -f "$f" ]] || continue
        BASENAME=$(basename "$f")
        [[ "$BASENAME" == "README.md" ]] && continue
        ((HOOK_COUNT++))

        if [[ -x "$f" ]] || [[ "$f" == *.js ]] || [[ "$f" == *.py ]] || [[ "$f" == *.sh ]]; then
            check_pass "Hook ativo: $BASENAME"
        else
            check_warn "Hook sem extensão executável: $BASENAME"
        fi
    done

    check_pass "Total de hooks: $HOOK_COUNT"
else
    check_warn "Diretório de hooks não encontrado"
fi

# ============================================================================
# 8. KNOWLEDGE REPOS
# ============================================================================
section "8. REPOSITORIOS DE CONHECIMENTO"

SCRAPER_DIR="$HOME/telegram-scraper"
if [[ -d "$SCRAPER_DIR/output" ]]; then
    REPO_COUNT=$(find "$SCRAPER_DIR/output" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
    check_pass "Grupos INEMA: $REPO_COUNT"

    # Check key repos
    for REPO in "INEMA_N8N" "INEMA_CCODE" "INEMA_Google"; do
        if [[ -d "$SCRAPER_DIR/output/$REPO" ]]; then
            check_pass "Repo presente: $REPO"
        else
            check_warn "Repo ausente: $REPO"
        fi
    done
else
    check_warn "Telegram scraper output não encontrado"
fi

if [[ -d "$SCRAPER_DIR/mirofish-repo" ]]; then
    check_pass "MiroFish repo presente"
else
    check_warn "MiroFish repo ausente"
fi

# ============================================================================
# RESUMO
# ============================================================================
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                    RESUMO FINAL                     ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

HEALTH=0
if [[ $TOTAL -gt 0 ]]; then
    HEALTH=$(( (PASS * 100) / TOTAL ))
fi

echo -e "  ${GREEN}✅ Passou:${NC}    $PASS"
echo -e "  ${YELLOW}⚠️  Avisos:${NC}   $WARN"
echo -e "  ${RED}❌ Falhas:${NC}    $FAIL"
echo -e "  ${BOLD}📊 Total:${NC}     $TOTAL checks"
echo ""

if [[ $HEALTH -ge 90 ]]; then
    echo -e "  ${GREEN}${BOLD}SAUDE DO FRAMEWORK: ${HEALTH}% — EXCELENTE${NC}"
elif [[ $HEALTH -ge 75 ]]; then
    echo -e "  ${CYAN}${BOLD}SAUDE DO FRAMEWORK: ${HEALTH}% — BOM${NC}"
elif [[ $HEALTH -ge 60 ]]; then
    echo -e "  ${YELLOW}${BOLD}SAUDE DO FRAMEWORK: ${HEALTH}% — ATENCAO${NC}"
else
    echo -e "  ${RED}${BOLD}SAUDE DO FRAMEWORK: ${HEALTH}% — CRITICO${NC}"
fi

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Executado em: $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "  Script: ~/.claude/scripts/health-check.sh"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
