# External API Integration Patterns — Framework Rules

> **Severity:** MUST | **Applies to:** @architect, @dev, @data-engineer, @devops
> **Origin:** Incidente Client Dashboard 17/03/2026 — rate limit cascata PAYMENT_API

## Princípio Core: SYNC > CACHE > REAL-TIME

Toda integração com API externa em dashboards, relatórios ou interfaces de consulta deve seguir esta hierarquia de decisão:

### SYNC (padrão para dashboards)
- Dados sincronizados periodicamente para DB local
- Frontend consulta apenas o DB — **zero chamadas à API externa no acesso do usuário**
- Sync roda em background via cron/scheduler com rate limit próprio
- **Quando usar:** Dashboards, relatórios, analytics, listagens, kanban

### CACHE (quando real-time é necessário mas dados mudam pouco)
- Cache em DB (não em memória) — sobrevive a restarts
- TTL proporcional à frequência de mudança dos dados
- **Quando usar:** Dados que mudam poucas vezes por hora e precisam ser "quase real-time"

### REAL-TIME (exceção, requer justificativa)
- Chamada direta à API externa no momento do acesso
- **Apenas para:** Ações do usuário (criar cobrança, enviar pagamento, webhook incoming)
- **Nunca para:** Listagens, relatórios, dashboards, filtros

---

## Decision Matrix

| Cenário | Padrão | Rate Limit Risk | Latência |
|---------|--------|----------------|----------|
| Dashboard financeiro | SYNC → DB | Nenhum | <100ms |
| Relatório mensal | SYNC → DB | Nenhum | <100ms |
| Kanban de cobranças | SYNC → DB | Nenhum | <100ms |
| Criar cobrança nova | REAL-TIME | Baixo (1 call) | 1-3s |
| Webhook de pagamento | REAL-TIME (incoming) | Nenhum | Async |
| Buscar cliente por CPF | CACHE → DB | Nenhum | <50ms |
| Troca de filtro/período | DB QUERY | Nenhum | <100ms |

---

## Anti-Patterns (PROIBIDOS)

### 1. Dashboard Real-Time
```
❌ Usuário abre página → API externa (centenas de chamadas)
✅ Usuário abre página → query DB local (1 query)
```

### 2. Force Refresh por Filtro
```
❌ Trocar filtro de período → bypass cache → API externa
✅ Trocar filtro → nova query no DB (mesmos dados, diferente WHERE)
```

### 3. Cache em Memória para Dados Críticos
```
❌ const cache = new Map() → perde no PM2 restart
✅ Dados no PostgreSQL → persiste sempre
```

### 4. Rate Limit por Endpoint
```
❌ Cada endpoint com seu próprio rate limit isolado
✅ Rate limit GLOBAL compartilhado entre todos os endpoints que usam mesma API
```

### 5. Retry Agressivo em Rate Limit
```
❌ 429 → retry 3x → piora o bloqueio → retry de novo
✅ 429 → cooldown global 5min → para TUDO → espera expirar
```

---

## Regras de Sync

### Schema
Todo campo necessário para a UI DEVE existir no schema local:
```
API response field → DB column → UI reads from DB
```
Nunca: `API response field → UI reads directly from API`

### Frequência
| Tipo de Dado | Sync Interval | Window |
|---|---|---|
| Pagamentos (status muda) | 30 min | Últimos 90 dias |
| Clientes (raramente muda) | 30 min | Todos |
| Assinaturas (status muda) | 30 min | Todas |
| Campanhas Meta Ads | 1 hora | Últimos 30 dias |

### Rate Limit Protection no Sync
- Delay entre páginas (1s a cada 500 registros)
- Backoff exponencial em 429 (3s, 6s, 9s)
- Cooldown global de 5 min em qualquer 429/403
- Sync NUNCA roda em paralelo (mutex/flag)

---

## Validation Gates

### G-API-1: Story Creation (@sm)
- Se story menciona "API externa", "integração", "dados real-time" → flag para @architect review

### G-API-2: Architecture Review (@architect)
- **Blocking:** Se o design propõe chamadas real-time a API externa em dashboard/relatório
- **Action:** Propor pattern SYNC → DB antes de aprovar story

### G-API-3: Dev Implementation (@dev)
- **Blocking:** PR que adiciona `axios.get` / `fetch` a API externa em route handler de GET (leitura)
- **Allowed:** `axios.post` / `fetch POST` para ações do usuário

### G-API-4: QA Review (@qa)
- **Check:** Nenhum endpoint de leitura (GET) faz chamadas a APIs externas
- **Check:** Rate limit global está implementado se sync existe
- **Check:** Schema local tem TODOS os campos que a UI consome

---

## Referência: Caso Client Dashboard

**Problema:** Módulo financeiro fazia ~300 chamadas paginadas ao PAYMENT_API por acesso. Múltiplos endpoints + cache warmer martelavam a API. Rate limit 429 cascateou e bloqueou por >1h.

**Solução:** Migração para sync periódico (30min) → DB local → queries instantâneas.

**Resultado:** Zero rate limits, zero downtime, <100ms por query, filtros instantâneos.
