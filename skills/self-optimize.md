---
name: self-optimize
description: "Auto-análise e melhoria contínua do framework Segunda-feira — detecta padrões repetitivos, propõe skills, elimina erros recorrentes, evolui autonomia. Invocada manualmente via /self-optimize ou automaticamente 1x/semana. O framework que se melhora sozinho."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# /self-optimize — Auto-Análise e Melhoria Contínua

> **Tipo:** Skill meta-evolutiva | **Agente padrão:** @aios-master
> **Trigger:** Comando `/self-optimize` ou execução semanal automática (domingo à noite)
> **Dependências:** `/pattern-detector` (fonte de padrões), `/skill-creator` (criação de skills)

## Objetivo

Analisar o uso do framework Segunda-feira, detectar oportunidades de melhoria, e implementar evoluções automaticamente. Transforma o que hoje o CEO faz manualmente ("analisa minhas conversas e cria uma skill") em um processo autônomo e contínuo.

---

## Ciclo de Execução (6 Fases)

### Fase 1 — SCAN (Coleta de Dados)

Ler e catalogar o estado atual do framework:

#### 1.1 Skills
```bash
ls ~/.claude/skills/*.md | wc -l  # total
```
Para cada skill, verificar:
- Data de última modificação (`stat -f %Sm` ou `ls -la`)
- Tamanho do arquivo (skills < 10 linhas = potencialmente vazias)
- Presença de frontmatter válido (name + description)

#### 1.2 Agentes
```bash
ls ~/.claude/agents/*.md | wc -l  # total
```

#### 1.3 Memórias
```bash
ls ~/.claude/projects/*/memory/*.md | wc -l  # total
```
Para cada memória, verificar:
- Idade (> 30 dias sem atualização = stale)
- Tipo (feedback vs contexto vs regra)

#### 1.4 Regras
```bash
ls ~/.claude/rules/*.md | wc -l  # total
```

#### 1.5 Observações
Ler todos os arquivos em `~/observations/`:
- `patterns-detected.md` — padrões ativos e em observação
- `suggestions-queue.md` — sugestões pendentes, aceitas, descartadas
- `self-optimize-log.md` — histórico de otimizações anteriores

#### 1.6 Feedbacks
Ler todos os arquivos `feedback_*.md` em memória:
```bash
ls ~/.claude/projects/*/memory/feedback_*.md
```

---

### Fase 2 — ANALYZE (Detecção de Oportunidades)

Aplicar as seguintes análises sobre os dados coletados:

#### 2.1 Detecção de Repetição
Comparar feedbacks e memórias buscando:

| Sinal | Threshold | Ação |
|-------|-----------|------|
| Mesmo pedido aparece em 3+ feedbacks | 3 ocorrências | Candidato a skill |
| Mesmo erro corrigido em 3+ feedbacks | 3 ocorrências | Candidato a regra |
| Tarefa operacional recorrente sem skill | 3 ocorrências | Candidato a automação |
| Decisão que segue padrão previsível | 3 ocorrências | Candidato a regra autônoma |

#### 2.2 Detecção de Desuso
| Sinal | Threshold | Ação |
|-------|-----------|------|
| Skill sem referência em memórias ou observations | > 30 dias | Candidata a remoção |
| Agente nunca mencionado em feedbacks | > 30 dias | Candidato a review |
| Memória sem atualização | > 30 dias | Candidata a arquivamento |

#### 2.3 Detecção de Conflitos
| Sinal | Ação |
|-------|------|
| Duas regras contradizem entre si | Resolver — manter a mais recente ou mais específica |
| Memória contradiz regra | Atualizar a memória ou a regra |
| Skill duplica funcionalidade de outra | Consolidar em uma só |

#### 2.4 Detecção de Lacunas
| Sinal | Ação |
|-------|------|
| Feedback sem regra correspondente | Criar regra |
| Padrão detectado pelo /pattern-detector sem ação | Criar automação |
| Workflow manual sem skill | Criar skill |

#### 2.5 Métricas de Autonomia
Calcular baseado nos feedbacks e observações:
- **Taxa de operacional vs estratégico**: % de feedbacks sobre tarefas operacionais
- **Taxa de correção**: % de feedbacks que são correções de erros
- **Taxa de autonomia**: % de decisões que já têm regra/skill cobrindo

---

### Fase 3 — PROPOSE (Geração de Propostas)

Para cada oportunidade detectada, gerar uma proposta estruturada:

```markdown
### PROPOSTA #N

- **Tipo:** [Nova Skill | Melhoria de Skill | Nova Regra | Remoção | Consolidação | Automação]
- **Problema:** [o que o CEO está fazendo que não deveria / o que está quebrado]
- **Evidência:** [dados concretos — X ocorrências em Y dias, arquivos específicos]
- **Solução:** [o que criar/mudar/remover]
- **Impacto estimado:** [qualitativo — alto/médio/baixo]
- **Risco:** [o que pode dar errado]
- **Classificação:** [AUTOMATICO | NOTIFICAR | CONSULTAR]
```

#### Classificação de Ação

| Nível | Critério | Exemplos | Ação |
|-------|----------|----------|------|
| **AUTOMATICO** | Impacto baixo, risco zero, padrão claro | Corrigir typo em regra, atualizar parâmetro obsoleto, arquivar memória stale | Implementar imediatamente |
| **NOTIFICAR** | Impacto médio, risco baixo, evidência forte | Criar skill baseada em 5+ repetições, melhorar skill existente, consolidar duplicatas | Implementar e reportar no relatório |
| **CONSULTAR** | Impacto alto, risco médio, ou mudança de fluxo | Remover skill usada recentemente, nova automação que muda workflow, alterar regra constitucional | Propor e aguardar aprovação |

---

### Fase 4 — EXECUTE (Implementação)

#### 4.1 Melhorias AUTOMATICO
Implementar diretamente:
- Criar/editar arquivo usando `Edit` ou `Write`
- Registrar ação no log

#### 4.2 Melhorias NOTIFICAR
Implementar e incluir no relatório:
- Criar skill via padrão `/skill-creator` (frontmatter + conteúdo < 500 linhas)
- Editar skill existente preservando estrutura
- Registrar ação no log

#### 4.3 Melhorias CONSULTAR
Apenas listar no relatório com opção de aprovação.

#### Regras de Implementação
- Skills novas seguem o padrão `/skill-creator`: frontmatter (name + description + tools), conteúdo conciso
- Skills são genéricas e reutilizáveis — NUNCA atreladas a campanhas/produtos específicos
- Toda modificação em skill existente faz backup primeiro (copiar conteúdo anterior no log)
- Toda remoção é na verdade um arquivamento (mover para `~/.claude/skills/_archived/`)

---

### Fase 5 — VERIFY (Verificação)

Após implementação, verificar:
- Arquivo criado/editado existe e tem conteúdo válido
- Frontmatter da skill está correto (se aplicável)
- Nenhuma referência quebrada
- Se a melhoria resolve o problema original (checagem lógica)

---

### Fase 6 — LEARN (Aprendizado)

Atualizar `~/observations/self-optimize-log.md`:
- Registrar todas as ações tomadas
- Registrar propostas pendentes
- Atualizar métricas de evolução
- Registrar taxa de aceitação de propostas anteriores

---

## Output — Relatório

Ao final da execução, gerar relatório completo:

```markdown
## SELF-OPTIMIZE — Relatório [AAAA-MM-DD]

### SAÚDE DO FRAMEWORK
| Recurso | Total | Ativos | Dormentes | Problemas |
|---------|-------|--------|-----------|-----------|
| Skills | X | X | X | X |
| Agentes | X | X | X | X |
| Memórias | X | X | X | X |
| Regras | X | X | X | X |
| Observações | X | — | — | X |

### MÉTRICAS DE EVOLUÇÃO
- Taxa de autonomia: X%
- Taxa de erro recorrente: X%
- Feedbacks operacionais vs estratégicos: X% / X%
- Propostas aceitas / rejeitadas (acumulado): X / X (taxa: X%)

### PADRÕES DETECTADOS
1. [padrão] — [evidência] — [ação sugerida]

### MELHORIAS IMPLEMENTADAS (AUTOMÁTICO + NOTIFICAR)
- [melhoria 1] — [tipo] — [arquivo afetado]

### PENDENTE APROVAÇÃO (CONSULTAR)
- [proposta 1] — aprovar? (SIM/NÃO)

### PRÓXIMAS AÇÕES
- [ação programada para próximo ciclo]
```

---

## Meta-Regras (a skill segue suas próprias regras)

1. **NUNCA remover skill sem evidência de desuso** — mínimo 30 dias sem referência
2. **NUNCA modificar skill usada com sucesso nos últimos 7 dias** — estável = não mexer
3. **SEMPRE criar backup antes de modificar** — conteúdo anterior registrado no log
4. **SEMPRE registrar motivo de cada mudança** — rastreabilidade completa
5. **Auto-calibração de ousadia:**
   - Taxa de rejeição > 50% nas últimas 10 propostas → reduzir ousadia (ser mais conservador)
   - Taxa de aceitação > 95% nas últimas 10 propostas → aumentar ousadia (ser mais proativo)
   - Default: conservador (prefere CONSULTAR sobre NOTIFICAR)
6. **Proporcionalidade EROS:** complexidade do scan proporcional ao volume de mudanças
   - Poucas mudanças desde último scan → scan rápido (Fases 1-2-6 apenas)
   - Muitas mudanças → scan completo (todas as 6 fases)

---

## Integração com o Ecossistema

| Componente | Relação |
|-----------|---------|
| `/pattern-detector` | Fonte primária de padrões — ler `~/observations/patterns-detected.md` |
| `/skill-creator` | Padrão para criação de novas skills |
| `/daily-briefing` | Pode incluir resumo do último self-optimize no briefing |
| `~/observations/self-optimize-log.md` | Log persistente de todas as otimizações |
| `~/observations/suggestions-queue.md` | Sugestões geradas alimentam esta fila |
| `~/.claude/rules/eros-quality.md` | Portões de qualidade aplicados nas melhorias |
| CLAUDE.md | Atualizar lista de skills quando nova skill é criada |

---

## Fase Extra — COMPACT (Compactação de Memória)

> Inspirado no AutoDream do Claude Code — consolidar, podar e reorganizar memórias.

### Quando executar
- A cada execução completa do `/self-optimize`
- Quando MEMORY.md ultrapassar 150 linhas
- Quando houver mais de 40 arquivos de memória

### Processo
1. **Ler MEMORY.md** e todos os arquivos de memória referenciados
2. **Identificar duplicatas** — memórias que cobrem o mesmo tópico
3. **Identificar obsoletas** — memórias com informações ultrapassadas (verificar contra estado atual)
4. **Consolidar** — mesclar memórias duplicadas em uma só, mantendo o mais recente
5. **Podar** — remover informações que agora existem em rules/ ou CLAUDE.md
6. **Compactar MEMORY.md** — garantir que cada entrada tenha no máximo 1 linha (~150 chars)
7. **Verificar integridade** — todo arquivo referenciado no MEMORY.md deve existir

### Regras de Compactação
- NUNCA remover memórias de feedback (tipo: feedback) — são leis
- NUNCA remover memórias de referência (tipo: reference) — são ponteiros
- Memórias de projeto (tipo: project) com mais de 60 dias → verificar se ainda relevante
- Memórias de usuário (tipo: user) → consolidar se houver sobreposição
- Manter MEMORY.md abaixo de 200 linhas (truncamento automático após 200)

### Output
Incluir no relatório:
- Memórias consolidadas: X
- Memórias arquivadas: X
- Linhas do MEMORY.md antes/depois: X → X
- Bytes economizados: X KB

---

## Execução Rápida (Modo Resumo)

Quando invocada com `/self-optimize quick`:
- Apenas Fases 1 e 2 (scan + análise)
- Output: lista de oportunidades sem implementar nada
- Útil para check rápido sem ação

## Execução Completa (Padrão)

Quando invocada com `/self-optimize`:
- Todas as 6 fases
- Implementa AUTOMÁTICO e NOTIFICAR
- Lista CONSULTAR para aprovação

## Execução Forçada

Quando invocada com `/self-optimize force`:
- Todas as 6 fases
- Implementa AUTOMÁTICO, NOTIFICAR e CONSULTAR sem perguntar
- Usar com cautela — para quando o CEO quer evolução máxima sem fricção

---

## Regras Herdadas

- **Acentuação obrigatória** — todo texto em português com acentos e cedilha corretos
- **Skills genéricas** — nunca atreladas a campanhas/produtos específicos
- **IDS: REUSE > ADAPT > CREATE** — antes de criar skill nova, verificar se existe similar para adaptar
- **Autonomia máxima** — implementar o que for seguro, só consultar quando necessário
