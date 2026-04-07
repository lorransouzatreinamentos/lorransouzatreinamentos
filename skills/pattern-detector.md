---
description: "Detecção de padrões em dados acumulados (ads, infra, conteúdo, leads) e geração de sugestões acionáveis com níveis de confiança"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep"]
---

# /pattern-detector — Detecção de Padrões e Inteligência Proativa

> **Tipo:** Skill autocontida | **Agente padrão:** @analyst
> **Trigger:** Comando `/pattern-detector` ou chamado pelo `/daily-briefing`

## Objetivo

Analisar dados acumulados nas observações, detectar padrões recorrentes e gerar sugestões acionáveis. Atua como a camada de inteligência do sistema de briefing.

---

## Execução

### Passo 1 — Coletar Dados Históricos

Ler TODOS os arquivos em `~/observations/` e extrair dados com timestamps. Fontes primárias:

| Fonte | Dados |
|-------|-------|
| `ads-performance.md` | CPL por dia/campanha, budget, conversões |
| `server-health.md` | Métricas de CPU, memória, disco ao longo do tempo |
| `content-calendar.md` | Datas de publicação, engajamento por post |
| `leads-pipeline.md` | Volume de leads por dia/hora, status de follow-up |
| `patterns-detected.md` | Padrões anteriores (para não duplicar) |
| `suggestions-queue.md` | Sugestões descartadas (para não repetir) |

### Passo 2 — Análise de Padrões

Aplicar as seguintes detecções. Cada padrão requer **dados reais** — nunca inferir sem evidência:

#### Tráfego e Ads
| Padrão | Trigger | Sugestão |
|--------|---------|----------|
| CPL subindo 3+ dias seguidos | CPL dia N > dia N-1 > dia N-2 | Trocar criativos ou pausar conjuntos fracos |
| CPL de campanha 2x acima da média | CPL campanha > 2 * CPL médio | Pausar campanha específica |
| Budget vai acabar antes do fim | Gasto/dia * dias restantes > budget | Reduzir orçamento diário ou priorizar campeões |
| Horário de pico de conversão | 60%+ conversões em janela de 4h | Concentrar budget nesse horário |
| Criativo saturado | Frequência > 3.0 com CPL subindo | Renovar criativos desse conjunto |

#### Infraestrutura
| Padrão | Trigger | Sugestão |
|--------|---------|----------|
| Memória crescente | Uso subindo 5%+ em 3 leituras | Restart preventivo do serviço |
| Disco enchendo | Uso > 80% | Limpar logs/cache ou expandir |
| Serviço instável | 2+ restarts em 24h | Investigar causa raiz |
| SSL expirando | Certificado vence em < 14 dias | Renovar certificado |

#### Conteúdo
| Padrão | Trigger | Sugestão |
|--------|---------|----------|
| Gap no calendário | 2+ dias sem post agendado nos próximos 7 dias | Criar conteúdo para preencher |
| Dia de melhor engajamento | Engajamento 30%+ acima da média em dia X | Priorizar publicações nesse dia |
| Formato campeão | Um formato com 2x+ engajamento vs outros | Dobrar nesse formato |

#### Leads e Pipeline
| Padrão | Trigger | Sugestão |
|--------|---------|----------|
| Leads sem follow-up > 48h | Leads com status "novo" por 2+ dias | Follow-up urgente |
| Pico de leads em horário | 40%+ leads em janela de 3h | Configurar automação nesse horário |
| Taxa de conversão caindo | Conversão semana N < semana N-1 por 2 semanas | Revisar oferta ou follow-up |

#### Comportamento do Usuário
| Padrão | Trigger | Sugestão |
|--------|---------|----------|
| Usuário sempre pede X depois de Y | 3+ ocorrências da sequência | Antecipar X quando Y acontecer |
| Tarefa recorrente não automatizada | Mesma tarefa manual 3+ vezes | Sugerir automação |

### Passo 3 — Avaliar Confiança

Cada padrão detectado recebe um nível de confiança:

| Nível | Critério | Ação |
|-------|----------|------|
| **Alta** | 5+ data points, tendência clara, sem contradição | Registrar como Ativo, gerar sugestão |
| **Média** | 3-4 data points, tendência provável | Registrar como Em Observação, gerar sugestão com ressalva |
| **Baixa** | 2 data points, pode ser coincidência | Registrar como Em Observação, NÃO gerar sugestão ainda |

### Passo 4 — Verificar Duplicatas

Antes de registrar qualquer padrão:

1. Ler `~/observations/patterns-detected.md` seção `## Ativos` e `## Em Observação`
2. Se padrão similar já existe → atualizar dados de suporte, não duplicar
3. Se padrão já está em `## Invalidados` → só re-registrar se dados novos forem muito fortes (confiança Alta)

Antes de gerar qualquer sugestão:

1. Ler `~/observations/suggestions-queue.md` seção `## Descartadas`
2. Se sugestão similar foi descartada nos últimos 7 dias → NÃO repetir
3. Se sugestão similar foi descartada mas dados mudaram significativamente → pode sugerir com contexto novo

### Passo 5 — Registrar Padrões

Adicionar em `~/observations/patterns-detected.md` na seção apropriada:

```markdown
### [Nome do Padrão]
- **Detectado em:** AAAA-MM-DD
- **Confiança:** Alta/Média/Baixa
- **Dados de suporte:**
  - [dado 1 com data]
  - [dado 2 com data]
  - [dado 3 com data]
- **Sugestão:** [ação recomendada]
- **Status:** Ativo / Em Observação
```

### Passo 6 — Gerar Sugestões

Para padrões com confiança Alta ou Média, adicionar em `~/observations/suggestions-queue.md` seção `## Pendentes`:

```markdown
- **[AAAA-MM-DD]** [Sugestão acionável em 1 linha] | Confiança: [nível] | Padrão: [nome do padrão]
```

---

## Regras

- **Conservador por padrão** — só reportar padrões com dados reais verificáveis
- **Nunca inventar dados** — se não tem observação registrada, não tem padrão
- **Respeitar descartados** — sugestão rejeitada pelo usuário não volta em 7 dias
- **Atualizar, não duplicar** — padrão existente recebe dados novos, não cria entrada nova
- **Invalidar proativamente** — se dados novos contradizem um padrão, mover para Invalidados
- **Acentuação obrigatória** — todo texto em português com acentos e cedilha corretos
- **Autocontida** — esta skill não depende de outras skills para funcionar
