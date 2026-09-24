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
- **Rotina `/api/cron/expirar-pix`:** cancela Pix vencidos e devolve a reserva ao anúncio. Protegida por `CRON_SECRET`.

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

## Próximos passos

1. Verificação de identidade do vendedor (documento + selfie) e criação da subconta Asaas com Conta Escrow.
2. Webhook do Asaas: confirmar pagamento, conferir se o CPF do pagador é o do comprador e reembolsar Pix pago depois de vencido.
3. Rotinas agendadas restantes: reembolso por prazo de transferência esgotado, encerramento de anúncios e liberação automática.
4. Chat em tempo real (polling no início) com aviso por e-mail/WhatsApp de nova mensagem.
5. Painel admin: eventos, sobreposições de regras e disputas.
6. Validar no sandbox do Asaas: finish/refund com escrow e dados do pagador Pix.
