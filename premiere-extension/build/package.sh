#!/usr/bin/env bash
# Empacota FASTVIDEO como .zxp para distribuição.
# Requer: ZXPSignCmd (https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT/build"
OUT_FILE="$BUILD_DIR/FastVideo.zxp"
CERT_FILE="$BUILD_DIR/selfsign.p12"
CERT_PASS="${CERT_PASS:-fastvideo}"

cd "$ROOT"

# 1. Gera certificado self-signed se não existir
if [ ! -f "$CERT_FILE" ]; then
    echo "▶ Gerando certificado self-signed..."
    if command -v ZXPSignCmd &>/dev/null; then
        ZXPSignCmd -selfSignedCert BR SP "Segunda-feira" "FastVideo" "$CERT_PASS" "$CERT_FILE"
    else
        echo "⚠ ZXPSignCmd não encontrado. Baixe em:"
        echo "  https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD"
        echo ""
        echo "Gerando ZIP alternativo para instalação manual..."
        (cd "$ROOT/.." && zip -r "$OUT_FILE.zip" "$(basename "$ROOT")" \
            -x "*/build/*" "*/.git/*" "*.DS_Store" "*.zxp")
        echo "✓ ZIP gerado: $OUT_FILE.zip"
        echo "  Extraia em: ~/Library/Application Support/Adobe/CEP/extensions/FastVideo/"
        exit 0
    fi
fi

# 2. Empacota
echo "▶ Empacotando .zxp..."
ZXPSignCmd -sign "$ROOT" "$OUT_FILE" "$CERT_FILE" "$CERT_PASS" \
    -tsa http://timestamp.digicert.com

echo ""
echo "✓ Gerado: $OUT_FILE"
echo ""
echo "Instalação para usuário final:"
echo "  1. Baixar: https://aescripts.com/learn/zxp-installer/"
echo "  2. Arrastar FastVideo.zxp para o instalador"
echo "  3. Abrir Premiere > Window > Extensions > FASTVIDEO"
