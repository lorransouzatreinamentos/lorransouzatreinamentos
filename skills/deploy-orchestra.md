---
name: deploy-orchestra
description: "Orquestrador de deploy para todos os projetos VPS — MY GROWTH, Client Dashboard, WhatsApp Bot, DOMINA.IA. Health check + rollback automático + notificação Telegram."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Deploy Orchestra — Skill de Deploy Unificado

## Contexto

**VPS:** `${VPS_IP}` — root — porta 22 — senha: `${VPS_PASSWORD}`
**SSH:** Via `expect` com senha (sshpass não instalado no Mac)
**Telegram Bot:** WhatsApp Bot na porta 3003 (para notificações)

---

## Regras Invioláveis

1. **SEMPRE fazer health check** após deploy. Se falhar, rollback automático.
2. **NUNCA misturar credenciais** entre projetos (cada um tem seu DB, porta, PM2 name).
3. **SEMPRE salvar hash do commit atual** antes do deploy (para rollback).
4. **Logs de deploy** registrados em `~/observations/deploy-orchestra.log`.
5. **SEMPRE usar acentos e cedilha** em mensagens e logs em português.

---

## Projetos Registrados

| Projeto | Caminho VPS | PM2 Name | Porta | Health Check | DB |
|---------|-------------|----------|-------|-------------|-----|
| MY GROWTH | `/opt/my-growth/` | `my-growth` | 3000 | `curl -s http://localhost:3000/api/health` | `${DATABASE_URL_MYGROWTH}` |
| Client Dashboard | `/opt/client-dashboard/` | `client-dashboard` | 3002 | `curl -s -o /dev/null -w '%{http_code}' http://localhost:3002` | `${DATABASE_URL_ALR}` |
| WhatsApp Bot | `/opt/whatsapp-bot/` | `whatsapp-bot` | 3003 | `curl -s http://localhost:3003/api/health` | Mesmo DB do MY GROWTH |
| DOMINA.IA | `/opt/dominantes/` | `dominantes` | 3004 | `curl -s -o /dev/null -w '%{http_code}' http://localhost:3004` | SQLite local |

---

## Comandos

```
/deploy-orchestra my-growth      → deploy apenas MY GROWTH
/deploy-orchestra alr            → deploy apenas Client Dashboard
/deploy-orchestra whatsapp       → deploy apenas WhatsApp Bot
/deploy-orchestra dominantes     → deploy apenas DOMINA.IA
/deploy-orchestra all            → deploy de TODOS (sequencial)
/deploy-orchestra status         → status PM2 de todos os projetos
```

---

## Fluxo de Deploy (por projeto)

### Função SSH Base

```bash
# Template de conexão SSH via expect (macOS)
expect -c "
  set timeout 120
  spawn ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} -p 22
  expect \"*assword*\"
  send \"${VPS_PASSWORD}\r\"
  expect \"*#*\"
  send \"COMANDOS_AQUI\r\"
  expect \"*#*\"
  send \"exit\r\"
  expect eof
"
```

### PASSO 1 — Salvar Estado Atual (pré-deploy)

```bash
# Dentro da VPS, para cada projeto:
cd /opt/{projeto}
COMMIT_ANTES=$(git rev-parse HEAD)
echo "$COMMIT_ANTES" > /tmp/deploy-rollback-{projeto}.txt
pm2 save
```

### PASSO 2 — Deploy por Projeto

#### MY GROWTH (`/opt/my-growth/`)

```bash
cd /opt/my-growth
git stash  # salvar alterações locais se houver
git pull origin main
npm install --production
npm run build
pm2 restart my-growth --update-env
sleep 5
# Health check
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health)
if [ "$HEALTH" != "200" ]; then
  echo "FALHA: health check retornou $HEALTH"
  exit 1
fi
echo "MY GROWTH deployado com sucesso — $(git rev-parse --short HEAD)"
```

#### Client Dashboard (`/opt/client-dashboard/`)

```bash
cd /opt/client-dashboard
git stash
git pull origin main
npm install --production
npx next build
pm2 restart client-dashboard --update-env
sleep 5
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3002)
if [ "$HEALTH" != "200" ]; then
  echo "FALHA: health check retornou $HEALTH"
  exit 1
fi
echo "Client Dashboard deployado com sucesso — $(git rev-parse --short HEAD)"
```

#### WhatsApp Bot (`/opt/whatsapp-bot/`)

```bash
cd /opt/whatsapp-bot
git stash
git pull origin main
npm install --production
pm2 restart whatsapp-bot --update-env
sleep 5
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3003/api/health)
if [ "$HEALTH" != "200" ]; then
  echo "FALHA: health check retornou $HEALTH"
  exit 1
fi
echo "WhatsApp Bot deployado com sucesso — $(git rev-parse --short HEAD)"
```

#### DOMINA.IA (`/opt/dominantes/`)

```bash
cd /opt/dominantes
git stash
git pull origin main
npm install --production
npm run build
pm2 restart dominantes --update-env
sleep 5
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3004)
if [ "$HEALTH" != "200" ]; then
  echo "FALHA: health check retornou $HEALTH"
  exit 1
fi
echo "DOMINA.IA deployado com sucesso — $(git rev-parse --short HEAD)"
```

### PASSO 3 — Health Check Detalhado

```bash
# Após deploy, verificar:
pm2 status  # todos os processos online?
pm2 logs {pm2-name} --lines 10 --nostream  # erros recentes?

# Health check HTTP
for port in 3000 3002 3003 3004; do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:$port)
  echo "Porta $port: HTTP $STATUS"
done
```

**Critérios de sucesso:**
- HTTP 200 no health check
- PM2 status: `online` (não `errored` ou `stopped`)
- Zero erros nos últimos 10 logs

### PASSO 4 — Rollback Automático (se health check falhar)

```bash
cd /opt/{projeto}
COMMIT_ANTERIOR=$(cat /tmp/deploy-rollback-{projeto}.txt)
git checkout $COMMIT_ANTERIOR
npm install --production
npm run build  # se aplicável
pm2 restart {pm2-name} --update-env
sleep 5

# Verificar se rollback funcionou
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:{porta})
if [ "$HEALTH" == "200" ]; then
  echo "ROLLBACK OK — revertido para $COMMIT_ANTERIOR"
else
  echo "ROLLBACK FALHOU — INTERVENÇÃO MANUAL NECESSÁRIA"
fi
```

### PASSO 5 — Notificação (Telegram ou output)

**Deploy OK:**
```
✅ DEPLOY CONCLUÍDO
Projeto: {nome}
Commit: {hash_curto}
Horário: {timestamp BRT}
Health: HTTP 200
```

**Deploy FALHOU:**
```
❌ DEPLOY FALHOU — ROLLBACK EXECUTADO
Projeto: {nome}
Erro: {descrição}
Revertido para: {commit_anterior}
Horário: {timestamp BRT}
Ação: verificar logs com `pm2 logs {pm2-name}`
```

---

## Comando `/deploy-orchestra all`

Execução **sequencial** (não paralela) para evitar sobrecarga na VPS:

```
1. MY GROWTH     → deploy + health check
2. Client Dashboard → deploy + health check
3. WhatsApp Bot  → deploy + health check
4. DOMINA.IA     → deploy + health check
```

Se qualquer projeto falhar, os demais continuam. Relatório final consolida todos:

```
📊 DEPLOY REPORT — {data}
┌─────────────────┬────────┬──────────┐
│ Projeto         │ Status │ Commit   │
├─────────────────┼────────┼──────────┤
│ MY GROWTH       │ ✅ OK  │ a1b2c3d  │
│ Client Dashboard   │ ✅ OK  │ e4f5g6h  │
│ WhatsApp Bot    │ ❌ FAIL│ rollback │
│ DOMINA.IA       │ ✅ OK  │ i7j8k9l  │
└─────────────────┴────────┴──────────┘
Tempo total: 3m 42s
```

---

## Comando `/deploy-orchestra status`

Verificar estado atual sem fazer deploy:

```bash
# Via SSH
pm2 jlist  # JSON format
pm2 status  # tabela visual

# Health checks
for port in 3000 3002 3003 3004; do
  curl -s -o /dev/null -w "Porta $port: HTTP %{http_code}\n" http://localhost:$port
done

# Uso de recursos
free -h
df -h /opt
```

---

## Tratamento de Erros

| Erro | Ação |
|------|------|
| SSH timeout | Retry 3x com 10s de intervalo. Se persistir, alertar CEO. |
| `git pull` conflito | `git stash && git pull && git stash pop`. Se falhar, `git reset --hard origin/main`. |
| `npm install` falhou | Limpar cache: `rm -rf node_modules && npm install --production`. |
| `npm run build` falhou | Verificar `pm2 logs`. Rollback imediato. |
| Health check timeout | Esperar mais 10s. Se persistir, rollback. |
| PM2 `errored` | `pm2 logs {name} --lines 50 --nostream` → diagnosticar. |
| Disco cheio | `npm cache clean --force && pm2 flush`. Alertar CEO. |
| Porta ocupada | `lsof -i :{porta}` → identificar processo → matar se não for crítico. |

---

## Observações

```bash
# Registrar cada deploy
mkdir -p ~/observations
echo "[$(date)] deploy-orchestra: {projeto} deployado — commit {hash} — status {ok/fail}" >> ~/observations/deploy-orchestra.log
```

---

## Segurança

- Senha SSH usada via `expect` (não armazenada em plaintext em scripts permanentes)
- Cada projeto tem seu próprio usuário/senha de DB — NUNCA misturar
- Rollback preserva `auth_state/` do WhatsApp Bot (reconexão sem QR code)
- `git stash` antes de pull preserva alterações locais feitas diretamente na VPS
