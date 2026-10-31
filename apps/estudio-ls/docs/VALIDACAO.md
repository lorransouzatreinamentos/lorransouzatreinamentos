# Validação da reconstrução 0.2.1

Os resultados históricos da 0.2.0 não foram reutilizados como se fossem testes desta versão. O ZIP original desapareceu; esta é uma reconstrução a partir da conversa, não uma restauração byte a byte.

Executado nesta reconstrução:

- `npm run check`: sintaxe de extensão/servidor/scripts, referências do Manifest V3 e recursos HTML passaram.
- `npm test`: 12 testes passaram. Cobrem timer, normalização, cenas, limites de origem/backend, comandos, IA/cooldown, criptografia push e assinatura VAPID, isolamento do relay, contas/licenças/aparelhos/controle remoto/cota/logout, fila de ações e isolamento da aba.
- `python3 tests/browser_ui.py`: passou no Chromium com APIs chrome.* modeladas. Exercitou timer com reload, ajustes persistentes, imagem/áudio em IndexedDB, cenas/camadas/canvas, áudio contínuo/efeitos, câmera/microfone sintéticos, gravação WebM não vazia, modo de captura, texto não interpretado como HTML e telas de operação/serviços. Sem erros JavaScript reportados.

Não validado nesta versão: instalação nativa da extensão, alarmes/sidePanel/portas nativos, conexão completa WebRTC com TikTok, ações em live real, modelos reais OpenAI, entrega push, controle remoto em rede pública, captura OBS/LIVE Studio, carga prolongada, Docker e publicação comercial.

Não houve transmissão, envio real de comentário, bloqueio em conta TikTok ou cobrança de provedor de IA. Não é alegada equivalência completa com a referência.
