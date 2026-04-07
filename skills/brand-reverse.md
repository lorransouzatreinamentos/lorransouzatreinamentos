---
name: brand-reverse
description: "Reverse engineering de identidade de marca em 6 fases — visual, verbal, positioning, archetype, content, synthesis. Gera documento completo para replicação de marca."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch"]
---

# /brand-reverse — Reverse Engineering de Identidade de Marca

> **Tipo:** Skill de análise estratégica | **Agente padrão:** @creative-director
> **Input:** Screenshots, URLs ou textos de uma marca
> **Output:** Documento completo de identidade replicável

## Objetivo

Desconstruir qualquer marca em seus componentes fundamentais e gerar um guia completo que permita replicar sua identidade em novos materiais com precisão.

---

## Processo — 6 Fases

### Fase 1: Identidade Visual
Extrair com precisão:
- **Cores** — hex codes, proporção de uso (ex: "70% branco, 20% azul, 10% dourado")
- **Tipografia** — fonte de títulos, corpo, accent, hierarquia (tamanhos, pesos, espaçamento)
- **Logo** — estilo (wordmark, símbolo, combinação), características visuais
- **Imagens** — estilo fotográfico (natural/studio, mood, composição), filtros, tratamento
- **Layout** — densidade, grid, uso de espaço branco, bordas/containers
- **Personalidade visual** — 5 adjetivos, tier (premium/mid/budget), indústria percebida

### Fase 2: Identidade Verbal
Avaliar cada dimensão (1-10) com evidência:
- Formal ←→ Casual | Profissional ←→ Amigável | Sério ←→ Divertido
- Reservado ←→ Entusiasta | Complexo ←→ Simples | Autoritário ←→ Acessível
- **Vocabulário** — nível de leitura, jargão, termos próprios, palavras proibidas
- **Gramática** — contrações, pessoa (eu/nós/você), voz ativa/passiva
- **Retórica** — técnicas de persuasão, uso de perguntas, storytelling, CTAs

### Fase 3: Messaging e Posicionamento

| Elemento | Extrair |
|----------|---------|
| **Proposta de valor** | Frase-núcleo (1 linha) + versão expandida (3 linhas) |
| **Público declarado** | Quem a marca diz atender |
| **Público real** | Quem realmente consome (inferido pelo tom e conteúdo) |
| **Competidores implícitos** | Contra quem se posiciona |
| **Enemy** | O que a marca combate (status quo, concorrente, crença) |
| **Promessa central** | Transformação prometida (antes → depois) |
| **Proof stack** | Tipos de prova social (números, depoimentos, mídia) |

### Fase 4: Personalidade e Arquétipo
Classificar nos 12 Arquétipos de Jung:
- Inocente, Explorador, Sábio, Herói, Fora-da-Lei, Mago
- Cara Comum, Amante, Bobo da Corte, Cuidador, Criador, Governante

Entregar: arquétipo primário + secundário, justificativa, nota de aderência 0-1

### Fase 5: Content e Communication Patterns
- **Pilares de conteúdo** — 3-5 temas recorrentes
- **Formatos preferidos** — longo vs curto, vídeo vs texto vs áudio
- **Proporção** — educacional vs entretenimento vs inspiracional
- **Social proof** — como constroem credibilidade
- **CTAs** — padrões de linguagem (5-10 exemplos), urgência/escassez
- **Variação por contexto** — tom em headline vs body, social vs email vs site

### Fase 6: Síntese — 4 Documentos Finais

#### 6.1 Voice Guide (1 página)
```
Tom: [descrição em 1 frase]
Faz: [5 bullets]
Não faz: [5 bullets]
Frase on-brand: "..."
Frase off-brand: "..."
```

#### 6.2 Visual Cheat Sheet (tabela)
| Elemento | Valor |
|----------|-------|
| Cor primária | #XXXXXX |
| Fonte título | Nome (peso) |
| Estilo foto | Descrição |

#### 6.3 Messaging Template
Fórmulas extraídas para: headline, subheadline, body, CTA, prova social

#### 6.4 Replication Checklist
Checklist para verificar se novo material "parece" com a marca.

---

## Regras
- SEMPRE usar acentos e cedilhas em todo texto português
- Citar evidências concretas para cada classificação
- Se input for URL: fazer WebFetch para extrair conteúdo
- Se input for screenshot: descrever elementos visuais observados
- Confidence score em cada classificação subjetiva
