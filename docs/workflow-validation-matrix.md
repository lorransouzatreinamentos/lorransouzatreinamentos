# Workflow Validation Matrix — Segunda-feira Framework

> **Propósito:** Mapear o status de maturidade de cada workflow — quais são battle-tested em produção vs. teóricos/aspiracionais.
> **Última atualização:** 2026-03-29

---

## Legenda de Status

| Status | Significado | Critério |
|--------|------------|----------|
| **BATTLE-TESTED** | Usado em produção com sucesso repetido | 3+ execuções completas sem falha |
| **VALIDADO** | Testado pelo menos uma vez end-to-end | 1-2 execuções completas |
| **PARCIAL** | Algumas fases usadas, workflow completo nunca rodou | Fases individuais validadas |
| **TEÓRICO** | Definido mas nunca executado | Apenas documentação |
| **ASPIRACIONAL** | Conceito planejado, implementação incompleta | Design existe, código/config não |

---

## Workflows Primários

| # | Workflow | Arquivo YAML | Status | Execuções | Projetos | Notas |
|---|---------|-------------|--------|-----------|----------|-------|
| 1 | **Story Development Cycle (SDC)** | `story-development-cycle.yaml` | **BATTLE-TESTED** | 20+ | Production Projects | Workflow principal — Create→Validate→Implement→QA Gate |
| 2 | **QA Loop** | `qa-loop.yaml` | **VALIDADO** | 5+ | Production Projects | Review-fix iterativo, max 5 iterações |
| 3 | **Spec Pipeline** | `spec-pipeline.yaml` | **PARCIAL** | 2-3 | Delivery App | Fases Gather e Write Spec usadas; Critique e Plan menos |
| 4 | **Brownfield Discovery** | `brownfield-discovery.yaml` | **PARCIAL** | 1-2 | Client Dashboard | Fases 1-3 (data collection) usadas; fases 8-10 raramente |
| 5 | **Development Cycle** | `development-cycle.yaml` | **BATTLE-TESTED** | 15+ | Vários | Variante simplificada do SDC |
| 6 | **Epic Orchestration** | `epic-orchestration.yaml` | **VALIDADO** | 3-5 | Production Projects | Multi-story orchestration por @pm |

## Workflows de Projeto

| # | Workflow | Arquivo YAML | Status | Execuções | Notas |
|---|---------|-------------|--------|-----------|-------|
| 7 | **Greenfield Fullstack** | `greenfield-fullstack.yaml` | **VALIDADO** | 2-3 | Setup de projeto do zero (Next.js+Supabase) |
| 8 | **Greenfield UI** | `greenfield-ui.yaml` | **PARCIAL** | 1-2 | Frontend-only setup |
| 9 | **Greenfield Service** | `greenfield-service.yaml` | **TEÓRICO** | 0 | Backend-only setup — nunca usado isolado |
| 10 | **Brownfield Fullstack** | `brownfield-fullstack.yaml` | **PARCIAL** | 1-2 | Integração em projeto existente |
| 11 | **Brownfield UI** | `brownfield-ui.yaml` | **TEÓRICO** | 0 | Frontend legacy — definido mas não testado |
| 12 | **Brownfield Service** | `brownfield-service.yaml` | **TEÓRICO** | 0 | Backend legacy — definido mas não testado |

## Workflows Operacionais

| # | Workflow | Arquivo YAML | Status | Execuções | Notas |
|---|---------|-------------|--------|-----------|-------|
| 13 | **Weekly Ops Review** | `weekly-ops-review.yaml` | **TEÓRICO** | 0 | Review semanal de operações — conceito |
| 14 | **Design System Build Quality** | `design-system-build-quality.yaml` | **TEÓRICO** | 0 | Qualidade de design system — nunca ativado |
| 15 | **Auto Worktree** | `auto-worktree.yaml` | **VALIDADO** | 3+ | Git worktree automático para dev paralelo |

## Subsistemas (não são workflows YAML mas têm definição formal)

| # | Subsistema | Local | Status | Notas |
|---|-----------|-------|--------|-------|
| 16 | **IDS Entity Registry** | `data/entity-registry.yaml` | **ASPIRACIONAL → VALIDADO** | Recém-criado (2026-03-29), precisa de uso real |
| 17 | **Smart Router** | `core/orchestration/smart-router.yaml` | **ASPIRACIONAL → VALIDADO** | Recém-criado (2026-03-29), precisa de uso real |
| 18 | **EROS Quality Gates** | `rules/eros-quality.md` | **BATTLE-TESTED** | Integrado em todos os workflows de dev |
| 19 | **Agent Authority Matrix** | `rules/agent-authority.md` | **BATTLE-TESTED** | Respeitado em todas as operações |
| 20 | **CodeRabbit Self-Healing** | `rules/coderabbit-integration.md` | **PARCIAL** | Config existe, execução inconsistente |

---

## Resumo de Maturidade

| Status | Quantidade | % |
|--------|-----------|---|
| BATTLE-TESTED | 5 | 25% |
| VALIDADO | 6 | 30% |
| PARCIAL | 5 | 25% |
| TEÓRICO | 4 | 20% |
| ASPIRACIONAL | 0 | 0% |

**Score de Maturidade: 6.0/10**

---

## Plano de Promoção

### Prioridade Alta (promover para BATTLE-TESTED)

| Workflow | De | Para | Ação Necessária |
|----------|-----|------|----------------|
| QA Loop | VALIDADO | BATTLE-TESTED | Executar em 3+ stories com tracking completo |
| Epic Orchestration | VALIDADO | BATTLE-TESTED | Executar epic completo com 5+ stories |
| Auto Worktree | VALIDADO | BATTLE-TESTED | Mais 2 usos com medição de eficiência |

### Prioridade Média (promover para VALIDADO)

| Workflow | De | Para | Ação Necessária |
|----------|-----|------|----------------|
| Spec Pipeline | PARCIAL | VALIDADO | Executar end-to-end com todas as 6 fases |
| Brownfield Discovery | PARCIAL | VALIDADO | Executar fases 7-10 em projeto real |
| CodeRabbit Self-Healing | PARCIAL | VALIDADO | Configurar execução automática em CI |

### Prioridade Baixa (avaliar necessidade)

| Workflow | Status Atual | Decisão |
|----------|-------------|---------|
| Greenfield Service | TEÓRICO | Manter — raramente necessário isolado |
| Brownfield UI/Service | TEÓRICO | Manter — coberto pelo Brownfield Fullstack |
| Weekly Ops Review | TEÓRICO | Avaliar implementação quando operação escalar |
| Design System Build Quality | TEÓRICO | Avaliar quando houver design system formal |

---

## Critérios de Promoção

### TEÓRICO → PARCIAL
- [ ] Pelo menos 1 fase executada com sucesso
- [ ] Resultado documentado

### PARCIAL → VALIDADO
- [ ] Todas as fases executadas end-to-end pelo menos 1 vez
- [ ] Resultado atendeu expectativas
- [ ] Nenhuma falha crítica não tratada

### VALIDADO → BATTLE-TESTED
- [ ] 3+ execuções completas
- [ ] Usado em 2+ projetos diferentes
- [ ] Edge cases tratados
- [ ] Tempo de execução previsível
- [ ] Documentação reflete comportamento real

---

## Histórico de Atualizações

| Data | Mudança |
|------|---------|
| 2026-03-29 | Criação inicial da matrix com inventário completo |
| 2026-03-29 | IDS Entity Registry e Smart Router criados (ASPIRACIONAL → VALIDADO) |
