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

## Falta testar (com a chave da subconta)

1. O valor do split fica retido? `GET /finance/balance` da subconta e `GET /payments/{id}/escrow`
   com a chave da subconta. Descobrir qual id de cobrança a subconta enxerga.
2. Liberar: `POST /escrow/{id}/finish`. Com qual chave (principal ou subconta)?
3. Reembolso depois do split com escrow: a parte do vendedor volta da subconta?
4. Link de documentos da subconta: `GET /myAccount/documents` com a chave da subconta (`onboardingUrl`).
5. Ajustar `releaseEscrow` em `src/lib/payments/asaas.ts` conforme o resultado (hoje usa a chave
   principal e `GET /payments/{chargeId}/escrow`, que devolve 404 na conta principal). A chave da
   subconta do vendedor fica criptografada em `User.gatewayApiKeyEnc` (`src/lib/crypto.ts`).
6. Registrar os resultados no README e testar o fluxo inteiro pelo site (`PAYMENT_PROVIDER=asaas`).
