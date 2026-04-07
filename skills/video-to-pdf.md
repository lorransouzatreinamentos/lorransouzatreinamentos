---
name: video-to-pdf
description: "Pipeline completo de transcrição de vídeos e geração de PDFs educacionais profissionais. Use quando precisar transcrever vídeos de Vimeo, YouTube ou qualquer plataforma, gerar material didático em PDF, ou converter aulas/cursos em documentos formatados."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
arguments:
  - name: url
    description: URL do vídeo, playlist ou canal
    required: false
  - name: platform
    description: "Plataforma: vimeo | youtube | url (default: url)"
    required: false
  - name: brand
    description: Nome do instituto/marca para o PDF
    required: false
  - name: whisper_model
    description: "Modelo Whisper: base | small | medium (default: base)"
    required: false
  - name: output_dir
    description: "Pasta de saída (default: ~/Downloads)"
    required: false
---

# Video to PDF Pipeline

Transcreve vídeos de qualquer plataforma e gera PDFs educacionais profissionais com layout editorial.

## Parâmetros

| Param | Default | Opções |
|-------|---------|--------|
| `platform` | url | vimeo, youtube, url |
| `credentials` | - | usuário:senha (quando necessário) |
| `videos` | - | URLs, IDs, ou "all" |
| `brand` | - | Nome do instituto/marca |
| `language` | pt | Código ISO do idioma |
| `whisper_model` | base | base, small, medium |
| `output_dir` | ~/Downloads | Qualquer caminho absoluto |

---

## Fase 0: Pre-Flight (Dependências)

Verificar e instalar TODAS as dependências antes de começar. Executar este script Bash:

```bash
#!/bin/bash
set -e
TEMP_DIR="$HOME/Downloads/video_temp"
mkdir -p "$TEMP_DIR"

echo "=== Verificando dependências ==="

# 1. yt-dlp
if ! command -v yt-dlp &>/dev/null; then
  echo "Instalando yt-dlp..."
  if [[ "$(uname)" == "Darwin" ]]; then
    brew install yt-dlp 2>/dev/null || pip3 install yt-dlp
  else
    pip3 install yt-dlp
  fi
fi
echo "yt-dlp: $(yt-dlp --version)"

# 2. ffmpeg
if ! command -v ffmpeg &>/dev/null; then
  if [[ -f "$HOME/ffmpeg" ]]; then
    export PATH="$HOME:$PATH"
  elif [[ -f "$HOME/ffmpeg/ffmpeg" ]]; then
    export PATH="$HOME/ffmpeg:$PATH"
  else
    echo "Instalando ffmpeg..."
    if [[ "$(uname)" == "Darwin" ]]; then
      brew install ffmpeg
    else
      sudo apt-get install -y ffmpeg
    fi
  fi
fi
echo "ffmpeg: $(ffmpeg -version 2>&1 | head -1)"

# 3. whisper (openai-whisper)
if ! command -v whisper &>/dev/null; then
  echo "Instalando whisper..."
  pip3 install openai-whisper
fi
echo "whisper: instalado"

# 4. PyMuPDF (fitz)
python3 -c "import fitz" 2>/dev/null || {
  echo "Instalando PyMuPDF..."
  pip3 install PyMuPDF
}
echo "PyMuPDF: $(python3 -c 'import fitz; print(fitz.version)')"

echo "=== Todas dependências OK ==="
```

**Se qualquer instalação falhar:** reportar o erro e sugerir instalação manual antes de prosseguir.

---

## Fase 1: Acesso à Plataforma

### Opção A: yt-dlp direto (preferencial)

Para YouTube, Vimeo público, e qualquer URL compatível:

```bash
# Listar vídeos de uma playlist/canal
yt-dlp --flat-playlist --print "%(id)s | %(title)s | %(duration_string)s" "URL_AQUI"

# Com credenciais (Vimeo privado)
yt-dlp --username "EMAIL" --password "SENHA" --flat-playlist --print "%(id)s | %(title)s" "URL_AQUI"
```

### Opção B: Playwright (quando yt-dlp falha com login)

Usar APENAS se yt-dlp retornar erro de autenticação:

```bash
# Instalar Playwright se necessário
pip3 install playwright && playwright install chromium
```

Fluxo Playwright:
1. Abrir browser com `playwright.chromium.launch(headless=False)`
2. Navegar até a página de login da plataforma
3. Preencher credenciais e submeter
4. Navegar até a biblioteca de vídeos
5. Extrair URLs dos vídeos via DOM
6. Fechar browser
7. Passar URLs para yt-dlp

### Decisão de Roteamento

```
URL fornecida?
  SIM -> yt-dlp direto (tentar sem login primeiro)
    Falhou com 403/401?
      Credenciais fornecidas?
        SIM -> yt-dlp --username --password
          Falhou novamente?
            SIM -> Playwright login -> extrair URLs -> yt-dlp
        NÃO -> Solicitar credenciais ao usuário
  NÃO -> Solicitar URL ao usuário
```

---

## Fase 2: Download de Áudio

```bash
TEMP_DIR="$HOME/Downloads/video_temp"
mkdir -p "$TEMP_DIR"

# Download áudio MP3 128kbps — um vídeo
yt-dlp -x --audio-format mp3 --audio-quality 128K \
  --ffmpeg-location "$(which ffmpeg)" \
  -o "$TEMP_DIR/%(title)s.%(ext)s" \
  "URL_DO_VIDEO"

# Download de múltiplos vídeos (playlist)
yt-dlp -x --audio-format mp3 --audio-quality 128K \
  --ffmpeg-location "$(which ffmpeg)" \
  -o "$TEMP_DIR/%(playlist_index)02d - %(title)s.%(ext)s" \
  "URL_DA_PLAYLIST"

# Com credenciais
yt-dlp -x --audio-format mp3 --audio-quality 128K \
  --username "EMAIL" --password "SENHA" \
  --ffmpeg-location "$(which ffmpeg)" \
  -o "$TEMP_DIR/%(playlist_index)02d - %(title)s.%(ext)s" \
  "URL"
```

**Verificação pós-download:**
```bash
# Contar arquivos baixados
ls -la "$TEMP_DIR"/*.mp3 | wc -l
# Verificar tamanhos (nenhum deve ser 0 bytes)
find "$TEMP_DIR" -name "*.mp3" -size 0 -print
```

---

## Fase 3: Transcrição com Whisper

### Transcrição individual
```bash
whisper "$TEMP_DIR/arquivo.mp3" \
  --model base \
  --language pt \
  --output_format txt \
  --output_dir "$TEMP_DIR"
```

### Transcrição em lote (paralelo)
```bash
#!/bin/bash
TEMP_DIR="$HOME/Downloads/video_temp"
MODEL="base"  # ou small, medium
LANG="pt"
MAX_PARALLEL=3

process_file() {
  local file="$1"
  local basename=$(basename "$file" .mp3)
  echo "Transcrevendo: $basename"
  whisper "$file" --model "$MODEL" --language "$LANG" \
    --output_format txt --output_dir "$TEMP_DIR"
  echo "Concluído: $basename"
}

export -f process_file
export TEMP_DIR MODEL LANG

# Processar em paralelo (máximo 3 simultâneos)
find "$TEMP_DIR" -name "*.mp3" -print0 | \
  xargs -0 -P "$MAX_PARALLEL" -I {} bash -c 'process_file "{}"'

echo "=== Transcrição concluída ==="
ls -la "$TEMP_DIR"/*.txt | wc -l
```

### Modelos Whisper — Guia de Escolha

| Modelo | VRAM | Velocidade | Qualidade PT | Quando Usar |
|--------|------|-----------|-------------|-------------|
| base | ~1GB | Rápido | Boa | Vídeos claros, áudio limpo |
| small | ~2GB | Médio | Muito boa | Padrão recomendado |
| medium | ~5GB | Lento | Excelente | Áudio ruim, sotaques fortes |

---

## Fase 4: Geração do PDF

### REGRA CRÍTICA: Fonte com Suporte a Acentos

O PDF DEVE renderizar corretamente: ã é í ó ú ç Ã É Í Ó Ú Ç ñ

**Estratégia de fonte (em ordem de preferência):**

1. macOS: `/System/Library/Fonts/Helvetica.ttc` ou `/Library/Fonts/Arial Unicode.ttf`
2. Linux: `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`
3. Fallback: baixar NotoSans de `https://fonts.google.com/noto/specimen/Noto+Sans`

**Teste obrigatório antes de gerar:**
```python
import fitz
doc = fitz.open()
page = doc.new_page()
font = fitz.Font(fontfile="/System/Library/Fonts/Helvetica.ttc")
page.insert_font(fontname="helvttf", fontbuffer=font.buffer)
tw = fitz.TextWriter(page.rect)
tw.append(
    (72, 100),
    "Teste: ação, educação, você, saúde, único",
    fontsize=14,
    font=font,
)
tw.write_text(page)
doc.save("/tmp/test_acentos.pdf")
doc.close()
print("Verificar /tmp/test_acentos.pdf — acentos OK?")
```

### Script Python Completo para Geração do PDF

```python
#!/usr/bin/env python3
"""
Video-to-PDF Generator
Gera PDFs educacionais profissionais a partir de transcrições.
"""

import fitz  # PyMuPDF
import os
import re
import textwrap
from datetime import datetime
from pathlib import Path


class Config:
    """Configuração de cores, layout e fontes."""

    # Cores
    DARK_BG = fitz.pdfcolor["gray10"]    # #1a1a1a
    HEADER_BG = (0.102, 0.102, 0.180)    # #1a1a2e
    GREEN = (0, 0.784, 0.325)             # #00C853
    WHITE = (1, 1, 1)
    LIGHT_GRAY = (0.95, 0.95, 0.95)
    DARK_TEXT = (0.15, 0.15, 0.15)
    RED_ALERT = (0.898, 0.224, 0.208)     # #E53935
    GREEN_TIP = (0, 0.784, 0.325)

    # Layout A4
    PAGE_WIDTH = 595.28
    PAGE_HEIGHT = 841.89
    MARGIN_LEFT = 56
    MARGIN_RIGHT = 56
    MARGIN_TOP = 72
    MARGIN_BOTTOM = 72
    CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

    # Caminhos de fontes com suporte a acentuação
    FONT_PATHS = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/SFPro.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    ]

    @classmethod
    def find_font(cls):
        """Encontra uma fonte TrueType com suporte a acentuação."""
        for path in cls.FONT_PATHS:
            if os.path.exists(path):
                return path
        # Fallback: baixar NotoSans
        fallback = os.path.expanduser("~/Downloads/video_temp/NotoSans-Regular.ttf")
        if not os.path.exists(fallback):
            import urllib.request
            url = (
                "https://github.com/google/fonts/raw/main/"
                "ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
            )
            urllib.request.urlretrieve(url, fallback)
        return fallback


class PDFGenerator:
    """Gerador de PDFs educacionais com layout profissional."""

    def __init__(self, brand: str, output_dir: str):
        self.brand = brand
        self.output_dir = output_dir
        self.font_path = Config.find_font()
        self.font = fitz.Font(fontfile=self.font_path)
        self.doc = None
        self.current_y = Config.MARGIN_TOP

    def _new_page(self):
        page = self.doc.new_page(
            width=Config.PAGE_WIDTH, height=Config.PAGE_HEIGHT
        )
        self.current_y = Config.MARGIN_TOP
        return page

    def _check_space(self, page, needed: float):
        """Se não há espaço suficiente, cria nova página."""
        if self.current_y + needed > Config.PAGE_HEIGHT - Config.MARGIN_BOTTOM:
            self._add_footer(page)
            page = self._new_page()
        return page

    def _draw_rect(self, page, x, y, w, h, color):
        rect = fitz.Rect(x, y, x + w, y + h)
        shape = page.new_shape()
        shape.draw_rect(rect)
        shape.finish(fill=color, color=color)
        shape.commit()

    def _write_text(self, page, x, y, text, size=11, color=Config.DARK_TEXT):
        tw = fitz.TextWriter(page.rect)
        tw.append(fitz.Point(x, y), text, fontsize=size, font=self.font)
        tw.write_text(page, color=color)
        return y

    def _wrap_and_write(self, page, x, y, text, size=11,
                        color=Config.DARK_TEXT, max_width=None):
        """Escreve texto com word wrap. Retorna página atual."""
        if max_width is None:
            max_width = Config.CONTENT_WIDTH
        chars_per_line = int(max_width / (size * 0.52))
        lines = textwrap.wrap(text, width=chars_per_line)
        line_height = size * 1.5
        for line in lines:
            page = self._check_space(page, line_height)
            self._write_text(
                page, x, self.current_y, line, size=size, color=color
            )
            self.current_y += line_height
        return page

    def _add_footer(self, page):
        """Rodapé: marca | título | data | página."""
        y = Config.PAGE_HEIGHT - 40
        self._draw_rect(page, 0, y - 5, Config.PAGE_WIDTH, 1, Config.GREEN)
        page_num = len(self.doc)
        footer = (
            f"{self.brand}  |  {self.title}  |  "
            f"{self.date_str}  |  Página {page_num}"
        )
        self._write_text(
            page, Config.MARGIN_LEFT, y + 10, footer,
            size=8, color=(0.5, 0.5, 0.5),
        )

    def _create_cover(self, title: str, subtitle: str, stats: dict):
        """Página de capa com header escuro e barra de estatísticas."""
        page = self._new_page()

        # Fundo escuro header (metade superior)
        self._draw_rect(page, 0, 0, Config.PAGE_WIDTH, 420, Config.HEADER_BG)

        # Nome do instituto em verde
        self._write_text(
            page, Config.MARGIN_LEFT, 120,
            self.brand.upper(), size=14, color=Config.GREEN,
        )

        # Título principal
        self._write_text(
            page, Config.MARGIN_LEFT, 200,
            title, size=28, color=Config.WHITE,
        )

        # Subtítulo
        if subtitle:
            self._write_text(
                page, Config.MARGIN_LEFT, 260,
                subtitle, size=14, color=(0.7, 0.7, 0.8),
            )

        # Barra de estatísticas
        stats_y = 350
        self._draw_rect(
            page, Config.MARGIN_LEFT, stats_y,
            Config.CONTENT_WIDTH, 40, Config.GREEN,
        )
        stats_text = "  |  ".join(
            [f"{k}: {v}" for k, v in stats.items()]
        )
        self._write_text(
            page, Config.MARGIN_LEFT + 15, stats_y + 25,
            stats_text, size=10, color=Config.WHITE,
        )

        # Data
        self._write_text(
            page, Config.MARGIN_LEFT, 500,
            f"Material gerado em {self.date_str}",
            size=11, color=Config.DARK_TEXT,
        )

        # Aviso
        self._write_text(
            page, Config.MARGIN_LEFT, 530,
            "Transcrição automática — conteúdo fiel ao vídeo original.",
            size=9, color=(0.5, 0.5, 0.5),
        )

    def _create_toc(self, chapters: list):
        """Página de sumário com capítulos numerados."""
        page = self._new_page()

        # Header
        self._draw_rect(page, 0, 0, Config.PAGE_WIDTH, 80, Config.HEADER_BG)
        self._write_text(
            page, Config.MARGIN_LEFT, 50,
            "SUMÁRIO", size=22, color=Config.WHITE,
        )

        self.current_y = 120
        for i, chapter in enumerate(chapters, 1):
            page = self._check_space(page, 50)

            # Número verde
            num_text = f"{i:02d}"
            self._write_text(
                page, Config.MARGIN_LEFT, self.current_y,
                num_text, size=18, color=Config.GREEN,
            )

            # Título do capítulo
            self._write_text(
                page, Config.MARGIN_LEFT + 40, self.current_y,
                chapter["title"], size=13, color=Config.DARK_TEXT,
            )

            # Descrição breve
            if chapter.get("description"):
                self.current_y += 18
                self._write_text(
                    page, Config.MARGIN_LEFT + 40, self.current_y,
                    chapter["description"], size=9, color=(0.5, 0.5, 0.5),
                )

            self.current_y += 35

    def _create_chapter(self, number: int, title: str, content: str):
        """Página de conteúdo com header numerado e corpo estruturado."""
        page = self._new_page()

        # Header do capítulo
        self._draw_rect(page, 0, 0, Config.PAGE_WIDTH, 90, Config.HEADER_BG)
        self._write_text(
            page, Config.MARGIN_LEFT, 40,
            f"{number:02d}", size=32, color=Config.GREEN,
        )
        self._write_text(
            page, Config.MARGIN_LEFT + 55, 45,
            title, size=18, color=Config.WHITE,
        )

        self.current_y = 120

        # Processar conteúdo em blocos
        blocks = self._parse_content(content)
        for block in blocks:
            if block["type"] == "paragraph":
                page = self._wrap_and_write(
                    page, Config.MARGIN_LEFT, self.current_y,
                    block["text"], size=11,
                )
                self.current_y += 8

            elif block["type"] == "heading":
                page = self._check_space(page, 30)
                self._write_text(
                    page, Config.MARGIN_LEFT, self.current_y,
                    block["text"], size=13, color=Config.HEADER_BG,
                )
                self.current_y += 22

            elif block["type"] == "bullet":
                page = self._check_space(page, 20)
                bullet_text = f"  •  {block['text']}"
                page = self._wrap_and_write(
                    page, Config.MARGIN_LEFT + 10, self.current_y,
                    bullet_text, size=10,
                )
                self.current_y += 4

            elif block["type"] == "tip":
                page = self._add_callout_box(page, block["text"], "tip")

            elif block["type"] == "alert":
                page = self._add_callout_box(page, block["text"], "alert")

        self._add_footer(page)

    def _add_callout_box(self, page, text, box_type="tip"):
        """Caixa de destaque: verde (dica) ou vermelha (alerta)."""
        page = self._check_space(page, 60)
        color = Config.GREEN_TIP if box_type == "tip" else Config.RED_ALERT
        label = "DICA" if box_type == "tip" else "ATENÇÃO"

        # Borda esquerda colorida
        self._draw_rect(
            page, Config.MARGIN_LEFT, self.current_y, 4, 50, color,
        )
        # Fundo claro
        self._draw_rect(
            page, Config.MARGIN_LEFT + 4, self.current_y,
            Config.CONTENT_WIDTH - 4, 50, Config.LIGHT_GRAY,
        )
        # Label
        self._write_text(
            page, Config.MARGIN_LEFT + 15, self.current_y + 15,
            label, size=9, color=color,
        )
        # Texto
        self._write_text(
            page, Config.MARGIN_LEFT + 15, self.current_y + 32,
            text[:100], size=10, color=Config.DARK_TEXT,
        )
        self.current_y += 65
        return page

    def _create_checklist(self, items: list):
        """Página final com checklist de ação."""
        page = self._new_page()

        self._draw_rect(page, 0, 0, Config.PAGE_WIDTH, 80, Config.HEADER_BG)
        self._write_text(
            page, Config.MARGIN_LEFT, 50,
            "CHECKLIST DE AÇÃO", size=22, color=Config.WHITE,
        )

        self.current_y = 120
        for item in items:
            page = self._check_space(page, 25)
            checkbox = f"[ ]  {item}"
            self._write_text(
                page, Config.MARGIN_LEFT + 10, self.current_y,
                checkbox, size=11, color=Config.DARK_TEXT,
            )
            self.current_y += 25

        self._add_footer(page)

    def _parse_content(self, text: str) -> list:
        """Converte texto bruto em blocos estruturados."""
        blocks = []
        paragraphs = text.split("\n\n")
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            if len(para) < 80 and (para.isupper() or para.endswith(":")):
                blocks.append({"type": "heading", "text": para})
            elif para.startswith(("- ", "* ")):
                for line in para.split("\n"):
                    line = line.lstrip("- *").strip()
                    if line:
                        blocks.append({"type": "bullet", "text": line})
            elif para.lower().startswith(("dica:", "importante:", "lembre")):
                blocks.append({"type": "tip", "text": para})
            elif para.lower().startswith(("atenção:", "cuidado:", "alerta:")):
                blocks.append({"type": "alert", "text": para})
            else:
                blocks.append({"type": "paragraph", "text": para})
        return blocks

    def _organize_chapters(self, transcriptions: list) -> list:
        """Organiza transcrições em capítulos (cada arquivo = 1 capítulo)."""
        chapters = []
        for i, t in enumerate(transcriptions, 1):
            title = t["title"]
            clean_title = re.sub(r'^\d+\s*[-_.]\s*', '', title)
            chapters.append({
                "number": i,
                "title": clean_title,
                "description": f"Transcrição do vídeo {i}",
                "content": t["content"],
            })
        return chapters

    def generate(self, transcriptions: list, title: str, subtitle: str = ""):
        """
        Gera o PDF completo.

        Args:
            transcriptions: Lista de dicts {"title": str, "content": str}
            title: Título principal do documento
            subtitle: Subtítulo (opcional)
        """
        self.title = title
        self.date_str = datetime.now().strftime("%d/%m/%Y")
        self.doc = fitz.open()

        chapters = self._organize_chapters(transcriptions)

        stats = {
            "Capítulos": str(len(chapters)),
            "Palavras": str(sum(len(c["content"].split()) for c in chapters)),
            "Gerado em": self.date_str,
        }

        # Gerar páginas
        self._create_cover(title, subtitle, stats)
        self._create_toc(chapters)

        for ch in chapters:
            self._create_chapter(ch["number"], ch["title"], ch["content"])

        # Checklist baseado nos títulos dos capítulos
        checklist_items = [f"Revisar: {ch['title']}" for ch in chapters]
        checklist_items.append("Aplicar conceitos na prática")
        checklist_items.append("Compartilhar com a equipe")
        self._create_checklist(checklist_items)

        # Salvar
        output_path = os.path.join(
            self.output_dir, f"{self._slugify(title)}.pdf"
        )
        self.doc.save(output_path)
        self.doc.close()
        print(f"PDF gerado: {output_path}")
        return output_path

    def _slugify(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[\s_]+', '-', text)
        return text[:80]


def generate_pdf_from_transcriptions(
    transcription_dir: str,
    brand: str,
    title: str,
    subtitle: str = "",
    output_dir: str = None,
) -> str:
    """
    Gera PDF a partir de um diretório com arquivos .txt de transcrição.

    Args:
        transcription_dir: Pasta com arquivos .txt
        brand: Nome da marca/instituto
        title: Título do PDF
        subtitle: Subtítulo
        output_dir: Pasta de saída (default: mesmo diretório)

    Returns:
        Caminho do PDF gerado
    """
    if output_dir is None:
        output_dir = transcription_dir

    txt_files = sorted(Path(transcription_dir).glob("*.txt"))
    if not txt_files:
        raise FileNotFoundError(
            f"Nenhum .txt encontrado em {transcription_dir}"
        )

    transcriptions = []
    for f in txt_files:
        content = f.read_text(encoding="utf-8")
        title_from_file = f.stem
        transcriptions.append({
            "title": title_from_file,
            "content": content,
        })

    gen = PDFGenerator(brand=brand, output_dir=output_dir)
    return gen.generate(transcriptions, title, subtitle)
```

### Uso do Script

Salvar o script acima como `~/Downloads/video_temp/generate_pdf.py` e executar:

```bash
python3 ~/Downloads/video_temp/generate_pdf.py
```

Ou importar a função diretamente via Bash:

```bash
python3 -c "
from generate_pdf import generate_pdf_from_transcriptions
generate_pdf_from_transcriptions(
    transcription_dir='$HOME/Downloads/video_temp',
    brand='NOME_DO_INSTITUTO',
    title='Título do Material',
    subtitle='Subtítulo opcional',
    output_dir='$HOME/Downloads'
)
"
```

---

## Fase 5: Limpeza

```bash
TEMP_DIR="$HOME/Downloads/video_temp"

# Verificar PDFs gerados
echo "=== PDFs gerados ==="
ls -lh "$HOME/Downloads/"*.pdf 2>/dev/null

# Limpar temporários
echo "=== Limpando temporários ==="
rm -f "$TEMP_DIR"/*.mp3
rm -f "$TEMP_DIR"/*.txt
rm -f "$TEMP_DIR"/*.py
rm -f "$TEMP_DIR"/*.ttf 2>/dev/null
rmdir "$TEMP_DIR" 2>/dev/null

echo "=== Limpeza concluída ==="
```

---

## Pipeline Completo — Sequência de Execução

```
FASE 0: Pre-Flight
  +-- Verificar/instalar: yt-dlp, ffmpeg, whisper, PyMuPDF
       |
FASE 1: Acesso
  +-- Identificar plataforma -> listar vídeos -> seleção
       |
FASE 2: Download
  +-- yt-dlp -x --audio-format mp3 -> ~/Downloads/video_temp/
       |
FASE 3: Transcrição
  +-- whisper --model {model} --language {lang} -> .txt
       |
FASE 4: PDF
  +-- Teste acentos -> gerar PDF educacional -> ~/Downloads/
       |
FASE 5: Limpeza
  +-- Remover MP3, TXT temporários -> manter apenas PDFs
```

## Tratamento de Erros

| Erro | Causa | Solução |
|------|-------|---------|
| `ERROR: 403 Forbidden` | Vídeo privado sem login | Adicionar --username/--password ou usar Playwright |
| `ERROR: unable to extract` | URL inválida ou plataforma não suportada | Verificar URL, tentar copiar do browser |
| `whisper: command not found` | Whisper não instalado | `pip3 install openai-whisper` |
| `ffmpeg: command not found` | ffmpeg não no PATH | Verificar ~/ffmpeg ou instalar via brew/apt |
| Acentos quebrados no PDF | Fonte built-in sem suporte UTF-8 | Usar fonte TrueType do sistema (ver Fase 4) |
| PDF com páginas em branco | Transcrição vazia | Verificar .txt antes de gerar — pular vazios |
| `MemoryError` no Whisper | Modelo grande demais | Usar modelo `base` em vez de `medium` |

## Organização com Claude (Fase 3.5 — Opcional)

Após a transcrição bruta, usar Claude para organizar o conteúdo antes de gerar o PDF:

**Prompt para organização:**
```
Você é um editor educacional. Organize a transcrição abaixo em formato didático:

1. Divida em seções lógicas com títulos descritivos
2. Converta fala informal em texto fluido e claro
3. Mantenha 100% do conteúdo original — NÃO invente nada
4. Adicione marcadores "DICA:" para insights importantes
5. Adicione marcadores "ATENÇÃO:" para alertas/cuidados
6. Use bullets para listas de itens
7. Mantenha todos os acentos corretos (português brasileiro)

Transcrição:
[COLAR CONTEÚDO DO .TXT AQUI]
```

Isso melhora significativamente a qualidade do PDF final.

## Exemplos de Uso

### Exemplo 1: Curso no Vimeo (privado)
```
/video-to-pdf
  url: https://vimeo.com/showcase/12345678
  platform: vimeo
  credentials: email@exemplo.com:senha123
  brand: Instituto Cliente C
  whisper_model: small
```

### Exemplo 2: Playlist YouTube (pública)
```
/video-to-pdf
  url: https://www.youtube.com/playlist?list=PLxxxx
  platform: youtube
  brand: Canal Educacional XYZ
  whisper_model: base
```

### Exemplo 3: Vídeo único
```
/video-to-pdf
  url: https://www.youtube.com/watch?v=xxxxx
  brand: Meu Curso
```
