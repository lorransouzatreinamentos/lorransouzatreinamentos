# Feedback Loop — Consulta Obrigatória de Resultados

> **Severidade:** MUST | **Aplica-se a:** Todos os agentes que criam conteúdo, campanhas ou ofertas
> **Origem:** Sistema de aprendizado por resultados — Segunda-feira v6.2

## Princípio

Nenhum agente cria campanha, conteúdo ou oferta sem antes consultar os resultados anteriores. Decisões baseadas em dados reais, não em suposições.

**Regra de ouro:** "Antes de criar, consulte o que já funcionou."

---

## Quando Consultar

| Agente | Antes de | Consultar |
|--------|---------|-----------|
| @traffic | Criar campanha, escolher ângulo | ~/feedback-loop/results.json → campaigns |
| @content | Criar post, escolher formato | ~/feedback-loop/results.json → content |
| @copywriter | Escrever copy, definir tom | ~/patterns/angles.md + ~/patterns/hooks.md |
| @creative-director | Criar criativo, definir visual | ~/patterns/formats.md |
| @offer-engineer | Montar oferta, definir preço | ~/feedback-loop/results.json → offers |
| @cold-outreach | Criar sequência, definir approach | ~/patterns/angles.md |
| @launch-strategist | Planejar lançamento | ~/feedback-loop/results.json (todos) |

## Como Consultar

### Passo 1: Ler results.json
```
Ler ~/feedback-loop/results.json
Filtrar por domínio relevante (campaigns, content, offers)
```

### Passo 2: Ler padrões aplicáveis
```
Ler ~/patterns/angles.md (se criando comunicação)
Ler ~/patterns/hooks.md (se criando abertura/hook)
Ler ~/patterns/offers.md (se montando oferta)
Ler ~/patterns/formats.md (se escolhendo formato)
```

### Passo 3: Aplicar aprendizados
- Usar ângulos que já funcionaram como base
- Evitar ângulos que já falharam
- Justificar escolhas divergentes com "teste intencional"

## Exceções

| Situação | Pode pular? |
|----------|------------|
| Tarefa técnica (bug fix, deploy) | SIM — não se aplica |
| Pergunta rápida do CEO | SIM — contexto conversacional |
| Primeiro conteúdo de um tipo novo | PARCIAL — consultar ângulos, mas não exigir dados do formato |
| Teste A/B intencional | SIM — mas registrar como teste |

## Consequência de Não Consultar

Se agente criar conteúdo/campanha sem consultar e o resultado for ruim:
1. Registrar como falha tipo P2 (sem planejamento) na taxonomia EROS
2. Adicionar resultado ao feedback loop para futuro aprendizado
3. Na próxima iteração, consulta é obrigatória sem exceção

---

## Integração

| Componente | Relação |
|-----------|---------|
| `/feed-results` | Alimenta o results.json |
| `/daily-scan` | Consulta results.json para detectar anomalias |
| `/weekly-sync` | Consolida resultados da semana |
| `~/patterns/` | Padrões extraídos dos resultados |
| `~/broadcast/signals.json` | Sinais emitidos quando padrão detectado |
