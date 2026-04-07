---
name: highlight-hunter
description: "Extrai trechos virais de transcrições e vídeos — timestamps, resumos, sugestões de caption e hook para Reels/TikTok."
tools: ["Read", "Write", "Edit", "Bash", "WebFetch"]
---

# /highlight-hunter — Extrator de Trechos Virais

> **Tipo:** Skill de produção | **Agente padrão:** @growth-hacker
> **Input:** URL de vídeo, transcrição ou arquivo de texto
> **Output:** 8 trechos com potencial viral ranqueados

## Objetivo

Encontrar os momentos de ouro em qualquer conteúdo longo (vídeo, podcast, live, palestra) e transformá-los em cortes prontos para Reels, TikTok e Shorts.

---

## Processo

### 1. Obtenção do Conteúdo
- Se URL de vídeo: extrair transcrição (yt-dlp ou WebFetch)
- Se arquivo de texto: ler diretamente
- Se transcrição com timestamps: preservar marcações

### 2. Identificação de Momentos Virais
Buscar trechos que contenham:

| Elemento | Peso | Exemplo |
|----------|------|---------|
| **Contraste forte** | Alto | "Todo mundo faz X, mas o certo é Y" |
| **Dado surpreendente** | Alto | "97% das pessoas não sabem que..." |
| **História pessoal** | Médio | "Quando eu perdi tudo, descobri que..." |
| **Provocação** | Médio | "Isso que ninguém te conta sobre..." |
| **Instrução prática** | Médio | "Faça isso AGORA: passo 1..." |
| **Emoção intensa** | Alto | Momento de epifania, raiva, humor |
| **One-liner memorável** | Alto | Frase curta e impactante |

### 3. Para Cada Trecho

| Campo | Descrição |
|-------|-----------|
| **Timestamp** | Início e fim (ex: 12:34 - 13:15) |
| **Trecho** | Texto literal (15-60 segundos) |
| **Resumo** | 15-20 palavras descrevendo o momento |
| **Hook sugerido** | Frase de abertura para o corte (3-5 segundos) |
| **Caption** | Legenda para Reels/TikTok (< 150 chars) |
| **CTA** | Call-to-action sugerido |
| **Potencial viral** | Score 0.0-1.0 |

### 4. Output

Tabela ordenada por potencial viral (maior primeiro):

```
| # | Timestamp | Resumo | Hook | Score |
|---|-----------|--------|------|-------|
| 1 | 12:34-13:15 | [resumo] | [hook] | 0.92 |
```

+ Detalhamento completo de cada trecho abaixo da tabela.

---

## Regras
- Mínimo 8 trechos, máximo 12
- Cada trecho deve funcionar ISOLADAMENTE (sem contexto prévio)
- Hook deve capturar atenção nos primeiros 3 segundos
- Caption deve gerar curiosidade para assistir até o fim
- Score > 0.8 = potencial alto | 0.5-0.8 = médio | < 0.5 = baixo
- Output em português brasileiro com acentos
