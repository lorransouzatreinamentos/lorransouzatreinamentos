---
name: remotion-video
description: "Cria vídeos programaticamente com Remotion — legendas automáticas, motion graphics, demos de produto, anúncios para redes sociais e showcases animados."
---

# Criar Vídeos Programaticamente com Remotion

## Introdução

Este sistema permite gerar **ativos de nível profissional** — vídeo, web, UI, dados e automação — a partir de um único pipeline.

---

## Pré-requisitos

Instale:

- **Node.js** (para usar `npx`)
  https://nodejs.org/en/download

- **Git** (para baixar ferramentas do GitHub)
  https://git-scm.com/install

Depois, execute:

```bash
npx create-video@latest
```

---

## O Que Este Sistema Pode Gerar

### Vídeo & Motion Graphics (Remotion)
- Intros e outros animados
- Vídeos explicativos
- Demos de produto
- Anúncios para redes sociais
- Tipografia cinética
- Infográficos animados

### Web
- Landing pages
- Dashboards
- Painéis administrativos
- Sites de marketing

### UI / UX
- Bibliotecas de componentes
- Design systems
- Animações de loading
- Microinterações

### Automação
- Scripts em lote
- Integrações com API
- Ferramentas CLI

---

## Workflow 1 — Vídeo Automatizado com Legendas

Pipeline totalmente automático:

### Etapa 1 — Análise
- Transcrição com Whisper
- Identificação do melhor take
- Corte com FFmpeg

### Etapa 2 — Áudio (Auphonic)
- Normalização (16 LUFS)
- Redução de ruído
- Exportação AAC 192kbps

### Etapa 3 — Legendas (Remotion)
- React + Remotion
- 4 palavras por bloco
- Palavra atual destacada
- Áudio substituído pelo processado

### Etapa 4 — Renderização

```bash
npx remotion render [Composição] output.mp4 --codec h264
```

Resultado: **MP4 cinematográfico com legendas automáticas**.

---

## Workflow 2 — Site -> Design System -> Vídeo

1. Extrair tokens visuais do site:
   - Tipografia
   - Cores
   - Espaçamento
   - Componentes

2. Criar showcase animado em Remotion:
   - 1920x1080
   - 30fps
   - 15-16s

3. Renderizar vídeo final

---

## Workflow 3 — Dashboard Interativo

- UI fiel ao site de referência
- Tokens centralizados em `theme.ts`
- Dados mock (pronto para Supabase)
- Estados completos (loading, erro, vazio)

---

## Objetivo Final

Criar uma **skill reutilizável** que, ao ser ativada, repita exatamente este processo para qualquer vídeo futuro, sem perguntas, sem confirmação — apenas execução.
