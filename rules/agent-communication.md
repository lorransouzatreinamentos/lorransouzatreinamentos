# Protocolo de Comunicação Inter-Agente

> **Severidade:** MUST | **Aplica-se a:** Todos os agentes
> **Origem:** Teammate Mode (vazamento Claude Code) — Segunda-feira v6.3

## Princípio

Agentes não operam em silos. Quando um agente descobre algo relevante para outro domínio, ele DEVE comunicar. Quando um agente é ativado, ele DEVE verificar suas mensagens.

**Regra de ouro:** "Se sua descoberta muda a decisão de outro agente, comunique imediatamente."

---

## 3 Modos de Operação de Agente

### Standard (padrão)
- Começa do zero, sem contexto de outro agente
- Usa: tarefas independentes, perguntas isoladas
- Comunicação: apenas broadcast (signals.json)

### Fork (ramificação)
- Herda contexto do agente principal
- Usa: explorar alternativas, testar hipóteses
- Comunicação: compartilha thread com agente pai

### Teammate (colaboração)
- Opera em paralelo com outros agentes
- Usa: tarefas complexas que cruzam domínios
- Comunicação: mailbox direta + threads

---

## Protocolo de Comunicação

### Ao ser ATIVADO (todo agente, toda vez)
```
1. Ler ~/broadcast/signals.json → sinais ativos não consumidos
2. Ler ~/broadcast/mailbox/{meu-nome}.json → mensagens pendentes
3. Ler ~/feedback-loop/results.json → resultados relevantes ao meu domínio
4. Processar mensagens pendentes ANTES de executar tarefa principal
```

### Ao DESCOBRIR algo relevante
```
Se descoberta afeta OUTRO domínio:
  1. Identificar agente(s) destinatário(s)
  2. Escrever mensagem na mailbox do destinatário
  3. Se urgente: também emitir sinal no broadcast

Se descoberta afeta TODOS:
  1. Emitir sinal no broadcast (signals.json)
```

### Ao COMPLETAR tarefa
```
1. Atualizar ~/feedback-loop/results.json se gerou resultado mensurável
2. Emitir sinal de conclusão se relevante
3. Responder mensagens pendentes na mailbox do remetente
```

---

## Tabela de Comunicação Obrigatória

| Quando isso acontece... | Quem comunica | Para quem | Via |
|------------------------|--------------|-----------|-----|
| CPL muda significativamente | @traffic | @content, @copywriter | mailbox + signal |
| Novo ângulo de conteúdo performa | @content | @traffic, @creative-director | mailbox |
| Tendência identificada | @market-intel | @content, @traffic, @offer-engineer | broadcast |
| Oferta montada/alterada | @offer-engineer | @traffic, @copywriter, @content | mailbox |
| Bug ou problema técnico | @dev | @ops, @devops | signal (alert) |
| Lead qualificado entra | @cold-outreach | @closer, @cs | mailbox |
| Campanha pausada/criada | @traffic | TODOS | broadcast |
| Conteúdo agendado | @content | @traffic (para alinhar) | mailbox |
| Feedback do cliente | @cs | @offer-engineer, @content | mailbox |

---

## Formato de Mensagem

```json
{
  "id": "msg_{timestamp}",
  "from": "@agente-remetente",
  "to": "@agente-destinatário",
  "type": "request|info|alert|response",
  "subject": "Resumo em 1 linha",
  "body": "Detalhes da mensagem",
  "priority": "high|normal|low",
  "data": {},
  "timestamp": "ISO-8601",
  "read": false,
  "thread_id": null
}
```

### Tipos de Mensagem

| Tipo | Uso | Espera resposta? |
|------|-----|-----------------|
| `request` | Pedir algo ao destinatário | Sim |
| `info` | Informar (sem ação necessária) | Não |
| `alert` | Urgente — requer atenção imediata | Depende |
| `response` | Resposta a um request anterior | Não |

---

## Anti-Patterns

| Evitar | Por quê |
|--------|---------|
| Enviar mensagem para si mesmo | Inútil — use memória local |
| Flood de mensagens low-priority | Polui a mailbox, agente ignora tudo |
| Mensagem sem subject claro | Destinatário não sabe se é relevante |
| Não ler mailbox ao ativar | Perde contexto importante, duplica trabalho |
| Comunicar resultado sem dados | "Campanha indo bem" sem CPL = inútil |
