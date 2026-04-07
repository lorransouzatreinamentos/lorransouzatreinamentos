---
name: paid-ads
description: "Gestão de tráfego pago Meta Ads — estrutura de campanhas, escala, análise diária, metodologia Pedro Sobral. Pixel ${PIXEL_ID}, Page ${PAGE_ID}."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - WebSearch
  - WebFetch
---

# Paid Ads — Skill de Gestão de Tráfego Meta Ads

## Contexto

**Anunciante:** YOUR_NAME — DOMINA.IA
**Pixel ID:** ${PIXEL_ID}
**Page ID:** ${PAGE_ID}
**Conta de anúncios:** Via Meta Business Suite
**Metodologia base:** Pedro Sobral + Alex Hormozi + Brian Manon + Motion

---

## Estrutura de Campanha Padrão

### Configuração Obrigatória
| Parâmetro | Valor |
|-----------|-------|
| Tipo de compra | AUCTION |
| Objetivo | OUTCOME_LEADS (OFFSITE_CONVERSIONS) |
| Orçamento | CBO (Campaign Budget Optimization) |
| Otimização | Advantage+ |
| Público | 25-65 anos |
| Posicionamento | Advantage+ Placements (automático) |
| Evento de conversão | Lead (formulário na LP) |

### Estrutura Hierárquica
```
Campanha (CBO — orçamento aqui)
├── Conjunto de Anúncios 1 (segmentação A)
│   ├── Anúncio 1A (criativo variação A)
│   ├── Anúncio 1B (criativo variação B)
│   └── Anúncio 1C (criativo variação C)
├── Conjunto de Anúncios 2 (segmentação B)
│   ├── Anúncio 2A
│   └── Anúncio 2B
└── Conjunto de Anúncios 3 (lookalike/retargeting)
    ├── Anúncio 3A
    └── Anúncio 3B
```

---

## Regras de Segmentação

### Interesses Validados (com IDs)
Usar interesses relacionados a:
- Empreendedorismo digital
- Marketing digital
- Inteligência artificial
- Renda extra
- Negócios online

### Configuração Advantage+
```json
{
  "targeting": {
    "age_min": 25,
    "age_max": 65,
    "genders": [0],
    "geo_locations": {
      "countries": ["BR"]
    },
    "publisher_platforms": ["facebook", "instagram"],
    "flexible_spec": [
      {
        "interests": [
          {"id": "INTEREST_ID", "name": "Interest Name"}
        ]
      }
    ]
  },
  "optimization_goal": "OFFSITE_CONVERSIONS",
  "billing_event": "IMPRESSIONS",
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP"
}
```

### Exclusões Obrigatórias
- Já convertidos (custom audience de leads)
- Menores de 25 anos
- Públicos irrelevantes (jogos, entretenimento puro)

---

## Metodologia Sobral — Regras de Escala

### Regra de Ouro: NUNCA Aumentar Orçamento em Campanha Vencedora

**ERRADO:**
```
Campanha CPL R$4 → Aumentar orçamento de R$30 para R$60
Resultado: CPL sobe para R$8-12 (piora 2-3x)
```

**CORRETO:**
```
Campanha CPL R$4 → DUPLICAR campanha inteira com mesmo orçamento
Resultado: 2 campanhas a R$30 cada, CPL mantém ~R$4
```

### Protocolo de Duplicação
1. Duplicar a **CAMPANHA INTEIRA** (não apenas o conjunto de anúncios)
2. Manter **MESMO orçamento** da original
3. Manter **MESMOS criativos** da original
4. Agendar início para **00:05h do dia seguinte**
5. Nomear: `{Nome Original} Cópia{N}` (ex: "V3 LP Cópia²")
6. Esperar **48h** antes de avaliar performance da cópia

### Regras de Decisão Diária

| Métrica | Ação | Condição |
|---------|------|----------|
| CPL < alvo por 3+ dias | **ESCALAR** — Duplicar campanha | CPL consistente, volume adequado |
| CPL entre alvo e 1.5x | **MANTER** — Observar mais 24h | Pode ser flutuação normal |
| CPL entre 1.5x e 2x alvo | **ALERTA** — Observar mais 24h | Se não melhorar, pausar |
| CPL > 2x alvo por 2 dias | **PAUSAR** — Desligar imediatamente | Não tem recuperação |
| Frequência > 3.0 | **PAUSAR** — Fadiga de criativo | Público saturado |
| CTR < 0.8% | **TROCAR CRIATIVO** — Ângulo não funciona | Hook fraco |
| CTR > 2.0% | **VENCEDOR** — Considerar escala | Criativo forte |

### Análise Diária Obrigatória (Checklist)
Todos os dias às 10h, revisar:
- [ ] CPL de cada campanha ativa
- [ ] CTR de cada anúncio
- [ ] Frequência de cada conjunto
- [ ] Gasto acumulado vs budget planejado
- [ ] Leads captados vs meta
- [ ] Projeção de leads até fim do período

### Nota de Conta
A "nota de conta" no Meta é a reputação acumulada da conta de anúncios:
- Conta nova: CPL mais alto nas primeiras 2 semanas
- Conta com histórico: CPL mais estável
- **NUNCA pausar todas as campanhas de uma vez** — mata a nota
- Sempre manter pelo menos 1 campanha rodando (mesmo que R$10/dia)

---

## Transição de Ângulos

### Quando Trocar Ângulo de Criativo
- Frequência > 3.0 em todos os conjuntos
- CTR caindo consistentemente por 3+ dias
- CPL subindo mesmo com orçamento estável
- Já explorou todas as variações do ângulo atual

### Framework de Ângulos
| Tipo | Exemplo | Quando Usar |
|------|---------|-------------|
| **Dinheiro direto** | "De R$3K a R$30K com IA" | Sempre funciona, ângulo campeão |
| **Oportunidade oculta** | "O mercado que ninguém vê" | Curiosidade, topo de funil |
| **Medo de perder** | "Enquanto você espera, outros lucram" | Urgência, retargeting |
| **Prova social** | "218 pessoas já se inscreveram" | Meio/fundo de funil |
| **Transformação** | "Antes: CLT R$3K. Depois: R$30K/mês" | Aspiracional, topo |
| **Autoridade** | "Testei 47 ferramentas de IA" | Credibilidade, educativo |

### Ângulo Campeão Atual
**"R$3K a R$30K"** — Peça 5A — CPL médio R$2.98 a R$4.25
- Variações: Mesa de Dinheiro (V5-A), Bold Numbers (V5-B)
- Design: Dark background + green highlights
- Este ângulo é o baseline para comparação de todos os outros

---

## Regras de Orçamento

### Distribuição de Budget
| Fase | % do Budget | Foco |
|------|------------|------|
| Teste de criativos | 20% | 3-5 criativos, R$15-20/dia cada |
| Validação | 30% | Duplicar vencedores, confirmar CPL |
| Escala | 50% | Duplicações dos validados |

### Limites
- Orçamento mínimo por campanha: R$20/dia
- Orçamento máximo por campanha: R$100/dia (para conta atual)
- Nunca gastar mais que 30% do budget em um único dia
- Sempre manter reserva de 20% para oportunidades

---

## Padrão de Criativos para Ads

### Formato Obrigatório
- **Dimensão:** 1080x1920 (9:16) — Stories/Reels
- **Formato feed (quando solicitado):** 1080x1080 (1:1)
- **Design campeão:** Fundo escuro (#0D0D0D) + destaques verde (#00FF88 ou #39FF14)
- **Texto:** Branco sobre fundo escuro, fonte bold
- **Imagem:** Foto real do YOUR_NAME ou estilo tipográfico puro

### Regras de Criativo
- SEMPRE com acentos corretos (ã, é, ç, ô)
- NUNCA recortar foto de dentro de outro criativo
- NUNCA usar a mesma imagem em múltiplos anúncios
- Máximo 20% de texto na imagem (regra Meta)
- CTA visível e contrastante

---

## Meta API — Rate Limits e Boas Práticas

### Limites
- **200 chamadas/hora** por conta de anúncios
- **Batch requests:** Máximo 50 por batch
- **Rate limit 429:** Cooldown global de 5 minutos

### Boas Práticas
- Usar batch requests para múltiplas operações
- Implementar exponential backoff em erros
- Cachear dados de campanhas localmente
- NUNCA fazer polling agressivo de métricas (máximo 1x/hora)
- Usar webhooks quando disponível

### Endpoints Principais
```
GET /{ad_account_id}/campaigns — Listar campanhas
GET /{campaign_id}/insights — Métricas da campanha
POST /{ad_account_id}/campaigns — Criar campanha
POST /{campaign_id} — Atualizar campanha (status, budget)
GET /{ad_account_id}/adsets — Listar conjuntos
GET /{ad_account_id}/ads — Listar anúncios
```

---

## Campanhas Ativas — Referência Rápida

### Nomenclatura
```
{Versão} {Tipo} {Variação} — Ex: "V3 LP Cópia³"
V = Versão da campanha
LP = Landing Page como destino
Cópia = Duplicação (Cópia¹, Cópia², Cópia³...)
```

### Status de Campanha
- **ATIVA:** Rodando normalmente, monitorar diariamente
- **PAUSADA:** Desligada por decisão (CPL alto, teste concluído)
- **MANTER PAUSADA:** Não reativar — decisão definitiva
- **AGENDADA:** Programada para ativar em data/hora específica

---

## Processo de Criação de Campanha

1. **Definir objetivo** — Leads, vendas, tráfego
2. **Selecionar ângulo** — Usar framework de ângulos acima
3. **Criar criativos** — 3-5 variações do ângulo (usar skill `ad-creative`)
4. **Configurar campanha** — CBO, Advantage+, segmentação padrão
5. **Definir orçamento** — R$20-45/dia para teste
6. **Agendar** — Início às 00:05h do dia seguinte
7. **Monitorar** — Análise diária por 48h antes de qualquer decisão
8. **Decidir** — Escalar, manter ou pausar conforme regras acima

---

## Relatório de Performance — Template

```markdown
## Relatório Diário — {DATA}

### Resumo
- Budget total: R$X
- Gasto hoje: R$X
- Leads hoje: X
- CPL médio: R$X
- Meta de leads: X
- Progresso: X%

### Por Campanha
| Campanha | Gasto | Leads | CPL | CTR | Freq | Status |
|----------|-------|-------|-----|-----|------|--------|
| ... | ... | ... | ... | ... | ... | ... |

### Decisões
- [ ] Campanha X: {ação} — motivo
- [ ] Campanha Y: {ação} — motivo

### Projeção
- Leads projetados até {data}: X
- Budget restante: R$X
- CPL necessário para meta: R$X
```
