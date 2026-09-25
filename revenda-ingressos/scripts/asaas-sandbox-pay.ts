export {};
import { AsaasPaymentProvider } from "@/lib/payments/asaas";

// Etapa 2 do teste no sandbox: Pix com split para a subconta, pago na hora.
// Uso: tsx scripts/asaas-sandbox-pay.ts <walletIdDoVendedor>
const provider = new AsaasPaymentProvider(process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3", null);

async function main() {
  const walletId = process.argv[2];
  const charge = await provider.createPixCharge({
    orderId: `teste-${Date.now()}`,
    totalCents: 11_500, // R$ 100 + 15% de taxa
    sellerNetCents: 10_000,
    sellerWalletId: walletId,
    buyer: { name: "Comprador Teste", cpf: "52998224725", email: `comprador.${Date.now()}@example.com` },
    expiresAt: new Date(Date.now() + 30 * 60_000),
    description: "Teste de split com escrow",
  });
  console.log("cobrança", charge.chargeId);
  await provider.simulatePayment(charge.chargeId);
  console.log("pago no sandbox");
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
