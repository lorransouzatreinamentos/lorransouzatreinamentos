# Instalação rápida — FASTVIDEO

## 🚀 Modo rápido (3 minutos)

### macOS

```bash
# 1. Habilitar CEP debug (uma vez)
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1

# 2. Clonar/baixar este repo e copiar
git clone <repo-url> fastvideo-src
cp -R fastvideo-src/premiere-extension \
    ~/Library/Application\ Support/Adobe/CEP/extensions/FastVideo

# 3. Reiniciar Premiere Pro
```

### Windows (PowerShell)

```powershell
# 1. Habilitar CEP debug
reg add HKCU\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add HKCU\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add HKCU\Software\Adobe\CSXS.9 /v PlayerDebugMode /t REG_SZ /d 1 /f

# 2. Copiar extensão
git clone <repo-url> fastvideo-src
Copy-Item -Recurse fastvideo-src\premiere-extension "$env:APPDATA\Adobe\CEP\extensions\FastVideo"

# 3. Reiniciar Premiere Pro
```

## 📦 Instalação via .zxp (produção)

Se você baixou o arquivo `FastVideo.zxp`:

1. Baixe o **ZXP Installer** gratuito:
   - https://aescripts.com/learn/zxp-installer/ (Mac/Win)
   - Ou **Anastasiy's Extension Manager**
2. Arraste o `FastVideo.zxp` para dentro da janela do instalador
3. Confirme a instalação
4. Reinicie o Premiere Pro

## ⚙ Primeiro uso

1. Abra Premiere Pro
2. Menu **Window > Extensions > FASTVIDEO**
3. Clique no ícone ⚙ (canto superior direito)
4. Aba **Providers** → cole pelo menos uma API key:
   - **Claude** (recomendado): https://console.anthropic.com/settings/keys
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Gemini** (mais barato): https://aistudio.google.com/app/apikey
5. Clique **Testar conexão** → **Salvar chaves**
6. Volte à tela principal e comece a usar

## ❓ Precisa de ajuda?

Veja o [README.md](README.md) completo para troubleshooting.
