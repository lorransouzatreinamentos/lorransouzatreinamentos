# Decision Log — Template Padronizado

> **Uso:** Todo agente que toma uma decisão autônoma DEVE registrar usando este template.
> **Local:** `docs/decisions/decision-log-{story-id}.md` ou `~/observations/decisions/`
> **Princípio:** Decisões documentadas criam um learning loop — o framework aprende com cada execução.

---

## Formato de Registro

```markdown
### DEC-{NNN} — {Título curto da decisão}

| Campo | Valor |
|-------|-------|
| **Data** | AAAA-MM-DD HH:MM |
| **Agente** | @{agent-name} |
| **Contexto** | {Story ID ou tarefa que originou a decisão} |
| **Tipo** | TÉCNICA / ARQUITETURA / NEGÓCIO / PROCESSO / EMERGÊNCIA |
| **Severidade** | BAIXA / MÉDIA / ALTA / CRÍTICA |

**Situação:** {O que estava acontecendo — 1-2 linhas}

**Opções Avaliadas:**

| # | Opção | Prós | Contras |
|---|-------|------|---------|
| 1 | {opção escolhida} | {prós} | {contras} |
| 2 | {opção descartada} | {prós} | {contras} |

**Decisão:** Opção {N} — {justificativa em 1 linha}

**IDS Check:** {REUSE / ADAPT / CREATE} — {referência ao entity registry se aplicável}

**Impacto Esperado:** {O que muda com essa decisão}

**Validação:** {Como saber se a decisão foi boa — métrica ou critério objetivo}
```

---

## Regras de Uso

### Quando Registrar (obrigatório)

| Situação | Exemplo |
|----------|---------|
| Escolha de tecnologia/lib | "Usar Zustand em vez de Redux" |
| Mudança de arquitetura | "Separar módulo em microserviço" |
| Desvio do AC da story | "AC pede X mas Y é mais seguro" |
| Pausa/escala de campanha | "Pausar campanha V4 por CPL alto" |
| Criação em vez de reuso | "Criar componente novo (IDS CREATE)" |
| Qualquer override de regra | "Override IDS gate por urgência" |
| Decisão de priorização | "Adiar feature Z para sprint seguinte" |

### Quando NÃO Registrar

- Decisões triviais (nome de variável, formatação)
- Decisões já cobertas por regras existentes sem exceção
- Ações automáticas que seguem regras Sobral/EROS sem desvio

### Classificação por Tipo

| Tipo | Exemplos |
|------|----------|
| **TÉCNICA** | Escolha de lib, pattern, algoritmo |
| **ARQUITETURA** | Estrutura de módulos, APIs, DB schema |
| **NEGÓCIO** | Priorização, escopo, oferta, preço |
| **PROCESSO** | Mudança de workflow, skip de gate |
| **EMERGÊNCIA** | Hotfix, rollback, pausa urgente |

### Revisão e Aprendizado

- Decisões com severidade ALTA/CRÍTICA devem ser revisadas em 7 dias
- Campo **Validação** é verificado na revisão — a decisão deu certo?
- Padrões de decisões repetidas devem virar regras ou skills
- Decisões que deram errado alimentam memória de feedback

---

## Exemplo Preenchido

```markdown
### DEC-001 — Usar sync periódico em vez de real-time para dashboard PAYMENT_API

| Campo | Valor |
|-------|-------|
| **Data** | 2026-03-17 14:30 |
| **Agente** | @architect |
| **Contexto** | Client Dashboard — módulo financeiro |
| **Tipo** | ARQUITETURA |
| **Severidade** | CRÍTICA |

**Situação:** Dashboard financeiro fazendo ~300 chamadas paginadas ao PAYMENT_API por acesso. Rate limit 429 cascateou e bloqueou API por >1h.

**Opções Avaliadas:**

| # | Opção | Prós | Contras |
|---|-------|------|---------|
| 1 | Sync periódico 30min → DB local | Zero rate limits, <100ms queries | Dados com até 30min de delay |
| 2 | Cache em memória com TTL | Rápido de implementar | Perde no restart, não escala |
| 3 | Manter real-time com rate limiting | Dados sempre frescos | Complexo, ainda sujeito a 429 |

**Decisão:** Opção 1 — Dados financeiros não precisam de real-time, delay de 30min é aceitável para dashboard.

**IDS Check:** CREATE — Novo padrão SYNC > CACHE > REAL-TIME (registrado como PAT-001)

**Impacto Esperado:** Eliminar 100% dos rate limits, queries <100ms, filtros instantâneos.

**Validação:** 0 erros 429 em 14 dias + tempo de resposta < 200ms em P95
```

---

## Integração com Workflows

| Workflow | Quando registrar |
|----------|-----------------|
| SDC (Implement) | @dev registra decisões técnicas durante implementação |
| QA Loop | @qa registra decisões de verdict (APPROVE/REJECT/BLOCKED) |
| Spec Pipeline | @architect registra decisões de arquitetura |
| Brownfield | @architect registra decisões de migração |
| Traffic Autopilot | Ações automáticas registradas em ads-actions-log.md |
