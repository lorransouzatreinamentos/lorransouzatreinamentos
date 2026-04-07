---
name: feed-results
description: "Importa resultados de Meta Ads, Instagram e WhatsApp para o feedback loop. Atualiza patterns automaticamente. Base de todo aprendizado dos agentes."
tools: ["Read", "Write", "Edit", "Bash", "WebFetch"]
---

# /feed-results — Alimentar o Feedback Loop

> **Tipo:** Skill de coleta | **Agente padrão:** @analyst
> **Frequência:** Diária ou após cada campanha/lançamento
> **Output:** ~/feedback-loop/results.json atualizado + patterns extraídos

## Objetivo

Coletar resultados reais de todas as plataformas e alimentar o banco central de resultados que todos os agentes consultam antes de tomar decisões.

---

## Processo

### 1. Coleta de Dados

#### Meta Ads (se disponível via API ou manual)
Para cada campanha ativa/recente:
- Nome, ID, status
- CPL (custo por lead), CPA
- Leads gerados, spend total
- Ângulo do criativo usado
- Período

#### Instagram (se dados disponíveis)
Para cada post recente:
- Slug, formato (Reel/Carrossel/Post)
- Likes, saves, shares, comentários, alcance
- Ângulo/tema do conteúdo
- Data de publicação

#### WhatsApp Bot (se dados disponíveis)
- Mensagens enviadas, entregues, lidas, respondidas
- Taxa de conversão por sequência

### 2. Atualização do results.json
- Ler ~/feedback-loop/results.json
- Adicionar novos entries (sem duplicar — verificar por ID/slug)
- Atualizar entries existentes se houver dados mais recentes
- Salvar

### 3. Extração de Padrões
Após atualizar resultados, analisar automaticamente:

#### Ângulos
- Agrupar campanhas por creative_angle
- Calcular CPL médio por ângulo
- Identificar: campeões (CPL < média) e perdedores (CPL > 2x média)
- Atualizar ~/patterns/angles.md

#### Formatos
- Agrupar conteúdo por formato
- Calcular engajamento médio por formato
- Atualizar ~/patterns/formats.md

#### Ofertas
- Comparar taxas de conversão entre ofertas
- Atualizar ~/patterns/offers.md

### 4. Emissão de Sinais
Se padrão relevante detectado, emitir sinal em ~/broadcast/signals.json:
- CPL_DROP: ângulo com CPL abaixo da média
- CPL_SPIKE: campanha com CPL subindo
- ENGAGEMENT_SPIKE: conteúdo com performance excepcional

### 5. Output
Resumo em texto:
```
## Feed Results — [DATA]
- Campanhas atualizadas: X
- Posts atualizados: X
- Padrões novos: X
- Sinais emitidos: X
- Ângulo campeão atual: [nome] (CPL R$X.XX)
```

---

## Regras
- NUNCA inventar dados — só registrar o que foi coletado
- Manter histórico (nunca sobrescrever entries antigos, apenas adicionar novos)
- Confidence score obrigatório em padrões extraídos
- Se dados insuficientes (< 3 entries), marcar padrão como "preliminary"
