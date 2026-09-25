# Próximos testes do Asaas sandbox (conta principal CNPJ)

Contexto: 25/09/2026. A chave do sandbox agora está na variável `ASAAS_API_KEY` do
ambiente (e não mais como credencial de API), porque o proxy do ambiente trocava
qualquer `access_token` pela chave da conta principal e não dava para chamar a API
com a chave da subconta. Confirme primeiro: `npm run -s asaas:check` e
`npm run -s asaas:call -- GET /myAccount/commercialInfo` (deve vir `JURIDICA`).
Postgres: `service postgresql start`.

## Já testado (ver README, "Conta principal CNPJ no sandbox")

- subconta criada (`POST /accounts`) e escrow ligado (`POST /accounts/{id}/escrow`), já no código;
- Pix com split para subconta em análise: split `DONE`;
- reembolso de cobrança com split exige saldo na conta principal para o valor total.

## Dados do sandbox

- subconta 1: id `0978bf5a-ff9e-4aeb-ab62-9d7074217505`, wallet `b68e9b71-317a-4b90-b69c-1ee156d8c74c`
  - cobrança paga com split: `pay_3kmpdetbomp5z0e0` (R$ 115, R$ 100 para a subconta)
- subconta 2: id `0da57707-5284-479e-a2d4-beb47ba5b640`, wallet `7599d137-caac-47a0-8ecc-eac955fbc9f4`
  - cobrança paga com split e **reembolsada**: `pay_njy75jq1nmjix4s4`. O Rafael aprovou a
    autorização no painel. Verificar: o split foi estornado da subconta (status / cancellationReason
    do split) ou os R$ 115 saíram todos da conta principal?
- as chaves de API das subcontas acima não foram guardadas: para os testes abaixo, crie uma
  subconta nova com `npx tsx scripts/asaas-sandbox-flow.ts <arquivo-para-a-chave>` (grava a chave
  em arquivo com permissão 600; nunca imprimir a chave) e pague com
  `npx tsx scripts/asaas-sandbox-pay.ts <walletId>` (prefixar com `NODE_USE_ENV_PROXY=1`).

## Resultado dos testes de 25/09/2026 (detalhes no README, "Conta Escrow no sandbox")

- `pay_njy75jq1nmjix4s4`: o reembolso terminou `CANCELLED` (estorno de -R$ 115 da conta principal, depois
  cancelado). Não responde se o split volta da subconta.
- Subconta 3: id `5ee83598-108b-41f7-ba2c-d1288e070be9`, wallet `2c1f0bf7-e4e4-4afe-ba3e-df93161ef302`
  (chave só no scratchpad da sessão, perdida ao fim dela).
- 1. Split vindo da conta principal **não fica retido**: cai livre no saldo da subconta. O escrow só vale
  para cobranças criadas com a chave da subconta.
- 2. `POST /escrow/{id}/finish`: só com a **chave principal**. `GET /payments/{id}/escrow`: só com a chave da subconta.
- 3. Não testado: o estorno só vale para Pix/cartão, e a subconta só emite Pix depois de aprovada.
- 4. `GET /myAccount/documents`: 200, mas `onboardingUrl: null` logo após criar a subconta.

## Decisão pendente antes de mexer no código

Com o fluxo atual (cobrança na conta principal + split), o dinheiro do vendedor **não fica protegido**.
Para usar o escrow, a cobrança precisa ser criada com a chave da subconta do vendedor, com split de volta
para a carteira da plataforma (testado: as duas partes ficam bloqueadas e o `finish` com a chave principal
libera as duas). Isso muda `createPixCharge`, `refund`, `cancelCharge`, `getPayerCpf`, `releaseEscrow` e o
webhook (os eventos passam a vir da subconta), e o vendedor só recebe Pix depois de aprovado.

## Ainda falta

1. Decidir a arquitetura acima e ajustar `src/lib/payments/asaas.ts`.
2. Reembolso de cobrança com escrow (precisa de subconta aprovada para ter Pix).
3. Reembolso de cobrança com split, aprovado de fato no painel (o de `pay_njy75jq1nmjix4s4` foi cancelado).
4. `onboardingUrl`: consultar de novo depois de um tempo, ou ver se só vem em produção.
5. Testar o fluxo inteiro pelo site (`PAYMENT_PROVIDER=asaas`).
