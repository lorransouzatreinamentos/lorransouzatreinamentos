---
name: flutter-app
description: "Guia mestre para transformar uma ideia conceitual em app nativo Flutter — da análise de requisitos ao código compilável, usando orquestração de agentes IA."
---

# Guia Mestre: Da Ideia Conceitual a App Nativo Flutter

## 1. Ficha Técnica do Projeto

| Elemento | Descrição |
|----------|-----------|
| **Nome do Projeto** | Orquestração Mobile: E-Commerce para Flutter |
| **Stack Tecnológico** | Antigravity, Stitch, Firecrawl, Dart/Flutter |
| **Objetivo Principal** | Transformar sua ideia em um aplicativo móvel |
| **Requisito Único** | Antigravity instalado |

## 2. Arquitetura (O Cérebro Digital)

Este projeto se integra ao ecossistema geral replicando o ciclo de trabalho de uma equipe completa de desenvolvimento dentro de uma única estação de trabalho. A partir de uma ideia abstrata ou conceitual, utilizamos múltiplos "Cérebros" conectados em sequência para executar a visão:

- **Gestão de Produto e Análise (Agente IA):** Atua como o Product Manager (PM) do projeto. Sua função é interpretar a ideia original, estruturar os requisitos, definir as histórias de usuário e traçar o mapa de navegação lógico antes de tocar um único pixel de design.
- **Direção Criativa e UX/UI (Stitch MCP):** Funciona como seu Lead Designer pessoal. Recebe os requisitos estruturados pelo PM e propõe a identidade da marca do zero (paleta de cores, tipografia, estética) para depois montar toda a interface mobile sem depender de URLs ou referências externas.
- **Engenharia Ágil (Antigravity + Skills Locais):** Executa a construção do software. Injeta padrões profissionais instantaneamente invocando a skill flutter-architecture e conecta o design estratégico com a escrita de código nativo limpo, modular e escalável (usando Riverpod para gerenciamento de estado).

## 3. Configuração Técnica (Orquestração)

### A. Configuração dos Servidores MCP (`mcp_config.json`)

Atualize o objeto `"mcpServers"` com:

```json
{
  "stitch": {
    "command": "npx",
    "args": ["-y", "stitch-mcp-auto@latest"]
  },
  "dart-mcp-server": {
    "command": "dart",
    "args": ["mcp-server"]
  }
}
```

Depois execute:

```bash
dart pub global activate dart_mcp_server
```

### B. Instalação de Skills

```bash
npx skills add https://github.com/jeffallan/claude-skills --skill flutter-expert
npx skills add https://github.com/madteacher/mad-agents-skills --skill flutter-animations
npx skills add https://github.com/davila7/claude-code-templates --skill mobile-design
npx claude-code-templates@latest --skill=creative-design/frontend-design --yes
npx claude-code-templates@latest --skill=development/senior-frontend --yes
npx claude-code-templates@latest --agent=development-team/mobile-app-developer --yes
npx skills add https://github.com/wshobson/agents --skill mobile-android-design
npx skills add https://github.com/wshobson/agents --skill mobile-ios-design
npx skills add google-labs-code/stitch-skills --list
```

---

## PASSO 0: Auditoria do Ambiente

Antes de analisar a ideia, você deve garantir que o computador do usuário esteja pronto para compilar aplicações móveis.

Execute comandos de leitura no terminal para verificar a existência das seguintes 3 ferramentas vitais:

1. Flutter SDK: Execute `flutter --version`
2. JDK 17 (Java): Execute `java -version` (Certifique-se de que a versão detectada seja a 17).
3. Android SDK: Execute `flutter doctor` para verificar o status das ferramentas Android.

Se faltar alguma ferramenta (Instalação Proativa): NÃO pare. Seu objetivo é resolver de forma autônoma:

1. Identifique o sistema operacional (Windows, macOS ou Linux).
2. Instale usando gerenciadores nativos (`winget` ou `choco` para Windows, `brew` para macOS, `apt` para Linux).
3. Para o Android SDK, aceite automaticamente as licenças com: `yes | flutter doctor --android-licenses`
4. Revalide a instalação executando novamente os comandos de verificação.

Se exigir permissões admin ou falhar: explique amigavelmente ao usuário e forneça o comando exato.

Se tudo estiver correto: confirme com entusiasmo e avance automaticamente ao Passo 1.

---

## 4. Fluxo de Trabalho

1. Estruturação Visual (UX/UI)
2. Desenvolvimento em Flutter usando flutter-architecture

---

## 5. Documentação

- Skill: https://skills.sh/
- Flutter: https://flutter.dev/
