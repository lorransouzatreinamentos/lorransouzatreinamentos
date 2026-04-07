# Roteamento de Modelos — Regras de Seleção por Tipo de Tarefa

> **Severidade:** SHOULD | **Aplica-se a:** Todos os agentes
> **Origem:** Otimização de custo e performance — Segunda-feira v6.0

## Princípio

Nem toda tarefa exige o modelo mais poderoso. O roteamento inteligente de modelos maximiza qualidade onde importa e economiza recursos onde a complexidade é baixa.

**Regra de ouro:** "Use o modelo mais leve que entrega o resultado com qualidade aceitável."

---

## Perfil de Cada Modelo

### Opus — Raciocínio Profundo

**Quando usar:**
- Decisões arquiteturais e trade-offs complexos
- Planejamento estratégico de longo prazo
- Análise complexa com múltiplas variáveis
- Code review crítico (segurança, performance, arquitetura)
- Conselho deliberativo (@mestre-do-conselho, @advogado-do-diabo)
- Spec Pipeline fase de critique (análise multi-dimensional)
- Resolução de bugs não-reproduzíveis ou intermitentes

**Custo relativo:** Referência (1x)

### Sonnet — Execução Versátil

**Quando usar:**
- Desenvolvimento de features (implementação de stories)
- Debugging e refactoring de código
- Criação de conteúdo (copy, posts, documentação)
- Análise de dados e relatórios
- QA Gate — revisão padrão
- Criação de stories e validação
- Integração de APIs e sync de dados

**Custo relativo:** ~5x mais barato que Opus

### Haiku — Execução Rápida e Econômica

**Quando usar:**
- Validações simples (lint, typecheck, formatação)
- Classificação e triagem (severidade, tipo, prioridade)
- Extração de dados estruturados (JSON, tabelas, campos)
- Perguntas rápidas com resposta objetiva
- Transformação de formato (Markdown → JSON, CSV → tabela)
- Geração de boilerplate e templates simples
- Resumos curtos de contexto

**Custo relativo:** ~10x mais barato que Opus

---

## Mapeamento Agente → Modelo Recomendado

| Agente | Modelo Padrão | Justificativa |
|--------|--------------|---------------|
| @architect | Opus | Decisões arquiteturais irreversíveis |
| @advogado-do-diabo | Opus | Análise crítica profunda |
| @mestre-do-conselho | Opus | Síntese deliberativa multi-perspectiva |
| @po | Sonnet | Validação de stories é estruturada |
| @pm | Sonnet | Planejamento e spec writing |
| @dev | Sonnet | Implementação de features |
| @qa | Sonnet | Revisão de código e quality checks |
| @sm | Sonnet | Criação de stories |
| @analyst | Sonnet | Análise de dados e pesquisa |
| @market-intel | Sonnet | Pesquisa de mercado |
| @content | Sonnet | Criação de conteúdo |
| @devops | Sonnet | Operações de deploy e CI/CD |
| @data-engineer | Sonnet | Schema design e queries |
| @copywriter | Sonnet | Copy persuasivo |
| @traffic | Sonnet | Gestão de tráfego |

---

## Regra de Delegação Econômica

> Quando um agente delega uma subtarefa simples, **preferir Haiku** para economia.

### Exemplos de subtarefas delegáveis para Haiku

| Agente Principal | Subtarefa | Modelo |
|-----------------|-----------|--------|
| @dev (Sonnet) | Validar formato de JSON | Haiku |
| @qa (Sonnet) | Checar se todos os campos existem | Haiku |
| @pm (Sonnet) | Extrair lista de ACs de um PRD | Haiku |
| @architect (Opus) | Gerar boilerplate de config | Haiku |
| @content (Sonnet) | Classificar tom de post (formal/casual) | Haiku |
| @analyst (Sonnet) | Converter CSV para tabela Markdown | Haiku |

---

## Estimativa de Economia

| Cenário | Sem Roteamento | Com Roteamento | Economia |
|---------|---------------|----------------|----------|
| Sprint típica (20 tasks) | 20x Opus | 4 Opus + 12 Sonnet + 4 Haiku | ~60% |
| QA Loop (5 iterações) | 5x Opus | 5x Sonnet | ~80% |
| Validação batch (10 stories) | 10x Opus | 10x Sonnet + subtarefas Haiku | ~75% |
| Extração de dados (50 items) | 50x Opus | 50x Haiku | ~90% |

**Economia média estimada:** 60-70% do custo total de tokens.

---

## Escalação de Modelo

Quando o modelo atual não consegue resolver:

```
Haiku falha → escalar para Sonnet
Sonnet falha → escalar para Opus
Opus falha → escalar para humano
```

**Critérios de escalação:**
- Resposta genérica ou superficial para a complexidade da tarefa
- Erro lógico ou contradição na saída
- Tarefa requer raciocínio multi-step que o modelo não sustenta
- Confidence score < 0.5 (ver `confidence-guardrails.md`)

---

## Anti-Patterns

| Anti-Pattern | Correção |
|-------------|----------|
| Usar Opus para lint check | Haiku resolve com qualidade idêntica |
| Usar Opus para todo code review | Sonnet para reviews padrão, Opus só para críticos |
| Usar Haiku para decisão arquitetural | Opus obrigatório — decisões irreversíveis |
| Não escalar quando Haiku falha | Detectar falha e subir para Sonnet |

---

## Integração com Fluxos Existentes

| Fluxo Segunda-feira | Fase | Modelo |
|---------------------|------|--------|
| Story Development Cycle | Create (@sm) | Sonnet |
| Story Development Cycle | Validate (@po) | Sonnet |
| Story Development Cycle | Implement (@dev) | Sonnet |
| Story Development Cycle | QA Gate (@qa) | Sonnet (Opus se crítico) |
| Spec Pipeline | Gather/Write | Sonnet |
| Spec Pipeline | Assess/Critique | Opus |
| QA Loop | Iterações | Sonnet |
| Brownfield Discovery | Arquitetura | Opus |
| Brownfield Discovery | Coleta de dados | Sonnet |
| Tarefa avulsa simples | — | Haiku |
