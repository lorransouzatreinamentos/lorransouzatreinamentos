---
name: proactive-monitor
description: "Monitora saúde dos servidores, apps PM2 e sites — registra observações e alerta via Telegram se encontrar problemas"
---

# /proactive-monitor — Monitoramento de Infraestrutura

## Objetivo

Verificar a saúde completa da infraestrutura (VPS MY GROWTH, Hostinger, apps PM2, sites públicos), registrar o estado em `~/observations/server-health.md` e notificar via Telegram apenas se houver problemas.

---

## Infraestrutura Monitorada

| Recurso | Host | Porta SSH | Usuário | Senha |
|---------|------|-----------|---------|-------|
| VPS MY GROWTH | ${VPS_IP} | 22 | root | ${VPS_PASSWORD} |
| Hostinger | ${HOSTINGER_IP} | ${HOSTINGER_PORT} | — | (ver ~/.claude/projects/) |

### Apps PM2 na VPS MY GROWTH

| App | Porta | Endpoint |
|-----|-------|----------|
| my-growth | 3001 | https://mygrowth.your-domain.com.br |
| client-dashboard | 3002 | https://alr.your-domain.com.br |
| whatsapp-bot | 3003 | — |
| domina-ia | 3004 | — |

### Sites na Hostinger

| Site | URL |
|------|-----|
| LP Principal | https://your-domain.com.br |
| Desafio MI | https://desafio.your-domain.com.br |
| Cliente B | https://cliente-b.your-domain.com.br |
| Client Project | https://client-project.your-domain.com.br |

---

## Execução — Passo a Passo

### 1. Verificar VPS MY GROWTH via SSH

Conectar via Bash (SSH) na VPS e executar os comandos abaixo. Usar `sshpass` ou `expect` conforme disponível:

```bash
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${VPS_USER}@${VPS_IP} << 'REMOTE'
echo "===PM2_STATUS==="
pm2 jlist 2>/dev/null || echo "PM2_UNAVAILABLE"
echo "===DISK==="
df -h / /opt 2>/dev/null
echo "===MEMORY==="
free -m
echo "===UPTIME==="
uptime
echo "===DOCKER==="
docker ps --format "{{.Names}} {{.Status}}" 2>/dev/null || echo "NO_DOCKER"
REMOTE
```

**Interpretar resultados:**

| Métrica | OK | ATENÇÃO | CRÍTICO |
|---------|-----|---------|---------|
| Disco (/) | < 70% | 70-85% | > 85% |
| Memória | < 70% | 70-85% | > 85% |
| PM2 app status | online | stopping/errored (< 5 restarts) | errored (> 5 restarts) |
| Load average (1min) | < 2.0 | 2.0-4.0 | > 4.0 |

### 2. Verificar Sites Respondendo

Para cada URL monitorada, executar curl e verificar HTTP status:

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}" --connect-timeout 10 --max-time 30 <URL>
```

**Interpretar resultados:**

| HTTP Code | Tempo | Classificação |
|-----------|-------|---------------|
| 200/301/302 | < 3s | OK |
| 200/301/302 | 3-10s | ATENÇÃO (lento) |
| 200/301/302 | > 10s | CRÍTICO (muito lento) |
| 4xx/5xx | — | CRÍTICO |
| Timeout/erro | — | CRÍTICO |

### 3. Verificar Hostinger via SSH

```bash
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p ${HOSTINGER_PORT} <user>@${HOSTINGER_IP} << 'REMOTE'
echo "===DISK==="
df -h / /home
echo "===MEMORY==="
free -m 2>/dev/null || echo "SHARED_HOSTING"
REMOTE
```

Se SSH falhar (hosting compartilhado), verificar apenas via curl nos sites.

### 4. Comparar com Estado Anterior

Ler `~/observations/server-health.md` (se existir) e comparar:
- Algum serviço que estava OK agora está com problema? → DEGRADAÇÃO
- Algum problema que existia foi resolvido? → RECUPERAÇÃO
- Disco/memória crescendo consistentemente? → TENDÊNCIA

### 5. Classificar Estado Geral

```
CRÍTICO — Qualquer serviço down, disco > 85%, memória > 85%, site não responde
ATENÇÃO — Alguma métrica entre 70-85%, site lento, PM2 com restarts
OK      — Tudo dentro dos limites normais
```

### 6. Registrar Observações

Atualizar `~/observations/server-health.md` com o formato:

```markdown
# Server Health — Última verificação

**Timestamp:** YYYY-MM-DD HH:MM:SS
**Estado Geral:** OK | ATENÇÃO | CRÍTICO

## VPS MY GROWTH (${VPS_IP})

| Métrica | Valor | Status |
|---------|-------|--------|
| Disco (/) | XX% | OK/ATENÇÃO/CRÍTICO |
| Memória | XX% | OK/ATENÇÃO/CRÍTICO |
| Load Avg | X.XX | OK/ATENÇÃO/CRÍTICO |
| PM2 apps | X/X online | OK/ATENÇÃO/CRÍTICO |

### PM2 Apps

| App | Status | Restarts | Uptime |
|-----|--------|----------|--------|
| my-growth | online | 0 | Xd Xh |
| client-dashboard | online | 0 | Xd Xh |
| whatsapp-bot | online | 0 | Xd Xh |
| domina-ia | online | 0 | Xd Xh |

## Sites

| Site | HTTP | Tempo | Status |
|------|------|-------|--------|
| mygrowth.your-domain.com.br | 200 | 0.5s | OK |
| alr.your-domain.com.br | 200 | 0.8s | OK |
| your-domain.com.br | 200 | 0.3s | OK |
| desafio.your-domain.com.br | 200 | 0.4s | OK |
| cliente-b.your-domain.com.br | 200 | 0.3s | OK |
| client-project.your-domain.com.br | 200 | 0.5s | OK |

## Histórico (últimas 10 verificações)

| Data | Estado | Observações |
|------|--------|-------------|
| YYYY-MM-DD HH:MM | OK | Tudo normal |
```

### 7. Notificar se Necessário

**Se estado = ATENÇÃO ou CRÍTICO:**

Usar MCP Telegram (`mcp__plugin_telegram_telegram__reply`) para enviar alerta formatado:

```
🔴 ALERTA INFRAESTRUTURA — [CRÍTICO/ATENÇÃO]

⏰ [timestamp]

Problemas encontrados:
• [descrição problema 1]
• [descrição problema 2]

Ação recomendada:
• [sugestão 1]
• [sugestão 2]

📊 Detalhes completos em ~/observations/server-health.md
```

**Se estado = OK:**
- Apenas registrar em `~/observations/server-health.md`
- NÃO notificar via Telegram (evitar spam)

**Exceção — Recuperação:**
Se o estado anterior era CRÍTICO/ATENÇÃO e agora é OK, notificar:

```
✅ RECUPERAÇÃO — Infraestrutura normalizada

⏰ [timestamp]

Resolvido:
• [o que voltou ao normal]
```

---

## Parâmetros

| Parâmetro | Descrição | Default |
|-----------|-----------|---------|
| --chat-id | Chat ID do Telegram para notificações | (obrigatório na 1ª execução, salvo em config) |
| --force-notify | Notificar mesmo se tudo OK | false |
| --skip-ssh | Pular verificação SSH (só curl) | false |
| --verbose | Mostrar detalhes da execução | false |

---

## Frequência Recomendada

- **Cron:** A cada 30 minutos
- **Trigger:** `proactive-monitor`
- **Horário ativo:** 06:00 - 23:00 (não acordar de madrugada)

---

## Dependências

- Acesso SSH à VPS (senha em memória)
- MCP Telegram configurado e ativo
- Diretório `~/observations/` existente
