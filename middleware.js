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

function paginaManutencao() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Manutenção — Direct Network</title>
<meta name="robots" content="noindex" />
</head>
<body style="margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:32px;">
  <img src="/logo.png" alt="Direct Network" style="height:40px;object-fit:contain;" />
  <div>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;">Voltamos em breve</h1>
    <p style="font-size:15px;color:#9a9a9a;max-width:400px;line-height:1.6;margin:0 auto;">
      Estamos em manutenção programada. Enquanto isso, veja os próximos eventos e listas VIP no nosso Linktree.
    </p>
  </div>
  <a href="${LINKTREE_URL}" target="_blank" rel="noopener noreferrer"
    style="background:#E91E8C;color:#fff;font-weight:600;font-size:14px;padding:14px 28px;border-radius:8px;text-decoration:none;">
    Acessar Linktree
  </a>
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
