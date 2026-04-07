---
name: channels
description: "Gerencia Claude Code Channels — setup, pareamento, troubleshoot, status de canais Telegram/Discord. Use quando o usuário quer configurar, verificar ou resolver problemas com Channels."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Channels — Gerenciamento de Claude Code Channels

Gerencia canais de comunicação externa (Telegram, Discord) que conectam sessões Claude Code ao mundo real.

## Comandos

Ao invocar `/channels`, pergunte qual operação:

### `status` — Verificar estado atual

1. Verificar versão do Claude Code (`claude --version`, requer >= 2.1.81)
2. Listar plugins instalados (`claude plugin list`)
3. Checar se Bun está instalado (`~/.bun/bin/bun --version`)
4. Verificar token configurado (`~/.claude/channels/telegram/.env`)
5. Reportar estado de cada canal

### `setup telegram` — Configurar canal Telegram

Fluxo completo:

```
1. Verificar pré-requisitos (Bun, versão Claude Code)
2. Se Bun ausente → instalar: curl -fsSL https://bun.sh/install | bash
3. Instalar plugin: claude plugin install telegram@claude-plugins-official
4. Solicitar Bot Token do @BotFather
5. Salvar token em ~/.claude/channels/telegram/.env
6. Instruir: claude --channels plugin:telegram@claude-plugins-official
7. Guiar pareamento: DM ao bot → código → /telegram:access pair <code>
8. Travar: /telegram:access policy allowlist
```

### `setup discord` — Configurar canal Discord

Fluxo completo:

```
1. Verificar pré-requisitos (Bun, versão Claude Code)
2. Se Bun ausente → instalar
3. Instalar plugin: claude plugin install discord@claude-plugins-official
4. Solicitar Bot Token do Discord Developer Portal
5. Instruir: habilitar "Message Content Intent"
6. Convidar bot para servidor Discord
7. Salvar token em ~/.claude/channels/discord/.env
8. Instruir: claude --channels plugin:discord@claude-plugins-official
9. Guiar pareamento via DM
10. Travar acesso
```

### `troubleshoot` — Diagnosticar problemas

Checklist de diagnóstico:

| Sintoma | Causa Provável | Solução |
|---------|---------------|---------|
| Bot não responde | Sessão sem `--channels` | Relançar com flag |
| Bot não responde | Terminal fechado | Abrir sessão + tmux |
| Pairing code não aparece | Token inválido | Verificar `.env` |
| Mensagem ignorada | Fora da allowlist | `/telegram:access policy pairing` → re-parear |
| "Bun not found" | Bun não no PATH | `export PATH="$HOME/.bun/bin:$PATH"` |
| Plugin não listado | Não instalado | `claude plugin install telegram@claude-plugins-official` |

### `always-on` — Configurar persistência

Para manter o canal ativo 24/7:

```bash
# Opção 1: tmux local
tmux new -s channels
claude --channels plugin:telegram@claude-plugins-official
# Ctrl+B D para detach

# Opção 2: tmux na VPS (para monitoramento remoto)
ssh ${VPS_USER}@${VPS_IP}
tmux new -s channels
claude --channels plugin:telegram@claude-plugins-official
# Ctrl+B D para detach
```

### `multi` — Múltiplos canais simultâneos

```bash
claude --channels plugin:telegram@claude-plugins-official,plugin:discord@claude-plugins-official
```

## Referência Rápida

| Recurso | Localização |
|---------|-------------|
| Token Telegram | `~/.claude/channels/telegram/.env` |
| Token Discord | `~/.claude/channels/discord/.env` |
| Plugin cache | `~/.claude/plugins/cache/claude-plugins-official/` |
| Fotos recebidas | `~/.claude/channels/telegram/inbox/` |
| Docs oficiais | `https://code.claude.com/docs/en/channels` |

## Tools Disponíveis nos Canais

| Tool | Telegram | Discord | Uso |
|------|----------|---------|-----|
| `reply` | Sim | Sim | Enviar mensagem + arquivos |
| `react` | Sim | Sim | Reação emoji |
| `edit_message` | Sim | Sim | Editar mensagem enviada |
| `fetch_messages` | Não | Sim | Buscar histórico |
| `download_attachment` | Não | Sim | Baixar anexo |
