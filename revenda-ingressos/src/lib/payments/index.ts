import { AsaasPaymentProvider } from "./asaas";
import { MockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./provider";

let provider: PaymentProvider | undefined;

export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;
  const kind = process.env.PAYMENT_PROVIDER ?? "mock";
  if (kind === "asaas") {
    const apiUrl = process.env.ASAAS_API_URL;
    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiUrl || !apiKey) throw new Error("ASAAS_API_URL e ASAAS_API_KEY são obrigatórios");
    provider = new AsaasPaymentProvider(apiUrl, apiKey);
  } else {
    provider = new MockPaymentProvider();
  }
  return provider;
}
