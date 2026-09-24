# Revenda de ingressos com garantia

Marketplace de revenda em que **ninguém corre risco financeiro**:

- **Entrega:** o ingresso só é entregue por transferência no **app oficial** da ticketeira. PDF e print não valem.
- **Pagamento:** só **Pix**, pago pelo próprio CPF do comprador, então não existe chargeback.
- **Custódia:** o dinheiro fica retido na subconta do vendedor, com a Conta Escrow do Asaas.
- **Liberação:** só **depois do evento** (D+3 dias úteis) e sem disputa aberta.
- **Regras:** cada ticketeira tem seu perfil de regras, e cada evento pode sobrescrever o que precisar.

## Ticketeiras (fase 1)

| | Ingresse | Sympla | Ticketmaster (Quentro) |
|---|---|---|---|
| Dado do comprador | E-mail | Nome + CPF + e-mail | E-mail (ou Quentro ID) |
| Quem vende | Titular da carteira | Só o comprador original | Só o comprador original |
| Janela de venda | Custódia de 45 dias | Fecha 48h antes | Abre 30 dias antes, fecha 8 dias antes |

Os perfis ficam em `src/lib/platforms/profiles.ts`. Valores marcados "a confirmar" precisam de um teste de transferência real.

## Travas que o código garante

- **Custódia:** a compra só abre quando a custódia de 45 dias cobre a data de liberação. A trava fica em `saleWindow` e é coberta por teste.
- **Prazo de arrependimento:** ingressos comprados há menos de 8 dias não podem ser anunciados. Isso cobre os 7 dias do CDC art. 49, em que o comprador original ainda pode cancelar na ticketeira.
- **Futebol:** evento esportivo sempre tem o preço travado no valor de face (Lei 14.597/2023, art. 166).
- **Transferência:** eventos com transferência não confirmada, ou com ingresso nominal e biometria, ficam bloqueados.
- **Confirmação do comprador:** o "recebi" **não libera dinheiro**. A liberação só acontece depois da janela de disputa.
- **Prazo do vendedor:** se o vendedor não transferir no prazo, o comprador é reembolsado automaticamente.
- **Janela de transferência do evento:** a data/hora exatas cadastradas no evento (`transferOpensAt` / `transferEndsAt`) fecham a venda antes do fim da transferência, com o prazo do vendedor de folga. Os anúncios saem do ar sozinhos (`isSaleClosed`).

## Chat do pedido

- **Quando abre:** só depois do pagamento. Antes não há negociação, então não há como combinar "por fora".
- **Filtro:** mensagens com telefone, e-mail, link, CPF ou "manda um pix / chama no whats" são bloqueadas. Elas ficam guardadas para o admin como sinal de risco.
- **Automático:** o sistema posta mensagens a cada mudança de status e oferece respostas rápidas ("já consegue transferir?", "recebi, deu certo!").
- **Depois de concluído:** a conversa fica só para leitura e serve de prova em disputas.

## Estrutura

```
src/lib/rules/        motor de regras (perfil + evento → regras efetivas, validação de anúncio e compra)
src/lib/orders/       máquina de estados do pedido (funções puras)
src/lib/payments/     gateway: interface, mock (dev/testes) e Asaas (Pix + split + escrow)
src/lib/platforms/    perfis iniciais das ticketeiras
src/lib/chat/         regras do chat do pedido (quando abre, filtro de contato)
prisma/schema.prisma  banco de dados (usuários, eventos, anúncios, pedidos, histórico, disputas, chat, "COMPRO")
tests/                testes do motor de regras, dos estados e do pagamento
```

## Telas

- **Início (`/`):** busca, categorias e cards de evento com selos ("Últimas horas", "Últimos ingressos", "Revenda em análise").
- **Evento (`/evento/[slug]`):** ofertas (VENDO), pedidos (COMPRO), setores e valores originais, prazo de vendas e garantia.
- **Cadastro e login (`/cadastro`, `/entrar`):**
  - o cadastro pede nome, CPF (com checagem dos dígitos), nascimento (18+), e-mail, celular e senha;
  - a senha é guardada com scrypt;
  - a sessão fica num cookie httpOnly, e só o hash do token vai para o banco.
- **Anunciar (`/anunciar`):** exige conta **verificada**; o motor de regras valida o anúncio.
- **COMPRO (`/evento/[slug]/compro`):** pedido de compra.
- **Checkout (`/comprar/[id]`):**
  - cria o pedido e **reserva o ingresso por 30 min** (reserva atômica no banco) enquanto o Pix não é pago;
  - gera o Pix e leva à página do pedido.
- **Pedido (`/pedidos/[id]`):**
  - para o comprador: Pix e, depois, o checklist "recebi";
  - para o vendedor: dados do comprador, instruções de transferência e o botão "já transferi";
  - para os dois: disputa e histórico.
  - Em modo teste há o botão "simular pagamento".
- **Minha conta (`/conta`):** compras, vendas (com data de liberação) e anúncios.
- **Rotinas (`/api/cron/rotinas`):** chamar a cada ~5 min com `Authorization: Bearer $CRON_SECRET`. A cada chamada:
  - cancela Pix vencidos e devolve a reserva;
  - reembolsa quando o vendedor perde o prazo;
  - libera o pagamento após o evento (com `payoutStatus`, como no reembolso);
  - tira do ar anúncios de eventos com venda encerrada.

  No plano gratuito da Vercel o cron é só diário; use um agendador externo (ex.: cron-job.org).
- **Chat do pedido:**
  - abre após o pagamento e se atualiza a cada 8 s;
  - tem respostas rápidas e mensagens automáticas a cada etapa;
  - mensagens com contato são bloqueadas e ficam visíveis só para o admin.

**Níveis de conta:**
- **Comprar:** basta o CPF válido.
- **Vender:** a conta precisa ser verificada. Por enquanto a verificação é manual: `npm run admin:verificar -- email`.

O nome da marca é provisório e fica em `src/lib/brand.ts`.

## Rodando localmente

```bash
cp .env.example .env         # ajuste o DATABASE_URL (Postgres)
npm install
npx prisma migrate deploy    # cria as tabelas
npm run db:seed:demo         # ticketeiras + eventos e usuários de exemplo (senha: demo1234)
npm run dev
npm test                     # testes de regras (sem banco)
npm run test:db              # testes com banco (usa TEST_DATABASE_URL ou o banco local revenda_test)
```

## Asaas (sandbox)

- **Variáveis:**
  - `PAYMENT_PROVIDER=asaas`;
  - `ASAAS_API_URL=https://api-sandbox.asaas.com/v3`;
  - `ASAAS_WEBHOOK_TOKEN`;
  - `ASAAS_API_KEY`: opcional quando o ambiente injeta o header `access_token` por proxy.
- **Conferir a conexão:** `npm run asaas:check`. O comando nunca mostra a chave.
- **Webhook:**
  - em Integrações > Webhooks, apontar para `https://<site>/api/webhooks/asaas`;
  - usar o token de autenticação igual a `ASAAS_WEBHOOK_TOKEN`;
  - eventos `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED` e `PAYMENT_REFUNDED`.
- **O que o webhook faz:**
  - confirma o pedido;
  - devolve o Pix se ele foi pago por outro CPF;
  - devolve o Pix se ele foi pago depois de vencido;
  - é idempotente: avisos repetidos não fazem nada.
- **Pix vencido:** a cobrança é cancelada no gateway.
- **Teste no navegador:**
  - `npm run asaas:call -- GET /customers` faz chamadas avulsas ao Asaas, com as chaves ocultas;
  - no sandbox, o botão "Simular pagamento" da página do pedido usa `POST /sandbox/payment/{id}/confirm`.

### O que o sandbox mostrou (24/09/2026)

- **Subcontas só para CNPJ:**
  - uma conta de CPF recebe 403 ao criar subconta;
  - sem subconta não existe split nem Conta Escrow;
  - **a conta de produção precisa ser de CNPJ**;
  - no sandbox de CPF, a cobrança sai sem split, e em produção a venda exige a subconta do vendedor (`requiresSellerWallet`).
- **CPF do pagador:**
  - `GET /payments/{id}` traz `pixTransaction`, e `GET /pix/transactions/{id}` traz `externalAccount.cpfCnpj` **mascarado** (`***.444.777-**`);
  - comparamos os 6 dígitos visíveis (`payerMatchesBuyer`).
- **Reembolso:**
  - o Asaas desconta a taxa do Pix (R$ 0,99 no sandbox) ao receber;
  - devolver o valor cheio exige **saldo na conta da plataforma** para cobrir essa taxa (erro "Saldo insuficiente").
- **Autorização de reembolso:** reembolsos pela API ficam em `AWAITING_CRITICAL_ACTION_AUTHORIZATION` até alguém aprovar a "ação crítica" no painel.

### Política de reembolso (decidida)

- **Valor:** o comprador recebe sempre o **valor integral**, e a taxa do Pix sai do saldo da plataforma. Mantenha saldo de reserva no Asaas.
- **Aprovação:** os reembolsos são **aprovados manualmente** no painel do Asaas.
- **Situação no pedido (`refundStatus`):** `SOLICITADO`, `AGUARDANDO_APROVACAO`, `CONCLUIDO` (pelo webhook `PAYMENT_REFUNDED`) ou `FALHOU` (com a mensagem do gateway).
- **`/admin/reembolsos`:** lista os pendentes e permite "tentar de novo" os que falharam.
- **Sem reembolso duplicado:** a troca para `SOLICITADO` é atômica, então avisos repetidos não geram dois reembolsos.
- **Validade do QR Code:** o Pix vale até um ano. Por isso o site cancela a cobrança quando a reserva vence, e devolve se ela for paga mesmo assim.

## Próximos passos

1. Verificação de identidade do vendedor (documento + selfie) e criação da subconta Asaas com Conta Escrow.
2. Com uma conta de CNPJ no sandbox: validar subconta, split, Conta Escrow e `POST /escrow/{id}/finish`.
3. Avisos por e-mail/WhatsApp: nova mensagem, pagamento confirmado, prazo acabando.
4. Painel admin: eventos, sobreposições de regras e disputas.
