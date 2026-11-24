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
const WHATSAPP_URL = 'https://curt.link/grupo-direct'

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

// O domínio principal aponta pro Vercel (este site), não pro Wix — então o
// link de "gerenciar preferências/cancelar inscrição" que o Wix gera pros
// e-mails de campanha (.../\_manage-consent/api/revoke-consent/unsubscribe)
// cai aqui e não existe nenhuma rota pra ele, dando 404. Não dá pra
// processar o token aqui (é criptografado pro backend do Wix), então a
// saída é capturar o e-mail aqui mesmo (igual ao padrão appsScriptUrl já
// usado em CortesiaSlugClient.js) pra remover manualmente depois, até
// ajustar a causa raiz direto no Wix.
//
// UNSUBSCRIBE_SCRIPT_URL ainda não configurada em produção -- enquanto isso
// a página cai no fallback por e-mail (mailto) mais abaixo.
const EMAIL_CONTATO = 'contato@directnw.com.br'

function paginaCancelarInscricao() {
  const scriptUrl = process.env.UNSUBSCRIBE_SCRIPT_URL

  const corpo = scriptUrl
    ? `
    <p>Estamos com uma instabilidade no cancelamento automático. Deixe seu e-mail abaixo que a gente remove você da nossa lista o quanto antes.</p>
    <form id="form-cancelar">
      <input type="email" id="input-email" placeholder="seu@email.com" required
        style="width:100%;box-sizing:border-box;background:#0a0a0a;border:1px solid #242424;border-radius:10px;color:#fff;font-size:14px;padding:13px 16px;outline:none;font-family:inherit;margin-bottom:12px;" />
      <button type="submit" class="btn" style="width:100%;border:none;cursor:pointer;font-family:inherit;">Cancelar minha inscrição</button>
    </form>
    <p id="msg-sucesso" style="display:none;">Prontinho! Vamos remover seu e-mail da nossa lista em breve.</p>
    <script>
      document.getElementById('form-cancelar').addEventListener('submit', function (e) {
        e.preventDefault()
        var email = document.getElementById('input-email').value
        fetch(${JSON.stringify(scriptUrl)}, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, timestamp: new Date().toISOString(), origem: 'unsubscribe-fallback' }),
        }).catch(function () {})
        document.getElementById('form-cancelar').style.display = 'none'
        document.getElementById('msg-sucesso').style.display = 'block'
      })
    </script>`
    : `
    <p>O link usado para gerenciar suas preferências de e-mail expirou ou não é mais válido. Mande um e-mail pra gente que cancelamos sua inscrição manualmente.</p>
    <a class="btn" href="mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent('Cancelar inscrição')}&body=${encodeURIComponent('Quero parar de receber e-mails da Direct Network.\n\nMeu e-mail cadastrado é: ')}">Cancelar minha inscrição por e-mail</a>`

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cancelar inscrição — Direct Network</title>
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
    font-size: 24px;
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
  .btn {
    display: block;
    font-weight: 600;
    font-size: 14px;
    padding: 15px 24px;
    border-radius: 10px;
    text-decoration: none;
    background: #E91E8C;
    color: #fff;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .btn:hover { background: #C4176F; transform: translateY(-1px); }
</style>
</head>
<body>
  <div class="card">
    <img class="logo" src="/icon.png" alt="Direct Network" />
    <h1>Cancelar inscrição</h1>
    ${corpo}
  </div>
</body>
</html>`
}

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
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_manage-consent')) {
    return new NextResponse(paginaCancelarInscricao(), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  if (process.env.MAINTENANCE_MODE !== 'true') {
    return NextResponse.next()
  }

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
