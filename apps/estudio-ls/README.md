# ESTUDIO LS 0.2.1 — reconstrução

Pacote reconstruído a partir do código registrado na conversa após a perda dos arquivos temporários do ambiente anterior. Não é uma cópia byte a byte do ZIP 0.2.0, que não foi recuperado. O objetivo aqui é restaurar uma entrega utilizável, testada e preservada junto ao código.

## Instalação no Chrome

1. Baixe `ESTUDIO-LS-v0.2.1.zip` da pasta `dist`.
2. Descompacte-o em uma pasta permanente.
3. Abra `chrome://extensions` e ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta `ESTUDIO-LS` que contém `manifest.json`.
5. Fixe o ícone e clique nele para abrir o painel lateral. Recarregue as abas TikTok que já estavam abertas.

O ZIP é para instalação local, não é um pacote assinado da Chrome Web Store. Um navegador gerenciado pode bloquear extensões sem compactação.

## O que foi reconstruído

- Painel, timer persistente, prorrogação, cancelamento, badge de término, diário, histórico e exportação JSON.
- Acervo local IndexedDB para imagens, áudios e vídeos, com prévia e exclusão; até 250 MB por arquivo, sujeito à cota do navegador.
- Múltiplas cenas, camadas de texto/bloco/imagem/vídeo, arraste, ordem, opacidade, recorte cover/contain, fundo com zoom/espelhamento e dissolução/corte.
- Playlist de vídeo e áudio contínuo com trechos aleatórios opcionais, ambiência sintética ou arquivos por camada, volumes, celebrações e ducking.
- Câmera/microfone na composição, saída em canvas 720×1280, janela limpa de captura, tela cheia e gravação WebM local limitada aproximadamente a 250 MB.
- Saída de câmera e áudio por WebRTC local para a aba TikTok selecionada, somente quando explicitamente ativada.
- Operações configuráveis por seletores CSS: leitura, encerramento por timer/alerta, tentativa de reabertura, fixação/rotação de produtos, fila de comentários e moderação por alvo/nome/termo.
- IA OpenAI via backend próprio: briefing, referências de fatos, cotas, sugestões editáveis, aprovação ou automático opt-in, com limites globais e por pessoa.
- Backend Node/SQLite: contas por convite, licenças por prazo, limite de aparelhos, revogação de sessões, controle remoto web e Web Push VAPID/aes128gcm.

## Limitações e integração real

**Não há equivalência completa comprovada com o Loopyz.** Continuam pendentes testes no TikTok real, descoberta automática de produtos, fluxos específicos de navegação e modais, catálogo completo de efeitos, reversão/processamento avançado de vídeo, licença offline, recuperação de conta e cobrança recorrente.

Não há backend público ou domínio configurado. A OpenAI real não foi chamada; é necessária uma chave privada no servidor. Entrega push real e captura por OBS/LIVE Studio não foram validadas. A ponte de câmera foi reconstruída, mas o teste atual valida seu isolamento por mensagens, não a instalação nativa nem a conexão completa ao TikTok.

Os testes de UI usam Chromium real com APIs `chrome.*` modeladas. Isso não substitui carregar a extensão em um Chrome autorizado. Câmera e microfone nos testes são sintéticos; nenhuma transmissão ou ação em conta real foi executada.

## Operação

Em **Operação da live**, selecione a aba e configure seletores CSS visíveis e únicos. Campos vazios não executam ações. Valide em conta de teste antes de habilitar automações. Cliques são registrados como tentativas, sem afirmar que o TikTok confirmou o resultado. CAPTCHA configurado interrompe ações; resultados desconhecidos não são repetidos cegamente.

Moderação por autor exige seletor de linha, autor, texto e botão de bloqueio dentro da linha. Autores ambíguos não são bloqueados. O automático da IA é opt-in e publica na sua conta: mantenha a revisão humana até validar briefing e comportamento.

No estúdio, câmera e microfone exigem sua permissão. Para saída TikTok, selecione a aba em Operação, ative a saída e escolha ESTUDIO LS Câmera/Microfone no site. Não é um driver de sistema. Reative após recarga, troca de aba, fechamento do estúdio ou perda do worker.

## Backend e desenvolvimento

Node.js 24+, sem dependências npm. Veja [BACKEND](docs/BACKEND.md).

```sh
npm run check
npm test
npm run package
```

Teste visual opcional, quando Python, Playwright e Chromium estiverem disponíveis:

```sh
python3 tests/browser_ui.py
```

Resultados desta reconstrução: [VALIDACAO](docs/VALIDACAO.md).

## Dados e segurança

Mídia, configurações, briefing, observações e histórico ficam no perfil local. Quando a IA/controle remoto é ativado, dados correspondentes são enviados ao backend escolhido. O acervo de arquivos não é enviado ao servidor. Desinstalar pode apagar a mídia local; exportar histórico não faz backup dos arquivos.

Permissões permanentes: storage, sidePanel, alarms, activeTab e observador HTTPS TikTok. Acesso ao domínio do backend é opcional e solicitado pelo Chrome quando você o configura. Tokens ficam em `chrome.storage.session`; chaves OpenAI/VAPID e segredo administrativo ficam somente no servidor. Não inclua `.env`, banco de dados ou convites no ZIP.

## Preservação e download

O código e os ZIPs foram colocados em `apps/estudio-ls` no checkout local `lorransouzatreinamentos/lorransouzatreinamentos`. Estar no Git **local** não equivale a estar salvo no GitHub. Enviar uma branch para o remoto é uma etapa separada.

Após uma branch ser enviada ao GitHub, abra `apps/estudio-ls/dist/ESTUDIO-LS-v0.2.1.zip` nessa branch e use **Download raw file**. Para todo o código, baixe o ZIP de código-fonte ou use **Code → Download ZIP** na branch correta. Esse caminho não depende dos arquivos temporários do chat.
