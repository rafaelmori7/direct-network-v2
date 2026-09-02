import Nav from '../components/Nav'
import Footer from '../components/Footer'

const TITLE = 'Virada Estaiada 2027 | Ingressos com Desconto — Cupom DIRECT'
const DESCRIPTION = 'Ingressos para a Virada Estaiada 2027 com desconto pelo cupom DIRECT. Open bar e open food premium no Varanda Estaiada, 31 de dezembro, das 20h às 3h.'
const IMAGE_PATH = '/virada-estaiada-2027.jpg'
const IMAGE_URL = `https://www.directnw.com.br${IMAGE_PATH}`
const PAGE_PATH = '/virada-estaiada-2027'
const PAGE_URL = `https://www.directnw.com.br${PAGE_PATH}`

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Direct Network',
    url: PAGE_URL,
    images: [{ url: IMAGE_PATH, width: 1200, height: 630, alt: 'Virada Estaiada' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE_PATH],
  },
}

// Vendas abrem em 10/09. Quando o cupom/link de afiliado estiverem confirmados,
// troque VENDAS_ABERTAS para true e preencha LINK_AFILIADO — é a única linha a mudar.
const VENDAS_ABERTAS = false
const LINK_GRUPO_WHATSAPP = 'https://chat.whatsapp.com/DYcOSP7iF8U3OYgBHpU0tG' // TODO: trocar pelo link do grupo específico da Virada Estaiada (pendência Rafael)
const LINK_AFILIADO = '#' // TODO: link de afiliado com cupom DIRECT aplicado (pendência Rafael)

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Virada Estaiada 2027',
  description: 'Réveillon 2027 no Varanda Estaiada, em São Paulo, com open bar premium, open food premium e atração musical ao vivo.',
  startDate: '2026-12-31T20:00:00-03:00',
  endDate: '2027-01-01T03:00:00-03:00',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  image: [IMAGE_URL],
  location: {
    '@type': 'Place',
    name: 'Varanda Estaiada',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Dr. Chucri Zaidan, 155',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      postalCode: '04583-110',
      addressCountry: 'BR',
    },
  },
  // offers: pendência — a partir de 10/09, acrescentar { '@type': 'Offer', url: LINK_AFILIADO, price, priceCurrency: 'BRL', availability: 'https://schema.org/InStock', validFrom: '2026-09-10T00:00:00-03:00' }
}

function ConversionBlock() {
  if (!VENDAS_ABERTAS) {
    return (
      <div style={{background:'rgba(233,30,140,0.05)',border:'1px solid rgba(233,30,140,0.25)',borderRadius:'var(--radius)',padding:'24px',textAlign:'center'}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:'18px',fontWeight:700,marginBottom:'8px'}}>As vendas abrem em 10 de setembro — com desconto Direct</div>
        <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.7,marginBottom:'18px',maxWidth:'520px',marginLeft:'auto',marginRight:'auto'}}>
          A pré-venda é o menor valor de toda a temporada e tem quantidade limitada. Entre no nosso grupo e receba o link com desconto assim que a venda abrir.
        </p>
        <a href={LINK_GRUPO_WHATSAPP} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',background:'var(--pink)',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px 28px',borderRadius:'8px'}}>
          Quero o link com desconto
        </a>
      </div>
    )
  }

  return (
    <div style={{background:'rgba(233,30,140,0.05)',border:'1px solid rgba(233,30,140,0.25)',borderRadius:'var(--radius)',padding:'24px',textAlign:'center'}}>
      <div style={{fontFamily:'var(--font-display)',fontSize:'18px',fontWeight:700,marginBottom:'8px'}}>Ingressos à venda com desconto Direct</div>
      <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.7,marginBottom:'18px',maxWidth:'520px',marginLeft:'auto',marginRight:'auto'}}>
        Compre pelo nosso link e o cupom <strong>DIRECT</strong> já vem aplicado. Também funciona digitando <strong>DIRECT</strong> no checkout.
      </p>
      <a href={LINK_AFILIADO} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',background:'var(--pink)',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px 28px',borderRadius:'8px'}}>
        Comprar com desconto
      </a>
    </div>
  )
}

const FICHA = [
  ['Evento', 'Virada Estaiada 2027'],
  ['Data', '31 de dezembro de 2026'],
  ['Horário', 'Das 20h às 3h'],
  ['Local', 'Varanda Estaiada — Av. Dr. Chucri Zaidan, 155, Vila Cordeiro, São Paulo/SP'],
  ['Open bar', 'Premium, durante toda a festa'],
  ['Open food', 'Premium, incluso'],
  ['Atração musical', 'Ao vivo, nome a ser anunciado'],
  ['Vendas', 'A partir de 10 de setembro, começando pela pré-venda'],
  ['Cupom de desconto', 'DIRECT'],
]

const FAQ = [
  ['Quando é a Virada Estaiada 2027?', 'Dia 31 de dezembro de 2026, das 20h às 3h.'],
  ['Onde é a Virada Estaiada?', 'No Varanda Estaiada, na Av. Dr. Chucri Zaidan, 155, Vila Cordeiro, São Paulo.'],
  ['Quando abrem as vendas?', 'Em 10 de setembro, começando pela pré-venda, que tem o menor valor da temporada e quantidade limitada.'],
  ['Quanto custa o ingresso?', 'Os valores são divulgados na abertura das vendas. A pré-venda é sempre o lote mais barato do ano.'],
  ['Tem open bar?', 'Sim, open bar premium durante toda a festa, além de open food premium incluso.'],
  ['Qual é o line-up?', 'A produção confirmou uma atração musical ao vivo e ainda não divulgou o nome.'],
  ['Tem cupom de desconto para a Virada Estaiada?', 'Sim. Comprando pelo link da Direct o cupom DIRECT já vem aplicado, e ele também funciona digitado no checkout.'],
]

export default function ViradaEstaiada2027Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Nav />
      <main>
        {/* HERO */}
        <section style={{padding:'56px var(--px) 32px',maxWidth:'800px',margin:'0 auto'}}>
          <div style={{display:'inline-block',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.2)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            Réveillon 2027 — São Paulo
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(28px,5vw,44px)',fontWeight:700,lineHeight:1.15,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Virada Estaiada 2027: réveillon no Varanda Estaiada, em São Paulo
          </h1>
          <div style={{width:'100%',borderRadius:'12px',overflow:'hidden',border:'1px solid var(--border)',marginBottom:'24px'}}>
            <img src={IMAGE_PATH} alt="Virada Estaiada — réveillon no Varanda Estaiada, em São Paulo" style={{width:'100%',height:'auto',display:'block'}} />
          </div>
          <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.75,marginBottom:'16px'}}>
            A Virada Estaiada volta em 31 de dezembro de 2026 para receber 2027 do melhor ângulo da cidade, com a Ponte Estaiada de moldura. Open bar premium, open food premium e atração musical ao vivo, das 20h às 3h.
          </p>
          <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.75}}>
            A Direct tem link com desconto para a festa. Abaixo você encontra tudo o que já foi confirmado e como garantir o seu ingresso pelo menor valor.
          </p>
        </section>

        {/* CONVERSÃO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 48px'}}>
          <ConversionBlock />
        </section>

        {/* FICHA DA FESTA */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <hr style={{border:'none',borderTop:'1px solid var(--border)',marginBottom:'40px'}} />
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Ficha da festa
          </h2>
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden'}}>
            {FICHA.map(([label, value]) => (
              <div key={label} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:'160px',flexShrink:0,fontSize:'12px',color:'var(--text-faint)'}}>{label}</div>
                <div style={{fontSize:'14px',fontWeight:500}}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* LOCALIZAÇÃO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Onde fica o Varanda Estaiada
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'16px'}}>
            O Varanda Estaiada fica na Av. Dr. Chucri Zaidan, 155, na Vila Cordeiro, zona sul de São Paulo, a poucos minutos do Morumbi, Brooklin e Berrini, com acesso pela Marginal Pinheiros.
          </p>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8}}>
            É um dos endereços com a vista mais reconhecível da cidade: a Ponte Octávio Frias de Oliveira fica bem à frente, o que faz da casa um dos pontos mais procurados para ver a virada do ano em São Paulo.
          </p>
        </section>

        {/* PREÇO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Quanto custa
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'16px'}}>
            Os valores da Virada Estaiada 2027 são divulgados na abertura das vendas, em 10 de setembro.
          </p>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'16px'}}>
            A temporada começa pela pré-venda, que é o menor valor do ano e tem quantidade limitada. Em réveillon de São Paulo o preço sobe a cada lote, e quem compra depois da virada de lote paga mais pelo mesmo ingresso.
          </p>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8}}>
            Comprando pelo link da Direct, o cupom DIRECT aplica o desconto sobre o lote que estiver aberto.
          </p>
        </section>

        {/* O QUE ESTÁ INCLUSO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            O que está incluso
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'16px'}}>
            <strong style={{color:'var(--text)'}}>Open bar premium.</strong> Bebida liberada durante toda a festa, das 20h às 3h.
          </p>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'16px'}}>
            <strong style={{color:'var(--text)'}}>Open food premium.</strong> Comida inclusa no ingresso, sem consumação à parte.
          </p>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8}}>
            <strong style={{color:'var(--text)'}}>Atração musical ao vivo.</strong> A produção confirmou que haverá show e anuncia o nome em breve. Esta página é atualizada no mesmo dia do anúncio.
          </p>
        </section>

        {/* A FESTA */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            A festa
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8}}>
            A Virada Estaiada não é evento novo. A casa já realizou as edições de 2025 e 2026, e a festa aparece nas listas de réveillon de São Paulo publicadas pela imprensa desde a virada de 2022. É uma das viradas que consolidaram o formato open bar premium com vista para a ponte.
          </p>
        </section>

        {/* FAQ */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'24px'}}>
            Perguntas frequentes
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
            {FAQ.map(([pergunta, resposta]) => (
              <div key={pergunta}>
                <h3 style={{fontFamily:'var(--font-display)',fontSize:'16px',fontWeight:600,marginBottom:'8px'}}>{pergunta}</h3>
                <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.75}}>{resposta}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ENCERRAMENTO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 72px'}}>
          <hr style={{border:'none',borderTop:'1px solid var(--border)',marginBottom:'40px'}} />
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'24px',textAlign:'center'}}>
            O primeiro lote da Virada Estaiada é sempre o mais disputado da temporada. Garanta o seu com o desconto da Direct.
          </p>
          <ConversionBlock />
        </section>
      </main>
      <Footer />
    </>
  )
}
