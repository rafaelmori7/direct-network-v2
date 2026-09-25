# Revenda de ingressos com garantia

Marketplace de revenda em que **ninguém corre risco financeiro**:

- **Entrega:** o ingresso só é entregue por transferência no **app oficial** da ticketeira. PDF e print não valem.
- **Pagamento:** só **Pix**, pago pelo próprio CPF do comprador, então não existe chargeback.
- **Custódia:** o Pix cai todo na conta da plataforma no Asaas (sem split). A parte do vendedor e a do parceiro só saem por transferência na liberação.
- **Liberação:** só **depois do evento** (D+3 dias úteis) e sem disputa aberta.
- **Regras:** cada ticketeira tem seu perfil de regras, e cada evento pode sobrescrever o que precisar.

## Ticketeiras (fase 1)

| | Ingresse | Sympla | Ticketmaster (Quentro) |
|---|---|---|---|
| Dado do comprador | E-mail | Nome + CPF + e-mail | E-mail (ou Quentro ID) |
| Quem vende | Titular da carteira | Só o comprador original | Só o comprador original |
| Janela de venda | Até o prazo de transferência | Fecha 48h antes | Abre 30 dias antes, fecha 8 dias antes |

Os perfis ficam em `src/lib/platforms/profiles.ts`. Valores marcados "a confirmar" precisam de um teste de transferência real.

## Travas que o código garante

- **Janela de venda:** a compra abre quando a ticketeira libera a transferência (se ela restringir) e fecha a tempo de o vendedor transferir antes do bloqueio. Não há mais limite de custódia: o dinheiro fica na conta da plataforma até o repasse. A trava fica em `saleWindow` e é coberta por teste.
- **Prazo de arrependimento:** ingressos comprados há menos de 8 dias não podem ser anunciados. Isso cobre os 7 dias do CDC art. 49, em que o comprador original ainda pode cancelar na ticketeira.
- **Futebol:** evento esportivo sempre tem o preço travado no valor de face (Lei 14.597/2023, art. 166).
- **Transferência:** eventos com transferência não confirmada, ou com ingresso nominal e biometria, ficam bloqueados.
- **Confirmação do comprador:** o "recebi" **não libera dinheiro**. A liberação só acontece depois da janela de disputa.
- **Prazo do vendedor:** se o vendedor não transferir no prazo, o comprador é reembolsado automaticamente.
- **Janela de transferência do evento:**
  - a data/hora exatas cadastradas no evento (`transferOpensAt` / `transferEndsAt`) **valem sobre a regra geral da ticketeira**;
  - a venda fecha antes do fim da transferência, deixando o prazo do vendedor de folga;
  - sem data cadastrada, vale a regra geral (Ticketmaster: 30 a 7 dias antes; Sympla: até 24h antes);
  - os anúncios saem do ar sozinhos (`isSaleClosed`).

## Chat do pedido

- **Quando abre:** só depois do pagamento. Antes não há negociação, então não há como combinar "por fora".
- **Filtro:** mensagens com telefone, e-mail, link, CPF ou "manda um pix / chama no whats" são bloqueadas. Elas ficam guardadas para o admin como sinal de risco.
- **Automático:** o sistema posta mensagens a cada mudança de status e oferece respostas rápidas ("já consegue transferir?", "recebi, deu certo!").
- **Depois de concluído:** a conversa fica só para leitura e serve de prova em disputas.

## Estrutura

```
src/lib/rules/        motor de regras (perfil + evento → regras efetivas, validação de anúncio e compra)
src/lib/orders/       máquina de estados do pedido (funções puras)
src/lib/payments/     gateway: interface, mock (dev/testes) e Asaas (Pix + repasse por transferência)
src/lib/platforms/    perfis iniciais das ticketeiras
src/lib/chat/         regras do chat do pedido (quando abre, filtro de contato)
src/lib/partners/     parceiros: slug, indicação e opções do widget
src/app/(site)/       páginas do site (com cabeçalho e rodapé)
src/app/embed/        vitrine do widget, sem cabeçalho (vai em iframe no site da agência)
public/widget.js      script que a agência cola no site
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
- **Painel admin (`/admin`, só para `isAdmin`):**
  - **eventos:** criar e editar, com ticketeira, transferência permitida, janela exata, prazo do vendedor, setores, esportivo e biometria;
  - **disputas:** a decisão fica na página do pedido. Se o vendedor tiver razão antes da data de liberação, o pedido volta a aguardar essa data;
  - **reembolsos pendentes;**
  - **repasses:** liberações com falha, com "tentar de novo", e transferências esperando autorização no painel do Asaas (em `/admin/disputas`);
  - **usuários:** busca por nome, e-mail ou CPF; verificar e remover a verificação de vendedor. **Bloquear** encerra as sessões, pausa os anúncios e desativa os COMPRO;
  - **anúncios:** pausados, ativos, encerrados e removidos; reativar (só se a venda do evento ainda estiver aberta) ou remover;
  - **pedidos:** busca por nº, cobrança, e-mail, CPF ou evento;
  - **avisos:** e-mails e WhatsApp enviados ou registrados.
- **Avisos por e-mail (Resend):**
  - quando: pagamento confirmado (comprador e vendedor), "transfira até…", transferido, recebido, liberado, reembolso, Pix vencido e disputa (partes e admins);
  - lembrete ao vendedor 6h antes do fim do prazo de transferência;
  - nova mensagem no chat, no máximo um e-mail a cada 15 min por pedido;
  - sem `RESEND_API_KEY` e `EMAIL_FROM`, os e-mails só ficam registrados (`EmailLog`);
  - falha no envio nunca trava o pedido.
- **Avisos por WhatsApp (WhatsApp Cloud API, da Meta):**
  - só para quem aceitou: caixa no cadastro, ou ligar/desligar em Minha conta (`whatsappOptIn`);
  - só os avisos que pedem ação ou envolvem dinheiro: pagamento confirmado, "transfira até…", lembrete de prazo, transferido, reembolso, pagamento liberado e disputa. O chat fica só no e-mail;
  - a Meta só entrega mensagem iniciada pela empresa com **modelo aprovado**. Os textos estão em `src/lib/notify/whatsapp.ts` (`WHATSAPP_TEMPLATES`): cadastre cada um no WhatsApp Manager com o mesmo nome, idioma Português (BR) e categoria Utilidade;
  - sem `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`, as mensagens só ficam registradas (mesma tabela dos e-mails, canal WHATSAPP).
- **Como funciona, termos e privacidade (`/como-funciona`, `/termos`, `/privacidade`):** textos montados a partir das regras reais (taxas, prazos, limites). Razão social, CNPJ e endereço (do cartão CNPJ) ficam em `src/components/legal.tsx` e aparecem também no rodapé (Decreto 7.962/2013); podem ser trocados por `COMPANY_*`. Os e-mails vêm de `CONTACT_EMAIL` e `PRIVACY_EMAIL`. O aviso "versão preliminar" some com `LEGAL_REVIEWED=1`, depois da revisão do advogado.
- **Minha conta (`/conta`):** compras, vendas (com data de liberação), anúncios e avisos pelo WhatsApp.
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
- **Comprar:** basta o CPF válido. A verificação do comprador é o próprio Pix, que precisa vir do mesmo CPF.
- **Anunciar:** exige a **conta de recebimento** criada (`/conta/recebimento`, cerca de 2 min: endereço e renda).
  - O site cria a subconta no Asaas com o CPF do vendedor e mostra o link do Asaas para enviar documento e selfie.
  - Enquanto os documentos estão em análise, o vendedor **já anuncia**, com até **10 ingressos ativos**.
- **Receber:**
  - só com a conta **aprovada**, pelo webhook `ACCOUNT_STATUS_GENERAL_APPROVAL_*` ou pelo admin em Usuários;
  - vendas concluídas antes disso ficam em `AGUARDANDO_CADASTRO`, e a rotina paga quando a conta for aprovada.
- **Chave da subconta:** guardada **criptografada** (`ENCRYPTION_KEY`, AES-256-GCM).

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

## Parceiros (agências e promoters)

- **Página do parceiro:** `/<slug>` (ex.: `/timelapse`), com a marca dele. Mostra os eventos dele com o selo "Revenda oficial" e **todos os outros eventos** do site.
- **Link de indicação:** qualquer link com `?ref=<slug>`, ou visitar a página do parceiro, grava a indicação (cookie de 30 dias, vale o último clique).
- **Cupom:** o comprador pode digitar o cupom do parceiro no checkout. O cupom vale mais que o link.
- **Quem ganha a venda (um parceiro por pedido):** cupom → link/página → dono do evento. Pelo cupom ou link o comprador ganha o desconto do parceiro; pelo evento, não.
- **Dinheiro:**
  - o comprador paga **preço + taxa de serviço** (`BUYER_FEE_BPS`, padrão 15%);
  - a comissão do vendedor é opcional (`SELLER_FEE_BPS`, padrão 0%);
  - o cupom dá desconto sobre o **total** (preço + taxa) e sai da receita do site, nunca do vendedor. Ex.: R$ 100 + R$ 15 com cupom de 10% = R$ 103,50;
  - o resto da receita é dividido pela participação do parceiro (padrão 50%);
  - com a subconta do parceiro (`gatewayWalletId`), a parte dele é transferida na liberação, junto com a do vendedor; sem ela, fica com a plataforma para repasse manual.
- **Admin:** `/admin/parceiros` cadastra os parceiros (links, cupom, cor, logo, participação, desconto) e mostra vendas e comissão de cada um. O evento pode ter um parceiro dono.
- **Painel da agência (`/parceiro`):**
  - o admin dá acesso pelo e-mail de quem já tem conta;
  - a agência vê os links e o cupom, as vendas indicadas e a comissão (a liberar e liberada);
  - cadastra e edita **os próprios eventos**, que entram na página dela com o selo de revenda oficial;
  - ajusta a cor e o logo;
  - copia o código do **widget** e vê a prévia.
- **Widget para o site da agência:** uma linha de código mostra a vitrine de revenda dentro do site dela:

  ```html
  <script async src="https://SEU-SITE/widget.js" data-parceiro="timelapse"></script>
  ```

  - opções: `data-eventos="proprios"` (só os eventos da agência), `data-tema="claro"|"escuro"`, `data-limite="8"` (1 a 24), `data-alvo="#id"` (onde colocar);
  - `public/widget.js` cria um iframe de `/embed/<slug>`, que ajusta a altura sozinho (`postMessage`, conferindo a origem);
  - os cards abrem o evento **no nosso site, em outra aba**, com `?ref=<slug>`: o cookie de indicação é gravado lá (primeiro acesso) e não dentro do iframe, onde navegadores bloqueiam cookies de terceiros. Compra, login e Pix nunca acontecem dentro do site da agência;
  - só `/embed/*` pode ser aberto em iframe; o resto do site manda `X-Frame-Options: SAMEORIGIN` (proteção contra clickjacking).

  Na demonstração, `isabela@demo.local` é da Timelapse.

## Publicar (Vercel + Postgres)

1. **Banco:** crie um Postgres gratuito (Neon ou Supabase) e copie a URL de conexão.
2. **Projeto:** na Vercel, clique em **Add New → Project** e importe este repositório.
   - **Root Directory:** `revenda-ingressos`.
   - **Build Command:** `npm run vercel-build`. Ele aplica as migrações, cadastra as ticketeiras e faz o build.
3. **Variáveis de ambiente:**
   - `DATABASE_URL`;
   - `PAYMENT_PROVIDER`, `ASAAS_API_URL`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`;
   - `CRON_SECRET`, `BUYER_FEE_BPS`, `SELLER_FEE_BPS`;
   - `SEED_DEMO=1`, só se quiser os eventos e usuários de exemplo.
4. **Deploy:** faça o deploy do branch.
5. **Agendador:** configure um agendador (ex.: cron-job.org) chamando `GET /api/cron/rotinas` a cada 5 min, com o header `Authorization: Bearer <CRON_SECRET>`.

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
  - eventos `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_REFUNDED`, `TRANSFER_DONE`, `TRANSFER_FAILED` e `TRANSFER_CANCELLED`.
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

### Conta principal CNPJ no sandbox (25/09/2026)

- **Subconta do vendedor:** `POST /accounts` funciona e devolve `walletId` e a chave da subconta. (O site ligava a Conta Escrow dela com `POST /accounts/{id}/escrow`; deixou de ligar com o repasse por transferência.)
- **Split para subconta ainda em análise:** a cobrança paga fica com o split `DONE` (R$ 100 do vendedor foi para a subconta; a plataforma ficou com R$ 15 menos a taxa do Pix).
- **Chave Pix:** a conta precisa de uma chave Pix (criamos uma aleatória, `POST /pix/addressKeys`), senão o QR Code falha.
- **Reembolso de cobrança com split:** o Asaas debita o **valor total da conta principal** (`PAYMENT_REVERSAL` de -R$ 115). Sem saldo para isso, recusa ("não há saldo suficiente"). Com saldo, fica aguardando autorização. O reembolso de `pay_njy75jq1nmjix4s4` terminou **`CANCELLED`** (`PAYMENT_REFUND_CANCELLED` +R$ 115, `refundedSplits: null`, split continua `DONE`), então **ainda não se sabe** se a parte do vendedor volta da subconta.

### Conta Escrow no sandbox (25/09/2026, com a chave da subconta)

- **Split vindo da conta principal NÃO fica retido.** Com escrow ligado na subconta (`GET /accounts/{id}/escrow` → `enabled: true`, 45 dias), o split de R$ 100 de `pay_beikef87rxse4z9h` caiu **livre** no saldo da subconta (`INTERNAL_TRANSFER_CREDIT`, saldo R$ 100). A cobrança não tem `escrow`, e `GET /payments/{id}/escrow` dá 404 com as duas chaves. A subconta não enxerga a cobrança (`GET /payments` vazio), só a transação com o `splitId`.
- **O escrow só vale para cobranças criadas pela própria subconta** (com a chave dela): na confirmação aparece `PAYMENT_CUSTODY_BLOCK` do valor líquido, e a cobrança traz `escrow.status: ACTIVE` (vence em 45 dias).
- **Cobrança da subconta com split para a plataforma** (`pay_x566o7r0bia0xbig`, R$ 115, split R$ 15 para a carteira da conta principal): fica tudo bloqueado, R$ 99,01 na subconta e **os R$ 15 também na conta principal** (`PAYMENT_CUSTODY_BLOCK` nas duas).
- **Consultar:** `GET /payments/{id}/escrow` só funciona com a **chave da subconta** (a conta principal nem enxerga a cobrança: 404).
- **Liberar:** `POST /escrow/{escrowId}/finish` só funciona com a **chave da conta principal** (com a chave da subconta: 404, testado duas vezes). Volta a cobrança com `escrow.status: DONE`, `finishReason: REQUESTED_BY_CUSTOMER`, e desbloqueia as duas partes (`PAYMENT_CUSTODY_BLOCK_REVERSAL` na subconta e na principal). O `escrow.id` também vem em `GET /payments/{id}` (chave da subconta).
- **Pix na subconta:** só depois de aprovada ("O Pix não está disponível no momento. Para utilizá-lo, sua conta precisa estar aprovada."). Boleto funciona e dá para confirmar no sandbox.
- **Reembolso de cobrança com escrow:** não deu para testar. O Asaas só estorna Pix ou cartão, e a subconta ainda não aprovada só emite boleto.
- **Link de documentos:** `GET /myAccount/documents` com a chave da subconta responde 200 (`IDENTIFICATION`, `NOT_SENT`), mas com `onboardingUrl: null` logo após a criação.

### Repasse por transferência (decidido em 25/09/2026)

Como o split não fica retido, o site passou a:

- **Cobrar sem split:** o Pix cai todo na conta da plataforma.
- **Liberar por transferência:** depois do evento, `requestPayout` faz `POST /transfers` (`walletId`, `value`, `externalReference` `pedido-<id>-vendedor` / `pedido-<id>-parceiro`) para a subconta do vendedor e, se houver, a do parceiro.
- **Não pagar duas vezes:** o id de cada transferência feita fica no pedido (`sellerTransferId`, `partnerTransferId`). Se uma falhar, o pedido vai para `FALHOU` e "tentar de novo" (botão em `/admin/disputas`) só faz a que faltou.
- **Autorização no painel:** transferência criada mas não autorizada deixa o repasse em `AGUARDANDO_APROVACAO` (como no reembolso). O webhook `TRANSFER_DONE` / `TRANSFER_FAILED` / `TRANSFER_CANCELLED` e a rotina periódica consultam `GET /transfers/{id}`: todas concluídas → `CONCLUIDO`; uma recusada ou cancelada → `FALHOU`, e o id dela sai do pedido para "tentar de novo" transferir outra vez. O admin vê as pendentes em `/admin/disputas` ("Repasses para aprovar").
- **Reembolsar sem ninguém devolver nada:** o dinheiro ainda está todo na conta da plataforma.

Testado no sandbox:

- **Reembolso de Pix sem split** (`pay_ahx1nga5y1w10bfo`, R$ 115): aceito e aguardando autorização (`AWAITING_CRITICAL_ACTION_AUTHORIZATION`). Logo depois do pagamento, o Asaas respondeu "Não é possível solicitar estorno para essa cobrança no momento. Tente novamente em alguns instantes."; cerca de 20 s depois funcionou. O "tentar de novo" de `/admin/reembolsos` cobre esse caso.
- **Reembolso aprovado no painel:** terminou **`CANCELLED`** (`PAYMENT_REVERSAL` -R$ 115 e depois `PAYMENT_REFUND_CANCELLED` +R$ 115), igual ao de `pay_njy75jq1nmjix4s4`. Ainda não se sabe se é limite do sandbox com Pix simulado ou se a autorização não foi concluída.
- **Transferência:** a chave precisa da **permissão de saque via API** (sem ela: 403 `insufficient_permission`). Com a permissão, a transferência para a subconta 3 (ainda não aprovada, `general: PENDING`) foi recusada: 400 "Você poderá solicitar transferências quando a aprovação do cadastro da conta de destino for concluída." O repasse ao vendedor já espera a aprovação (`AGUARDANDO_CADASTRO`). Parceiro com subconta ainda não aprovada: a transferência dele falha, o pedido fica `FALHOU` e o admin tenta de novo depois.

Com a **aprovação automática de subcontas** ligada no sandbox e o modelo da operação em **BaaS** (25/09/2026):

- **Subconta 4** (`edc47d61-a8cb-4471-bb71-e4ede29e4fc6`, wallet `f039cb95-37cd-4376-85e1-48c66feaeb09`): `GET /myAccount/status` com a chave dela logo após a criação: `commercialInfo`, `bankAccountInfo`, `documentation` e `general` todos `APPROVED`.
- **Transferência de R$ 10 para ela** (`b590039a-4462-4983-be46-deceb5fd1452`): aceita (200), `status: PENDING`, `authorized: false`, `operationType: INTERNAL`, `transferFee: 0`. O saldo da conta principal caiu na hora (R$ 470,05 → R$ 460,05); a subconta ficou em R$ 0. Continuou assim até a autorização no painel; depois, `DONE` / `authorized: true`, com comprovante, e R$ 10 no saldo da subconta. Daí o estado `AGUARDANDO_APROVACAO` do repasse.

Scripts:

- `scripts/asaas-sandbox-flow.ts <arquivo>` cria a subconta e grava a chave dela no arquivo (permissão 600);
- `scripts/asaas-sandbox-pay.ts` cria um Pix sem split e paga na hora;
- `scripts/asaas-sandbox-transfer.ts <walletId> [centavos]` testa o repasse.

Todos com `NODE_USE_ENV_PROXY=1` e `ASAAS_API_KEY`.

### Saque automático para o vendedor (decidido em 25/09/2026)

No modelo BaaS o vendedor não entra no Asaas. Quando o repasse para a subconta dele conclui, o site marca `User.withdrawalDueAt`, e a rotina (`processDueWithdrawals`, em `src/lib/sellers/withdrawals.ts`):

- consulta o saldo da subconta (`GET /finance/balance`, com a chave da subconta);
- envia **todo o saldo** por Pix para a **chave CPF do próprio vendedor** (`POST /transfers` com `pixAddressKeyType: CPF`, chave da subconta). Só CPF garante a mesma titularidade;
- grava cada saque em `SellerWithdrawal` e avisa o vendedor por e-mail;
- saque esperando autorização: só acompanha (`GET /transfers/{id}`), não abre outro;
- falha (ex.: CPF sem chave Pix): o dinheiro fica na subconta, o vendedor recebe um aviso e a rotina tenta de novo a cada 24h. O admin vê em "Pix para vendedor com falha";
- `WITHDRAWAL_FEE_CENTS` desconta a tarifa do Pix de saída, se o Asaas cobrar da subconta.

Como o saque usa o saldo real da subconta, uma chamada interrompida não paga duas vezes.

**Agências:** o mesmo saque automático vale para a comissão, para a **chave CNPJ** da agência.
- No admin (`/admin/parceiros/<id>`), a seção "Conta de recebimento" cria a subconta CNPJ da agência (razão social, CNPJ, e-mail financeiro, tipo de empresa, faturamento e endereço) e mostra o link de envio de documentos enquanto está em análise. Também dá para marcar como aprovada manualmente.
- Agência que já tem conta Asaas própria: continua com o `walletId` digitado no formulário. A comissão cai direto na conta dela, sem saque.
- Conta da agência ainda em análise quando o evento acaba: o vendedor recebe normalmente e a comissão fica esperando (`Order.partnerPayoutWaiting`). A rotina transfere quando a conta for aprovada (webhook ou botão manual) e aí faz o Pix para o CNPJ.
- Os saques ficam na tabela `Withdrawal`, com `userId` (vendedor) ou `partnerId` (agência).

### Política de reembolso (decidida)

- **Valor:** o comprador recebe sempre o **valor integral**, e a taxa do Pix sai do saldo da plataforma. Mantenha saldo de reserva no Asaas.
- **Aprovação:** os reembolsos são **aprovados manualmente** no painel do Asaas.
- **Situação no pedido (`refundStatus`):** `SOLICITADO`, `AGUARDANDO_APROVACAO`, `CONCLUIDO` (pelo webhook `PAYMENT_REFUNDED`) ou `FALHOU` (com a mensagem do gateway).
- **`/admin/reembolsos`:** lista os pendentes e permite "tentar de novo" os que falharam.
- **Sem reembolso duplicado:** a troca para `SOLICITADO` é atômica, então avisos repetidos não geram dois reembolsos.
- **Validade do QR Code:** o Pix vale até um ano. Por isso o site cancela a cobrança quando a reserva vence, e devolve se ela for paga mesmo assim.

## Próximos passos

1. **Reembolso:** no sandbox os reembolsos aprovados terminam `CANCELLED`. Fica para testar **em produção, com valor baixo** (ex.: Pix de R$ 5 pago e reembolsado): conferir se termina `DONE`, se o webhook `PAYMENT_REFUNDED` chega e se o pedido vai para `CONCLUIDO`.
2. Validar no sandbox o link de documentos (`onboardingUrl` veio `null`) e o webhook de aprovação da subconta.
3. Configurar o Resend com domínio próprio (SPF/DKIM) para os e-mails não caírem no spam, e o WhatsApp Cloud API (número, token e modelos aprovados).
4. Revisão jurídica dos termos e da política de privacidade; depois, `LEGAL_REVIEWED=1`.
5. Parceiros, próxima fase: domínio próprio da agência (nível 3).
