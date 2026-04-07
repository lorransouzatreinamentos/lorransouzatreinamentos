---
name: page-cro
description: "Otimização de landing pages (CRO) — framework 7 pontos, mobile-first, above-the-fold, velocidade, A/B testing, hierarquia visual, tratamento de objeções."
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
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_evaluate
---

# Page CRO — Skill de Otimização de Landing Pages

## Contexto

**Marca:** DOMINA.IA — YOUR_NAME
**LP ativa:** https://desafio.your-domain.com.br/
**Deploy:** Hostinger (your-domain.com.br)
**Padrão visual:** Dark (#0D0D0D) + Green (#00FF88) + White text
**Tráfego:** 70%+ mobile (Meta Ads → Instagram/Facebook)

---

## Framework CRO — 7 Pontos

### Ponto 1: Proposta de Valor (Value Proposition)

**O que é:** A razão pela qual o visitante deve agir. Deve ser entendida em 5 segundos.

**Checklist:**
- [ ] O benefício principal é claro em 1 frase
- [ ] O "para quem" está explícito
- [ ] O "como funciona" é intuitivo
- [ ] Diferencial está evidente (por que ESTA oferta e não outra)

**Fórmula:**
```
[Resultado desejado] + [Para quem] + [Sem a maior objeção]
Exemplo: "Fature com IA em 5 dias — sem saber programar"
```

**Teste:** Mostre a headline para alguém por 5 segundos. Se não entender o que é e para quem, reescrever.

**Erros comuns:**
- Headline vaga: "Transforme sua vida" (com o quê?)
- Focada no produto, não no benefício: "Desafio de 5 dias sobre IA" (e daí?)
- Sem público definido: "Para todos" (para ninguém)

---

### Ponto 2: Headline e Sub-headline

**Headline:** Promessa principal — máximo 10 palavras

| Tipo | Exemplo | Quando Usar |
|------|---------|-------------|
| Benefício direto | "Fature R$10K/mês com Inteligência Artificial" | Público quente |
| Curiosidade | "O Mercado Invisível que Gera R$30K/mês" | Público frio |
| Prova social | "600+ Pessoas Já Descobriram Como Lucrar com IA" | Retargeting |
| Pergunta | "E Se Você Pudesse Ganhar Dinheiro com IA?" | Topo de funil |

**Sub-headline:** Detalhe que complementa — máximo 25 palavras
```
"Desafio gratuito de 5 dias. Aulas ao vivo de 23 a 27 de março, às 20h.
Sem precisar saber programar."
```

**Regras:**
- Headline e sub-headline devem funcionar sozinhas (sem ler mais nada)
- Fonte grande e bold para headline (mínimo 28px mobile)
- Contraste alto (branco sobre escuro ou verde sobre escuro)
- SEMPRE com acentos corretos

---

### Ponto 3: CTA (Call to Action)

**O botão é o elemento mais importante da página.**

**Checklist do CTA perfeito:**
- [ ] Texto de ação (verbo): "Quero Participar Gratuitamente"
- [ ] Cor contrastante (verde #00FF88 sobre fundo escuro)
- [ ] Tamanho grande (mínimo 48px altura no mobile — Apple guideline)
- [ ] Espaço em volta (padding generoso, sem outros elementos colados)
- [ ] Micro-copy abaixo: "100% gratuito. Sem cartão de crédito."
- [ ] Presente acima da dobra E repetido a cada 2-3 seções
- [ ] Apenas UM tipo de CTA na página (não competir ações)

**Textos de CTA que convertem (BR):**
| Contexto | CTA |
|----------|-----|
| Desafio gratuito | "Quero Participar Gratuitamente" |
| Ebook/PDF | "Baixar Meu Guia Gratuito" |
| Consultoria | "Agendar Minha Consultoria" |
| Compra | "Garantir Minha Vaga" |
| WhatsApp | "Falar no WhatsApp" |

**O que NÃO usar:**
- "Enviar" / "Submit" (sem benefício)
- "Clique aqui" (genérico)
- "Saiba mais" (sem compromisso)
- Dois botões competindo (confusão)

---

### Ponto 4: Hierarquia Visual

**Princípio:** O olho deve seguir o caminho: Headline → Benefício → Prova → CTA

**Layout Mobile-First:**
```
┌──────────────────────────┐
│       [Logo pequeno]      │
│                           │
│    HEADLINE GRANDE        │
│    Sub-headline menor     │
│                           │
│  ┌──────────────────────┐ │
│  │  [BOTÃO CTA VERDE]   │ │
│  └──────────────────────┘ │
│  "100% gratuito"          │
│                           │
│ ─────────────────────────│
│                           │
│  ✓ Benefício 1            │
│  ✓ Benefício 2            │
│  ✓ Benefício 3            │
│                           │
│ ─────────────────────────│
│                           │
│  "600+ já se inscreveram" │
│  [Depoimento 1]           │
│  [Depoimento 2]           │
│                           │
│  ┌──────────────────────┐ │
│  │  [BOTÃO CTA VERDE]   │ │
│  └──────────────────────┘ │
│                           │
│ ─────────────────────────│
│                           │
│  FAQ / Objeções           │
│                           │
│  ┌──────────────────────┐ │
│  │  [BOTÃO CTA VERDE]   │ │
│  └──────────────────────┘ │
│                           │
│  [Footer mínimo]          │
└──────────────────────────┘
```

**Regras de design:**
- Fundo escuro (#0D0D0D ou #1A1A1A) — padrão da marca
- Texto branco (#FFFFFF) para corpo
- Verde (#00FF88 ou #39FF14) para destaques e botões
- Uma coluna no mobile (NUNCA grids complexos)
- Espaçamento generoso (mínimo 40px entre seções)
- Sem menu de navegação (zero distrações)
- Sem sidebar
- Sem pop-ups intrusivos (Google penaliza)

---

### Ponto 5: Prova Social

**Onde posicionar:**
- Logo após o primeiro CTA (reforça a decisão)
- Entre seções de conteúdo (mantém credibilidade)
- Antes do último CTA (empurrão final)

**Elementos de prova social:**

| Elemento | Impacto | Implementação |
|----------|---------|---------------|
| Contador de inscritos | Alto | Número atualizado em tempo real ou periodicamente |
| Depoimentos com foto | Muito alto | 2-3 depoimentos curtos, com nome e resultado |
| Depoimentos em vídeo | Máximo | Embed de vídeo curto (30-60s) |
| Logos/badges | Médio | "Como visto em..." se aplicável |
| Screenshot de resultado | Alto | Print de dashboard, pagamento, conversa |

**Regras:**
- Depoimentos REAIS apenas — nunca inventar
- Incluir resultado específico: "Saí de R$3K para R$15K" (não "mudou minha vida")
- Foto real da pessoa (não banco de imagens)
- Atualizar números conforme crescem

---

### Ponto 6: Tratamento de Objeções

**As 7 objeções mais comuns (mercado BR de infoprodutos):**

| # | Objeção | Resposta |
|---|---------|----------|
| 1 | "É gratuito mesmo?" | "Sim. 100% gratuito. Sem cartão de crédito. Sem pegadinha." |
| 2 | "Preciso saber programar?" | "Não. As ferramentas são visuais e intuitivas. Zero código." |
| 3 | "Não tenho tempo" | "São apenas 50 minutos por dia durante 5 dias. Você pode assistir pelo celular." |
| 4 | "Funciona para meu nicho?" | "IA se aplica a qualquer área: saúde, direito, marketing, vendas, educação..." |
| 5 | "Já tentei e não deu certo" | "Esse método é diferente. Foco em resultados práticos, não teoria." |
| 6 | "É confiável?" | "{número} pessoas já participaram. Veja os depoimentos acima." |
| 7 | "Vou receber gravação?" | "Replay disponível por 24h após cada aula. Participe ao vivo para melhor experiência." |

**Formato na LP:** Seção de FAQ com accordion (expandir/colapsar)

---

### Ponto 7: Redução de Atrito (Friction)

**Checklist anti-atrito:**
- [ ] Formulário com máximo 2 campos (Nome + WhatsApp)
- [ ] Botão de submit grande e com texto claro
- [ ] Sem captcha visível (usar reCAPTCHA v3 invisível)
- [ ] Sem redirecionamentos desnecessários
- [ ] Sem pop-ups que bloqueiam o conteúdo
- [ ] SSL ativo (https://) — cadeado verde
- [ ] Sem erros de console (JavaScript)
- [ ] Sem links quebrados
- [ ] Política de privacidade acessível (link no footer)
- [ ] Sinal de segurança: "Seus dados estão protegidos"

---

## Mobile-First Checklist

### Obrigatório (70%+ do tráfego é mobile)

- [ ] **Tap targets:** Botões com mínimo 48x48px
- [ ] **Font size:** Mínimo 16px para corpo (evita zoom no iOS)
- [ ] **Espaçamento:** Mínimo 8px entre elementos clicáveis
- [ ] **Imagens:** Responsivas (max-width: 100%)
- [ ] **Formulário:** Input type correto (tel para WhatsApp, text para nome)
- [ ] **Scroll:** Vertical apenas (sem scroll horizontal)
- [ ] **Orientação:** Funciona em portrait e landscape
- [ ] **Teclado:** Formulário não é coberto pelo teclado virtual
- [ ] **Gestos:** Não depende de hover (não existe no mobile)

### Teste Rápido
```bash
# Usar Playwright para testar responsividade
# Viewport mobile: 375x812 (iPhone X)
# Viewport tablet: 768x1024 (iPad)
# Viewport desktop: 1440x900
```

---

## Above the Fold — Otimização

**Definição:** Tudo que é visível SEM rolar a página.

**No mobile (375x812):**
- Logo (pequeno, canto superior)
- Headline (máximo 2 linhas)
- Sub-headline (máximo 2 linhas)
- Botão CTA
- Micro-copy de segurança

**O que NÃO colocar acima da dobra:**
- Imagem hero gigante (empurra o CTA para baixo)
- Vídeo auto-play (consome dados, carrega lento)
- Menu de navegação completo
- Formulário com muitos campos
- Animações pesadas

**Teste:** No seu celular, a headline E o botão CTA são visíveis sem rolar? Se não, ajustar.

---

## Velocidade de Carregamento

### Metas
| Métrica | Meta | Ferramenta |
|---------|------|------------|
| LCP (Largest Contentful Paint) | < 2.5s | PageSpeed Insights |
| FID (First Input Delay) | < 100ms | PageSpeed Insights |
| CLS (Cumulative Layout Shift) | < 0.1 | PageSpeed Insights |
| Tempo total de carregamento | < 3s | GTmetrix |
| Tamanho da página | < 1MB | DevTools |

### Otimizações Prioritárias

| Ação | Impacto | Esforço |
|------|---------|---------|
| Converter imagens para WebP | Alto | Baixo |
| Lazy loading em imagens abaixo da dobra | Alto | Baixo |
| Minificar CSS/JS | Médio | Baixo |
| Comprimir com Gzip/Brotli | Alto | Médio |
| Eliminar JS não utilizado | Alto | Médio |
| Preconnect para fontes externas | Médio | Baixo |
| Cache headers corretos | Alto | Médio |
| CDN para assets estáticos | Alto | Médio |

### Checklist de Performance
```bash
# Testar com Lighthouse
# URL: https://pagespeed.web.dev/
# Testar mobile E desktop
# Meta: Score > 90 em Performance
```

---

## Metodologia de A/B Testing

### O que Testar (em ordem de impacto)

| Prioridade | Elemento | Variação Típica |
|-----------|----------|-----------------|
| 1 (maior) | Headline | Benefício vs Curiosidade vs Prova Social |
| 2 | CTA (texto) | "Participar Gratuitamente" vs "Garantir Minha Vaga" |
| 3 | CTA (cor) | Verde vs Laranja vs Branco |
| 4 | Layout acima da dobra | Com imagem vs Sem imagem |
| 5 | Prova social | Número vs Depoimento vs Ambos |
| 6 | Formulário | 2 campos vs 1 campo |
| 7 | Sub-headline | Informativa vs Emocional |

### Regras de A/B Test

1. **Testar UMA variável por vez** — senão não sabe o que causou a diferença
2. **Volume mínimo:** 100 conversões por variação antes de declarar vencedor
3. **Duração mínima:** 7 dias (captura diferentes dias da semana)
4. **Significância estatística:** 95% de confiança antes de decidir
5. **Não espiar resultados** antes do volume mínimo (viés de confirmação)
6. **Documentar TUDO:** hipótese, variações, resultados, aprendizado

### Formato de Documentação
```markdown
## A/B Test #{número}
**Elemento:** Headline
**Hipótese:** "Headline com número converte mais que headline com pergunta"
**Variação A (controle):** "Fature com IA em 5 Dias"
**Variação B (teste):** "Como 600+ Pessoas Já Faturam com IA"
**Período:** {data início} a {data fim}
**Tráfego:** {visitantes A} vs {visitantes B}
**Conversões:** {leads A} ({taxa A}) vs {leads B} ({taxa B})
**Vencedor:** {A ou B}
**Confiança:** {%}
**Aprendizado:** {o que aprendemos}
**Próximo teste:** {o que testar agora}
```

---

## Auditoria CRO — Checklist Completo

### Executar Antes de Cada Lançamento

**Estrutura:**
- [ ] Headline clara e com benefício (< 10 palavras)
- [ ] Sub-headline complementa sem repetir
- [ ] CTA acima da dobra no mobile
- [ ] CTA repetido a cada 2-3 seções
- [ ] Formulário com máximo 2 campos
- [ ] FAQ/objeções tratadas
- [ ] Prova social presente (número + depoimentos)

**Visual:**
- [ ] Fundo escuro + texto branco + verde (padrão marca)
- [ ] Uma coluna no mobile
- [ ] Espaçamento generoso entre seções
- [ ] Sem menu de navegação
- [ ] Sem pop-ups intrusivos
- [ ] Imagens otimizadas (WebP, quality 82)

**Técnico:**
- [ ] HTTPS ativo
- [ ] Carrega em < 3 segundos (mobile)
- [ ] Sem erros de console
- [ ] Pixel de conversão disparando
- [ ] Formulário submit funcionando
- [ ] Thank you page configurada
- [ ] Redirect para WhatsApp funcionando
- [ ] Responsivo em 375px, 768px, 1440px

**Copy:**
- [ ] Acentuação correta em TUDO
- [ ] Sem erros gramaticais
- [ ] Tom consistente com a marca
- [ ] CTAs com verbo de ação
- [ ] Urgência/escassez baseada em dados reais

**Tracking:**
- [ ] Pixel Meta instalado e ativo
- [ ] Evento Lead configurado no formulário submit
- [ ] UTMs nos links de anúncio
- [ ] Google Analytics (se aplicável)

---

## Processo de Otimização Contínua

```
1. Auditar página (checklist acima)
    ↓
2. Identificar maior gargalo (onde perde mais visitantes)
    ↓
3. Formular hipótese (por que estão saindo)
    ↓
4. Criar variação (A/B test)
    ↓
5. Rodar teste (mínimo 100 conversões por variação)
    ↓
6. Analisar resultado (significância 95%)
    ↓
7. Implementar vencedor → Voltar para 1
```

**Frequência:** Ciclo de 7-14 dias por teste. Sempre ter um teste rodando.
