# Claudio Cuts — Extensão Adobe Premiere Pro

Extensão que extrai automaticamente os melhores trechos de um vídeo usando IA (Claude, GPT, Gemini) e insere diretamente na timeline do Premiere Pro.

![Segunda-feira Framework](https://img.shields.io/badge/Segunda--feira-v7.0-c26cff)
![Premiere Pro](https://img.shields.io/badge/Premiere%20Pro-22.0+-9999ff)
![CEP](https://img.shields.io/badge/CEP-9.0-blue)

## O que faz

1. **Você arrasta** um vídeo da biblioteca do Premiere para a extensão
2. **Escreve um briefing** (ex: "quero trechos com ganchos fortes sobre produtividade")
3. **Escolhe o modo:**
   - **Trecho contínuo:** encontra janelas fechadas (1 corte só)
   - **Compilação multi-cut:** monta vídeo costurando pedaços de momentos diferentes
4. **A IA processa** a transcrição nativa do Premiere e devolve os melhores trechos
5. **1 clique** insere tudo na timeline como subclipes não-destrutivos

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

**macOS:** `~/Library/Application Support/Adobe/CEP/extensions/ClaudioCuts/`
**Windows:** `%APPDATA%\Adobe\CEP\extensions\ClaudioCuts\`

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Adobe/CEP/extensions/
cp -R premiere-extension ~/Library/Application\ Support/Adobe/CEP/extensions/ClaudioCuts

# Windows (PowerShell)
Copy-Item -Recurse premiere-extension "$env:APPDATA\Adobe\CEP\extensions\ClaudioCuts"
```

### 3. Abrir no Premiere

Abra o Premiere Pro → menu **Window > Extensions > Claudio Cuts**.

### 4. Configurar providers

Clique no ⚙ no canto superior direito → aba **Providers** → cole sua API key de pelo menos um:

- **Claude:** https://console.anthropic.com/settings/keys
- **OpenAI:** https://platform.openai.com/api-keys
- **Gemini:** https://aistudio.google.com/app/apikey

Clique em **Testar conexão** para validar e depois **Salvar chaves**.

## Como usar

### Passo a passo

1. No Premiere, **importe o vídeo** para a biblioteca do projeto (Project panel)
2. Gere a transcrição: **Window > Text > Transcript > Transcrever sequência/clipe**
3. Exporte a transcrição como SRT ao lado do arquivo de vídeo (mesmo nome base)
   - Alternativa: a extensão tenta ler do XMP embed automaticamente
4. Na extensão Claudio Cuts:
   - **Clique na dropzone** (ou arraste o clipe do Project)
   - Escreva o **briefing**
   - Escolha **modo** e **duração**
   - Selecione o **modelo de IA**
   - Clique **Iniciar extração**
5. Revise os trechos sugeridos, desmarque os indesejados
6. Clique **Adicionar à timeline**

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
# Saída: build/ClaudioCuts.zxp
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
│       └── main.js            # Controller principal
├── host/
│   ├── json2.jsx              # JSON polyfill ES
│   ├── index.jsx              # Entry ExtendScript
│   ├── transcript.jsx         # Parser SRT/VTT/prtranscript/XMP
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

**"Transcrição não encontrada":**
- Gere a transcrição no Premiere (Window > Text > Transcript)
- Exporte como SRT com o mesmo nome base do vídeo
- Exemplo: `video.mp4` → salve como `video.srt` na mesma pasta

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
