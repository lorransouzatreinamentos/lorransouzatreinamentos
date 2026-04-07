---
name: creative-validator
description: "Validador automático de criativos — 7 checagens obrigatórias (acentos, espaçamento, foto, variedade, formato, visual, upload) antes de qualquer entrega"
---

# /creative-validator — Pipeline de Validação de Criativos

## Propósito

Validar AUTOMATICAMENTE todo criativo gerado antes de entregar ao usuário. Este pipeline elimina os erros repetitivos que custam 3-5h/semana de retrabalho. NENHUM criativo pode ser entregue sem passar pelos 7 checks.

## Quando Usar

Este pipeline é AUTOMÁTICO — deve ser executado SEMPRE que qualquer agente ou skill gerar criativos (ads, posts, banners). Não depende de invocação manual.

Skills que DEVEM chamar este validador antes de entregar:
- `/ad-creative`
- `/social-content`
- `/paid-ads` (quando gera criativos)
- Qualquer fluxo que produza imagens PNG/JPG para Meta Ads ou Instagram

---

## Pipeline de Validação (7 Checks)

```
Gerar criativo → Check 1-6 → Se falhar: corrigir auto → Re-check → Se OK: Check 7 (upload) → Entregar
```

**Regra de ouro:** Se QUALQUER check CRÍTICO falhar e não puder ser corrigido automaticamente → BLOQUEAR e informar o problema específico. NUNCA entregar criativo com erro.

---

### CHECK 1: ACENTUAÇÃO (CRÍTICO — BLOQUEANTE)

**Severidade:** CRÍTICO
**Ação em falha:** Corrigir automaticamente. Se impossível corrigir → BLOQUEAR.

Scan de TODO texto presente no criativo (headlines, body, CTA, badges, labels) por regex.

#### Mapa de correções obrigatórias:

O scanner deve procurar por versões SEM acento e substituí-las pela versão CORRETA. Abaixo, cada linha mostra a forma correta que deve existir no texto final. Se a versão sem acento/cedilha for encontrada, substituir imediatamente:

**Palavras com acento agudo/circunflexo/til — forma correta obrigatória:**

- não (regex: `\bn[aã]o\b` — se "a" sem til → corrigir)
- você (regex: `\bvoc[eê]\b` — se "e" sem circunflexo → corrigir)
- código (regex: `\bcod[ií]go\b` — se "i" sem acento → corrigir)
- também (regex: `\btamb[eé]m\b` — se "e" sem acento → corrigir)
- já (regex: `\bj[aá]\b` — se "a" sem acento → corrigir)
- área (regex: `\b[aá]rea\b` — se "a" sem acento → corrigir)
- início (regex: `\b[ií]n[ií]cio\b` — se sem acento → corrigir)
- único (regex: `\b[uú]nico\b` — se "u" sem acento → corrigir)
- número (regex: `\bn[uú]mero\b` — se "u" sem acento → corrigir)
- prática (regex: `\bpr[aá]tica\b` — se "a" sem acento → corrigir)

**Palavras com cedilha (ç) — forma correta obrigatória:**

- ação (regex: `\ba[cç][aã]o\b` — se "c" sem cedilha → corrigir)
- função (regex: `\bfun[cç][aã]o\b` — se "c" sem cedilha → corrigir)
- solução (regex: `\bsolu[cç][aã]o\b` — se "c" sem cedilha → corrigir)
- produção (regex: `\bprodu[cç][aã]o\b` — se "c" sem cedilha → corrigir)
- lançamento (regex: `\blan[cç]amento\b` — se "c" sem cedilha → corrigir)
- serviço (regex: `\bservi[cç]o\b` — se "c" sem cedilha → corrigir)
- preço (regex: `\bpre[cç]o\b` — se "c" sem cedilha → corrigir)

#### Procedimento:

1. Extrair TODAS as strings de texto do criativo (draw.text calls, variáveis de texto)
2. Fazer scan regex case-insensitive por cada palavra da lista acima
3. Se encontrar QUALQUER versão sem acento → corrigir automaticamente no texto
4. Re-verificar após correção
5. Se a correção automática falhar por qualquer motivo → BLOQUEAR entrega

**Regra complementar:** Esta checagem se aplica a TUDO em português — headlines, body copy, badges, CTAs, notas de rodapé, labels. NENHUMA exceção.

**Origem:** feedback_acentos_obrigatorios.md — "Falta de acentos passa imagem amadora e prejudica credibilidade profissional."

---

### CHECK 2: ESPAÇAMENTO 9:16 (CRÍTICO — BLOQUEANTE)

**Severidade:** CRÍTICO
**Ação em falha:** Ajustar automaticamente. Se impossível → BLOQUEAR.

Para criativos no formato Story 1080x1920 (9:16), o conteúdo DEVE preencher >= 75% da altura do canvas.

#### Regras de distribuição vertical (1080x1920):

| Zona | Posição Y | Conteúdo |
|------|-----------|----------|
| Topo | y=120-220 | Badge inicial, tag de evento |
| Corpo principal | y=220-1300 | Headline, body, números, benefícios |
| CTA + info evento | y=1300-1600 | Botão CTA, data, local |
| Rodapé fixo | y=1780-1920 | Swipe up indicator, logo |

#### Critérios de validação:

- **y_final >= 1440** (75% de 1920) — conteúdo deve terminar em ou após esta linha
- **y_final >= 1500** (78% de 1920) — META IDEAL
- **y_final < 1200** — CRÍTICO, NUNCA entregar
- **y_final < 1400** — AUMENTAR espaçamentos antes de salvar

#### Margens mínimas:

- **Bordas laterais:** mínimo 40px (x >= 40, x <= 1040)
- **Topo:** conteúdo não começa antes de y=100
- **Base:** swipe up/logo em y >= 1780

#### Correção automática (quando y_final < 1440):

1. Aumentar font size dos títulos (incrementar 10-20px)
2. Aumentar spacing entre blocos (incrementar 20-40px entre seções)
3. Adicionar espaçamento após glow_line separador (+40px)
4. Se ainda insuficiente: aumentar tamanho do botão CTA
5. Re-calcular y_final após ajustes

#### Fontes recomendadas para preencher canvas:

- Bebas Neue headline: 80-200px
- Body text: 30-36px
- CTA button: 80px de altura
- Espaçamento entre blocos: mínimo 40-80px

**Origem:** feedback_criativos_espacamento.md — "gerei 7 criativos com conteúdo terminando em y=915 de 1920px (48% do canvas). O YOUR_NAME teve que pedir correção."

---

### CHECK 3: FOTO NÃO RECORTADA (CRÍTICO — BLOQUEANTE)

**Severidade:** CRÍTICO
**Ação em falha:** BLOQUEAR. Não há correção automática — requer decisão.

#### Regras absolutas:

1. **NUNCA usar foto extraída/recortada de dentro de outro criativo**
   - Fundo baked-in cria degradê feio e corte na cabeça
   - Transição visível entre fundo original e novo background

2. **NUNCA aplicar gradient fade em cima de foto recortada**
   - Sempre fica com corte na cabeça
   - Resultado amador

3. **Se a instrução mencionar "usar foto do criativo X"** → BLOQUEAR
   - Informar: "Não é possível recortar foto de outro criativo. Opções: (a) fornecer foto raw/limpa, (b) usar estilo dark/green sem foto"

4. **Fontes válidas de foto:**
   - Foto raw/original (sem texto, sem fundo de criativo)
   - Diretório de assets do projeto
   - Banco de imagens (Unsplash, Pexels, Pixabay)

5. **Se não tiver foto limpa disponível:**
   - Usar estilo dark/green SEM foto (melhor CPL: R$3.61)
   - Text-only performa MELHOR nos dados reais
   - Não forçar foto quando não tem asset limpo

#### Detecção automática:

- Verificar se o path da imagem fonte referencia outro criativo (ex: `*_criativo_*.png`, `*_v6_*.png`)
- Verificar se a instrução do usuário contém "recortar de", "usar foto do", "pegar de"
- Se detectar qualquer indicativo → BLOQUEAR com opções

**Origem:** feedback_foto_criativos.md — "Tentativas repetidas falharam 3 vezes — degradê em cima da cabeça, texto sobreposto, e transição feia. O YOUR_NAME ficou frustrado."

---

### CHECK 4: VARIEDADE VISUAL (ALTO)

**Severidade:** ALTO
**Ação em falha:** Alertar e sugerir correção. Não bloqueia, mas exige justificativa para prosseguir.

#### Regras:

1. **Em batch de múltiplos criativos: nenhuma foto pode repetir**
   - Cada peça deve ter identidade visual própria
   - Verificar hash ou path de cada imagem usada
   - Se detectar repetição → alertar e sugerir alternativa

2. **Cada peça deve ter visual distinto:**
   - Cores de destaque diferentes (verde, azul, dourado)
   - Layout variado (hero left vs center vs right)
   - Tipografia variada quando possível

3. **Se batch > 3 peças: exigir pelo menos 2 estilos diferentes**
   - Ex: 2 dark/green + 2 com foto + 1 bold numbers
   - Não gerar 5 peças idênticas só mudando texto

4. **Buscar variedade de imagens:**
   - Para cada post/criativo, buscar imagem temática relacionada ao assunto
   - Usar bancos de imagem gratuitos (Unsplash, Pexels, Pixabay) via Fetch/Playwright
   - Variar layouts entre posts — não usar o mesmo template visual em sequência
   - Fotos pessoais do YOUR_NAME podem ser usadas, mas alternadas com imagens temáticas

5. **Testar overflow de texto ANTES de subir**
   - Garantir que nenhum texto está cortado
   - NUNCA subir criativo sem verificar visualmente

**Origem:** feedback_criativos_variedade.md — "O usuário reclamou que todos os reels tinham a mesma foto, sem variedade. Isso torna o feed repetitivo e amador."

---

### CHECK 5: FORMATO CORRETO (ALTO)

**Severidade:** ALTO
**Ação em falha:** Corrigir automaticamente.

#### Formatos válidos:

| Contexto | Formato | Dimensões |
|----------|---------|-----------|
| Meta Ads (padrão) | 9:16 Story | 1080x1920 |
| Feed Instagram | 1:1 Feed | 1080x1080 |

#### Regras:

1. **Formato padrão para Meta Ads: SEMPRE 1080x1920 (9:16)**
   - Se nenhum formato foi especificado → usar 9:16
   - Não gerar 1080x1080 a menos que explicitamente solicitado

2. **Formato feed (1080x1080): APENAS quando o usuário pedir explicitamente**
   - Termos que ativam: "feed", "quadrado", "1:1", "1080x1080"
   - Se ambíguo → usar 9:16 (padrão mais seguro para ads)

3. **Verificação:**
   - Checar `Image.new()` ou equivalente — dimensões devem ser (1080, 1920) ou (1080, 1080)
   - Se detectar dimensões diferentes → corrigir automaticamente
   - Alertar se proporção está invertida (1920x1080 → horizontal, errado)

**Origem:** feedback_criativos_ads_regras.md — "Story: 1080x1920 (9:16) — formato padrão para Meta Ads. Feed: 1080x1080 apenas quando explicitamente solicitado."

---

### CHECK 6: PADRÃO VISUAL APROVADO (MÉDIO)

**Severidade:** MÉDIO
**Ação em falha:** Alertar. Não bloqueia, mas documenta desvio.

#### Estilo visual campeão (Dark/Green Minimalista) — CPL R$3.61:

| Elemento | Especificação |
|----------|--------------|
| Fundo | Gradiente escuro dark navy/black (#0a0a0a a #1a1a1a) |
| Números grandes | Verde neon (#2ECC71 / #00ff88 / #39ff14) |
| Headlines | Texto branco bold |
| Subtexto | Cinza (#888888) |
| Botão CTA | Verde arredondado |
| Pill de data | Verde escuro (#1a6b3a) |
| Foto | SEM foto — text-only performa melhor |
| Estilo geral | Minimalista, limpo, muito espaço |
| Fonte títulos | Bebas Neue ou Impact, 80-200px |

#### Ângulos que funcionam (dados reais de performance):

| Ângulo | CPL | Exemplo |
|--------|-----|---------|
| Ganância/dinheiro | R$3.61-R$4.26 | "R$30.000 na mesa", "R$3K a R$30K por projeto" |
| Pergunta provocativa | R$5.00 | "E se você pudesse cobrar R$30K?" |
| Comparação CLT vs IA | A testar | Salário riscado vs valor por projeto |
| FOMO empresarial | A testar | "Seu concorrente já usa IA. E você?" |
| Dor do empresário | A testar | "IA faz o trabalho de 3 funcionários" |

#### Ângulos que NÃO funcionam (evitar):

| Ângulo | CPL | Motivo |
|--------|-----|--------|
| Urgência sozinha ("FALTAM X DIAS") | 0 leads | Falta benefício/oportunidade |
| Profissão do futuro | 0 leads | Muito genérico |
| Bold Numbers sem contexto | 0 leads | Número sem história |
| Case de terceiro (aluno R$9K) | R$9.48 | Case de terceiro não converte frio |
| Autoridade/método | R$7.63 | Oportunidade financeira > autoridade |

#### Estrutura de copy para Meta Ads:

```
Headline (name): Frase curta e impactante (< 40 chars)
Texto (message):
  - Linha 1: Hook (gancho forte)
  - Linha 2-3: Proposta de valor com números
  - Linha 4: Barreira removida ("sem programar")
  - Linha 5: CTA + data + gratuito
  - Emoji: apenas emoji de calendário para data
Description: Frase curta reforçando gratuidade
CTA: SIGN_UP
```

#### Segmentação por público (criativos diferentes):

| Público | Ângulo ideal | Dor |
|---------|-------------|-----|
| Aberto (geral) | Ganância + oportunidade | Não sabe que mercado existe |
| Empresários | IA substitui funcionário | Faz tudo sozinho, sobrecarregado |
| CLT renda alta | Comparação salário vs projeto | Insatisfeito com salário fixo |

#### Regra dos 20% (Meta):

- Texto não pode ocupar mais de 20% da área da imagem
- Se o criativo tem muito texto → redistribuir em mais linhas menores ou reduzir copy

#### Validação:

- Verificar que background usa tons escuros (#0a0a0a a #1a1a1a)
- Verificar que cor de destaque é verde (aceitar variações: #2ECC71, #00ff88, #39ff14)
- Se o criativo usa cores completamente fora do padrão → alertar (não bloquear)
- Desvios do padrão são aceitos APENAS se o usuário pediu explicitamente outro estilo

**Origem:** feedback_criativos_ads_regras.md — "O padrão com MELHOR CPL (R$3.61) é fundo escuro gradiente + números grandes em verde + texto branco bold."

---

### CHECK 7: UPLOAD MY GROWTH (OBRIGATÓRIO — BLOQUEANTE)

**Severidade:** CRÍTICO
**Ação em falha:** BLOQUEAR entrega até upload completo.

**Regra:** Criativo NÃO existe até estar no MY GROWTH. NUNCA declarar criativo "pronto" sem estar no MY GROWTH.

#### Fluxo obrigatório (sem exceção):

```
1. Gerar imagens (PIL/Pillow)
2. SCP para VPS → /opt/my-growth/public/traffic-creatives/{slug}/
3. INSERT no banco → status = 'pending'
4. Informar ao usuário que estão no MY GROWTH para aprovação
5. ESPERAR aprovação do usuário
6. SOMENTE DEPOIS de aprovado → subir na Meta API / criar campanha
```

#### Detalhes técnicos:

| Parâmetro | Valor |
|-----------|-------|
| VPS | `${VPS_USER}@${VPS_IP}` |
| Senha | `${VPS_PASSWORD}` |
| DB | `${DATABASE_URL_MYGROWTH}` |
| Tabela | `traffic_creatives` |
| Status válidos | `pending`, `approved`, `rejected` (NUNCA outro valor) |
| image_path | `/traffic-creatives/{slug}/{arquivo}.png` (relativo ao public/) |

#### Campos da tabela traffic_creatives:

- `campaign_name` — Nome da campanha
- `piece_name` — Nome da peça
- `format` — Ex: '9:16'
- `variation` — Variação (A, B, C...)
- `image_path` — Path relativo ao public/
- `status` — SEMPRE 'pending' no upload inicial
- `notes` — Observações
- `uploaded_by` — 'claude-code'
- `uploaded_at` — timestamp

#### Comando de upload SCP:

```bash
sshpass -p '${VPS_PASSWORD}' scp -o StrictHostKeyChecking=no \
  {arquivo_local}.png \
  ${VPS_USER}@${VPS_IP}:/opt/my-growth/public/traffic-creatives/{slug}/
```

#### Comando de INSERT no banco:

```bash
sshpass -p '${VPS_PASSWORD}' ssh ${VPS_USER}@${VPS_IP} \
  "${DATABASE_URL_MYGROWTH} psql -U manychat -d manychat_db -h localhost -c \
  \"INSERT INTO traffic_creatives (campaign_name, piece_name, format, variation, image_path, status, notes, uploaded_by, uploaded_at) \
  VALUES ('{campaign}', '{piece}', '9:16', '{var}', '/traffic-creatives/{slug}/{arquivo}.png', 'pending', '{notes}', 'claude-code', NOW());\""
```

#### NUNCA fazer:

- Subir criativos na Meta API ANTES de aprovação no MY GROWTH
- Criar campanhas ANTES de confirmar o destino (LP? DM? Grupo?)
- Usar status diferente de `pending`, `approved`, `rejected`
- Copiar arquivos sem inserir no banco
- Esperar o usuário pedir upload — fazer AUTOMATICAMENTE
- Declarar criativos "prontos" sem estarem no MY GROWTH
- Assumir que destino é LP — PERGUNTAR se não for óbvio

**Origem:** feedback_mygrowth_criativos.md — "O YOUR_NAME precisa aprovar criativos visualmente no MY GROWTH E definir a estratégia de destino ANTES de criar campanhas."

---

## Resumo do Pipeline

| Check | Nome | Severidade | Ação em Falha |
|-------|------|-----------|---------------|
| 1 | Acentuação | CRÍTICO | Corrigir auto → Re-check → Bloquear se falhar |
| 2 | Espaçamento 9:16 | CRÍTICO | Ajustar auto (font/spacing) → Re-check → Bloquear |
| 3 | Foto não recortada | CRÍTICO | BLOQUEAR → Informar opções ao usuário |
| 4 | Variedade visual | ALTO | Alertar → Sugerir alternativa → Exigir justificativa |
| 5 | Formato correto | ALTO | Corrigir auto para 1080x1920 |
| 6 | Padrão visual | MÉDIO | Alertar desvio → Documentar → Não bloqueia |
| 7 | Upload MY GROWTH | CRÍTICO | BLOQUEAR → Upload obrigatório antes de entregar |

## Relatório de Validação

Após executar os 7 checks, gerar relatório inline:

```
CREATIVE VALIDATOR — Resultado
================================
Check 1 (Acentuação):    PASS / FIXED (N correções) / BLOCKED
Check 2 (Espaçamento):   PASS / FIXED (y_final: Npx) / BLOCKED
Check 3 (Foto):          PASS / BLOCKED (motivo)
Check 4 (Variedade):     PASS / ALERTA (detalhe)
Check 5 (Formato):       PASS / FIXED (de NxN para NxN)
Check 6 (Visual):        PASS / ALERTA (desvios)
Check 7 (Upload):        PASS (MY GROWTH ID: N) / BLOCKED
================================
Veredicto: APROVADO / BLOQUEADO (checks N, N)
```

## Integração com Outros Fluxos

- **`/ad-creative`**: Chamar creative-validator ANTES de entregar qualquer peça
- **`/paid-ads`**: Se gerar criativos, passar pelo validator antes de subir na Meta API
- **`/social-content`**: Validar criativos de posts antes de agendar
- **Qualquer agente**: Se produzir imagem para Meta/Instagram → validar

## Regra Final

**Se eu IDENTIFICAR um problema durante a geração, CORRIGIR ANTES de entregar. Não apontar o problema e gerar com o mesmo erro. Fix primeiro, entrega depois.**
