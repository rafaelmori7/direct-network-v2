export {};
import { AsaasPaymentProvider } from "@/lib/payments/asaas";

// Etapa 1 do teste no sandbox: cria a subconta de um vendedor fictício.
const provider = new AsaasPaymentProvider(process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3", process.env.ASAAS_API_KEY ?? null);

function cpf(): string {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const dv = (base: number[]) => {
    const s = base.reduce((acc, d, i) => acc + d * (base.length + 1 - i), 0);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  n.push(dv(n));
  n.push(dv(n));
  return n.join("");
}

async function main() {
const account = await provider.createSellerAccount({
  name: "Vendedor Teste Sandbox",
  email: `vendedor.${Date.now()}@example.com`,
  cpf: cpf(),
  birthDate: new Date("1990-05-10"),
  mobilePhone: "11987654321",
  incomeCents: 500_000,
  address: "Av. Paulista",
  addressNumber: "1000",
  complement: "",
  province: "Bela Vista",
  postalCode: "01310100",
});
const out = process.argv[2];
if (out && account.apiKey) (await import("node:fs")).writeFileSync(out, account.apiKey, { mode: 0o600 });
console.log(JSON.stringify({ accountId: account.accountId, walletId: account.walletId, chaveSalva: Boolean(out && account.apiKey) }));
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
