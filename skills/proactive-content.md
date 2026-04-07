---
name: proactive-content
description: "Monitora calendário editorial no MY GROWTH — identifica gaps, posts sem criativos e sugere temas via Telegram"
---

# /proactive-content — Monitoramento de Calendário Editorial

## Objetivo

Verificar o calendário editorial no MY GROWTH, identificar lacunas na programação, validar que posts agendados estão completos (com criativos) e sugerir temas para preencher gaps. Notificar via Telegram quando encontrar problemas.

---

## Fontes de Dados

| Fonte | Acesso |
|-------|--------|
| MY GROWTH DB | SSH → VPS ${VPS_IP} → `/opt/my-growth/` |
| MY GROWTH API | https://mygrowth.your-domain.com.br/api/ |
| Content Studio local | `~/content-studio/` |

### Regras Editoriais (memória)

- **NUNCA mexer em posts já agendados** — apenas reportar estado
- **NUNCA repetir mesma foto** em todos os posts — verificar variedade
- **Formatos:** Story 1080x1920 (9:16) para ads, 1080x1080 para feed
- **SEMPRE acentos e cedilha** em textos português

---

## Execução — Passo a Passo

### 1. Consultar Calendário

Conectar via SSH na VPS e consultar posts agendados:

```bash
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'REMOTE'
cd /opt/my-growth
node -e "
const db = require('./src/database');
// Posts agendados para os próximos 7 dias
const hoje = new Date().toISOString().split('T')[0];
const em7dias = new Date(Date.now() + 7*86400000).toISOString().split('T')[0];
db.query('SELECT * FROM posts WHERE scheduled_date BETWEEN ? AND ? ORDER BY scheduled_date', [hoje, em7dias]);
// Posts sem criativo
db.query('SELECT * FROM posts WHERE scheduled_date >= ? AND (image_url IS NULL OR image_url = \\'\\') ORDER BY scheduled_date', [hoje]);
"
REMOTE
```

**Se API disponível**, usar:
```
GET /api/posts?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&status=scheduled
```

### 2. Identificar Gaps no Calendário

Analisar os próximos 7 dias e identificar:

| Verificação | Critério |
|-------------|----------|
| Dia sem post | Nenhum post agendado para o dia |
| Dia com poucos posts | Menos de 1 post/dia (mínimo) |
| Posts sem criativo | Campo image_url vazio ou nulo |
| Posts sem copy | Campo caption/text vazio |
| Posts sem hashtags | Sem hashtags definidas |
| Concentração de horário | Todos no mesmo horário |

### 3. Verificar Variedade de Criativos

- Comparar imagens dos posts agendados
- Identificar se a mesma foto está sendo usada em múltiplos posts
- Verificar se há mix de formatos (carrossel, single, reels, stories)

### 4. Sugerir Temas

Com base em:
- **Tendências atuais** — usar WebSearch MCP se disponível
- **Datas comemorativas** — próximos 7 dias
- **Histórico de performance** — posts que tiveram mais engajamento
- **Gaps temáticos** — assuntos não abordados recentemente

Categorias sugeridas:
- Educacional (dicas IA, tutoriais)
- Autoridade (cases, resultados)
- Engajamento (enquetes, perguntas)
- Venda (CTA para produto/mentoria)
- Bastidores (dia a dia, rotina)

### 5. Registrar Observações

Atualizar `~/observations/content-calendar.md`:

```markdown
# Calendário Editorial — Última verificação

**Timestamp:** YYYY-MM-DD HH:MM:SS
**Estado Geral:** COMPLETO | GAPS | CRÍTICO
**Posts agendados (7 dias):** XX
**Dias cobertos:** X/7
**Posts sem criativo:** X

## Próximos 7 Dias

| Data | Dia | Posts Agendados | Criativos OK | Status |
|------|-----|----------------|--------------|--------|
| DD/MM | Seg | 2 | 2/2 | OK |
| DD/MM | Ter | 0 | — | GAP |
| DD/MM | Qua | 1 | 0/1 | INCOMPLETO |

## Posts sem Criativo

| Post | Data | Plataforma | Problema |
|------|------|------------|----------|
| Título | DD/MM | Instagram | Sem imagem |

## Sugestões para Gaps

| Data | Tema Sugerido | Formato | Categoria |
|------|---------------|---------|-----------|
| DD/MM | [tema] | Carrossel | Educacional |

## Histórico

| Data Verificação | Posts/7dias | Gaps | Estado |
|-----------------|------------|------|--------|
| DD/MM HH:MM | XX | X | OK/GAPS |
```

### 6. Notificar se Necessário

**Notificar via Telegram se:**
- Mais de 2 dias consecutivos sem post nos próximos 7 dias
- Posts agendados sem criativo (precisa de ação)
- Amanhã não tem nada agendado (urgente)
- Semana com menos de 4 posts total

**Formato:**

```
📅 CALENDÁRIO EDITORIAL — [COMPLETO/GAPS/CRÍTICO]

⏰ [timestamp]
📝 Posts agendados (7 dias): XX | Dias cobertos: X/7

⚠️ Gaps encontrados:
• [dia] — nenhum post agendado
• [dia] — post sem criativo

💡 Sugestões:
• [dia]: [tema sugerido] — [formato]
• [dia]: [tema sugerido] — [formato]

🔴 Ação urgente:
• Amanhã (DD/MM) não tem post agendado!

📊 Detalhes: ~/observations/content-calendar.md
```

**Se calendário completo:** Apenas registrar, sem notificação.

---

## Parâmetros

| Parâmetro | Descrição | Default |
|-----------|-----------|---------|
| --chat-id | Chat ID Telegram | (obrigatório 1ª vez) |
| --days-ahead | Dias à frente para verificar | 7 |
| --min-posts-day | Mínimo de posts por dia | 1 |
| --force-notify | Notificar mesmo se completo | false |

---

## Frequência Recomendada

- **Cron:** A cada 6 horas (08:00, 14:00, 20:00)
- **Trigger:** `proactive-content`
- **Dia crítico:** Domingo (verificar semana inteira)

---

## Dependências

- Acesso SSH à VPS MY GROWTH (DB de publicações)
- MCP Telegram ativo
- Diretório `~/observations/` existente
- Regras em memória (`content-studio.md`, `feedback sobre posts agendados`)
