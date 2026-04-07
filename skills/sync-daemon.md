---
name: sync-daemon
description: Sincroniza contexto do framework Segunda-feira com o daemon na VPS. Gera framework-context.md e envia. Use --full para deploy completo (código + restart).
user_invocable: true
---

# /sync-daemon — Sincronizar Daemon VPS

## O que faz

Empacota o contexto atual do framework Segunda-feira (empresa, agentes, skills, projetos ativos, infra) e envia para o daemon rodando na VPS em `/opt/segunda-feira-daemon/context/framework-context.md`.

O daemon usa esse contexto no system prompt de todos os agentes via `PersonaBuilder`, permitindo respostas informadas sobre o negócio 24/7.

## Modos

| Modo | Comando | Tempo | O que faz |
|------|---------|-------|-----------|
| Context only | `/sync-daemon` | ~5s | Gera contexto, envia via SCP |
| Full deploy | `/sync-daemon --full` | ~30s | Build TS + rsync código + migrations + npm install + restart PM2 |

## Execução

1. Rodar o script de sync:
```bash
bash ~/segunda-feira-daemon/scripts/sync-context.sh
```

Para full deploy:
```bash
bash ~/segunda-feira-daemon/scripts/sync-context.sh --full
```

2. Verificar que o contexto chegou na VPS:
```bash
ssh root@VPS_IP "head -20 /opt/segunda-feira-daemon/context/framework-context.md"
```

3. Verificar daemon online:
```bash
ssh root@VPS_IP "pm2 show segunda-feira-daemon | grep -E 'status|uptime'"
```

## Cron automático

**Sistema (crontab do Mac):**
```
0 9,18 * * * /bin/bash ~/segunda-feira-daemon/scripts/sync-context.sh >> ~/logs/sync-daemon.log 2>&1
```
Roda às 6h e 15h BRT (9h e 18h UTC). Requer Mac ligado.

**Claude Code (CronCreate):** Configurado na sessão — roda quando REPL ativo. Expira em 7 dias.

## Contexto gerado inclui

- Self-awareness (roda na VPS 24/7)
- Dados da empresa (DOMINA.IA, CEO)
- Framework stats (51 agentes, 69 skills, 15 rules)
- Tabela de agentes para encaminhamento
- Skills principais
- Projetos ativos (extraídos das memórias)
- Infraestrutura

## Detalhes técnicos

- **Script:** `~/segunda-feira-daemon/scripts/sync-context.sh`
- **Output:** `/opt/segunda-feira-daemon/context/framework-context.md`
- **Cache:** PersonaBuilder cacheia contexto por 5 minutos
- **SSH:** Chave ed25519 em `~/.ssh/id_ed25519` (configurada 2026-04-03)
- **Migrations:** `--full` copia `.sql` para `dist/memory/migrations/` (não passam pelo tsc)

## Troubleshooting

| Problema | Solução |
|----------|---------|
| SSH falha | `ssh root@VPS_IP "echo ok"` — verificar chave |
| Build falha | `cd ~/segunda-feira-daemon && npm run build` manual |
| Daemon crasheia | Verificar migrations: `ssh root@VPS_IP "ls /opt/segunda-feira-daemon/dist/memory/migrations/"` |
| Contexto não atualiza | Cache de 5min — esperar ou restart daemon |
| Daemon não reinicia | `ssh root@VPS_IP "pm2 restart segunda-feira-daemon"` |
