---
name: eduzz-products
description: "Criar produtos na SALES_PLATFORM via Playwright (browser automation) — produto digital, meios de pagamento, URLs de obrigado, auditoria. Use quando precisar cadastrar ou configurar produtos na SALES_PLATFORM."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_fill_form
  - mcp__playwright__browser_type
  - mcp__playwright__browser_press_key
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_select_option
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_tabs
  - mcp__playwright__browser_file_upload
---

# SALES_PLATFORM Products — Skill de Criação de Produtos via Browser Automation

## Propósito

Criar e configurar produtos na plataforma SALES_PLATFORM via Playwright (automação de navegador). Cadastra produto digital, configura meios de pagamento, define URLs de obrigado e audita a configuração final.

**Input:** Dados do produto (nome, valor, descrição, imagem, URL obrigado)
**Output:** Produto criado e configurado na SALES_PLATFORM, pronto para venda

---

## Parâmetros Obrigatórios

O usuário DEVE fornecer:

| Parâmetro | Exemplo | Obrigatório |
|-----------|---------|-------------|
| Nome do produto | "Mentoria Premium 3 Meses" | Sim |
| Valor (R$) | `497.00` | Sim |
| Descrição curta | "Acesso por 3 meses à mentoria" | Sim |
| Tipo de entrega | "Área de membros" / "Conteúdo customizado" | Sim |
| URL página de obrigado | `https://site.com/obrigado-vip` | Sim |
| Imagem do produto | Caminho do arquivo (1080x1080 ou 600x600) | Não |
| Parcelamento máximo | `12` | Não (default: 12) |
| Boleto habilitado | `false` | Não (default: desabilitado) |

### Parâmetros com Defaults

| Parâmetro | Default | Notas |
|-----------|---------|-------|
| Categoria | "Negócios e Carreira" | Ajustar conforme nicho |
| Moeda | BRL | Só alterar se internacional |
| Tipo de produto | Digital | Quase sempre digital |
| Garantia | 7 dias | Padrão CDC |
| Boleto | Desabilitado | Evita inadimplência |
| Pix | Habilitado | Melhor conversão |
| Cartão | Habilitado | Padrão |

---

## Pré-requisitos

1. **Playwright MCP instalado e funcionando**
2. **Sessão do SALES_PLATFORM autenticada** — o usuário deve estar logado em `orbita.eduzz.com` no navegador
3. **Verificar login** antes de iniciar o processo

### Verificar Sessão

```
1. Navegar para https://orbita.eduzz.com
2. Tirar snapshot
3. Se pedir login → instruir o usuário a logar manualmente
4. Se mostrar dashboard → prosseguir
```

---

## PASSO 1 — Navegar até Criação de Produto

### Fluxo de Navegação

```
1. Acessar https://orbita.eduzz.com
2. Verificar se está logado (snapshot)
3. Clicar em "Produtos" no menu lateral
4. Clicar em "Criar Produto" ou "Novo Produto"
5. Selecionar tipo "Produto Digital"
```

### Ações Playwright

```
browser_navigate → https://orbita.eduzz.com
browser_snapshot → verificar estado
browser_click → menu "Produtos"
browser_snapshot → verificar lista de produtos
browser_click → botão "Criar Produto" / "Novo Produto"
browser_snapshot → verificar formulário
```

---

## PASSO 2 — Preencher Dados Básicos

### Campos a Preencher

| Campo | Ação | Conteúdo |
|-------|------|----------|
| Nome do produto | `browser_fill_form` ou `browser_type` | Nome informado pelo usuário |
| Descrição | `browser_fill_form` ou `browser_type` | Descrição informada |
| Valor do produto | `browser_fill_form` | Em reais (ex: 497.00) |
| Categoria | `browser_select_option` ou `browser_click` | Selecionar categoria |
| Tipo de entrega | `browser_select_option` | "Entrega Customizada" ou "Área de Membros" |
| Imagem | `browser_file_upload` | Caminho da imagem do produto |

### Regras de Preenchimento

1. **Limpar campo antes de digitar** — selecionar tudo (Ctrl+A) e depois digitar
2. **Aguardar carregamento** entre ações — `browser_wait_for` ou snapshot
3. **Verificar feedback visual** após cada preenchimento — snapshot
4. **Valor sem R$** — digitar apenas o número (ex: `497.00`)
5. **Imagem:** Formatos aceitos: JPG, PNG. Tamanho recomendado: 600x600 ou 1080x1080

### Fluxo Playwright

```
browser_snapshot → identificar campos do formulário
browser_fill_form → preencher nome, descrição, valor
browser_select_option → categoria
browser_select_option → tipo de entrega
browser_file_upload → imagem (se fornecida)
browser_snapshot → verificar preenchimento
browser_click → "Salvar" / "Próximo" / "Criar"
browser_snapshot → confirmar criação
```

---

## PASSO 3 — Configurar Meios de Pagamento

Após criar o produto, navegar para a aba de configuração de pagamento.

### Navegação

```
1. Acessar configurações do produto recém-criado
2. Encontrar aba "Pagamento" / "Checkout" / "Meios de Pagamento"
3. Snapshot para ver estado atual
```

### Configurações de Pagamento

| Meio | Ação | Status Desejado |
|------|------|----------------|
| Cartão de crédito | Manter habilitado | Habilitado |
| Pix | Habilitar (se não estiver) | Habilitado |
| Boleto | **Desabilitar** | **Desabilitado** |
| Parcelamento máximo | Configurar | 12x |

### Por que Desabilitar Boleto

- Alta taxa de inadimplência (60-80% não pagam)
- Infla números de "vendas" com boletos não compensados
- Pix é melhor alternativa (compensação imediata)

### Fluxo Playwright

```
browser_click → aba "Pagamento" / "Checkout"
browser_snapshot → ver configurações atuais
browser_click → toggle/checkbox do boleto (desabilitar)
browser_snapshot → confirmar que boleto está OFF
browser_click → configuração de parcelamento
browser_select_option → "12x" ou campo numérico
browser_click → "Salvar"
browser_snapshot → confirmar salvamento
```

---

## PASSO 4 — Configurar URL de Obrigado (Aba Avançado)

### Navegação

```
1. Acessar aba "Avançado" / "Configurações Avançadas" do produto
2. Encontrar campo "URL de Obrigado" / "Página de Obrigado" / "Thank You Page"
3. Preencher com a URL fornecida
```

### Regras

1. **URL DEVE ser HTTPS** — verificar que começa com `https://`
2. **URL DEVE estar acessível** — página já deployada antes de configurar
3. **Testar a URL** — acessar para confirmar que carrega
4. **UTMs na URL de obrigado** — a SALES_PLATFORM pode passar parâmetros automáticos

### URL com Parâmetros SALES_PLATFORM

A SALES_PLATFORM permite passar dados dinâmicos na URL de obrigado:

```
https://site.com/obrigado-vip?email={email}&name={name}&transaction={transaction_id}
```

### Fluxo Playwright

```
browser_click → aba "Avançado" / "Configurações Avançadas"
browser_snapshot → encontrar campo de URL de obrigado
browser_fill_form → URL de obrigado (HTTPS)
browser_click → "Salvar"
browser_snapshot → confirmar salvamento
```

---

## PASSO 5 — Configurações Adicionais (Se Aplicável)

### Garantia

```
browser_click → configuração de garantia
browser_fill_form → "7" (dias)
browser_click → salvar
```

### Afiliados (Opcional)

Se o produto terá programa de afiliados:

| Configuração | Sugestão |
|-------------|----------|
| Permitir afiliados | Sim/Não (conforme usuário) |
| Comissão | 30-50% |
| Cookie | 180 dias |

### Bump/Order Bump (Opcional)

Se existe produto complementar para oferecer no checkout.

---

## PASSO 6 — Auditoria Pós-Criação

### Checklist de Verificação (10 itens)

Após todas as configurações, verificar cada item:

```
browser_navigate → página do produto na SALES_PLATFORM
browser_snapshot → capturar estado final
```

| # | Item | Verificação | Como |
|---|------|-------------|------|
| 1 | Nome do produto correto | Exato ao informado | Snapshot da página do produto |
| 2 | Valor correto | Em R$ | Snapshot mostrando o valor |
| 3 | Descrição preenchida | Texto completo | Snapshot da descrição |
| 4 | Categoria definida | Categoria selecionada | Snapshot das configurações |
| 5 | Imagem do produto | Imagem carregada | Snapshot visual |
| 6 | Boleto DESABILITADO | Toggle/checkbox OFF | Snapshot da aba pagamento |
| 7 | Pix habilitado | Toggle/checkbox ON | Snapshot da aba pagamento |
| 8 | Cartão habilitado | Toggle/checkbox ON | Snapshot da aba pagamento |
| 9 | URL obrigado configurada | HTTPS, acessível | Snapshot da aba avançado |
| 10 | Parcelamento configurado | Até 12x | Snapshot da aba pagamento |

### Teste do Checkout

```
1. Copiar link do checkout do produto
2. Abrir em nova aba
3. Snapshot → verificar que aparece corretamente
4. Verificar que boleto NÃO aparece como opção
5. Verificar valor e parcelamento
```

### Fluxo Playwright

```
browser_snapshot → capturar página final do produto
browser_click → "Copiar link do checkout" ou copiar URL
browser_navigate → URL do checkout (nova aba)
browser_snapshot → verificar checkout
```

---

## Tratamento de Erros

### Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| Sessão expirada | Timeout do SALES_PLATFORM | Pedir ao usuário para relogar |
| Campo não encontrado | Interface mudou | Fazer snapshot, adaptar seletores |
| Upload de imagem falha | Formato/tamanho errado | Converter para JPG/PNG, redimensionar |
| Botão não clicável | Elemento sobreposto | Scroll até o elemento, aguardar |
| Página não carrega | Conexão lenta | `browser_wait_for` com timeout maior |

### Estratégia de Recuperação

```
1. Snapshot para diagnosticar o estado atual
2. Se sessão expirada → instruir usuário a relogar
3. Se elemento não encontrado → tentar seletores alternativos
4. Se erro persistir → screenshot + reportar ao usuário
5. NUNCA prosseguir sem confirmar que a etapa anterior foi concluída
```

---

## Produtos Múltiplos

Se precisar criar vários produtos (ex: ingresso Padrão + VIP):

### Fluxo

```
1. Criar Produto 1 (Padrão)
   - Menor investimento
   - URL obrigado padrão
   - Auditar

2. Criar Produto 2 (VIP/Premium)
   - Maior investimento
   - URL obrigado VIP (com grupo exclusivo)
   - Auditar

3. Verificar ambos os checkouts
4. Testar URLs de obrigado de ambos
```

---

## Resultado Final

Ao concluir, apresentar resumo:

```
PRODUTO(S) CRIADO(S) NA EDUZZ

Produto: NOME_DO_PRODUTO
   - ID SALES_PLATFORM: XXXXX
   - Investimento: R$XXX,XX (até 12x de R$XX,XX)
   - Checkout: https://sun.eduzz.com/XXXXX

Pagamento:
   - Cartão: Habilitado (até 12x)
   - Pix: Habilitado
   - Boleto: DESABILITADO

URL de Obrigado: https://site.com/obrigado-vip
Imagem: Configurada

Auditoria: 10/10 itens OK

Próximos passos:
   1. Testar compra real (modo sandbox ou R$1)
   2. Verificar se webhook de compra chega no CRM
   3. Configurar link do checkout nas LPs e anúncios
   4. Integrar com pixel Meta (Purchase event na URL de obrigado)
```
