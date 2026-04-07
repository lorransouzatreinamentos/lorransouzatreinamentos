# Confidence Guardrails — Controle de Confiança em Afirmações

> **Severidade:** MUST (agentes de pesquisa) | SHOULD (demais agentes)
> **Aplica-se a:** Todos os agentes que fazem afirmações factuais
> **Origem:** Redução de alucinações e rastreabilidade — Segunda-feira v6.0

## Princípio

Todo agente que faz afirmações factuais deve ser transparente sobre o grau de certeza. Isso protege contra alucinações, facilita verificação e constrói confiança com o destinatário.

**Regra de ouro:** "Afirmação sem confiança declarada é afirmação sem responsabilidade."

---

## Formato do Confidence Score

```
[confidence: 0.8]
```

- Escala: **0.0** (nenhuma confiança) a **1.0** (certeza absoluta)
- Posição: após a afirmação importante, na mesma linha
- Granularidade: incrementos de 0.1

### Exemplo prático

```
O mercado de IA generativa deve atingir $100B até 2028. [confidence: 0.6]
A API do Supabase suporta RLS nativamente. [confidence: 0.95]
O concorrente X faturou R$2M no último trimestre. [confidence: 0.4] — VERIFICAR
```

---

## Faixas de Confiança e Ações

| Faixa | Classificação | Ação Obrigatória |
|-------|--------------|------------------|
| **0.0 - 0.4** | Baixa | Marcar como **VERIFICAR**. Citar fonte necessária. Não usar como base para decisões. |
| **0.5 - 0.7** | Moderada | Incluir **caveat/ressalva** explícita. Indicar fonte quando disponível. |
| **0.8 - 1.0** | Alta | Pode afirmar diretamente. Fonte recomendada mas não obrigatória. |

### Detalhamento por faixa

**Score < 0.5 — VERIFICAR:**
```
❌ "O CPL médio do nicho é R$8,50."
✅ "O CPL médio do nicho é R$8,50. [confidence: 0.3] — VERIFICAR: dado baseado em estimativa sem fonte primária."
```

**Score 0.5 - 0.7 — Ressalva:**
```
❌ "A taxa de conversão de webinários é 15%."
✅ "A taxa de conversão de webinários gira em torno de 15%, embora varie significativamente por nicho e ticket. [confidence: 0.6]"
```

**Score > 0.7 — Afirmação direta:**
```
✅ "O Next.js 15 suporta Server Actions nativamente. [confidence: 0.95]"
✅ "A Meta API exige CBO para campanhas Advantage+. [confidence: 0.9]"
```

---

## Quando Aplicar vs Não Aplicar

| Contexto | Aplicar Score? | Justificativa |
|----------|---------------|---------------|
| Afirmações sobre mercado, tendências, dados | **SIM** | Dados mudam e podem estar desatualizados |
| Análise de concorrentes, benchmarks | **SIM** | Informações externas nem sempre verificáveis |
| Recomendações estratégicas | **SIM** | Baseadas em premissas que podem ser falsas |
| Comandos técnicos (`git commit`, `npm install`) | **NÃO** | Operações determinísticas |
| Código gerado/implementado | **NÃO** | Verificável por execução (lint, typecheck, testes) |
| Leitura de arquivos locais | **NÃO** | Dados objetivamente verificados |
| Documentação oficial citada | **NÃO** | Fonte primária acessível |
| Status de deploy, logs, outputs | **NÃO** | Observação direta |

---

## Regras por Tipo de Agente

### Agentes de Pesquisa — MUST

| Agente | Regra |
|--------|-------|
| @market-intel | DEVE citar fonte para TODA afirmação factual |
| @analyst | DEVE citar fonte para TODA afirmação factual |
| @advogado-do-diabo | DEVE incluir score em contra-argumentos |
| @mestre-do-conselho | DEVE incluir score nas sínteses |

**Formato obrigatório para agentes de pesquisa:**
```
Afirmação factual. [confidence: X.X] — Fonte: [nome da fonte]
```

### Agentes de Planejamento — SHOULD

| Agente | Regra |
|--------|-------|
| @pm | Score em estimativas de escopo e prazo |
| @po | Score em avaliações de valor de negócio |
| @sm | Score em estimativas de complexidade |
| @architect | Score em previsões de impacto |

### Agentes de Execução — EXEMPT (operações técnicas)

| Agente | Regra |
|--------|-------|
| @dev | NÃO precisa de score em operações técnicas |
| @devops | NÃO precisa de score em operações de infra |
| @data-engineer | NÃO precisa de score em DDL/queries |
| @content | Score APENAS em afirmações sobre performance de conteúdo |
| @copywriter | Score APENAS em afirmações sobre taxas de conversão |

---

## Calibração do Score

### Referências para calibração

| Score | Significado | Analogia |
|-------|------------|----------|
| 1.0 | Fato verificado com fonte primária | Documentação oficial lida agora |
| 0.9 | Alta confiança, conhecimento consolidado | Best practice amplamente aceita |
| 0.8 | Confiança boa, baseado em experiência | Padrão observado múltiplas vezes |
| 0.7 | Provável, mas com margem de erro | Estimativa baseada em dados parciais |
| 0.6 | Possível, com ressalvas | Tendência observada mas não confirmada |
| 0.5 | Incerto, 50/50 | Opinião educada sem dados |
| 0.4 | Mais incerto que certo | Extrapolação de cenários diferentes |
| 0.3 | Especulativo | Palpite com alguma lógica |
| 0.2 | Altamente especulativo | Quase chute |
| 0.1 | Chute informado | Melhor que aleatório, mas pouco |

---

## Integração com EROS

O confidence score complementa os portões de qualidade EROS:

| Portão EROS | Integração com Confidence |
|-------------|--------------------------|
| Portão 1 (Compreensão) | Score ajuda a identificar premissas fracas |
| Portão 3 (Execução) | Afirmações com score < 0.5 devem ser verificadas antes de basear decisões |
| Portão 4 (Revisão) | Revisor deve questionar afirmações sem score em contextos de pesquisa |
| Portão 5 (Liberação) | Entrega com múltiplos scores < 0.5 não atinge nível "Alto" |

---

## Integração com Model Routing

Confidence score pode informar escalação de modelo (ver `model-routing.md`):

```
Score < 0.5 em tarefa crítica → escalar para Opus para análise mais profunda
Score < 0.5 em tarefa simples → marcar VERIFICAR e seguir
```

---

## Anti-Patterns

| Anti-Pattern | Correção |
|-------------|----------|
| Score em toda frase (poluição) | Apenas em afirmações factuais importantes |
| Score 1.0 em tudo (inflação) | Reservar 1.0 para fatos verificados com fonte |
| Score sem ação (decorativo) | Score < 0.5 DEVE ter ação (VERIFICAR, ressalva) |
| Omitir score em pesquisa | Agentes de pesquisa: MUST — sem exceção |
| Score em operações técnicas | @dev executando `npm install` não precisa de score |
