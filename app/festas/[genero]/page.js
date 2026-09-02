import { getTodosEventos, getTodasListas } from '../../../lib/contentful'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'

function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatarData(dateStr, opts) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', ...opts })
}

async function getDadosGenero(generoSlug) {
  let eventos = []
  let listas = []
  try { eventos = await getTodosEventos() } catch {}
  try { listas = await getTodasListas() } catch {}

  const itens = [
    ...eventos.map(e => ({ ...e, tipo: 'evento' })),
    ...listas.map(l => ({ ...l, tipo: 'lista' })),
  ].filter(i => slugify(i.fields.gnero) === generoSlug)

  if (itens.length === 0) return null

  const agora = new Date()
  const proximos = itens
    .filter(i => new Date(i.fields.data) >= agora)
    .sort((a, b) => new Date(a.fields.data) - new Date(b.fields.data))
  const passados = itens
    .filter(i => new Date(i.fields.data) < agora)
    .sort((a, b) => new Date(b.fields.data) - new Date(a.fields.data))
    .slice(0, 12)

  return { nomeGenero: itens[0].fields.gnero, proximos, passados }
}

export async function generateStaticParams() {
  try {
    const [eventos, listas] = await Promise.all([getTodosEventos(), getTodasListas()])
    const generos = new Set()
    ;[...eventos, ...listas].forEach(i => {
      const s = slugify(i.fields.gnero)
      if (s) generos.add(s)
    })
    return Array.from(generos).map(genero => ({ genero }))
  } catch { return [] }
}

export async function generateMetadata({ params }) {
  const dados = await getDadosGenero(params.genero)
  if (!dados) return {}
  const { nomeGenero, proximos } = dados
  const title = `Festas de ${nomeGenero} em São Paulo | Direct Network`
  const description = proximos.length
    ? `${proximos.length} ${proximos.length === 1 ? 'evento' : 'eventos'} de ${nomeGenero} em São Paulo com ingresso com desconto e lista VIP. Agenda atualizada pela Direct Network.`
    : `Agenda de festas de ${nomeGenero} em São Paulo. Ingressos com desconto e listas VIP pela Direct Network.`
  return {
    title,
    description,
    alternates: { canonical: `/festas/${params.genero}` },
    openGraph: { title, description, type: 'website', siteName: 'Direct Network', url: `https://www.directnw.com.br/festas/${params.genero}` },
  }
}

function Card({ item }) {
  const f = item.fields
  const flyerUrl = f.flyer?.fields?.file?.url
  const href = item.tipo === 'lista' ? `/listas/${f.slug}` : `/eventos/${f.slug}`
  const passou = new Date(f.data) < new Date()
  const ehLista = item.tipo === 'lista'

  return (
    <Link href={href} style={{display:'flex',gap:'14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px',alignItems:'center',opacity: passou ? 0.6 : 1}}>
      <div style={{width:'72px',height:'72px',borderRadius:'8px',overflow:'hidden',background:'var(--bg3)',flexShrink:0}}>
        {flyerUrl && (
          <img src={`https:${flyerUrl}?w=200&h=200&fit=fill&fm=jpg&q=70`} alt={`Flyer de ${f.nome}`} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
        )}
      </div>
      <div style={{minWidth:0,flex:1}}>
        <div style={{display:'inline-block',fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',padding:'3px 9px',borderRadius:'20px',marginBottom:'6px',
          color: ehLista ? '#C8963C' : 'var(--pink)',
          background: ehLista ? 'rgba(200,150,60,0.1)' : 'rgba(233,30,140,0.1)',
          border: ehLista ? '1px solid rgba(200,150,60,0.25)' : '1px solid rgba(233,30,140,0.2)'}}>
          {ehLista ? 'Lista VIP' : 'Ingresso'}
        </div>
        <div style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,lineHeight:1.3,marginBottom:'3px'}}>{f.nome}</div>
        <div style={{fontSize:'12px',color:'var(--text-muted)'}}>
          {formatarData(f.data, {day:'2-digit',month:'short'})} · {f.local}
        </div>
      </div>
    </Link>
  )
}

export default async function GeneroPage({ params }) {
  const dados = await getDadosGenero(params.genero)
  if (!dados) notFound()

  const { nomeGenero, proximos, passados } = dados

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Festas de ${nomeGenero} em São Paulo`,
    description: `Agenda de festas de ${nomeGenero} em São Paulo com ingressos com desconto e listas VIP.`,
    url: `https://www.directnw.com.br/festas/${params.genero}`,
    isPartOf: { '@type': 'WebSite', name: 'Direct Network', url: 'https://www.directnw.com.br' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Nav />
      <main>
        <div style={{padding:'16px var(--px) 0'}}>
          <div style={{fontSize:'12px',color:'var(--text-faint)',display:'flex',gap:'6px',alignItems:'center',marginBottom:'20px',flexWrap:'wrap'}}>
            <Link href="/">Festas</Link>
            <span>›</span>
            <span style={{color:'var(--text-muted)'}}>{nomeGenero}</span>
          </div>
        </div>

        <div style={{maxWidth:'720px',margin:'0 auto',padding:'0 var(--px) 64px',display:'flex',flexDirection:'column',gap:'24px'}}>

          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(24px,5vw,34px)',fontWeight:700,lineHeight:1.15,letterSpacing:'-0.02em',marginBottom:'8px'}}>
              Festas de {nomeGenero} em São Paulo
            </h1>
            <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.6}}>
              {proximos.length > 0
                ? `${proximos.length} ${proximos.length === 1 ? 'evento confirmado' : 'eventos confirmados'} na agenda. Ingressos com desconto exclusivo e listas VIP sem custo.`
                : 'Nenhum evento confirmado no momento. Entre no grupo do WhatsApp para receber os próximos em primeira mão.'}
            </p>
          </div>

          {proximos.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)'}}>Próximos</div>
              {proximos.map(item => <Card key={`${item.tipo}-${item.fields.slug}`} item={item} />)}
            </div>
          )}

          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}>
            <div>
              <strong style={{fontFamily:'var(--font-display)',fontSize:'13px',fontWeight:600,display:'block',marginBottom:'2px'}}>Quer receber as festas de {nomeGenero} antes de todo mundo?</strong>
              <p style={{fontSize:'12px',color:'var(--text-muted)'}}>Entre no grupo WhatsApp da Direct Network.</p>
            </div>
            <a href="https://chat.whatsapp.com/DYcOSP7iF8U3OYgBHpU0tG" target="_blank" style={{display:'flex',alignItems:'center',gap:'7px',background:'#25D366',color:'#fff',fontSize:'12px',fontWeight:500,padding:'9px 16px',borderRadius:'6px',whiteSpace:'nowrap'}}>Entrar</a>
          </div>

          {passados.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)'}}>Já aconteceram</div>
              {passados.map(item => <Card key={`${item.tipo}-${item.fields.slug}`} item={item} />)}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}
