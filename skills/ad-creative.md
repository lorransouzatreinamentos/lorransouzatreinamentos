---
name: ad-creative
description: "Geração de criativos para anúncios — headlines, textos, variações de ângulo, A/B tests. Integração com Content Studio (uma_engine). Padrão dark/green."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - WebSearch
---

# Ad Creative — Skill de Geração de Criativos para Anúncios

## Contexto

**Marca:** DOMINA.IA — @your-handle
**Produto principal:** Desafio O Mercado Invisível + Mentoria DOMINA.IA
**Content Studio:** `~/content-studio/`
**Engines:** `uma_engine.py`, `uma_engine_v2.py`

---

## Regras Invioláveis

1. **SEMPRE usar acentos e cedilha** — ã, é, ç, ô, í, ú, â, ê, õ. Verificar CADA palavra.
2. **Formato padrão:** 1080x1920 (9:16) para Stories/Reels ads. Só usar 1080x1080 se explicitamente solicitado.
3. **NUNCA recortar foto de dentro de outro criativo** — usar foto raw original ou estilo sem foto (tipografia pura).
4. **NUNCA usar a mesma imagem em múltiplos criativos** — cada peça precisa de visual único.
5. **Design campeão:** Fundo escuro (#0D0D0D ou #1A1A1A) + destaques verde (#00FF88 ou #39FF14) + texto branco.

---

## Estrutura de Copy para Anúncios

### Anatomia Completa de um Anúncio Meta

```
┌─────────────────────────────────────┐
│ PRIMARY TEXT (texto principal)        │
│ Máximo: 125 caracteres visíveis      │
│ (antes do "Ver mais")                │
│ Total recomendado: 300-500 chars     │
├─────────────────────────────────────┤
│ CRIATIVO (imagem ou vídeo)           │
│ 1080x1920 (9:16) ou 1080x1080 (1:1) │
├─────────────────────────────────────┤
│ HEADLINE (título abaixo da imagem)   │
│ Máximo: 40 caracteres                │
├─────────────────────────────────────┤
│ DESCRIPTION (descrição)              │
│ Máximo: 30 caracteres                │
├─────────────────────────────────────┤
│ CTA BUTTON (botão)                   │
│ "Saiba Mais" / "Inscreva-se"         │
└─────────────────────────────────────┘
```

### Framework de Copy: Hook > Problema > Solução > Prova > CTA

| Bloco | Função | Exemplo |
|-------|--------|---------|
| **Hook** (1 linha) | Parar o scroll | "Eu saí de R$3K para R$30K em 90 dias usando IA." |
| **Problema** (1-2 linhas) | Gerar identificação | "Se você é CLT ganhando pouco e sente que tem potencial para mais..." |
| **Solução** (2-3 linhas) | Apresentar a saída | "Existe um mercado invisível onde profissionais comuns estão faturando com IA — sem precisar ser programador." |
| **Prova** (1-2 linhas) | Credibilizar | "Mais de 200 pessoas já se inscreveram no desafio gratuito." |
| **CTA** (1 linha) | Ação clara | "Clique abaixo e garanta sua vaga agora. É 100% gratuito." |

---

## Framework de Variação de Ângulos

### Conceito
Mesmo produto, mesma oferta, diferentes portas de entrada. Cada ângulo ataca um motivador diferente do público.

### Ângulos Validados

#### Ângulo 1: Dinheiro Direto (CAMPEÃO)
- **Motivador:** Ganância / ambição financeira
- **Hook:** "De R$3K a R$30K/mês com IA"
- **Prova:** Números reais, dados financeiros
- **Design:** Bold numbers em verde sobre fundo escuro
- **CPL médio:** R$2.98 - R$4.25
- **Status:** Baseline para comparação

#### Ângulo 2: Oportunidade Oculta
- **Motivador:** Curiosidade / FOMO
- **Hook:** "O mercado que 97% das pessoas não conhecem"
- **Prova:** Dados de mercado, tamanho da oportunidade
- **Design:** Elemento de mistério, revelação progressiva

#### Ângulo 3: Medo de Ficar Para Trás
- **Motivador:** Aversão à perda
- **Hook:** "Enquanto você pensa, outros já estão lucrando com IA"
- **Prova:** Velocidade de mudança, quem já entrou
- **Design:** Contraste antes/depois, urgência visual

#### Ângulo 4: Transformação Pessoal
- **Motivador:** Aspiração / identidade
- **Hook:** "De empregado frustrado a especialista em IA"
- **Prova:** Jornada pessoal, depoimentos
- **Design:** Foto pessoal, storytelling visual

#### Ângulo 5: Simplicidade / Sem Barreiras
- **Motivador:** Remoção de objeção
- **Hook:** "Você não precisa saber programar para ganhar com IA"
- **Prova:** Exemplos de pessoas comuns
- **Design:** Clean, acessível, sem jargão

#### Ângulo 6: Autoridade / Dados
- **Motivador:** Confiança / lógica
- **Hook:** "Testei 47 ferramentas de IA. Essas 3 geram dinheiro real."
- **Prova:** Dados, testes, comparações
- **Design:** Infográfico, dados visuais

---

## Geração em Batch

### Processo para Criar Lote de Criativos

**Passo 1: Definir o lote**
```yaml
campanha: "V{N} {Tipo}"
ângulo_principal: "Dinheiro Direto"
quantidade: 5 variações
formato: 1080x1920
destino: Landing Page do Desafio
```

**Passo 2: Gerar variações**
Para cada criativo, variar:
- **Hook:** 5 versões diferentes do mesmo ângulo
- **Visual:** Imagem diferente para cada um
- **CTA:** 2-3 variações de chamada para ação
- **Headline:** 5 opções curtas (max 40 chars)

**Passo 3: Nomenclatura A/B**
```
Peça {N}{Letra} — {Ângulo curto}
Exemplo:
- Peça 5A — Mesa de Dinheiro (imagem de notas + IA)
- Peça 5B — Bold Numbers (tipografia grande R$30K)
- Peça 5C — Laptop Glow (tela com dashboard)
- Peça 5D — Antes Depois (split visual)
- Peça 5E — Data Chart (gráfico crescente)
```

**Passo 4: Documentar**
Cada criativo deve ter registro:
```yaml
peça: "5A"
nome: "Mesa de Dinheiro"
ângulo: "Dinheiro Direto"
hook: "Eu saí de R$3K para R$30K em 90 dias usando IA"
headline: "Descubra o Mercado Invisível"
description: "Desafio gratuito de 5 dias"
cta_button: "Saiba Mais"
imagem: "descrição visual do criativo"
formato: "1080x1920"
```

---

## Templates de Copy por Ângulo

### Template: Dinheiro Direto
```
PRIMARY TEXT:
{Valor baixo} → {Valor alto} em {período} usando IA.

Parece mentira? Eu também achava.

Mas existe um mercado invisível onde profissionais comuns estão {resultado} usando ferramentas de inteligência artificial — sem precisar ser programador, sem investir fortunas.

{Prova social: X pessoas já se inscreveram}

Eu criei um desafio GRATUITO de 5 dias para te mostrar exatamente como funciona.

{CTA: Clique e garanta sua vaga}

HEADLINE: {Frase curta com valor} (max 40 chars)
DESCRIPTION: Desafio gratuito de 5 dias
CTA: Saiba Mais
```

### Template: Oportunidade Oculta
```
PRIMARY TEXT:
97% dos empreendedores não sabem que esse mercado existe.

{Dado surpreendente sobre o mercado de IA}

Enquanto a maioria está brigando por migalhas nos mesmos nichos saturados, um grupo pequeno está {resultado} em um mercado que ninguém olha.

Eu vou te mostrar exatamente qual é esse mercado em um desafio GRATUITO de 5 dias.

{Prova social}

{CTA}

HEADLINE: O Mercado Invisível da IA
DESCRIPTION: Vagas limitadas
CTA: Saiba Mais
```

### Template: Medo / Urgência
```
PRIMARY TEXT:
Cada dia que passa, mais pessoas estão descobrindo como ganhar dinheiro com IA.

E cada dia que você espera, mais difícil fica entrar.

{Dado de velocidade de crescimento}

Não estou dizendo isso para te assustar. Estou dizendo porque eu já vi esse filme antes — {referência a outra onda tecnológica}.

Quem entrou primeiro, lucrou mais.

{CTA para desafio gratuito}

HEADLINE: Não fique para trás
DESCRIPTION: Começa em {data}
CTA: Inscreva-se
```

---

## Integração com Content Studio

### Geração Programática
```bash
# Usando uma_engine_v2.py para gerar criativos
cd ~/content-studio
python uma_engine_v2.py --template ad_creative \
  --angle "dinheiro_direto" \
  --format "1080x1920" \
  --variations 5 \
  --output ./output/ads/
```

### Parâmetros do Engine
| Parâmetro | Valores |
|-----------|---------|
| `--template` | `ad_creative`, `carousel`, `story`, `reel_cover` |
| `--angle` | `dinheiro_direto`, `oportunidade`, `medo`, `transformacao`, `simplicidade`, `autoridade` |
| `--format` | `1080x1920`, `1080x1080` |
| `--variations` | 1-10 |
| `--style` | `dark_green` (padrão), `clean_white`, `gradient` |

---

## Checklist de Qualidade — Criativo

Antes de publicar qualquer criativo:

- [ ] Acentuação correta em TODAS as palavras (ã, é, ç, ô, í, ú)
- [ ] Formato correto (1080x1920 ou conforme solicitado)
- [ ] Texto ocupa menos de 20% da imagem
- [ ] Foto original (não recortada de outro criativo)
- [ ] Visual diferente de outros criativos ativos
- [ ] Hook legível nos primeiros 3 segundos
- [ ] CTA claro e visível
- [ ] Cores da marca (dark + green)
- [ ] Sem erros gramaticais
- [ ] Headline dentro do limite (40 chars)
- [ ] Description dentro do limite (30 chars)
- [ ] Nomenclatura correta (Peça XY — Nome)
