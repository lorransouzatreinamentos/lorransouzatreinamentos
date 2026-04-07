---
description: "Gerencia o WhatsApp Bot com Claude AI no MY GROWTH. Deploy, monitorar, conectar, tags, regras, troubleshoot."
argument-hint: "[status|deploy|connect|logs|tags|rules|restart|troubleshoot]"
allowed-tools: ["Bash", "Read", "Write", "Edit", "Grep", "Glob"]
---

# /whatsapp-bot — Gerenciamento do WhatsApp Bot com Claude AI

Você é um assistente especializado em gerenciar o WhatsApp Bot integrado ao MY GROWTH.

## Arquitetura

```
📱 WhatsApp (celular)
    ↕ WebSocket (Baileys)
🤖 whatsapp-bot (PM2 :3003)
    ├── @whiskeysockets/baileys 6.7.9 → conexão WhatsApp
    ├── @anthropic-ai/sdk            → respostas com Claude
    ├── PostgreSQL                    → mensagens, contatos, tags
    └── Express API (:3003)          → serve dados pro dashboard
        ↕
📊 MY GROWTH Dashboard (/whatsapp)
    ├── Visão Geral   → métricas, status, top contatos
    ├── Conversas     → chat real-time, envio manual, tags
    └── Config        → reconectar, desconectar
```

## Infraestrutura

| Item | Valor |
|------|-------|
| VPS | `${VPS_IP}` — root — porta 22 — senha: `${VPS_PASSWORD}` |
| Bot dir | `/opt/whatsapp-bot/` |
| Bot PM2 | `whatsapp-bot` (porta 3003) |
| Bot .env | `/opt/whatsapp-bot/.env` |
| Auth state | `/opt/whatsapp-bot/auth_state/` |
| MY GROWTH dir | `/opt/my-growth/` |
| Dashboard | https://mygrowth.your-domain.com.br/whatsapp |
| Bot API interna | `http://localhost:3003/api/` |

## Arquivos do Bot

| Arquivo | Função |
|---------|--------|
| `/opt/whatsapp-bot/index.js` | Serviço principal (Baileys + Express API + tag propagation) |
| `/opt/whatsapp-bot/claude-service.js` | Integração Anthropic SDK (Claude Sonnet 4) — respostas genéricas |
| `/opt/whatsapp-bot/closer-agent.js` | Agente Closer "Mia" — vendas VIP com contexto da ficha do lead |
| `/opt/whatsapp-bot/db.js` | Camada PostgreSQL (mensagens, contatos, tags, métricas) |
| `/opt/whatsapp-bot/broadcast.js` | Sistema de disparo em massa anti-ban (ficha + VIP + boas-vindas) |
| `/opt/whatsapp-bot/broadcast-migration.sql` | Schema broadcast (campaigns + log) |
| `/opt/whatsapp-bot/sync-leads-to-crm.js` | Sync lancamento_leads → crm_contacts |
| `/opt/whatsapp-bot/package.json` | Dependências |
| `/opt/whatsapp-bot/.env` | Config (API key, DB, limites, tags permitidas) |

## Arquivos do Dashboard (MY GROWTH)

| Arquivo | Função |
|---------|--------|
| `app/whatsapp/page.tsx` | Dashboard completo (overview, conversas, config) |
| `app/api/whatsapp/status/route.ts` | Proxy → bot `/api/status` |
| `app/api/whatsapp/qr/route.ts` | Proxy → bot `/api/qr` |
| `app/api/whatsapp/metrics/route.ts` | Proxy → bot `/api/metrics` |
| `app/api/whatsapp/conversations/route.ts` | Proxy → bot `/api/conversations` |
| `app/api/whatsapp/messages/[phone]/route.ts` | Proxy → bot `/api/messages/:phone` |
| `app/api/whatsapp/send/route.ts` | Proxy → bot `/api/send` |
| `app/api/whatsapp/actions/route.ts` | Proxy → bot `/api/reconnect, logout, block` |
| `app/api/whatsapp/contacts/[phone]/tags/route.ts` | Proxy → bot `/api/contacts/:phone/tags` |
| `lib/db/migrations/003_whatsapp_bot.sql` | Schema (5 tabelas) |

## Banco de Dados (PostgreSQL)

| Tabela | Função |
|--------|--------|
| `whatsapp_contacts` | Contatos (phone PK, name, tags[], is_blocked, total_messages) |
| `whatsapp_messages` | Mensagens (direction, body, claude_model, tokens_used, response_time_ms) |
| `whatsapp_auto_rules` | Regras auto-resposta (trigger_type, trigger_text, response_text) |
| `whatsapp_settings` | Configurações key-value |
| `whatsapp_event_log` | Log de eventos (conexão, QR, erros) |

## Variáveis de Ambiente (.env)

| Variável | Descrição |
|----------|-----------|
| `ANTHROPIC_API_KEY` | Chave da API Anthropic |
| `DATABASE_URL` | PostgreSQL connection string |
| `BOT_PORT` | Porta HTTP (3003) |
| `BOT_SYSTEM_PROMPT` | Prompt do sistema para o Claude |
| `MAX_TOKENS` | Máximo de tokens por resposta (1024) |
| `RATE_LIMIT_PER_CONTACT` | Máximo de mensagens por janela (30) |
| `RATE_LIMIT_WINDOW_MINUTES` | Janela de rate limit em minutos (60) |
| `BOT_ALLOWED_TAGS` | Tags que habilitam resposta do bot (bot,ai,atendimento) |

## Lógica de Resposta

1. Mensagem chega via WebSocket (Baileys)
2. Bot registra mensagem e contato no banco (SEMPRE)
3. Verifica se contato está **bloqueado** → se sim, ignora
4. **Propaga tags** — se o contato não tem tags, busca por variações do número (com/sem DDI 55, com/sem nono dígito) e por nome (pushName) para copiar tags de contatos equivalentes
5. Verifica se contato tem **tag permitida** (`bot`, `ai`, `atendimento`) → se não, apenas registra
6. Verifica **rate limit** → se excedido, avisa e para
7. Verifica **regras de auto-resposta** → se match, responde com texto fixo
8. **Verifica tag `vip-closer`** → se tem, ativa Agente Closer "Mia" (vendas VIP com dados da ficha)
9. Se nenhuma regra nem closer, busca **histórico** (últimas 20 msgs) e envia pro **Claude Sonnet 4** (genérico)
10. Responde e salva (modelo, tokens, tempo de resposta)

## Agente Closer "Mia" (closer-agent.js)

Agente de vendas consultivo ativado pela tag `vip-closer` no contato.

| Item | Detalhe |
|------|---------|
| Persona | Mia, assistente pessoal do YOUR_NAME |
| Modelo | Claude Sonnet 4 (max 512 tokens) |
| Ativação | Tag `vip-closer` no whatsapp_contacts |
| Dados | Busca ficha do lead em lancamento_leads/fichas (nível IA, ocupação, renda, dor, objetivo) |
| Produto | Acesso VIP Desafio R$67 |
| Checkout | https://chk.eduzz.com/39VEANXBWR |
| CRM | Quando envia link, adiciona tag `vip-link-enviado` e move pra stage `interessado` |

## Sistema de Broadcast (broadcast.js)

Disparo em massa seguro para WhatsApp via API não-oficial (Baileys).

### Regras Anti-Ban

| Proteção | Valor |
|----------|-------|
| Delay entre mensagens | 120s + jitter aleatório 0-30s |
| Lote | 20 mensagens |
| Pausa entre lotes | 10 minutos |
| Horário permitido | 8h-21h (fora disso, dorme até 8h) |
| Dedup | Nunca envia 2x pro mesmo lead (broadcast_log) |
| Controle | Pode pausar/retomar a qualquer momento |

### Comandos do Broadcast

```bash
node broadcast.js --dry-run      # Simula sem enviar
node broadcast.js --prepare      # Cria campanhas PAUSADAS
node broadcast.js --start <id>   # Inicia disparo
node broadcast.js --pause <id>   # Pausa campanha
node broadcast.js --resume <id>  # Retoma campanha
node broadcast.js --status       # Progresso de todas as campanhas
```

### Fluxos do Broadcast

| Fluxo | Target | Mensagem | Ação CRM |
|-------|--------|----------|----------|
| boas-vindas | Todos os leads | Boas-vindas + link grupo + agenda | Tag: broadcast-boas-vindas |
| lembrete-ficha | Leads sem ficha (prioridade) | Lembrete preencher ficha de perfil | Tag: broadcast-ficha-enviado |
| oferta-vip | Leads com ficha | Mia se apresenta + abertura consultiva | Tag: broadcast-vip-enviado + vip-closer, Stage → interessado |

## Normalização de Números Brasileiros (CRÍTICO)

### Problema
Números BR podem ter formatos diferentes no WhatsApp vs banco de dados:
- DB: `${PHONE_DB}` (sem DDI)
- WhatsApp JID: `${PHONE_WHATSAPP}@s.whatsapp.net` (com DDI, sem nono dígito)
- WhatsApp ID Meta: `${PHONE_META_ID}` (ID interno, completamente diferente)

### Solução no /api/send
1. Adicionar DDI 55 se número tem ≤11 dígitos
2. Usar `sock.onWhatsApp(num)` pra resolver o JID real
3. Enviar pro JID retornado (não pro número original)
4. Copiar tags do número original pro JID resolvido

### Propagação de Tags (propagateTags)
Quando um lead responde de um ID diferente do número de telefone:
1. Busca variações do número (com/sem DDI 55, com/sem nono dígito)
2. Busca por nome/pushName em contatos existentes com tags
3. Copia tags encontradas pro novo ID
4. Isso garante que o closer ativa mesmo quando o ID é diferente

### Regras de Formato BR
- SEMPRE adicionar DDI 55 antes de enviar
- SEMPRE usar onWhatsApp() pra resolver JID correto
- NUNCA enviar número cru sem DDI (vira código de outro país: 35=Búlgaria, 51=Peru, 21=Líbia)
- O nono dígito pode ou não existir — onWhatsApp() resolve

## Sync Lançamento → CRM (sync-leads-to-crm.js)

Importa leads de `lancamento_leads` para `crm_contacts` com tags e scores.

```bash
node sync-leads-to-crm.js --dry-run  # Simula
node sync-leads-to-crm.js            # Executa
```

| Estado do Lead | Stage CRM | Tags | Score Base |
|----------------|-----------|------|------------|
| Sem ficha | lead | desafio-mi, sem-ficha | 10 |
| Com ficha | engajado | desafio-mi, ficha-completa | 30+ |
| VIP | desafio | desafio-mi, ficha-completa, vip | 60+ |

## Comandos

### `/whatsapp-bot status`
Verifica status completo do bot:
1. PM2 status do whatsapp-bot
2. API `/api/status` (connected/qr_pending/disconnected)
3. Telefone conectado
4. Memória e uptime
5. Últimos logs

### `/whatsapp-bot deploy`
Deploy completo do bot e dashboard:
1. Upload dos arquivos do bot (`~/whatsapp-bot/`)
2. Upload do dashboard (`~/my-growth-whatsapp/`)
3. `npm install --production` no bot
4. Migration SQL (se houver novas)
5. Build MY GROWTH (`npm run build`)
6. Restart ambos PM2 processes
7. Verificação final

### `/whatsapp-bot connect`
Gera novo QR Code para conexão:
1. Limpar auth_state antigo
2. Restart whatsapp-bot
3. Aguardar QR gerado
4. Instruir usuário a escanear via dashboard

### `/whatsapp-bot logs`
Mostra logs recentes:
1. `pm2 logs whatsapp-bot --lines 50`
2. Filtrar erros relevantes
3. Mostrar status de conexão

### `/whatsapp-bot tags <phone> [add|remove] <tag>`
Gerenciar tags de um contato:
- `tags ${PHONE_EXAMPLE} add bot` → ativa bot para contato
- `tags ${PHONE_EXAMPLE} remove bot` → desativa bot
- `tags ${PHONE_EXAMPLE}` → lista tags do contato

### `/whatsapp-bot rules`
Gerenciar regras de auto-resposta:
1. Listar regras ativas
2. Adicionar nova regra (trigger_type, trigger_text, response_text)
3. Ativar/desativar regra

### `/whatsapp-bot restart`
Reiniciar o bot preservando a sessão:
1. `pm2 restart whatsapp-bot --update-env`
2. Verificar reconexão automática
3. Confirmar status connected

### `/whatsapp-bot troubleshoot`
Diagnóstico e correção de problemas:

| Problema | Diagnóstico | Solução |
|----------|-------------|---------|
| Bot offline | `pm2 status` | `pm2 restart whatsapp-bot` |
| QR inválido | Chromium incompatível | Usar Baileys (sem browser) |
| 405 disconnect | Versão Baileys errada | Usar `6.7.9` |
| Execution context destroyed | Chrome muito novo | Não usar whatsapp-web.js |
| Mensagens não respondidas | Falta tag no contato | Adicionar tag `bot` |
| Closer não ativa | Tag `vip-closer` no ID errado | Checar `propagateTags()` ou adicionar tag manual no ID real (ver logs: `[MSG] nome (ID): sem tag`) |
| Mensagem vai pra país errado | Número sem DDI 55 | SEMPRE adicionar DDI 55. Nunca enviar número BR cru (35=Bulgária, 51=Peru) |
| Mensagem "Aguardando" | JID errado (com/sem nono dígito) | Usar `onWhatsApp()` pra resolver JID correto antes de enviar |
| Lead responde de ID diferente | WhatsApp Meta Business ID ≠ phone | `propagateTags()` resolve automaticamente. Se não, adicionar tag manual: `UPDATE whatsapp_contacts SET tags = ARRAY['bot','vip-closer'] WHERE phone = 'ID'` |
| MY GROWTH caiu após deploy | Build falhou | Rebuild: `cd /opt/my-growth && npm run build` |
| Rate limit | Contato excedeu 30 msgs/hora | Aguardar ou ajustar `.env` |
| Claude não responde | API key inválida/expirada | Verificar `ANTHROPIC_API_KEY` no `.env` |
| Broadcast deu ban | Intervalo muito curto | Ajustar: 120s entre msgs + pausa 10min a cada 20 |

### `/whatsapp-bot` (sem argumento)
Diagnóstico rápido:
1. Status do PM2
2. Status da conexão WhatsApp
3. Métricas das últimas 24h
4. Últimos erros (se houver)

## Template SSH via Python

```python
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('${VPS_IP}', port=22, username='root', password='${VPS_PASSWORD}', timeout=30)
stdin, stdout, stderr = ssh.exec_command('COMANDO', timeout=120)
print(stdout.read().decode())
ssh.close()
```

## APIs Utilizadas

| API | Pacote | Função | Custo |
|-----|--------|--------|-------|
| WhatsApp WebSocket | `@whiskeysockets/baileys@6.7.9` | Conexão direta ao WhatsApp (sem browser) | Grátis |
| Claude AI | `@anthropic-ai/sdk` → `claude-sonnet-4-20250514` | Gerar respostas inteligentes | ~$3/$15 per 1M tokens |
| PostgreSQL | `pg@8.13.1` | Persistência de dados | Já existente |
| Express | `express@4.21.1` | API HTTP interna | Grátis |
| QR Code | `qrcode@1.5.4` / `qrcode-terminal@0.12.0` | Geração de QR Code | Grátis |

## Regras

- **SEMPRE verificar status antes de qualquer operação**: `pm2 status` + `curl localhost:3003/api/status`
- **NUNCA** fazer deploy do bot sem rebuild do MY GROWTH após alterar arquivos em `app/` ou `api/`
- **SEMPRE** limpar `auth_state` se precisar gerar novo QR Code
- Se o MY GROWTH cair após deploy, a causa mais provável é **build falhou** — verificar logs
- O bot reconecta automaticamente após desconexão (exceto logout explícito)
- Cópias locais dos arquivos estão em `~/whatsapp-bot/` e `~/my-growth-whatsapp/`
- Após alterar `.env`, reiniciar com `pm2 restart whatsapp-bot --update-env`

## Deploy Automatizado

Script disponível em `~/deploy_whatsapp_bot.py` — faz upload, migration, install, build e restart automaticamente.

```bash
export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
python3 ~/deploy_whatsapp_bot.py
```
