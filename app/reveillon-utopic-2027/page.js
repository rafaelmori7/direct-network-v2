import Link from 'next/link'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { REVEILLONS_SP } from '../../lib/reveillons-sp'

const TITLE = 'Réveillon Utopic Festival 2027 | Ingressos com Desconto — Direct Network'
const DESCRIPTION = 'Réveillon Utopic Festival 2027 no Bosque Esperia, em São Paulo. 100% open bar premium e 100% música eletrônica, com D-Nox, Meca, Tom Keller e mais. Ingressos com desconto Direct.'
const PAGE_PATH = '/reveillon-utopic-2027'
const PAGE_URL = `https://www.directnw.com.br${PAGE_PATH}`
const IMAGE_PATH = '/reveillon-utopic-2027.jpg'
const IMAGE_URL = `https://www.directnw.com.br${IMAGE_PATH}`

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
    images: [{ url: IMAGE_PATH, width: 1200, height: 630, alt: 'Réveillon Utopic Festival' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE_PATH],
  },
}

const LINK_AFILIADO = 'https://cart.ingresse.com/c89a2105-e284-4486-bad2-04c773e1ee8d/tickets?passkey=DIRECT'

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Réveillon Utopic Festival 2027',
  description: 'Réveillon 2027 no Bosque Esperia, em São Paulo, com 100% open bar premium e 100% música eletrônica.',
  startDate: '2026-12-31T21:00:00-03:00',
  endDate: '2027-01-01T06:00:00-03:00',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  image: [IMAGE_URL],
  location: {
    '@type': 'Place',
    name: 'Bosque Esperia',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Santos Dumont, 1313',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      postalCode: '02012-010',
      addressCountry: 'BR',
    },
  },
  // offers: pendência — preço do lote ainda não confirmado (declarar preço
  // inexistente gera erro no Search Console, então fica de fora até lá)
}

function ConversionBlock() {
  return (
    <div style={{background:'rgba(233,30,140,0.05)',border:'1px solid rgba(233,30,140,0.25)',borderRadius:'var(--radius)',padding:'24px',textAlign:'center'}}>
      <div style={{fontFamily:'var(--font-display)',fontSize:'18px',fontWeight:700,marginBottom:'8px'}}>Ingressos à venda com desconto Direct</div>
      <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.7,marginBottom:'18px',maxWidth:'520px',marginLeft:'auto',marginRight:'auto'}}>
        Compre pelo nosso link e o desconto Direct já vem aplicado. O Réveillon Utopic Festival tem lotes limitados — antecipe-se à virada de lote.
      </p>
      <a href={LINK_AFILIADO} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',background:'var(--pink)',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px 28px',borderRadius:'8px'}}>
        Comprar com desconto
      </a>
    </div>
  )
}

const FICHA = [
  ['Evento', 'Réveillon Utopic Festival 2027'],
  ['Data', '31 de dezembro de 2026'],
  ['Horário', 'Das 21h às 6h'],
  ['Local', 'Bosque Esperia — Av. Santos Dumont, 1313, Santana, São Paulo/SP'],
  ['Open bar', 'Premium, durante toda a festa'],
  ['Formato', '100% música eletrônica'],
  ['Line-up', 'D-Nox, Meca, Tom Keller, Dimy Soler, Mau Max'],
  ['Classificação', '18 anos'],
]

const LINEUP = [
  ['D-Nox', 'Produtor alemão de progressive house e techno melódico, mais de 30 anos de carreira e presença nos maiores festivais do mundo.'],
  ['Meca', 'DJ e produtor plural de house e melodic house, com passagens por Lollapalooza, Rock in Rio e o Hï Ibiza.'],
  ['Tom Keller', 'Um dos poucos brasileiros a dividir line-up com nomes como David Guetta, Tiësto e Armin van Buuren nos últimos 10 anos.'],
  ['Dimy Soler', 'Residente da Energia 97 FM e da balada Limelight em São Paulo, com um set especial de clássicos eletrônicos.'],
  ['Mau Max', 'DJ versátil, ex-residente de casas como Sutton e Terrazza, com som refinado e experiente.'],
]

const FAQ = [
  ['Quando é o Réveillon Utopic Festival 2027?', 'Dia 31 de dezembro de 2026, das 21h às 6h.'],
  ['Onde é o Réveillon Utopic Festival?', 'No Bosque Esperia, na Av. Santos Dumont, 1313, Santana, São Paulo.'],
  ['Tem open bar?', 'Sim, 100% open bar premium durante toda a festa.'],
  ['Qual é o estilo musical?', '100% música eletrônica, com curadoria de DJs de diferentes vertentes do house e do techno.'],
  ['Qual a classificação etária?', 'Evento 18+, não é permitida a entrada de menores de idade.'],
  ['Tem dress code?', 'Sugestão de branco e estilo festival eletrônico premium — tons off-white, champagne, prata e dourado também são bem-vindos.'],
  ['Tem desconto Direct Network?', 'Sim. Comprando pelo nosso link, o desconto Direct Network já vem aplicado.'],
]

const OUTROS = REVEILLONS_SP.filter(r => r.slug !== 'reveillon-utopic-2027')

export default function ReveillonUtopic2027Page() {
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
            Réveillon Utopic Festival 2027: ingressos com desconto no Bosque Esperia
          </h1>
          <div style={{width:'100%',borderRadius:'12px',overflow:'hidden',border:'1px solid var(--border)',marginBottom:'24px'}}>
            <img src={IMAGE_PATH} alt="Réveillon Utopic Festival — estrutura do Bosque Esperia, em São Paulo" style={{width:'100%',height:'auto',display:'block'}} />
          </div>
          <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.75,marginBottom:'16px'}}>
            O Réveillon Utopic Festival chega a São Paulo propondo uma experiência imersiva: 100% open bar premium e 100% música eletrônica, com cenografia, tecnologia e um line-up que já dividiu palco com os maiores nomes do gênero no mundo.
          </p>
          <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.75}}>
            A Direct tem link com desconto para a festa. Abaixo você encontra tudo o que já foi confirmado e como garantir o seu ingresso.
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
            Onde fica o Bosque Esperia
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8}}>
            O Bosque Esperia fica na Av. Santos Dumont, 1313, em Santana, zona norte de São Paulo, no complexo do Clube Esperia, com fácil acesso pela Marginal Tietê. É um espaço contemporâneo com mais de 3.500 m², com muito verde, parte coberta e parte open air.
          </p>
        </section>

        {/* O QUE ESTÁ INCLUSO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            O que está incluso
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'16px'}}>
            <strong style={{color:'var(--text)'}}>Open bar premium.</strong> Rótulos importados de gin, vodka, whisky e tequila, cerveja premium, espumante, energético e não alcoólicos, durante toda a festa (menu sujeito a confirmação final no Instagram oficial @reveillonutopicfestival).
          </p>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8}}>
            <strong style={{color:'var(--text)'}}>Show da virada.</strong> Telões de led, contagem regressiva e show de fogos de artifício na passagem de ano, em meio à cenografia imersiva do evento.
          </p>
        </section>

        {/* LINE-UP */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Line-up
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {LINEUP.map(([nome, desc]) => (
              <div key={nome}>
                <div style={{fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,marginBottom:'4px'}}>{nome}</div>
                <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.7}}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INFORMAÇÕES IMPORTANTES */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Informações importantes
          </h2>
          <ul style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.9,paddingLeft:'20px'}}>
            <li>Evento 18+, não é permitida a entrada de menores de idade.</li>
            <li>Dress code sugerido: branco e estilo festival eletrônico premium. Não é permitido camiseta de time, boné, corrente grossa, regata ou chinelo.</li>
            <li>Ingresso pessoal e intransferível, deve ser apresentado no aplicativo ou impresso, junto com documento com foto.</li>
            <li>Estacionamento oficial com valet terceirizado.</li>
          </ul>
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

        {/* OUTROS RÉVEILLONS */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(20px,4vw,24px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'16px'}}>
            Outros Réveillons em São Paulo
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {OUTROS.map(r => (
              <Link key={r.slug} href={`/${r.slug}`} style={{display:'block',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'14px 16px'}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,marginBottom:'2px'}}>{r.nome}</div>
                <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{r.local}</div>
              </Link>
            ))}
            <Link href="/reveillon-sao-paulo" style={{fontSize:'13px',fontWeight:600,color:'var(--pink)'}}>Ver guia completo do Réveillon em São Paulo →</Link>
          </div>
        </section>

        {/* ENCERRAMENTO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 72px'}}>
          <hr style={{border:'none',borderTop:'1px solid var(--border)',marginBottom:'40px'}} />
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'24px',textAlign:'center'}}>
            O Réveillon Utopic Festival tem lotes limitados. Garanta o seu com o desconto da Direct.
          </p>
          <ConversionBlock />
        </section>
      </main>
      <Footer />
    </>
  )
}
