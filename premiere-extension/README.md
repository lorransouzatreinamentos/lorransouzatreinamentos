# FASTVIDEO — Extensão Adobe Premiere Pro

Extensão que extrai automaticamente os melhores trechos de um vídeo usando IA (Claude, GPT, Gemini) e insere diretamente na timeline do Premiere Pro.

![Segunda-feira Framework](https://img.shields.io/badge/Segunda--feira-v7.0-c26cff)
![Premiere Pro](https://img.shields.io/badge/Premiere%20Pro-22.0+-9999ff)
![CEP](https://img.shields.io/badge/CEP-9.0-blue)

## O que faz

1. **Seleciona** o vídeo do Project panel do Premiere
2. **Carrega** a transcrição (TXT/JSON exportado do Premiere — só arrastar!)
3. **Escreve um briefing** (ex: "quero trechos com ganchos fortes sobre produtividade")
4. **Escolhe o modo:**
   - **Trecho contínuo:** encontra janelas fechadas (1 corte só)
   - **Compilação multi-cut:** monta vídeo costurando pedaços de momentos diferentes
5. **A IA processa** e devolve os melhores trechos
6. **1 clique** insere tudo na timeline como subclipes não-destrutivos

> 🆕 **v1.1:** fluxo simplificado com upload direto do TXT/JSON da transcrição
> do Premiere. Sem precisar salvar em pasta específica. Manual in-app incluído (❔).

## Features

- ✅ Multi-provider: **Claude**, **OpenAI**, **Gemini** (escolha por chamada)
- ✅ **Templates de briefing** salvos (reusar "pegada emocional", "financeiro", etc)
- ✅ **Dois modos** de extração (contínuo ou compilação)
- ✅ Múltiplas variações por execução
- ✅ Usa transcrição **nativa do Premiere** (zero custo de transcrição)
- ✅ Prompt caching no Claude (economia de ~90% em re-runs)
- ✅ Inserção não-destrutiva via subclipes
- ✅ Chaves API armazenadas localmente com ofuscação

## Instalação (modo desenvolvedor)

### 1. Habilitar CEP debug

**macOS** — abra Terminal:
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
```

**Windows** — abra regedit:
```
HKEY_CURRENT_USER\Software\Adobe\CSXS.11 → PlayerDebugMode (String) = 1
HKEY_CURRENT_USER\Software\Adobe\CSXS.10 → PlayerDebugMode (String) = 1
HKEY_CURRENT_USER\Software\Adobe\CSXS.9 → PlayerDebugMode (String) = 1
```

Reinicie o Premiere após habilitar.

### 2. Copiar a extensão

Copie (ou faça symlink de) a pasta `premiere-extension/` para:

**macOS:** `~/Library/Application Support/Adobe/CEP/extensions/FastVideo/`
**Windows:** `%APPDATA%\Adobe\CEP\extensions\FastVideo\`

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Adobe/CEP/extensions/
cp -R premiere-extension ~/Library/Application\ Support/Adobe/CEP/extensions/FastVideo

# Windows (PowerShell)
Copy-Item -Recurse premiere-extension "$env:APPDATA\Adobe\CEP\extensions\FastVideo"
```

### 3. Abrir no Premiere

Abra o Premiere Pro → menu **Window > Extensions > FASTVIDEO**.

### 4. Configurar providers

Clique no ⚙ no canto superior direito → aba **Providers** → cole sua API key de pelo menos um:

- **Claude:** https://console.anthropic.com/settings/keys
- **OpenAI:** https://platform.openai.com/api-keys
- **Gemini:** https://aistudio.google.com/app/apikey

Clique em **Testar conexão** para validar e depois **Salvar chaves**.

## Como usar

### Passo a passo

1. **Importe o vídeo** no Project panel do Premiere
2. **Gere a transcrição:** `Window > Text > Transcript > Transcrever sequência`
3. **Exporte a transcrição:** no painel Transcript, clique em `⋯` > **Exportar transcrição** > escolha **TXT** ou **JSON** (qualquer um dos dois funciona). Salve em qualquer pasta.
4. Na extensão FASTVIDEO:
   - **Passo 1:** selecione o vídeo no Project panel, clique em "Usar clipe selecionado"
   - **Passo 2:** **arraste o arquivo TXT/JSON** da transcrição para a área indicada (ou cole o texto)
   - **Passo 3:** escreva o briefing
   - **Passo 4:** configure modo, duração e modelo de IA
   - Clique **Iniciar extração**
5. Revise os trechos sugeridos, desmarque os indesejados
6. Clique **Adicionar à timeline**

> Dentro da extensão existe um botão **❔ Manual** no topo, com tutorial passo-a-passo completo.

### Formatos de transcrição suportados

A extensão detecta automaticamente o formato:
- **TXT do Premiere** (com timestamps `Speaker N  HH:MM:SS`)
- **JSON do Premiere** (export JSON do painel Transcript)
- **SRT** (legendas)
- **VTT** (WebVTT)
- **CSV** (start, end, text)
- **TXT puro** (sem timestamps — estima timestamps por palavra)

### Templates de briefing

Escreva um briefing → clique **💾 Salvar** → dê um nome.
Próxima vez: clique **📂 Carregar** e escolha o template.

Templates padrão já vêm incluídos:
- **Pegada emocional** — histórias pessoais, superação
- **Financeiro/Empresarial** — insights de negócios e ROI
- **Reels educacionais** — ensina algo em 30-60s

## Empacotamento (.zxp)

Para gerar um instalador `.zxp` distribuível:

```bash
# Precisa do ZXPSignCmd da Adobe (baixar em https://github.com/Adobe-CEP/CEP-Resources)
cd premiere-extension
./build/package.sh
# Saída: build/FastVideo.zxp
```

Os usuários instalam o `.zxp` via **ZXP Installer** (UnifiedPluginInstallerAgent) ou **Anastasiy's Extension Manager**.

## Estrutura do projeto

```
premiere-extension/
├── CSXS/
│   └── manifest.xml          # Manifesto CEP
├── client/
│   ├── index.html             # Painel HTML
│   ├── styles.css             # Tema dark Premiere
│   ├── assets/
│   │   └── icon.png
│   └── js/
│       ├── CSInterface.js     # Shim Adobe CEP
│       ├── storage.js         # LocalStorage + ofuscação
│       ├── providers.js       # Claude/OpenAI/Gemini
│       ├── templates.js       # CRUD templates
│       ├── transcript-parser.js # Parser multi-formato (TXT/JSON/SRT/VTT/CSV)
│       └── main.js            # Controller principal
├── host/
│   ├── json2.jsx              # JSON polyfill ES
│   ├── index.jsx              # Entry ExtendScript (selectItem + insertClips)
│   └── timeline.jsx           # createSubClip + insertClip
├── build/
│   └── package.sh             # Script empacotamento .zxp
├── .debug                     # Config debug port 8088
└── README.md
```

## Troubleshooting

**Painel não aparece no menu Extensions:**
- Confirme que `PlayerDebugMode = 1` foi aplicado antes de abrir o Premiere
- Reinicie o Premiere

**"Transcrição inválida":**
- Re-exporte do Premiere como TXT ou JSON (painel Transcript > ⋯ > Exportar)
- Alternativa: cole o texto direto usando "Ou cole o texto da transcrição"
- A extensão aceita TXT, JSON, SRT, VTT, CSV automaticamente

**"Falha na extração / resposta inválida":**
- Teste a conexão do provider nas Settings
- Verifique crédito/quota na conta do provider
- Tente um modelo mais capaz (Sonnet 4.6 > Haiku 4.5 para compilação multi-cut)

**Inserção falha:**
- Certifique-se de ter uma sequência ativa ou marque **"Criar nova sequência"**
- O vídeo deve estar na biblioteca do projeto (não só no disco)

## Custo estimado

Vídeo de 10 minutos:
- **Claude Haiku 4.5:** ~$0,002 (com prompt caching)
- **Claude Sonnet 4.6:** ~$0,02
- **GPT-4o mini:** ~$0,003
- **Gemini 2.5 Flash:** ~$0,001

## Roadmap

- [ ] UXP nativo (quando Premiere expuser toda API de timeline)
- [ ] Suporte a múltiplos clipes de entrada
- [ ] Preview in-panel antes da inserção
- [ ] Auto-snap em silêncios (frame-accurate)
- [ ] Exportar batch direto para redes sociais

## Licença

MIT © Segunda-feira Framework

---

Construído com ♥ pelo `@architect` + `@dev` + `@creative-director` do [Segunda-feira Framework](../README.md).
