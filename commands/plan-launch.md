---
description: "Planeja lançamento digital completo — desafio, evento, campanha"
argument-hint: "<nome do produto/evento>"
allowed-tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "WebSearch", "Agent"]
---

# Planejamento de Lançamento Digital

Planeje o lançamento completo para: $ARGUMENTS

## Contexto
- **Empresa:** DOMINA.IA — YOUR_NAME
- **Experiência anterior:** Desafio "O Mercado Invisível da IA" (Mar/2026)
- **Canais:** Instagram (@your-handle), Meta Ads, WhatsApp, LP própria
- **Infraestrutura:** MY GROWTH (CRM/automação), Content Studio, VPS próprio
- Leia a memória em `~/.claude/projects/${USER_PROJECT_PATH}/memory/` para contexto completo

## Instruções de Execução

### Passo 1: Pesquisa de Mercado
- Use WebSearch para pesquisar lançamentos similares no nicho
- Busque benchmarks de CPL, taxa de conversão, ticket médio
- Identifique o melhor formato: desafio, webinar, workshop, masterclass, evento
- Analise timing: datas ideais, evitar conflitos com feriados/eventos

### Passo 2: Definição do Produto/Evento
- **Nome e formato**: definição clara do que será lançado
- **Proposta de valor**: o que o participante ganha
- **Duração**: dias, horas, formato (ao vivo, gravado, híbrido)
- **Oferta backend**: o que será vendido ao final
- **Ticket**: preço e condições de pagamento
- **Meta de vendas**: quantidade e faturamento alvo

### Passo 3: Timeline Completo
Gere um cronograma detalhado:

```markdown
## Timeline

### Pré-Lançamento (T-30 a T-15)
- [ ] Definir oferta e produto
- [ ] Criar LP de captura
- [ ] Preparar criativos (mínimo 5 variações)
- [ ] Configurar pixel e eventos de conversão
- [ ] Setup WhatsApp automação (sequência de nutrição)
- [ ] Criar formulário de inscrição
- [ ] Testar fluxo completo (ad → LP → form → WhatsApp)

### Captação (T-14 a T-1)
- [ ] Ativar campanhas Meta Ads
- [ ] Dia 1-3: Budget conservador (R$ X/dia) — testar criativos
- [ ] Dia 4-7: Escalar vencedores (duplicar, NÃO aumentar budget)
- [ ] Dia 8-14: Escala máxima nos melhores conjuntos
- [ ] Conteúdo orgânico diário (stories, reels, posts)
- [ ] Nutrição WhatsApp (lembretes D-7, D-3, D-1, D-0)
- [ ] Monitorar CPL diariamente — aplicar matriz Sobral

### Evento/Lançamento (D-Day)
- [ ] Checklist técnico (streaming, slides, áudio)
- [ ] Sequência de conteúdo do evento
- [ ] Abertura de carrinho (timing exato)
- [ ] Bônus de ação rápida (primeiras X horas)

### Pós-Evento (D+1 a D+7)
- [ ] Follow-up WhatsApp (quem assistiu mas não comprou)
- [ ] Remarketing ads para inscritos
- [ ] Depoimentos e prova social
- [ ] Fechamento de carrinho com urgência
- [ ] Análise final de resultados
```

### Passo 4: Budget e Projeções
Calcule baseado em benchmarks reais:

```markdown
## Budget e Projeções

### Investimento em Tráfego
- Budget total: R$ X
- CPL alvo: R$ X (baseado no histórico DOMINA.IA)
- Leads projetados: X
- Distribuição por fase:
  - Teste (dias 1-3): X% do budget
  - Otimização (dias 4-7): X%
  - Escala (dias 8-14): X%

### Projeção de Conversão
- Leads captados: X
- Taxa de presença estimada: X% (benchmark: 30-50%)
- Presentes no evento: X
- Taxa de conversão estimada: X% (benchmark: 3-8%)
- Vendas projetadas: X
- Ticket médio: R$ X
- Faturamento projetado: R$ X
- ROI projetado: X%
```

### Passo 5: Estratégia de Criativos
Defina os ângulos e formatos:

```markdown
## Estratégia de Criativos

### Ângulos para Testar
1. **Resultado/Transformação**: "De X para Y em Z dias"
2. **Curiosidade/Oportunidade**: "O mercado que ninguém está vendo"
3. **Dor/Problema**: "Você ainda está fazendo X manualmente?"
4. **Autoridade/Prova**: "Como ajudei X pessoas a..."
5. **Urgência/Escassez**: "Últimas vagas / Só até dia X"

### Formatos
- 3x estáticos (1080x1920 Story)
- 2x vídeo curto (<30s)
- Variações de copy para cada ângulo
- Padrão visual: dark/green (campeão comprovado)

### Regras de Teste
- Mínimo R$50 por criativo antes de decidir
- CPL < meta por 48h = escalar
- CPL > 2x meta por 48h = pausar
- Duplicar vencedores, NÃO aumentar budget
```

### Passo 6: Sequência WhatsApp
Planeje a nutrição via WhatsApp (NÃO email):

```markdown
## Sequência WhatsApp

### Pré-Evento
- **Imediato**: Boas-vindas + confirmação de inscrição
- **D-7**: Conteúdo de valor + expectativa
- **D-3**: Prévia do conteúdo + CTA para marcar na agenda
- **D-1**: Lembrete + link de acesso
- **D-0 (2h antes)**: "Começa em 2 horas!"
- **D-0 (15min)**: "Estamos ao vivo! Entre agora"

### Pós-Evento
- **D+0**: Replay + resumo + oferta
- **D+1**: Depoimento + FAQ
- **D+3**: Urgência + bônus expirando
- **D+5**: Último lembrete
- **D+7**: Carrinho fecha + última chance
```

### Passo 7: Salvar Plano
- Crie o diretório `~/launches/{product-slug}/` se necessário
- Salve o plano completo como `~/launches/{product-slug}/LAUNCH-PLAN.md`
- Exiba o resumo executivo no chat com próximos passos imediatos

```markdown
## Próximos Passos Imediatos
1. [ ] [Ação mais urgente]
2. [ ] [Segunda ação]
3. [ ] [Terceira ação]

## Decisões Pendentes
- [ ] [Decisão que precisa do YOUR_NAME]
```
