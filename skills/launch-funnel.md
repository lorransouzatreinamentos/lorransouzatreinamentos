---
name: launch-funnel
description: "Criar funil completo de lançamento — da LP ao checkout, com páginas de obrigado, upsell, pixel, webhooks e deploy. Use quando precisar montar um funil de captação ou vendas do zero."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - WebFetch
---

# Launch Funnel — Skill de Criação de Funil Completo

## Propósito

Criar funil de lançamento completo e pronto para deploy — da landing page ao checkout, com todas as integrações (pixel, webhooks, UTMs). Processo end-to-end que elimina etapas manuais e garante rastreamento completo.

**Input:** Briefing do produto/evento + assets (logo, fotos, cores)
**Output:** Funil completo deployado e auditado

---

## Parâmetros Obrigatórios

O usuário DEVE fornecer:

| Parâmetro | Exemplo | Obrigatório |
|-----------|---------|-------------|
| Nome do produto/evento | "Desafio 5 Dias de IA" | Sim |
| Proposta de valor principal | "Aprenda a usar IA para faturar" | Sim |
| Público-alvo | "Empreendedores 25-55 anos" | Sim |
| Domínio de deploy | "desafio.meusite.com.br" | Sim |
| Pixel ID Meta | "${PIXEL_ID}" | Sim |
| URL do webhook (CRM) | "https://api.meucrm.com/leads" | Sim |
| Valor do produto (se venda) | "R$497 ou 12x R$49,70" | Se tiver checkout |
| Cor primária da marca | "#00FF88" | Não (default: verde neon) |
| Logo/fotos | Caminhos dos arquivos | Não |

---

## PASSO 1 — Definir Ângulos de Copy

Criar 3 ângulos de abordagem para a LP, cada um atacando uma dor/desejo diferente do público.

### Framework de Ângulos

| Ângulo | Foco | Exemplo |
|--------|------|---------|
| **Transformação** | Resultado final desejado | "De zero a R$10K/mês com IA" |
| **Dor/Problema** | Frustração atual do público | "Cansado de trabalhar 12h e não ver resultado?" |
| **Oportunidade** | Janela que está se fechando | "O mercado de IA vai triplicar em 2026" |

### Regras de Copy

1. **Headline:** Máximo 12 palavras, benefício claro
2. **Subheadline:** Complementa a headline com especificidade
3. **CTA principal:** Verbo de ação + benefício ("Quero Minha Vaga Gratuita")
4. **Prova social:** Números reais, depoimentos, logos
5. **Urgência:** Escassez real (vagas limitadas, data de encerramento)
6. **SEMPRE com acentuação correta** — ã, é, ç, ô, í, ú

---

## PASSO 2 — Criar Landing Page

### Estrutura Obrigatória da LP

```
1. HERO — Headline + Subheadline + CTA + Vídeo/Imagem
2. PROBLEMA — 3 dores do público-alvo
3. SOLUÇÃO — O que o produto/evento resolve
4. CONTEÚDO — O que vai aprender (bullets ou módulos)
5. AUTORIDADE — Quem é o expert + provas
6. PROVA SOCIAL — Depoimentos/resultados
7. FAQ — 5-8 perguntas frequentes
8. CTA FINAL — Último bloco com urgência
```

### Regras de Design

1. **Estilo dark/premium** — fundo escuro (#0a0a0a a #1a1a1a), texto branco, accent color neon
2. **Mobile-first** — 80%+ do tráfego vem do celular
3. **CTAs em TODOS os blocos** — mínimo 4 botões de CTA na página
4. **CTAs contextuais** — cada CTA com texto diferente relacionado ao bloco
5. **Formulário em popup** — NÃO inline (melhor conversão)
6. **Campos do formulário:** Nome + WhatsApp (mínimo viável)
7. **Imagens otimizadas:** WebP, max 200KB cada
8. **Fontes:** Google Fonts (Inter, Montserrat, ou similar)
9. **Animações sutis:** fade-in no scroll, hover nos botões

### Formulário Popup

```html
<!-- Estrutura do popup -->
<div id="modal-form" class="modal hidden">
  <div class="modal-content">
    <button class="close-btn">&times;</button>
    <h2>Garanta Sua Vaga</h2>
    <form id="lead-form" action="WEBHOOK_URL" method="POST">
      <input type="text" name="name" placeholder="Seu nome" required>
      <input type="tel" name="phone" placeholder="Seu WhatsApp" required>
      <input type="hidden" name="utm_source" id="utm_source">
      <input type="hidden" name="utm_medium" id="utm_medium">
      <input type="hidden" name="utm_campaign" id="utm_campaign">
      <input type="hidden" name="utm_content" id="utm_content">
      <input type="hidden" name="utm_term" id="utm_term">
      <button type="submit">QUERO PARTICIPAR</button>
    </form>
  </div>
</div>
```

### Captura de UTMs

```javascript
// Capturar UTMs da URL e preencher campos hidden
const params = new URLSearchParams(window.location.search);
['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(p => {
  const el = document.getElementById(p);
  if (el) el.value = params.get(p) || '';
});
```

---

## PASSO 3 — Criar Versões da LP

Gerar 3 versões da LP (uma por ângulo):

| Versão | Path | Ângulo |
|--------|------|--------|
| Original | `/` ou `/v1` | Transformação |
| Variação A | `/v2` | Dor/Problema |
| Variação B | `/v3` | Oportunidade |

**Diferenças entre versões:**
- Hero (headline, subheadline, imagem)
- CTA texts
- Bloco de problema (ênfase diferente)
- Restante da página pode ser igual

---

## PASSO 4 — Página de Obrigado (Lead)

### Estrutura

```
1. CONFIRMAÇÃO — "Inscrição Confirmada!"
2. PRÓXIMOS PASSOS — O que fazer agora (entrar no grupo, salvar data)
3. UPSELL (opcional) — Oferta especial de upgrade
4. GRUPO — Botão para WhatsApp/Telegram
```

### Pixel — Evento Lead

```html
<script>
  fbq('track', 'Lead', {
    content_name: 'NOME_DO_PRODUTO',
    content_category: 'CATEGORIA'
  });
</script>
```

---

## PASSO 5 — Página de Upsell (Opcional)

Se o funil tem oferta paga (VIP, premium, etc):

### Estrutura

```
1. PARABÉNS — Reforça a decisão de se inscrever
2. OFERTA EXCLUSIVA — Upgrade disponível só agora
3. BENEFÍCIOS VIP — O que ganha a mais
4. INVESTIMENTO — Âncora + valor real + parcelamento
5. GARANTIA — 7 dias incondicional
6. CTA — Link para checkout (SALES_PLATFORM, Hotmart, etc.)
7. RECUSAR — Link pequeno "Não, obrigado, quero apenas o gratuito"
```

### Pixel — Evento ViewContent (Upsell)

```html
<script>
  fbq('track', 'ViewContent', {
    content_name: 'UPSELL_NOME',
    content_type: 'product',
    value: VALOR_NUMERICO,
    currency: 'BRL'
  });
</script>
```

---

## PASSO 6 — Página de Obrigado VIP

Se o upsell foi aceito:

### Estrutura

```
1. CONFIRMAÇÃO VIP — "Bem-vindo ao VIP!"
2. ACESSO — Link do grupo VIP
3. BÔNUS — Lista de bônus exclusivos
4. SUPORTE — Canal de contato
```

### Pixel — Evento Purchase

```html
<script>
  fbq('track', 'Purchase', {
    content_name: 'PRODUTO_VIP',
    content_type: 'product',
    value: VALOR_NUMERICO,
    currency: 'BRL'
  });
</script>
```

---

## PASSO 7 — Pixel Meta (Todas as Páginas)

### Base Pixel (TODAS as páginas)

```html
<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=PIXEL_ID&ev=PageView&noscript=1"/></noscript>
```

### Mapa de Eventos

| Página | Evento | Quando |
|--------|--------|--------|
| LP (todas versões) | PageView | Carregamento |
| LP (popup aberto) | ViewContent | Abrir popup do form |
| Obrigado Lead | Lead | Carregamento |
| Upsell | ViewContent | Carregamento |
| Obrigado VIP | Purchase | Carregamento |
| Checkout externo | InitiateCheckout | Clique no botão |

---

## PASSO 8 — Webhooks

### Envio de Lead para CRM

```javascript
document.getElementById('lead-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch('WEBHOOK_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        source: 'landing-page',
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        utm_content: data.utm_content,
        utm_term: data.utm_term,
        created_at: new Date().toISOString()
      })
    });

    if (response.ok) {
      fbq('track', 'Lead', { content_name: 'PRODUTO' });
      window.location.href = '/obrigado';
    }
  } catch (error) {
    console.error('Erro ao enviar lead:', error);
    window.location.href = '/obrigado';
  }
});
```

---

## PASSO 9 — UTMs em Todos os Links

### Padrão de UTMs

| Parâmetro | Valor |
|-----------|-------|
| utm_source | facebook, instagram, google, organico |
| utm_medium | cpc, cpm, social, email, whatsapp |
| utm_campaign | nome-da-campanha (slug) |
| utm_content | nome-do-criativo (slug) |
| utm_term | segmentacao ou palavra-chave |

### Links Internos (botões de CTA na LP)

Todos os links internos devem preservar UTMs da URL original:

```javascript
// Propagar UTMs para links internos
document.querySelectorAll('a[href*="obrigado"], a[href*="checkout"]').forEach(link => {
  const currentParams = new URLSearchParams(window.location.search);
  const url = new URL(link.href, window.location.origin);
  currentParams.forEach((value, key) => {
    if (key.startsWith('utm_')) url.searchParams.set(key, value);
  });
  link.href = url.toString();
});
```

---

## PASSO 10 — Auditoria Pré-Deploy

### Checklist Obrigatório (18 itens)

| # | Item | Verificação |
|---|------|-------------|
| 1 | Pixel Meta presente em TODAS as páginas | Buscar `fbq('init'` em todos os HTML |
| 2 | Pixel ID correto (não placeholder) | Confirmar com o usuário |
| 3 | Evento Lead na página obrigado | Buscar `track.*Lead` em obrigado.html |
| 4 | Evento Purchase na página VIP | Buscar `track.*Purchase` em obrigado-vip.html |
| 5 | Formulário envia para webhook correto | Verificar URL do fetch |
| 6 | Campos UTM hidden no formulário | 5 campos utm_* |
| 7 | Captura de UTMs da URL funcionando | Script de captura presente |
| 8 | Propagação de UTMs nos links internos | Script de propagação presente |
| 9 | Mobile responsivo | Testar em viewport 375px |
| 10 | Imagens otimizadas (WebP, <200KB) | Verificar tamanho dos arquivos |
| 11 | Meta tags OG (título, descrição, imagem) | Buscar `og:` nos HTML |
| 12 | Favicon presente | Buscar `favicon` nos HTML |
| 13 | HTTPS nos links externos | Nenhum `http://` |
| 14 | Botões de CTA visíveis sem scroll (mobile) | Verificar hero |
| 15 | Formulário valida campos obrigatórios | `required` nos inputs |
| 16 | Página obrigado NÃO é indexável | `<meta name="robots" content="noindex">` |
| 17 | Links de grupo/WhatsApp funcionando | Testar URLs |
| 18 | Todas as 3 versões da LP funcionando | Acessar /v1, /v2, /v3 |

---

## PASSO 11 — Deploy

### Deploy Hostinger (SCP)

```bash
# Estrutura de diretórios
# /public_html/subdominio/
#   ├── index.html          (LP v1)
#   ├── v2/index.html       (LP v2)
#   ├── v3/index.html       (LP v3)
#   ├── obrigado/index.html (Obrigado Lead)
#   ├── upsell/index.html   (Upsell)
#   ├── obrigado-vip/index.html (Obrigado VIP)
#   ├── assets/             (CSS, JS, imagens)
#   └── favicon.ico

# Upload via SCP
scp -P PORTA -r ./dist/* usuario@IP:/public_html/subdominio/
```

### Deploy VPS (alternativo)

```bash
# Copiar arquivos para diretório do nginx
scp -r ./dist/* root@IP:/var/www/subdominio/

# Verificar nginx config
ssh root@IP "nginx -t && systemctl reload nginx"
```

---

## PASSO 12 — Validação Pós-Deploy

| # | Verificação | Ação |
|---|-------------|------|
| 1 | LP carrega corretamente | Acessar URL no browser |
| 2 | SSL/HTTPS ativo | Verificar cadeado |
| 3 | Popup do formulário abre | Clicar no CTA |
| 4 | Lead chega no CRM | Testar submissão |
| 5 | Pixel disparando | Meta Pixel Helper (extensão Chrome) |
| 6 | Página obrigado redireciona | Após submissão do form |
| 7 | UTMs chegam no CRM | Verificar dados do lead teste |
| 8 | Todas as versões acessíveis | /v1, /v2, /v3 |

---

## Resultado Final

Ao concluir, apresentar resumo:

```
FUNIL CRIADO E DEPLOYADO

Landing Pages:
   - LP v1 (Transformação): https://dominio.com/
   - LP v2 (Dor): https://dominio.com/v2
   - LP v3 (Oportunidade): https://dominio.com/v3

Páginas de Obrigado:
   - Lead: https://dominio.com/obrigado
   - Upsell: https://dominio.com/upsell
   - VIP: https://dominio.com/obrigado-vip

Pixel Meta: PIXEL_ID — Eventos: PageView, Lead, ViewContent, Purchase
Webhook: WEBHOOK_URL
UTMs: Configuradas em todos os links

Próximos passos:
   1. Testar pixel com Meta Pixel Helper
   2. Criar campanhas Meta Ads apontando para as LPs
   3. Configurar automação de WhatsApp no CRM
```
