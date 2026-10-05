import Link from 'next/link'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { REVEILLONS_SP } from '../../lib/reveillons-sp'

const TITLE = 'Réveillon La Nuit 2027 | Ingressos com Desconto — Direct Network'
const DESCRIPTION = 'Réveillon La Nuit 2027 na Casa Aragon, Butantã, São Paulo. Open bar premium, Chemical Surf e Banda Arnaldo Jr. no line-up. Ingressos com desconto Direct, a partir de R$ 420.'
const PAGE_PATH = '/reveillon-la-nuit-2027'
const PAGE_URL = `https://www.directnw.com.br${PAGE_PATH}`
const IMAGE_PATH = '/reveillon-la-nuit-2027.jpg'
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
    images: [{ url: IMAGE_PATH, width: 1200, height: 1200, alt: 'Réveillon La Nuit 2027' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE_PATH],
  },
}

const LINK_AFILIADO = 'https://curt.link/reveillon-lanuit'

// Lote em vigor até 07/10 (ou enquanto durar o estoque) — primeiro evento da
// série com preço e link de venda já confirmados desde o início, então aqui
// já entra o bloco offers no JSON-LD.
const schema = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Réveillon La Nuit 2027',
  description: 'Réveillon 2027 na Casa Aragon, no Butantã, com open bar premium, Chemical Surf e Banda Arnaldo Jr.',
  startDate: '2026-12-31T20:00:00-03:00',
  endDate: '2027-01-01T05:00:00-03:00',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  image: [IMAGE_URL],
  location: {
    '@type': 'Place',
    name: 'Casa Aragon',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Praça Prof. Rômulo Ribeiro Pieroni, s/n',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
  },
  offers: [
    {
      '@type': 'Offer',
      name: '2º lote — Open Bar individual',
      price: '420.00',
      priceCurrency: 'BRL',
      url: LINK_AFILIADO,
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2026-10-07',
      validFrom: '2026-10-05',
    },
    {
      '@type': 'Offer',
      name: 'Pré-venda Combo — 2 ingressos Open Bar',
      price: '800.00',
      priceCurrency: 'BRL',
      url: LINK_AFILIADO,
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2026-10-07',
      validFrom: '2026-10-05',
    },
    {
      '@type': 'Offer',
      name: 'Lounge Dining — All Inclusive',
      price: '920.00',
      priceCurrency: 'BRL',
      url: LINK_AFILIADO,
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2026-10-07',
      validFrom: '2026-10-05',
    },
  ],
}

function ConversionBlock() {
  return (
    <div style={{background:'rgba(200,150,60,0.06)',border:'1px solid rgba(200,150,60,0.3)',borderRadius:'var(--radius)',padding:'24px',textAlign:'center'}}>
      <div style={{fontFamily:'var(--font-display)',fontSize:'18px',fontWeight:700,marginBottom:'8px'}}>Ingressos à venda com desconto Direct</div>
      <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.7,marginBottom:'18px',maxWidth:'520px',marginLeft:'auto',marginRight:'auto'}}>
        2º lote a partir de R$ 420, com quantidade limitada até 07/10 (ou enquanto durar o estoque). Compre pelo nosso link e o desconto Direct já vem aplicado.
      </p>
      <a href={LINK_AFILIADO} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',background:'#C8963C',color:'#1a1205',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px 28px',borderRadius:'8px'}}>
        Comprar com desconto
      </a>
    </div>
  )
}

const FICHA = [
  ['Evento', 'Réveillon La Nuit 2027'],
  ['Data', '31 de dezembro de 2026'],
  ['Horário', 'Das 20h às 5h'],
  ['Local', 'Casa Aragon — Praça Prof. Rômulo Ribeiro Pieroni, s/n, Butantã, São Paulo/SP'],
  ['Open bar', 'Premium, durante toda a festa, em todos os setores'],
  ['Alimentação', 'Paga à parte no Espaço Gourmet (inclusa só no Lounge Dining)'],
  ['Line-up', 'Chemical Surf, Banda Arnaldo Jr. + DJs a confirmar'],
  ['Classificação', '18 anos'],
  ['Vendas', 'Sympla, em até 12x, ou PIX sem taxa direto com a produção'],
]

const LINEUP = [
  ['Chemical Surf', 'Duo formado pelos irmãos Lucas e Hugo Sanches, uma das maiores referências da música eletrônica brasileira há mais de duas décadas. Com a filosofia "RIP Genres", já passaram por Tomorrowland, Ultra Music Festival, Rock in Rio, Creamfields, EDC, Lollapalooza, Green Valley e Warung.'],
  ['Banda Arnaldo Jr.', 'Comandada pelo ex-integrante do Melanina Carioca, traz ao palco o Projeto Brasilidades, misturando pagode, sertanejo e clássicos nacionais em um repertório vibrante, feito para colocar todo mundo pra cantar e dançar.'],
  ['+ DJs convidados', 'Atrações extras serão divulgadas em breve nos canais oficiais do evento.'],
]

const TIERS = [
  {
    nome: '2º Lote — Open Bar',
    preco: 'R$ 420',
    unidade: 'por ingresso',
    nota: 'Até 07/10 ou enquanto durar o lote',
    incluso: ['1 entrada no evento', 'Open bar premium', 'Alimentação paga à parte no Espaço Gourmet'],
  },
  {
    nome: 'Pré-venda Combo',
    preco: 'R$ 800',
    unidade: '2 ingressos (R$ 400 cada) — compra mínima de 2',
    nota: 'Até 07/10 ou enquanto durar o lote',
    incluso: ['2 entradas no evento', 'Open bar premium', 'Alimentação paga à parte no Espaço Gourmet'],
  },
  {
    nome: 'Lounge Dining — All Inclusive',
    preco: 'R$ 920',
    unidade: 'por ingresso',
    nota: 'Até 07/10 ou enquanto durar o lote',
    incluso: ['1 entrada no evento', 'Open bar premium', 'Mesa e cadeira no jantar', 'Jantar servido: couvert, prato principal e sobremesa'],
  },
]

const FAQ = [
  ['Quando é o Réveillon La Nuit 2027?', '31 de dezembro de 2026, das 20h às 5h.'],
  ['Onde é o Réveillon La Nuit?', 'Na Casa Aragon, na Praça Prof. Rômulo Ribeiro Pieroni, s/n, Butantã, São Paulo.'],
  ['Tem open bar?', 'Sim, open bar premium durante toda a festa, em todos os setores.'],
  ['A comida está incluída no ingresso?', 'Só no Lounge Dining All Inclusive. Nos demais ingressos, a alimentação é paga à parte no Espaço Gourmet, uma praça de alimentação com ilhas gastronômicas.'],
  ['Como funciona o Lounge Dining?', 'Funciona como um restaurante: inclui mesa, cadeira e jantar servido (couvert, prato principal e sobremesa), além do open bar. Depois de confirmar a compra, a produção agenda o horário da sua mesa.'],
  ['Qual a classificação etária?', 'Evento 18+, não é permitida a entrada de menores de idade.'],
  ['Tem desconto Direct Network?', 'Sim. Comprando pelo nosso link, o desconto Direct Network já vem aplicado.'],
]

const OUTROS = REVEILLONS_SP.filter(r => r.slug !== 'reveillon-la-nuit-2027')

export default function ReveillonLaNuit2027Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Nav />
      <main>
        {/* HERO */}
        <section style={{padding:'56px var(--px) 32px',maxWidth:'800px',margin:'0 auto'}}>
          <div style={{display:'inline-block',fontSize:'11px',fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:'#C8963C',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.3)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            🎆 Réveillon 2027 — São Paulo
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(28px,5vw,44px)',fontWeight:700,lineHeight:1.15,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Réveillon La Nuit 2027: ingressos com desconto na Casa Aragon
          </h1>
          <div style={{width:'100%',borderRadius:'12px',overflow:'hidden',border:'1px solid var(--border)',marginBottom:'24px'}}>
            <img src={IMAGE_PATH} alt="Réveillon La Nuit 2027 — Casa Aragon, São Paulo" style={{width:'100%',height:'auto',display:'block'}} />
          </div>
          <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.75,marginBottom:'16px'}}>
            Por sete anos seguidos a Casa Aragon é endereço e referência de Réveillon em São Paulo. O La Nuit chega com open bar premium em todos os setores, curadoria musical entre eletrônica e brasilidades, e um dos espaços mais bonitos da zona oeste, no Butantã — a poucos minutos de Pinheiros, Vila Madalena, Alto de Pinheiros e Morumbi.
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

        {/* TIPOS DE INGRESSO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'12px'}}>
            Tipos de ingresso
          </h2>
          <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.7,marginBottom:'24px'}}>
            A venda começa pela pré-venda, com o menor valor de toda a temporada e quantidade limitada.
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {TIERS.map(tier => (
              <div key={tier.nome} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:'12px',marginBottom:'4px',flexWrap:'wrap'}}>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'16px',fontWeight:600}}>{tier.nome}</div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'20px',fontWeight:700,color:'#C8963C'}}>{tier.preco}</div>
                </div>
                <div style={{fontSize:'13px',color:'var(--text-faint)',marginBottom:'4px'}}>{tier.unidade}</div>
                <div style={{fontSize:'12px',color:'var(--text-faint)',marginBottom:'12px'}}>{tier.nota}</div>
                <ul style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.7,paddingLeft:'20px'}}>
                  {tier.incluso.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p style={{fontSize:'13px',color:'var(--text-faint)',lineHeight:1.7,marginTop:'16px'}}>
            As taxas da plataforma Sympla são aplicadas no final da compra do ingresso.
          </p>
        </section>

        {/* ESPAÇO GOURMET */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Espaço Gourmet
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8}}>
            Acesso à parte, aberto a todos os públicos do evento. Uma praça de alimentação com ilhas gastronômicas espalhadas pelo local, cada uma com uma proposta diferente. Você escolhe o que consumir e paga diretamente no local, sem custo embutido no ingresso.
          </p>
        </section>

        {/* OPEN BAR */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Open bar premium
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8}}>
            Durante todo o evento, para todos os setores (menu sujeito a ajuste, com confirmação anunciada no Instagram oficial): gin importado (Bombay, Beefeater ou Tanqueray), vodka importada (Absolut, Ciroc ou Grey Goose), whisky importado (Dewars 12 anos, Chivas 12 anos, Red Label ou Jameson), tequila importada (Jose Cuervo ou El Jimador), cerveja premium tradicional e zero (Heineken, Budweiser, Stella ou Beck's), energético Red Bull, espumante na virada (Salton Series Brut ou Farfalla), sucos, refrigerantes, água, água tônica e água de coco.
          </p>
        </section>

        {/* LOCALIZAÇÃO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,28px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Onde fica a Casa Aragon
          </h2>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.8}}>
            A Casa Aragon fica na Praça Prof. Rômulo Ribeiro Pieroni, s/n, no Butantã, zona oeste de São Paulo, a poucos minutos de Pinheiros, Vila Madalena, Alto de Pinheiros e Morumbi, com acesso fácil pela Marginal Pinheiros e estacionamento no local. Um dos espaços de eventos mais completos da cidade, com mais de 3.100 m² de área plana, 650 m² de área open exclusiva e dois salões independentes.
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
            <li>Ingresso pessoal e intransferível, deve ser apresentado no aplicativo ou impresso, junto com documento com foto.</li>
            <li>As taxas da plataforma Sympla são aplicadas no final da compra.</li>
            <li>Estacionamento disponível no local.</li>
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
            O 2º lote do Réveillon La Nuit tem quantidade limitada. Garanta o seu com o desconto da Direct.
          </p>
          <ConversionBlock />
        </section>
      </main>
      <Footer />
    </>
  )
}
