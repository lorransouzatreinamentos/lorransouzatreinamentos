---
name: video-avatar
description: Pipeline automatizado de vídeos com avatar IA — gera roteiros, áudio clonado, avatar/influencer virtual e edição
version: 2.0.0
author: Segunda-feira
tags: [video, avatar, clone, heygen, elevenlabs, content, influencer-virtual, grok, kling, comfyui, veo]
---

# /video-avatar — Pipeline de Vídeos com Avatar IA

## Descrição
Gera vídeos completos com avatar de IA de ponta a ponta. Suporta dois modos:
1. **Clone de você** — pesquisa viral, roteiro AIDA, áudio clonado (ElevenLabs), avatar (HeyGen), edição e legendas
2. **Influencer virtual do zero** — cria personagem original com GROK/Whisk/Nano Banana, gera vídeos com Veo 3.1/KLING/Pimeca, motion transfer de trends, monetização via Telegram

## Uso
```
/video-avatar [tema] --format=[talking-head|react|podcast|palestra|montagem] --duration=[30s|60s|90s] --look=[id]
/video-avatar --mode=influencer --name="Luna" --style="morena, 25 anos, fitness"
/video-avatar --mode=influencer --trend=[url-video-referencia]
```

## Exemplos
```
/video-avatar "5 ferramentas de IA que vão substituir agências" --format=talking-head --duration=60s
/video-avatar "react ao novo modelo GPT-5" --format=react --duration=90s
/video-avatar batch --count=5 --topic="IA para negócios"
/video-avatar --mode=influencer --name="Sofia" --style="loira, olhos azuis, 23 anos" --niche="fitness"
/video-avatar --mode=influencer --trend="https://tiktok.com/..." --motion-transfer
```

## Modo 1: Clone de Você (Pipeline Original)

### 1. Pesquisa de Ideias
- Busca trends atuais no nicho via RSS, Reddit, HN
- Encontra vídeos virais (>1M views) para extrair ganchos
- Traduz/adapta conteúdo viral de criadores americanos
- Conceito de mimetismo digital (René Girard): mimetizar != imitar

### 2. Roteiro (Framework AIDA Completo)
- **A (Atenção/Gancho):** 2-5 segundos, 60-70% da importância — "nada se cria, tudo se copia"
- **I (Interesse):** Continuação natural do gancho, manter promessa
- **D (Desejo):** Dados, storytelling, autoridade, personalidade diferenciada
- **A (Ação):** CTA direta ("link na bio") ou indireta ("postei no story") — indiretas convertem mais
- Múltiplas personas por plataforma (Instagram=empolgado, YouTube=conversacional, LinkedIn=sério)
- Benchmark: 100 vídeos/3 meses = 100K seguidores

### 3. Áudio (ElevenLabs)
- Gera áudio com voz clonada profissional
- Seleciona modelo de voz por persona/plataforma
- Verifica fidelidade via transcrição reversa

### 4. Avatar (HeyGen)
- Gera vídeo do clone com o áudio
- Hack: Avatar 4 (5s início) + Avatar 3 (resto) = economia
- Fundo verde (chroma key) para edição

### 5. Edição (FFmpeg)
- Chroma key automático
- Composição: avatar + B-Roll + slides
- Cortes rápidos entre cenas

### 5b. Conteúdo Visual Estático
- NotebookLM: infográficos, mapas mentais, slides
- Nano Banana Pro (FreePik): imagens com texto embutido
- Alternar vídeos com posts estáticos para evitar fadiga

### 6. Legendas (Whisper)
- Transcrição automática para SRT
- Estilização de legendas (sem pontuação, fonte bold)

### 7. Publicação
- Exporta 9:16 (Reels/TikTok), 16:9 (YouTube)
- Agenda via MY GROWTH ou API direta

## Modo 2: Influencer Virtual do Zero

### 1. Criação do Personagem
- **GROK (xAI):** Geração de imagens hiper-realistas, modo Especialista, 9:16
- **Google Whisk:** Consistência facial via foto de referência + prompt
- **Nano Banana Pro (FreePik):** Imagens até 4K, texto embutido
- **Seedream 4/5:** Fallback quando Nano Banana recusa conteúdo
- **ComfyUI:** Batch processing via workflows visuais com nodes

### 2. Banco de Assets
- Gerar 20-30 fotos (poses, roupas, ambientes variados)
- Troca de roupa: Pinterest (referência) > ChatGPT (descreve) > aplicar
- Troca de cenário: foto real Pinterest > ChatGPT descreve > aplicar
- Body Swap: Gemini 3 Pro como intermediário
- Upscale obrigatório para imagens gratuitas
- FreePik Spaces node "Variations": 9+ variações automáticas com 1 clique

### 3. Produção de Vídeo
- **Veo 3.1 (Flow):** 8s com fala sincronizada, câmera fixa, aceita PT-BR
- **KLING AI Motion Control:** Melhor transferência de movimento, 3-30s
- **Pimeca (Minimax):** Animação premium $6/mês, constância do personagem
- **Viggle/Furo:** Animação gratuita rápida, créditos diários
- **1.video (Wan 2.2):** Character Swap gratuito
- **Sora 2:** Cenas cinematográficas, função Cameo (requer VPN)

### 4. Motion Transfer (Trends/Danças)
- Encontrar vídeo de referência (Pinterest, TikTok, Instagram)
- KLING AI: gerar imagem no MESMO AMBIENTE do vídeo de referência antes de aplicar
- Regra: foto deve cobrir cabeça até joelhos, mesmo ângulo do vídeo
- Evitar "dança girando" — usar "dança normal, sem virar"

### 5. Voz Consistente
- Gerar vídeo com voz padrão (Veo 3.1)
- Trocar voz no ElevenLabs (exportar MP3 > trocar > substituir = sincronização perfeita)

### 6. GRWM (Get Ready With Me)
- Buscar vídeo GRWM real (câmera fixa, boa iluminação)
- Gemini 3 Pro extrai prompts de movimento
- Substituir pessoa frame a frame mantendo ambiente
- Gerar vídeos de cada frame > editar no CapCut

## Pipeline de Monetização

```
Instagram/TikTok (orgânico + pago)
    |
    +-- Privacy (assinatura — público que conhece a plataforma)
    |
    +-- Telegram Free (prévias para atrair)
            |
            +-- Bot VIP (Medibot/VIPGRAM — checkout PIX automático)
                    |
                    +-- Grupo VIP (conteúdo exclusivo)
                            |
                            +-- Planos: 7d (R$29,90) / 30d (R$49,90) / 1 ano (R$299,90)
```

**Automação de vendas:**
- MedBoot/Medibot: pagamento PIX > link automático > acesso ao VIP
- Remarketing automático: leads que geraram PIX mas não pagaram
- Renovação automática: mensagem 1 dia antes do vencimento
- Múltiplos modelos/perfis = multiplicador de receita

## Ferramentas — Stack Completo

### Geração de Imagens
| Ferramenta | Função | Custo |
|-----------|--------|-------|
| GROK (xAI) | Imagens hiper-realistas, modo Especialista | Grátis |
| Google Whisk | Consistência facial | Grátis |
| Nano Banana Pro | Imagens 4K, texto embutido | Incluso FreePik |
| Seedream 4/5 | Fallback para conteúdo liberal | Incluso FreePik |
| FLUX Image Turbo | Volume rápido (open-source) | ~1 crédito/img |
| Gemini | Geração gratuita limitada | Grátis |

### Geração de Vídeos
| Ferramenta | Função | Custo |
|-----------|--------|-------|
| HeyGen | Avatar/clone, talking-head | $29/mês |
| Veo 3.1 (Flow) | Vídeos com fala sincronizada | US$24.99/mês |
| KLING AI | Motion Control superior | US$8.80+/mês |
| Sora 2 | Cenas cinematográficas, Cameo | VPN + ChatGPT |
| Pimeca | Animação premium | ~$6/mês |
| Viggle/Furo | Animação gratuita | Grátis |
| 1.video (Wan 2.2) | Character Swap | Grátis |

### Áudio e Edição
| Ferramenta | Função | Custo |
|-----------|--------|-------|
| ElevenLabs | Clonagem de voz profissional | $22-99/mês |
| Claude API | Roteiros, prompts | ~R$50/mês |
| Whisper | Transcrição e legendas | ~R$10/mês |
| FFmpeg | Edição automática | Grátis |
| CapCut | Edição manual | Free/Pago |

### Plataformas de Workflow
| Ferramenta | Função | Custo |
|-----------|--------|-------|
| ComfyUI Cloud | Workflows visuais, GPU RTX 6000 Pro 96GB | Grátis (400 créditos) |
| FreePik Spaces | Nodes visuais interligáveis | R$34-180/mês |
| Civit.ai | Biblioteca de LoRAs/modelos | Grátis |

### Design Estático
| Ferramenta | Função | Custo |
|-----------|--------|-------|
| FreePik + Nano Banana | Imagens com texto embutido | ~$10/mês |
| NotebookLM | Infográficos, mapas mentais | Grátis |
| Canva AI | Refinamento, captura de texto | Pago |

## Projeto
Código fonte em: `~/video-agent/`

## Base de Conhecimento
- Knowledge base completa: `~/fabrica-conteudo-invisivel/KNOWLEDGE-BASE-COMPLETA.md`
- Cursos consolidados:
  - Fábrica de Conteúdo Invisível (Lucas Arrial, Hotmart) — 17 aulas
  - Método Job Com IA + Modelo Influencer (Cakto) — 14 aulas
  - Influencer Academy (Cakto) — 36 aulas
  - Influencer Sem Censura (Cakto) — 14 aulas
- Transcrições completas em `~/fabrica-conteudo-invisivel/transcricoes/` e `~/fabrica-conteudo-invisivel/transcricoes-cakto/`
- Resumos executivos em `~/fabrica-conteudo-invisivel/resumos/`
