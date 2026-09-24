import { AsaasPaymentProvider } from "./asaas";
import { MockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./provider";

let provider: PaymentProvider | undefined;

export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;
  const kind = process.env.PAYMENT_PROVIDER ?? "mock";
  if (kind === "asaas") {
    const apiUrl = process.env.ASAAS_API_URL;
    if (!apiUrl) throw new Error("ASAAS_API_URL é obrigatório");
    // Sem ASAAS_API_KEY, o header é colocado pelo proxy do ambiente ("API credential").
    provider = new AsaasPaymentProvider(apiUrl, process.env.ASAAS_API_KEY || null);
  } else {
    provider = new MockPaymentProvider();
  }
  return provider;
}
