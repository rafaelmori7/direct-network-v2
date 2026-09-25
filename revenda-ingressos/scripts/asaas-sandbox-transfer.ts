export {};
import { AsaasPaymentProvider } from "@/lib/payments/asaas";

// Etapa 3 do teste no sandbox: repasse da conta da plataforma para a subconta.
// Uso: tsx scripts/asaas-sandbox-transfer.ts <walletIdDoVendedor> [centavos]
// A chave precisa da permissão de saque via API (senão: 403 insufficient_permission).
const provider = new AsaasPaymentProvider(process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3", process.env.ASAAS_API_KEY ?? null);

async function main() {
  const [walletId, cents = "1000"] = process.argv.slice(2);
  const transfer = await provider.transferToWallet({
    walletId,
    cents: Number(cents),
    externalReference: `teste-${Date.now()}-vendedor`,
    description: "Teste de repasse",
  });
  console.log("transferência", transfer.transferId);
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
