export {};
import { AsaasPaymentProvider } from "@/lib/payments/asaas";

// Etapa 1 do teste no sandbox: cria a subconta de um vendedor (CPF) ou de uma agência (CNPJ) fictícios.
// Uso: tsx scripts/asaas-sandbox-flow.ts <arquivo-para-a-chave> [--cnpj [MEI|LIMITED|INDIVIDUAL|ASSOCIATION]]
const provider = new AsaasPaymentProvider(process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3", process.env.ASAAS_API_KEY ?? null);

function checkDigits(base: number[], weights: (len: number) => number[], mod: (r: number) => number): number[] {
  const n = [...base];
  for (let k = 0; k < 2; k++) {
    const w = weights(n.length);
    n.push(mod(n.reduce((acc, d, i) => acc + d * w[i], 0) % 11));
  }
  return n;
}

function cpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  return checkDigits(base, (len) => Array.from({ length: len }, (_, i) => len + 1 - i), (r) => ((11 - r) % 11) % 10).join("");
}

function cnpj(): string {
  const base = [...Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)), 0, 0, 0, 1];
  const weights = (len: number) => (len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return checkDigits(base, weights, (r) => (r < 2 ? 0 : 11 - r)).join("");
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf("--cnpj");
  const company = i >= 0;
  const companyType = (company && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "LIMITED") as "MEI" | "LIMITED" | "INDIVIDUAL" | "ASSOCIATION";
  const account = await provider.createSellerAccount({
    name: company ? "Agência Teste Sandbox Ltda" : "Vendedor Teste Sandbox",
    email: `${company ? "agencia" : "vendedor"}.${Date.now()}@example.com`,
    ...(company ? { cpfCnpj: cnpj(), companyType } : { cpfCnpj: cpf(), birthDate: new Date("1990-05-10") }),
    mobilePhone: "11987654321",
    incomeCents: company ? 2_000_000 : 500_000,
    address: "Av. Paulista",
    addressNumber: "1000",
    complement: "",
    province: "Bela Vista",
    postalCode: "01310100",
  });
  const out = args[0]?.startsWith("--") ? undefined : args[0];
  if (out && account.apiKey) (await import("node:fs")).writeFileSync(out, account.apiKey, { mode: 0o600 });
  console.log(JSON.stringify({ accountId: account.accountId, walletId: account.walletId, chaveSalva: Boolean(out && account.apiKey) }));
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
