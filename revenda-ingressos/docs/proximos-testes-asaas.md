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

## Decisão (25/09/2026): repasse por transferência

Cobrança na conta principal sem split; na liberação, `POST /transfers` com `walletId` para o vendedor e o
parceiro. Código, testes e README atualizados.

- Reembolso de Pix sem split (`pay_ahx1nga5y1w10bfo`): aceito, aguardando autorização no painel.
- `POST /transfers`: 403 `insufficient_permission` (a chave não tem permissão de saque via API).

- Com a permissão ligada: transferência para a subconta 3 (não aprovada) recusada com 400 "Você poderá solicitar
  transferências quando a aprovação do cadastro da conta de destino for concluída."
- Reembolso de `pay_ahx1nga5y1w10bfo` aprovado no painel: terminou `CANCELLED` (estorno -R$ 115 e depois
  cancelamento do estorno +R$ 115), igual ao de `pay_njy75jq1nmjix4s4`.
- Removida a trava de 45 dias; termos de uso ajustados.

## Resultado dos testes (25/09/2026, aprovação automática de subcontas + modelo BaaS)

- Subconta 4: id `edc47d61-a8cb-4471-bb71-e4ede29e4fc6`, wallet `f039cb95-37cd-4376-85e1-48c66feaeb09`
  (chave só no scratchpad da sessão). Veio **aprovada** na criação (`/myAccount/status`: tudo `APPROVED`).
- `POST /transfers` de R$ 10 para ela (`b590039a-4462-4983-be46-deceb5fd1452`): 200, `PENDING`, `authorized: false`;
  o saldo sai da conta principal na hora. Depois da autorização no painel: `DONE`, R$ 10 na subconta.
- Criado `AGUARDANDO_APROVACAO` no repasse (`payoutStatus`), concluído pelo webhook `TRANSFER_*` ou pela rotina.
- Reembolso: fica para testar em produção com valor baixo (ver README, "Próximos passos").

## Ainda falta

1. Reembolso em produção com valor baixo: termina `DONE`? chega o `PAYMENT_REFUNDED`?
2. Ao publicar o site: cadastrar os eventos `TRANSFER_DONE`, `TRANSFER_FAILED` e `TRANSFER_CANCELLED` no webhook do painel e conferir o
   formato do aviso (o código usa só `transfer.id` e consulta `GET /transfers/{id}`).
3. `onboardingUrl`: consultar de novo depois de um tempo, ou ver se só vem em produção.
4. Testar o fluxo inteiro pelo site (`PAYMENT_PROVIDER=asaas`).
5. Saque automático: ver "Resultado do saque" abaixo. Falta, com o suporte do Asaas: ligar a validação de saque por
   webhook (`/api/webhooks/asaas/saques`) e conferir se, com ela, o saque da subconta sai sem o token SMS e se o
   webhook traz `externalReference` e `bankAccount.pixAddressKey` como a resposta da criação.
6. Subconta CNPJ de agência pelo admin (`companyType` e sem `birthDate`): o Asaas aceita? Saque para chave CNPJ
   (deve ter o mesmo token SMS do saque CPF).

## Resultado do saque (25/09/2026, subconta 4, chave da subconta)

- `GET /finance/balance`: 200 (R$ 10, do repasse de teste).
- `POST /transfers` Pix para CPF: a chave da subconta pode sacar. CPF do próprio titular (fictício): 400 "A chave informada
  não foi encontrada.". Chave de teste do BACEN `99991111140`: aceito (`6e5319ab-...`), `PENDING`, `authorized: false`
  (token SMS da subconta), `transferFee: 0`, saldo debitado na hora; ficou parado. `99992222263` não é chave.
- `POST /transfers/{id}/cancel`: `CANCELLED`, valor de volta ao saldo.
- Código: saque parado 1h é cancelado (admin vê, titular não é avisado); rota de validação de saque por webhook pronta.
