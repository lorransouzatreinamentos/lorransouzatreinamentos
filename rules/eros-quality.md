# EROS — Padrão de Qualidade Integrado

> **Severidade:** MUST | **Aplica-se a:** Todos os agentes
> **Origem:** EROS v2.0 — adaptado para integração com Segunda-feira

## Princípio

Todo agente é **dono do resultado**. EROS não é um agente separado — é um padrão de comportamento que todo agente segue antes de entregar qualquer resultado.

**Regra de ouro:** "Se eu fosse o destinatário, ficaria satisfeito com isso?" — Se não, corrige antes de entregar.

---

## 5 Portões de Qualidade

### Portão 1 — COMPREENSÃO (pré-execução, todo agente)

| Critério | Validação |
|----------|-----------|
| Objetivo real identificado | O agente sabe **o que** entregar e **por que** |
| Contexto mapeado | Quem vai usar, em que situação, com que expectativa |
| Resultado esperado definido | Formato, profundidade, tom e escopo claros |
| Ambiguidades resolvidas | Resolvidas por inferência (autonomia) ou pergunta ao usuário (só se informação objetivamente ausente) |

**Falha típica:** Executar a tarefa literal sem entender a intenção real.

### Portão 2 — PLANEJAMENTO (pré-execução, todo agente)

| Critério | Validação |
|----------|-----------|
| Sequência lógica de etapas | Ordem faz sentido |
| Cobertura completa | Nenhuma etapa necessária omitida |
| Critérios de sucesso definidos | Como medir qualidade da entrega |
| Riscos antecipados | Pontos de falha previsíveis considerados |

**Falha típica:** Começar a executar sem planejar, gerando retrabalho.

### Portão 3 — EXECUÇÃO (delegado ao fluxo existente)

**Mapeamento Segunda-feira:**
- @dev → `dev-develop-story.md` + CodeRabbit self-healing (max 2 iterações)
- Outros agentes → execução conforme task definition

| Critério | Validação |
|----------|-----------|
| Completude | Todas as etapas executadas, sem atalhos |
| Profundidade adequada | Nível de detalhe proporcional à complexidade |
| Coerência interna | Sem contradições entre partes da entrega |
| Raciocínio aplicado | Análise real, não replicação de padrões |

### Portão 4 — REVISÃO (delegado ao QA Gate)

**Mapeamento Segunda-feira:**
- @qa → `qa-gate.md` (7 quality checks)
- Auto-revisão obrigatória antes de submeter ao QA Gate

| Critério | Validação |
|----------|-----------|
| Auto-revisão feita | Agente releu e avaliou o próprio trabalho |
| Erros factuais ausentes | Dados, nomes, referências corretos |
| Clareza | Leitor externo entenderia sem contexto adicional |
| Organização | Estrutura facilita leitura e uso |

### Portão 5 — LIBERAÇÃO (delegado ao QA Loop)

**Mapeamento Segunda-feira:**
- @qa → QA Loop (max 5 iterações) → verdict APPROVE/REJECT/BLOCKED
- @devops → push (autoridade exclusiva)

| Critério | Validação |
|----------|-----------|
| Resolve o problema original | Atende ao objetivo real (Portão 1) |
| Pronta para uso | Não exige retrabalho ou interpretação |
| Padrão mínimo atingido | Nível: **Alto** (ver escala abaixo) |
| Decisões autônomas documentadas | Decisões visíveis ou justificadas |

---

## Classificação de Qualidade

| Nível | Descrição | Ação |
|-------|-----------|------|
| **Crítico** | Errada, incompleta ou incoerente | Bloquear. Refazer do portão com falha. |
| **Baixo** | Funcional mas superficial ou genérica | Bloquear. Correções obrigatórias. |
| **Médio** | Adequada mas sem profundidade | Liberar com ressalvas documentadas. |
| **Alto** | Completa, clara, bem estruturada, revisada | Aprovar. **Padrão mínimo.** |
| **Excelência** | Supera expectativas, antecipa necessidades | Aprovar com destaque. |

---

## Taxonomia de Falhas

### Compreensão
| Código | Falha |
|--------|-------|
| C1 | Objetivo mal interpretado — resolve problema errado |
| C2 | Contexto ignorado — tom/formato/profundidade inadequados |
| C3 | Escopo inflado ou reduzido |

### Execução
| Código | Falha |
|--------|-------|
| E1 | Execução incompleta — etapas faltando |
| E2 | Superficialidade — conteúdo genérico |
| E3 | Incoerência interna — partes se contradizem |
| E4 | Dados incorretos |
| E5 | Cópia sem adaptação ao contexto |

### Processo
| Código | Falha |
|--------|-------|
| P1 | Sem revisão |
| P2 | Sem planejamento |
| P3 | Violação de autonomia — pergunta desnecessária |
| P4 | Entrega prematura |

### Qualidade
| Código | Falha |
|--------|-------|
| Q1 | Desorganização |
| Q2 | Falta de clareza |
| Q3 | Tom inadequado |
| Q4 | Formatação negligente |

---

## Protocolo de Correção

```
1. IDENTIFICAR  → Código da falha + descrição específica
2. LOCALIZAR    → Onde está o problema na entrega
3. ESPECIFICAR  → O que mudar + critério objetivo
4. REVALIDAR    → Passar novamente pelo portão relevante
```

**Regras:**
- Nunca apontar falha sem indicar correção específica
- Nunca termos vagos ("melhore isso") — sempre **o quê** e **como**
- Falha no Portão 1 → reavaliar toda a execução
- Máximo 2 ciclos de correção por portão → escalar ou refazer

---

## Entregas Proibidas

| Tipo | Descrição |
|------|-----------|
| Incompleta | Faltam seções ou etapas prometidas |
| Genérica | Poderia se aplicar a qualquer situação |
| Sem revisão | Não releu antes de entregar |
| Com erro factual | Dados ou referências incorretos |
| Confusa | Destinatário precisaria adivinhar a intenção |
| "Rápida para acabar" | Execução mínima sem cuidado |
| Redundante | Repete ideias para preencher espaço |
| Desconectada | Não responde ao problema original |

---

## Auto-Checagem (todo agente, antes de entregar)

```
[ ] Entendi o objetivo real (não apenas o literal)?
[ ] Executei todas as etapas necessárias?
[ ] Reli e revisei o trabalho completo?
[ ] A entrega está clara para quem vai receber?
[ ] A estrutura facilita a leitura e o uso?
[ ] Tomei decisões com autonomia onde cabia?
[ ] Se eu fosse o destinatário, ficaria satisfeito?
[ ] Existe algo que sei que poderia estar melhor mas deixei passar?
```

**Se qualquer resposta for "não" → a tarefa não está pronta.**

---

## Proporcionalidade

O rigor é proporcional ao impacto:

| Complexidade da tarefa | Portões aplicados | Relatório |
|------------------------|-------------------|-----------|
| Trivial (renomear, fix typo) | 1 + 3 (rápido) | Nenhum |
| Simples (bug fix, task isolada) | 1 + 3 + auto-checagem | Nenhum |
| Média (feature, refactor) | Todos os 5 | Apenas se falha |
| Crítica (arquitetura, release) | Todos os 5 + auditoria formal | Completo |

---

## Hierarquia de Autoridade

EROS é padrão de qualidade, não autoridade decisória.

```
@aios-master > @po > @qa > EROS > agente executor
```

EROS **não** overrida decisões de agentes com autoridade constitucional.
Conflito entre autonomia e qualidade → qualidade vence (autonomia é meio, não fim).

---

## Integração com Fluxos Existentes

| Fluxo Segunda-feira | Portões EROS ativos |
|---------------------|---------------------|
| Story Development Cycle | Todos (1→5 mapeados para SDC phases) |
| QA Loop | 3→4→5 (iterativo, max 5 ciclos) |
| Spec Pipeline | 1→2 (compreensão + planejamento intensivos) |
| Brownfield Discovery | 1→2→3 (sem QA Loop formal) |
| Tarefa avulsa (sem story) | 1→2→3 + auto-checagem |
