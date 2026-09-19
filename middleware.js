import { NextResponse } from 'next/server'

// Interruptor de manutenção — desligado por padrão (MAINTENANCE_MODE não
// existe em produção até alguém adicionar a variável na Vercel). Existe
// pra sobreviver a um estouro de cota do Contentful sem gastar mais
// nenhuma chamada: intercepta a requisição ANTES de qualquer busca ao
// Contentful, então nada é consultado enquanto está ligado.
//
// Pra ativar: Vercel → Settings → Environment Variables → MAINTENANCE_MODE=true
// → redeploy. Pra desativar: apaga a variável (ou põe false) → redeploy.
// Nada é apagado nem alterado no Contentful — é só a camada de entrega
// do site que fica em espera.

const LINKTREE_URL = 'https://linktr.ee/direct.festas'
// Mesmo link de grupo usado em Nav.js, Footer.js e app/grupo/page.js.
const WHATSAPP_URL = 'https://chat.whatsapp.com/DYcOSP7iF8U3OYgBHpU0tG'

// HTTP-date real (fim do ciclo de cobrança do Contentful), não uma estimativa
// em segundos — dá pro Google um motivo concreto pra não tirar o site do
// índice, só esperar até essa data.
const RETRY_AFTER = 'Tue, 29 Sep 2026 00:00:00 GMT'

// Único trecho que continua funcionando com a manutenção ligada:
// - assets internos do Next (_next/static, _next/image)
// - a imagem/ícones usados na própria página de manutenção
// - /api/revalidate: não consulta o Contentful (só invalida cache local),
//   e manter respondendo evita que o webhook do Contentful registre falha
//   de entrega à toa.
const CAMINHOS_LIVRES = ['/_next', '/logo.png', '/icon.png', '/apple-icon.png', '/api/revalidate']

// Data legível pra mostrar na página — separada do RETRY_AFTER (que precisa
// do formato HTTP-date exato). Ajustar as duas juntas se a previsão mudar.
const PREVISAO_RETORNO = '30 de setembro'

function paginaManutencao() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Manutenção — Direct Network</title>
<meta name="robots" content="noindex" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0a0a0a;
    background-image: radial-gradient(circle at 50% 30%, rgba(233,30,140,0.14), transparent 60%);
    color: #fff;
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 420px;
    background: #111111;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 48px 32px 40px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  }
  .logo {
    height: 56px;
    width: 56px;
    object-fit: contain;
    border-radius: 14px;
    margin-bottom: 28px;
  }
  h1 {
    font-family: 'Syne', 'DM Sans', sans-serif;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 14px;
  }
  p {
    font-size: 15px;
    color: #9a9a9a;
    line-height: 1.65;
    margin: 0 auto 28px;
    max-width: 320px;
  }
  .previsao {
    font-size: 12px;
    color: #7a7a7a;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0 0 24px;
  }
  .convite {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 16px;
  }
  .botoes {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .btn {
    display: block;
    font-weight: 600;
    font-size: 14px;
    padding: 15px 24px;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .btn-linktree { background: #E91E8C; color: #fff; }
  .btn-linktree:hover { background: #C4176F; transform: translateY(-1px); }
  .btn-whatsapp { background: #25D366; color: #fff; }
  .btn-whatsapp:hover { background: #1fa855; transform: translateY(-1px); }
</style>
</head>
<body>
  <div class="card">
    <img class="logo" src="/icon.png" alt="Direct Network" />
    <h1>Voltamos em breve</h1>
    <p>Estamos em manutenção programada.</p>
    <div class="previsao">Previsão de retorno: ${PREVISAO_RETORNO}</div>
    <p class="convite">Enquanto isso, confira nossos eventos aqui:</p>
    <div class="botoes">
      <a class="btn btn-linktree" href="${LINKTREE_URL}" target="_blank" rel="noopener noreferrer">Confira nosso calendário</a>
      <a class="btn btn-whatsapp" href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer">Entrar no grupo do WhatsApp</a>
    </div>
  </div>
</body>
</html>`
}

export function middleware(request) {
  if (process.env.MAINTENANCE_MODE !== 'true') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  if (CAMINHOS_LIVRES.some(caminho => pathname.startsWith(caminho))) {
    return NextResponse.next()
  }

  return new NextResponse(paginaManutencao(), {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': RETRY_AFTER,
      'Cache-Control': 'no-store',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
