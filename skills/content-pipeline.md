---
name: content-pipeline
description: "Pipeline automatizado de conteúdo semanal para Instagram — gera 21 posts em batch, valida acentuação/variedade, apresenta para aprovação e faz upload no MY GROWTH."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - WebSearch
  - WebFetch
---

# Content Pipeline — Skill de Automação de Conteúdo Semanal

## Contexto

**Marca:** DOMINA.IA — @your-handle
**Content Studio:** `~/content-studio/`
**MY GROWTH:** https://mygrowth.your-domain.com.br
**VPS:** `${VPS_IP}` — root — porta 22 — senha: `${VPS_PASSWORD}`
**Execução preferida:** Domingo ~9h (início proativo)

---

## Regras Invioláveis

1. **SEMPRE usar acentos e cedilha** — ã, é, ç, ô, í, ú, â, ê, õ. Verificar CADA palavra antes de entregar.
2. **NUNCA sobrescrever posts já agendados** — verificar agenda ANTES de criar qualquer coisa.
3. **NUNCA repetir mesma foto/template em todos os posts** — cada post precisa de identidade visual única.
4. **NUNCA recortar foto de dentro de outro criativo** — usar foto raw ou estilo tipográfico puro.
5. **Horários em BRT** para o CEO, **UTC para o banco** (9h BRT = 12h UTC).
6. **Filtros B&W (moon, inkwell, willow)** proibidos em fotos coloridas. Usar: clarendon, juno, lark, xpro2.

---

## Fluxo Completo

### PASSO 1 — Verificar Agenda Existente

Consultar MY GROWTH para posts já agendados na semana-alvo.

```bash
# Via SSH na VPS
ssh ${VPS_USER}@${VPS_IP} -p 22 << 'REMOTE'
cd /opt/my-growth
# Verificar scheduled-posts.json
cat data/scheduled-posts.json | python3 -c "
import json, sys
from datetime import datetime, timedelta
data = json.load(sys.stdin)
# Filtrar semana-alvo (próxima segunda a domingo)
today = datetime.now()
monday = today + timedelta(days=(7 - today.weekday()))
sunday = monday + timedelta(days=6)
existing = [p for p in data if monday.strftime('%Y-%m-%d') <= p.get('scheduled_date','')[:10] <= sunday.strftime('%Y-%m-%d')]
print(f'Posts já agendados na semana {monday.strftime(\"%d/%m\")} a {sunday.strftime(\"%d/%m\")}:')
for p in existing:
    print(f\"  {p['scheduled_date'][:16]} | {p.get('format','?')} | {p.get('title','sem título')}\")
print(f'Total: {len(existing)} posts existentes')
"
REMOTE
```

**Regra:** Mapear datas/horários ocupados. Criar novos posts APENAS nos slots vazios.

### PASSO 2 — Definir Grade Semanal

**21 posts = 3 por dia × 7 dias (segunda a domingo)**

#### Horários Otimizados (BRT)

| Slot | Horário BRT | Tipo Preferido |
|------|-------------|----------------|
| Manhã | 08:00 | Educativo / Notícia |
| Tarde | 13:00 | Autoridade / Provocação |
| Noite | 19:00 | Engajamento / Pessoal |

#### Mix de Formatos (por semana)

| Formato | Quantidade | Template |
|---------|-----------|----------|
| Reel (capa) | 7 | `render_reel` (dark) |
| Carrossel educativo | 5 | `render_carrossel` (dark) |
| Carrossel news | 4 | `render_carrossel_news` (claro) |
| Carrossel tweet | 3 | `render_carrossel_tweet` (branco) |
| Imagem estática | 2 | `render_feed_image` |

#### Pilares de Material

| Pilar | Descrição | Proporção |
|-------|-----------|-----------|
| **provocação** | Desafiar crenças do mercado, polêmica calculada | 30% (~6 posts) |
| **autoridade** | Cases, resultados, bastidores, provas sociais | 25% (~5 posts) |
| **educação** | Tutoriais, frameworks, dicas práticas com IA | 25% (~5 posts) |
| **guerra** | Contra-narrativa, "o que ninguém te conta" | 10% (~2 posts) |
| **pessoal** | Bastidores, reflexões, lifestyle do CEO tech | 10% (~3 posts) |

### PASSO 3 — Gerar 21 Posts em Batch

Para cada post, executar no Content Studio:

```bash
cd ~/content-studio

# Reel (capa dark com foto do YOUR_NAME)
python3 luna_uma.py reel "tema do post" --pilar provocacao

# Carrossel educativo dark
python3 luna_uma.py carrossel "Título" "Subtítulo"

# Carrossel news (fundo claro)
python3 luna_uma.py news "Título da notícia" --badge breaking --categoria "IA"

# Carrossel tweet card
python3 luna_uma.py tweet '[{"lines":["texto","**negrito**","✅ item"]}]' --output "prefix"

# Imagem via Freepik (temática, variar entre posts)
python3 gerar-imagem.py "prompt descritivo" --proporcao reels --destino posts-criados/2026-03
```

**Cada post DEVE ter:**
- Legenda completa (com emojis estratégicos, hashtags, CTA)
- Criativo visual gerado (arquivo local)
- Horário sugerido (BRT)
- Pilar/formato definido

**Regras de variedade visual:**
- Alternar entre fotos pessoais do YOUR_NAME e imagens temáticas
- NUNCA usar a mesma foto em 2 posts consecutivos
- Variar templates: dark → news → tweet → dark (evitar 3x seguidos do mesmo)
- Buscar imagens temáticas no Unsplash/Pexels quando necessário

### PASSO 4 — Auto-Validação de Cada Post

Antes de apresentar o batch, validar CADA post:

```
CHECKLIST POR POST:
[ ] Acentuação correta — buscar palavras suspeitas sem til, circunflexo ou agudo
[ ] Foto/visual diferente dos outros 20 posts
[ ] Sem conflito com posts já agendados (PASSO 1)
[ ] Horário livre (sem sobreposição com post existente)
[ ] Legenda tem: gancho + corpo + CTA + hashtags
[ ] Criativo gerado e salvo em posts-criados/YYYY-MM/
[ ] Formato correto: 1080x1920 (reel/story) ou 1080x1080 (feed)
```

### PASSO 5 — Apresentar Batch para Aprovação

Mostrar tabela resumo ao CEO:

```
📅 GRADE SEMANAL 24-30/03/2026

| # | Data | Hora | Formato | Pilar | Tema | Preview |
|---|------|------|---------|-------|------|---------|
| 1 | Seg 24/03 | 08:00 | Reel | educação | "5 prompts que..." | ✅ |
| 2 | Seg 24/03 | 13:00 | Carrossel | provocação | "IA vai substituir..." | ✅ |
| 3 | Seg 24/03 | 19:00 | Tweet card | autoridade | "Faturei R$30K..." | ✅ |
...
| 21 | Dom 30/03 | 19:00 | News | educação | "OpenAI anuncia..." | ✅ |

AÇÕES:
- "Aprovar tudo" → upload automático
- "Rejeitar #X, #Y" → regenerar posts específicos
- "Trocar tema #Z" → ajustar e regenerar
```

**O CEO aprova o BATCH inteiro, individualizando apenas rejeições.**

### PASSO 6 — Upload Automático no MY GROWTH

Para cada post aprovado:

```python
# No Content Studio
from publicar_mygrowth import registrar_post

registrar_post(
    slug="reel-5-prompts-2026-03-24",
    nome="5 Prompts que Valem R$10K",
    tema="educação",
    imagens=["posts-criados/2026-03/reel-5-prompts.jpg"],
    legenda="Legenda completa aqui...",
    data_agendada="2026-03-24T11:00:00Z"  # 08:00 BRT = 11:00 UTC
)
```

```bash
# Upload batch via script existente
cd ~/content-studio
python3 upload_v3_mygrowth.py
```

**Ou via SSH direto:**

```bash
# SCP dos criativos para a VPS
scp -P 22 posts-criados/2026-03/*.jpg ${VPS_USER}@${VPS_IP}:/opt/my-growth/public/carrosseis/{slug}/

# Inserir no scheduled-posts.json via SSH
ssh ${VPS_USER}@${VPS_IP} -p 22 << 'REMOTE'
cd /opt/my-growth
# Executar script de criação semanal com batch JSON
python3 /opt/criar_weekly_content.py --batch /tmp/batch_semana.json
REMOTE
```

**Status final de cada post:** `scheduled`

---

## Tratamento de Erros

| Erro | Ação |
|------|------|
| SSH falhou | Tentar 3x com 5s de intervalo. Se persistir, alertar CEO. |
| Freepik API indisponível | Usar imagens locais de `fotos-banco/` como fallback. |
| Post conflita com existente | Mover para próximo horário vazio do dia. |
| Uma Engine falhou | Verificar se Playwright está instalado. Rodar `npx playwright install chromium`. |
| Upload falhou | Salvar batch localmente em `~/content-studio/pending-uploads/`. Retry na próxima execução. |
| Acentuação com erro | BLOQUEAR post. Corrigir antes de incluir no batch. |

---

## Observações

Registrar execução em `~/observations/`:

```bash
echo "[$(date)] content-pipeline: 21 posts gerados para semana X. Y aprovados, Z rejeitados." >> ~/observations/content-pipeline.log
```

---

## Exemplo de Uso

```
/content-pipeline
/content-pipeline semana 31/03
/content-pipeline --regenerar 5,12,18
```
