export {};
import { readFileSync } from "node:fs";
import { AsaasPaymentProvider } from "@/lib/payments/asaas";

// Saque da subconta por Pix para chave CPF, com a chave DA SUBCONTA (lida de arquivo, nunca impressa).
// Uso: tsx scripts/asaas-sandbox-withdraw.ts <arquivo-da-chave> [cpf] [centavos] [--cancelar]
// No sandbox só valem as chaves de teste do BACEN (ex.: 99991111140) ou chaves de outras contas sandbox.
const provider = new AsaasPaymentProvider(process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3", null);

async function main() {
  const [file, cpf = "99991111140", cents] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const apiKey = readFileSync(file, "utf8").trim();
  const balance = await provider.getAccountBalance(apiKey);
  console.log("saldo", balance);
  const result = await provider.withdrawToPix(apiKey, {
    cents: cents ? Number(cents) : balance,
    pixKey: cpf,
    pixKeyType: "CPF",
    externalReference: `saque-teste-${Date.now()}`,
    description: "Teste de saque",
  });
  console.log("saque", result);
  if (process.argv.includes("--cancelar") && result.status !== "CONCLUIDO") {
    console.log("cancelado", await provider.cancelAccountTransfer(apiKey, result.transferId));
  }
  console.log("saldo depois", await provider.getAccountBalance(apiKey));
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
