export {};

// Chamada avulsa à API do Asaas para testes no sandbox, com campos sensíveis ocultos.
// Uso: npm run -s asaas:call -- GET /customers?limit=1
//      npm run -s asaas:call -- POST /customers '{"name":"...","cpfCnpj":"..."}'
const apiUrl = process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3";
const key = process.env.ASAAS_API_KEY;
const [method = "GET", path = "/", body] = process.argv.slice(2);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, /apikey|access_?token|secret/i.test(k) ? "<oculto>" : redact(v)]),
    );
  }
  return value;
}

async function main() {
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "User-Agent": "revenda-ingressos", ...(key && { access_token: key }) },
    body,
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = redact(JSON.parse(text));
  } catch {}
  console.log(JSON.stringify({ status: res.status, body: parsed }, null, 2));
}

main();
