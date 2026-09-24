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

## Rodando

```bash
cp .env.example .env      # ajuste o DATABASE_URL
npm install
npm test                  # testes das regras
npm run db:migrate        # cria as tabelas
npm run db:seed           # cadastra as ticketeiras
npm run dev
```

## Próximos passos

1. Cadastro e verificação de identidade (CPF + selfie), com criação da subconta Asaas do vendedor.
2. Telas de evento, anúncio ("VENDO") e pedido de compra ("COMPRO").
3. Checkout Pix e webhook do Asaas, que confere se o CPF do pagador é o do comprador.
4. Telas "transferi" (vendedor) e "recebi" com checklist (comprador).
5. Rotinas agendadas: reembolso por prazo esgotado, encerramento de anúncios e liberação automática.
6. Chat em tempo real (polling no início) com aviso por e-mail/WhatsApp de nova mensagem.
7. Painel admin: eventos, sobreposições de regras e disputas.
8. Validar no sandbox do Asaas: finish/refund com escrow e dados do pagador Pix.
