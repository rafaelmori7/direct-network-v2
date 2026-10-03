import Link from 'next/link'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { REVEILLONS_SP } from '../../lib/reveillons-sp'

const TITLE = 'Réveillon São Paulo 2027 | Guia Completo + Ingressos com Desconto'
const DESCRIPTION = 'Guia do Réveillon em São Paulo 2027: todos os eventos de virada de ano com desconto Direct, open bar, open food e dicas de onde ficar e o que fazer na cidade.'
const PAGE_PATH = '/reveillon-sao-paulo'
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
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
}

const LINK_GRUPO_WHATSAPP = 'https://chat.whatsapp.com/DYcOSP7iF8U3OYgBHpU0tG'
// Link genérico, sem id de afiliado — trocar se/quando tivermos um parceiro
// de hospedagem com link rastreável (pendência Rafael).
const LINK_BOOKING = 'https://www.booking.com/city/br/sao-paulo.html'

const schema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: TITLE,
  description: DESCRIPTION,
  url: PAGE_URL,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: REVEILLONS_SP.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: r.nome,
      url: `https://www.directnw.com.br/${r.slug}`,
    })),
  },
}

const PONTOS_TURISTICOS = [
  ['MASP', 'Museu de Arte de São Paulo, na Avenida Paulista — um dos cartões-postais da cidade.'],
  ['Parque Ibirapuera', 'O parque mais famoso de SP, ótimo pra caminhar, andar de bike e curtir o verão antes da virada.'],
  ['Avenida Paulista', 'O coração da cidade, com museus, shoppings e o Parque Trianon por perto.'],
  ['Mercado Municipal (Mercadão)', 'Parada clássica pra provar o famoso sanduíche de mortadela.'],
  ['Beco do Batman', 'Point de arte urbana na Vila Madalena, ótimo pra fotos.'],
]

const FAQ = [
  ['Qual é o melhor Réveillon de São Paulo em 2027?', 'Depende do estilo que você procura: o Virada Estaiada tem vista pra Ponte Estaiada, o Sampa Festival mistura pagode, sertanejo e eletrônica, e o Utopic Festival é 100% música eletrônica. Todos têm open bar e abrem com desconto exclusivo Direct.'],
  ['Quando devo comprar o ingresso do Réveillon?', 'O quanto antes. Os réveillons de São Paulo vendem por lotes crescentes e esgotam antes da virada — o primeiro lote é sempre o mais barato.'],
  ['Tem desconto para os Réveillons de São Paulo?', 'Sim, a Direct Network tem desconto exclusivo para os Réveillons deste guia. Entre no grupo do WhatsApp pra receber o link de cada um assim que abrir.'],
  ['Onde ficar hospedado para o Réveillon em São Paulo?', 'Região da Avenida Paulista, Jardins ou Vila Olímpia/Itaim são as mais centrais, com fácil acesso de app às principais casas de festa da cidade.'],
]

export default function ReveillonSaoPauloPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Nav />
      <main>
        {/* HERO */}
        <section style={{padding:'56px var(--px) 32px',maxWidth:'800px',margin:'0 auto'}}>
          <div style={{display:'inline-block',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.2)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            Guia 2027
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(28px,5vw,44px)',fontWeight:700,lineHeight:1.15,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Réveillon em São Paulo 2027: guia completo e ingressos com desconto
          </h1>
          <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.75,marginBottom:'16px'}}>
            São Paulo virou um dos principais destinos de réveillon do Brasil, com festas open bar premium que esgotam ano após ano. Reunimos aqui os Réveillons que a Direct Network vende com desconto exclusivo, além de dicas de onde ficar e o que fazer na cidade pra quem vem de fora.
          </p>
          <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.75}}>
            Escolha o seu abaixo — cada um tem sua própria página com ficha completa, line-up e o link de compra.
          </p>
        </section>

        {/* OS RÉVEILLONS */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Os Réveillons 2027 em São Paulo
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {REVEILLONS_SP.map(r => (
              <Link key={r.slug} href={`/${r.slug}`} style={{display:'block',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'18px 20px'}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:'16px',fontWeight:600,marginBottom:'4px'}}>{r.nome}</div>
                <div style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'8px'}}>{r.local}</div>
                <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,marginBottom:'8px'}}>{r.resumo}</p>
                <span style={{fontSize:'12px',fontWeight:600,color:'var(--pink)'}}>Ver detalhes e ingressos →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ONDE FICAR */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <hr style={{border:'none',borderTop:'1px solid var(--border)',marginBottom:'40px'}} />
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Onde ficar em São Paulo na virada
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'16px'}}>
            Quem vem de fora pra curtir o Réveillon em São Paulo costuma se hospedar perto da Avenida Paulista, Jardins ou Vila Olímpia/Itaim — bairros centrais, com boa oferta de hotéis em todas as faixas de preço e fácil acesso de app até as casas de festa deste guia.
          </p>
          <a href={LINK_BOOKING} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'8px',fontSize:'13px',fontWeight:600,color:'var(--pink)'}}>
            Buscar hospedagem em São Paulo no Booking.com →
          </a>
        </section>

        {/* O QUE FAZER */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            O que fazer em São Paulo
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            {PONTOS_TURISTICOS.map(([nome, desc]) => (
              <div key={nome}>
                <div style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,marginBottom:'2px'}}>{nome}</div>
                <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.7}}>{desc}</p>
              </div>
            ))}
          </div>
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
          <div style={{background:'rgba(233,30,140,0.05)',border:'1px solid rgba(233,30,140,0.25)',borderRadius:'var(--radius)',padding:'24px',textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:'18px',fontWeight:700,marginBottom:'8px'}}>Receba o desconto de todos os Réveillons</div>
            <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.7,marginBottom:'18px',maxWidth:'480px',marginLeft:'auto',marginRight:'auto'}}>
              Entre no grupo do WhatsApp da Direct Network e receba o link com desconto de cada Réveillon assim que abrir.
            </p>
            <a href={LINK_GRUPO_WHATSAPP} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',background:'var(--pink)',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px 28px',borderRadius:'8px'}}>
              Entrar no grupo
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
