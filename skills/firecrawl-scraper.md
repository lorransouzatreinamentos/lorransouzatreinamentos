---
name: firecrawl-scraper
description: "Extrai dados de qualquer site usando Firecrawl MCP — scraping, mapeamento, crawling, screenshots e análise de branding. Use para web scraping estruturado com IA."
---

# Extraia Dados de Qualquer Site com Claude Code + Firecrawl

Este guia mostra como usar o servidor MCP do Firecrawl dentro do Claude Code para transformar qualquer site em dados prontos para LLM, incluindo conteúdo estruturado, capturas de tela, branding e mapas completos do site — tudo por meio de comandos em linguagem natural.

---

## I. O que é o Firecrawl?

O Firecrawl é uma ferramenta de web scraping que transforma sites em dados limpos e estruturados que você pode usar com IA.

### O que o Firecrawl pode fazer:

- **Scrape (Raspar):** Extrair todo o conteúdo de uma única página (texto, imagens, metadados).
- **Map (Mapear):** Descobrir todas as URLs e entender a arquitetura completa de um site.
- **Crawl (Rastrear):** Explorar e extrair dados de múltiplas páginas.
- **Search (Pesquisar):** Fazer uma busca na web primeiro e depois extrair dados das páginas encontradas.
- **Extract (Extrair):** Puxar campos estruturados (ex.: cargos, preços, descrições).

### Formatos de saída incluem:

- Markdown
- Resumos gerados por IA
- Links
- HTML
- Capturas de tela da página inteira
- Informações de branding (logo, cores, tipografia)
- JSON bruto

---

## II. Configurando o MCP do Firecrawl no Claude Code

### Passo 1: Abra um Novo Projeto no VS Code

Crie ou abra uma pasta vazia. O lado esquerdo deve estar vazio e o Claude Code aberto à direita.

### Passo 2: Pegue o Comando de Instalação do MCP

Vá até a documentação do Firecrawl e encontre a seção do MCP Server. Copie o comando de instalação do Claude Code.

### Passo 3: Conecte ao Servidor MCP

Diga ao Claude Code:

> "Hey Claude, quero conectar ao servidor MCP do Firecrawl usando este comando. Não vou te passar minha API key aqui; vou colocá-la em um arquivo .env. Então crie esse arquivo para mim, eu coloco minha API key nele e depois você inicializa e conecta ao servidor."

### Passo 4: Adicione sua API Key

1. Abra o arquivo `.env`.
2. Copie sua API key no dashboard do Firecrawl.
3. Cole no `.env` e salve (Ctrl + S).
4. Feche o arquivo.

**Por que usar .env?**
Mantém sua chave segura e fora do histórico da conversa.

### Passo 5: Recarregue o VS Code

Pressione `Ctrl + Shift + P` → "Developer: Reload Window".

### Passo 6: Teste

Envie uma requisição simples para confirmar que está funcionando.

---

## III. Criando um Cheat Sheet do Firecrawl

Peça ao Claude Code:

> "Crie um cheat sheet do Firecrawl em markdown neste projeto explicando as ferramentas e como usá-las."

Isso gera um arquivo (ex.: `firecrawl-cheatsheet.md`) com:

- Visão geral das ferramentas
- Instruções de uso
- Guia de decisão

---

## IV. Caso de Uso: Extraindo 1.700+ Vagas de Emprego

### Cenário

Um site remoto possui ~1.700 vagas em 60+ páginas.
Objetivo: Extrair dados estruturados para jogar em uma planilha Google.

### Prompt

> "Tenho cerca de 1.700 vagas neste site. Quero usar o MCP do Firecrawl para extrair todas como dados estruturados para colocar em um Google Sheet."

### O que aconteceu:

1. Claude fez scrape inicial para entender estrutura.
2. Mapeou o site para encontrar paginações.
3. Criou plano e fez perguntas:
   - Quantas vagas? (200 para teste)
   - Quais campos? (Todos)
   - Descrição completa ou resumo? (Resumo)
4. Quando a primeira tentativa falhou, ele se auto-corrigiu usando o agente Firecrawl.

### Resultado:

Arquivo CSV com 200 vagas contendo:

- Título
- Empresa
- Tipo de vaga
- Localização
- Salário
- Nível de experiência
- Categoria
- Data
- URL
- Resumo
- Tags

---

## V. Caso de Uso: Screenshots & Análise de Branding

### Prompt

> "Pegue screenshots desta página e me ajude a entender o branding."

### Resultado:

- Screenshot da página inteira
- Paleta de cores
- Tipografia
- Espaçamento
- Componentes
- Logo

Útil para análise competitiva ou briefing de design.

---

## VI. Caso de Uso: Mapeamento Completo do Site

### Prompt

> "Mapeie este site para mim."

### Resultado:

Mapa completo contendo:

- Páginas principais
- Categorias
- Produtos
- Guias
- Localizações
- etc.

Depois você pode fazer crawl específico ou extrair dados para banco.

---

## VII. Preços e Créditos

Os três casos usaram cerca de **30 créditos** dos **500 gratuitos** (6%).

### Comparação de planos:

| Recurso | Free | Hobby | Tiers superiores |
|---------|------|-------|------------------|
| Créditos | 500 | Mais | Escalável |
| Páginas | Limitado | Mais | Escalável |
| Requisições simultâneas | 2 | 5 | Mais |

No plano free, requisições entram em fila.

---

## VIII. Referência Rápida de Setup

| Passo | O que fazer |
|-------|-------------|
| 1 | Criar pasta no VS Code |
| 2 | Instalar MCP |
| 3 | Adicionar API key no .env |
| 4 | Recarregar VS Code |
| 5 | Criar cheat sheet |
| 6 | Criar CLAUDE.md |
| 7 | Começar a extrair dados |
