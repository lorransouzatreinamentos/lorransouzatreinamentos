---
name: vps-setup
description: "Setup completo de VPS para automações — Docker, n8n, Evolution API, Traefik, PostgreSQL, Redis. Use quando precisar configurar servidor, deploy de aplicações, ou setup de infraestrutura de automação."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# VPS Setup

Setup completo de VPS Linux para stack de automação com Docker.

## Stack Padrão

```yaml
services:
  traefik:       # Reverse proxy + SSL automático
  n8n:           # Automação visual (porta 5678)
  evolution:     # WhatsApp API via Baileys (porta 8080)
  postgres:      # Database principal
  redis:         # Cache + queues
  portainer:     # Docker UI (porta 9443)
  minio:         # Object storage S3-compatible
```

## Checklist de Setup

### 1. Acesso e Segurança
- [ ] SSH key auth (desabilitar password)
- [ ] Firewall (ufw): 22, 80, 443 apenas
- [ ] fail2ban instalado
- [ ] Usuário não-root criado

### 2. Docker + Compose
- [ ] Docker Engine instalado
- [ ] Docker Compose v2 instalado
- [ ] Network compartilhada criada

### 3. Reverse Proxy (Traefik)
- [ ] SSL automático (Let's Encrypt)
- [ ] Subdomínios configurados
- [ ] Rate limiting habilitado

### 4. Aplicações
- [ ] n8n com persistência em volume
- [ ] PostgreSQL com backup automático
- [ ] Redis com persistência RDB
- [ ] Evolution API configurada

### 5. Manutenção
- [ ] Cron de backup diário (DB + volumes)
- [ ] Monitoramento de disco (alerta >80%)
- [ ] Log rotation configurado
- [ ] Update automático de segurança

## Procedimento de Manutenção (8 fases)
1. SSH connect
2. System update (apt update && apt upgrade)
3. Docker update
4. App updates (pull + restart)
5. Limpeza (docker system prune)
6. Backup verification
7. Health check (todos os serviços respondendo)
8. Log review
