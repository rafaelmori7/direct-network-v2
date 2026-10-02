export {};

// Confere a conexão com o Asaas sem nunca mostrar a chave. Uso: npm run asaas:check
const apiUrl = process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3";
const key = process.env.ASAAS_API_KEY;

async function main() {
  console.log(`API: ${apiUrl}`);
  console.log(`Chave: ${key ? "ASAAS_API_KEY definida" : "sem ASAAS_API_KEY (esperando o proxy do ambiente colocar a chave)"}`);
  const res = await fetch(`${apiUrl}/customers?limit=1`, {
    headers: { "User-Agent": "revenda-ingressos", ...(key && { access_token: key }) },
  });
  const body = await res.text();
  if (res.ok) {
    console.log("OK: o Asaas aceitou a chave.");
    const token = process.env.ASAAS_WEBHOOK_TOKEN ?? "";
    if (token.length < 32) {
      console.log(`Atenção: ASAAS_WEBHOOK_TOKEN tem ${token.length} caracteres; o Asaas exige pelo menos 32 para o webhook.`);
    }
    if (!process.env.SITE_URL?.startsWith("https://")) {
      console.log("Atenção: SITE_URL não é https; as subcontas serão criadas sem o webhook de aprovação.");
    }
    return;
  }
  console.log(`Falhou (${res.status}): ${body.slice(0, 200)}`);
  if (res.status === 401) {
    console.log("Confira: chave habilitada no painel, copiada inteira, header access_token sem prefixo.");
  }
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(`Erro de conexão: ${e.message}`);
  process.exitCode = 1;
});
