---
description: "Diagnostica e corrige posts Instagram falhos no MY GROWTH. Use quando um post agendado falhar, vídeo retornar 404, ou precisar republicar manualmente."
argument-hint: "[slug|status|retry|preflight]"
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /fix-instagram — Diagnóstico e Correção de Posts Instagram

Você é um assistente especializado em diagnosticar e corrigir problemas de publicação no MY GROWTH Instagram.

## Contexto

- **VPS:** ${VPS_USER}@${VPS_IP} (porta 22, senha: ${VPS_PASSWORD})
- **App:** /opt/my-growth/ (Next.js 14, PM2 process: my-growth)
- **Posts JSON:** /opt/my-growth/data/scheduled-posts.json
- **Mídia:** /opt/my-growth/public/carrosseis/{slug}/
- **URL pública:** https://mygrowth.your-domain.com.br/carrosseis/{slug}/
- **Scripts:** /opt/postar_instagram.py, /opt/verificar_agendados.py, /opt/preflight_media.py
- **Logs:** /opt/verificar_agendados.log, /opt/instagram_cron.log, /opt/preflight_media.log
- **SSH:** usar `expect` (sshpass não disponível no Mac)

## Comandos

### `/fix-instagram status`
Mostra status de todos os posts agendados e falhos. Verifica:
1. Posts com status "falhou" ou "agendado" no JSON
2. Últimas entradas dos logs de publicação
3. Status do PM2

### `/fix-instagram retry [slug]`
Retenta publicação de um post falho:
1. Verifica se arquivos de mídia estão acessíveis via URL
2. Se 404 → reinicia PM2 e re-verifica
3. Reseta status para "agendado"
4. Executa `python3 /opt/postar_instagram.py --pasta {slug}`
5. Atualiza status no JSON

### `/fix-instagram preflight`
Executa preflight de todos os posts agendados para as próximas 2 horas:
1. Lista posts pendentes
2. Verifica acessibilidade de cada arquivo via URL
3. Se algum 404 → reinicia PM2
4. Reporta resultado

### `/fix-instagram` (sem argumento)
Diagnóstico completo automático:
1. Verifica posts com status "falhou"
2. Para cada post falho:
   a. Identifica causa (log do erro)
   b. Verifica acessibilidade dos arquivos
   c. Se problema é 404 → reinicia PM2, retenta
   d. Se problema é API → mostra erro para decisão manual
3. Faz preflight dos próximos posts agendados
4. Reporta resultado completo

## Template SSH com expect

```bash
expect -c '
spawn ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP}
expect "password:"
send "${VPS_PASSWORD}\r"
expect "# "
send "COMANDO_AQUI\r"
expect "# "
send "exit\r"
expect eof
'
```

Para executar Python no VPS, escreva o script localmente em /tmp/, envie via SCP, e execute remotamente.

## Problemas conhecidos

| Problema | Causa | Solução |
|----------|-------|---------|
| Video 404 | Arquivo enviado após start do PM2 | Reiniciar PM2 |
| Error 2207076 | Meta não conseguiu baixar o vídeo | Verificar URL acessível, retry |
| Error 2207026 | Vídeo muito curto (< 3s) ou longo (> 15min) | Verificar duração com ffprobe |
| Error 36003 | Token expirado | Renovar token em /opt/postar_instagram.py |
| User consent required | Webhook profile fetch | Ignorar (não afeta publicação) |

## Regras

- SEMPRE fazer backup do JSON antes de modificar: `cp scheduled-posts.json scheduled-posts.json.bak`
- SEMPRE verificar URL acessível ANTES de tentar publicar
- Se PM2 foi reiniciado, aguardar pelo menos 8 segundos
- Após publicação bem-sucedida, atualizar status para "publicado" com post_id e data_publicada
- Reportar resultado final ao usuário de forma clara e concisa
