# Backend próprio

Node.js 24 e SQLite, sem dependências npm. O serviço foi reconstruído e testado em loopback; não foi publicado.

## Preparar

Na pasta `apps/estudio-ls`:

```sh
node scripts/configure-server.mjs
```

O comando cria `.env` privado (0600), com segredo administrativo e chaves VAPID aleatórios, sem imprimir valores. Recusa sobrescrever configuração existente. Edite localmente:

- `AI_API_KEY`: sua chave OpenAI, somente no servidor.
- `AI_MODEL`: modelo habilitado em sua conta (padrão `gpt-4.1-mini`).
- `VAPID_SUBJECT`: contato real no formato `mailto:voce@dominio.com`.
- `LS_ALLOWED_ORIGINS`: origens exatas separadas por vírgula, incluindo a URL do backend e `chrome-extension://ID_DA_EXTENSAO`, sem barra final. Veja o ID em chrome://extensions.

```sh
node --env-file=.env server/start.js
```

Por padrão, escuta somente `127.0.0.1:8787`. Saúde: `GET /health`. Banco persistente: `server/data/estudio.sqlite`.

## Criar conta

Com o serviço rodando, em outro terminal:

```sh
node --env-file=.env scripts/invitation.mjs 30
```

O convite de uso único é salvo em `.setup-invitation`, sem exibir seu valor. Abra-o localmente e use em **Conta e IA → Criar conta**. Não envie segredo, convite ou senha pelo chat. O exemplo emite 30 dias e até dois aparelhos.

Na extensão, conecte a origem do serviço, entre e vincule o aparelho. Tokens expiram em 24 horas e ao fechar o navegador; o servidor verifica licença e limite de aparelhos. Não há recuperação de senha, renovação comercial ou cobrança integrada.

## Controle remoto e publicação

Para uso no celular, é necessária hospedagem com HTTPS, disco persistente para SQLite, backups e gestão de segredos. Não foi provisionado serviço pago ou domínio nesta tarefa. O Dockerfile facilita a implantação, mas não foi construído/testado aqui. Injete variáveis no provedor, monte `/data`, limite a exposição com reverse proxy e configure origens exatas.

O entrypoint padrão local usa loopback; o Dockerfile define `LS_BIND=0.0.0.0` dentro do contêiner. A janela do estúdio consulta comandos a cada 3s quando **Controle remoto** está ativo. O celular abre a URL pública e faz login na mesma conta. Os comandos expiram em 15s e são consumidos uma vez; uma queda após consumo pode perder a ação, sem repetição automática.

## IA e push

OpenAI usa `https://api.openai.com/v1/responses`, com JSON estruturado e referências às linhas do briefing. Validar referências não prova correção semântica. O padrão é aprovação humana; automático exige opt-in e teste. Cota padrão: 150 gerações por conta/dia UTC; erros devolvem a reserva.

Web Push exige VAPID estável, HTTPS e permissão do dispositivo. Os destinos permitidos são FCM/Chrome, Mozilla e Apple. Payload aes128gcm, assinatura ES256, TTL 60s. Os testes verificam criptografia/assinatura; entrega real não foi realizada.

## Rotas

- GET /health; POST /admin/invitations (X-Admin-Key).
- POST /auth/register, /auth/login, /auth/logout; GET /account.
- GET/POST/DELETE /devices; POST /state.
- GET/POST /commands; POST /commands/ack.
- POST /ai/reply; GET/POST /notifications.
- GET /push/key; POST/DELETE /push/subscribe.

Rotas privadas usam token e licença. Senhas scrypt, hashes de convites/tokens, CORS por origem exata. Proteja banco e `.env`; não os inclua em pacotes de distribuição. Antes de uso comercial, faltam endurecimento operacional, monitoramento, recuperação de conta e pagamentos.
