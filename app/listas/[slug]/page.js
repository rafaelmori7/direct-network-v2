import { getLista, getTodasListas, eventoPassou } from '../../../lib/contentful'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 3600

function formatarData(dateStr, opts) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', ...opts })
}

function normalizar(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function casaJaMencionada(nome, local) {
  const nomeNorm = normalizar(nome)
  return normalizar(local)
    .split(/\s+/)
    .filter(palavra => palavra.length > 3)
    .some(palavra => nomeNorm.includes(palavra))
}

export async function generateStaticParams() {
  try {
    const listas = await getTodasListas()
    return listas.map(l => ({ slug: l.fields.slug }))
  } catch { return [] }
}

export async function generateMetadata({ params }) {
  try {
    const lista = await getLista(params.slug)
    if (!lista) return {}
    const f = lista.fields
    const flyerUrl = f.flyer?.fields?.file?.url
    const passou = eventoPassou(f.data)
    const dataCurta = formatarData(f.data, {day:'2-digit',month:'long',year:'numeric'})
    const title = `${f.nome} — Lista VIP, ${f.benefcio} | Direct Network`
    const description = passou
      ? `A lista VIP de ${f.nome} em ${f.local} aconteceu em ${dataCurta}. Veja as listas VIP abertas agora.`
      : `Coloque seu nome na lista VIP de ${f.nome} em ${f.local} e garanta ${f.benefcio.toLowerCase()}.`
    const url = `https://www.directnw.com.br/listas/${params.slug}`
    return {
      title,
      description,
      alternates: { canonical: `/listas/${params.slug}` },
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'Direct Network',
        url,
        images: flyerUrl ? [{ url: `https:${flyerUrl}?w=1200&fm=jpg&q=80`, width: 1200, height: 630, alt: f.nome }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: flyerUrl ? [`https:${flyerUrl}?w=1200&fm=jpg&q=80`] : [],
      },
    }
  } catch { return {} }
}

export default async function ListaPage({ params }) {
  let lista
  try { lista = await getLista(params.slug) } catch { notFound() }
  if (!lista) notFound()

  const f = lista.fields
  const flyerUrl = f.flyer?.fields?.file?.url
  const dataFormatada = formatarData(f.data, {weekday:'long',day:'2-digit',month:'long',year:'numeric'})
  const passou = eventoPassou(f.data)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: f.nome,
    description: f.descricao || `Lista VIP para ${f.nome} em ${f.local}. ${f.benefcio}.`,
    startDate: f.data,
    endDate: new Date(new Date(f.data).getTime() + 6 * 60 * 60 * 1000).toISOString(),
    ...(flyerUrl && { image: [`https:${flyerUrl}?w=1200&fm=jpg&q=80`] }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: f.local, address: { '@type': 'PostalAddress', addressLocality: f.cidade, addressRegion: 'SP', addressCountry: 'BR' } },
    organizer: { '@type': 'Organization', name: 'Direct Network', url: 'https://www.directnw.com.br' },
    ...(!passou && { offers: { '@type': 'Offer', url: f.linkDeLista, price: '0', priceCurrency: 'BRL', availability: 'https://schema.org/InStock' } }),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Nav />
      <main>
        <div style={{padding:'16px var(--px) 0'}}>
          <div style={{fontSize:'12px',color:'var(--text-faint)',display:'flex',gap:'6px',alignItems:'center',marginBottom:'20px',flexWrap:'wrap'}}>
            <Link href="/">Início</Link>
            <span>›</span>
            <Link href="/listas" style={{color:'var(--text-faint)'}}>Listas VIP</Link>
            <span>›</span>
            <span style={{color:'var(--text-muted)'}}>{f.nome}</span>
          </div>
        </div>

        <div style={{maxWidth:'560px',margin:'0 auto',padding:'0 var(--px) 64px',display:'flex',flexDirection:'column',gap:'20px'}}>

          {/* INFORMAÇÕES PRINCIPAIS */}
          <div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'10px'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'11px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C8963C',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.25)',padding:'5px 14px',borderRadius:'20px'}}>
                {f.gnero}
              </div>
              {passou && (
                <div style={{display:'inline-flex',alignItems:'center',fontSize:'11px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',background:'var(--bg3)',border:'1px solid var(--border)',padding:'5px 14px',borderRadius:'20px'}}>
                  Encerrada
                </div>
              )}
            </div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,5vw,32px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'6px'}}>
              Lista VIP {f.nome}
              {!casaJaMencionada(f.nome, f.local) && ` — ${f.local}`}
            </h1>
          </div>

          <div style={{display:'flex',flexWrap:'wrap',gap:'10px'}}>
            <div style={{fontSize:'13px',color:'var(--text-muted)',background:'var(--bg2)',border:'1px solid var(--border)',padding:'7px 14px',borderRadius:'6px'}}>{dataFormatada}</div>
            <div style={{fontSize:'13px',color:'var(--text-muted)',background:'var(--bg2)',border:'1px solid var(--border)',padding:'7px 14px',borderRadius:'6px'}}>{f.cidade}</div>
          </div>

          <hr style={{border:'none',borderTop:'1px solid var(--border)'}} />

          {passou ? (
            <>
              <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px',textAlign:'center'}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:'16px',fontWeight:600,marginBottom:'6px'}}>Esta lista já encerrou</div>
                <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6}}>Aconteceu em {dataFormatada}. Veja as listas VIP abertas agora.</p>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <Link href="/listas" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',background:'#C8963C',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px',borderRadius:'8px'}}>
                  Ver listas VIP abertas
                </Link>
                <Link href="/" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--text)',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px',borderRadius:'8px'}}>
                  Ver próximos eventos
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* BENEFÍCIO */}
              <div style={{background:'rgba(200,150,60,0.08)',border:'1px solid rgba(200,150,60,0.2)',borderRadius:'var(--radius)',padding:'16px 18px',display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'8px',background:'rgba(200,150,60,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="#C8963C" strokeWidth="1.5" strokeLinecap="round"><polygon points="11,2 13.5,8 20,8.5 15,13 16.5,20 11,17 5.5,20 7,13 2,8.5 8.5,8"/></svg>
                </div>
                <div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,color:'#C8963C',marginBottom:'2px'}}>{f.benefcio}</div>
                  <div style={{fontSize:'12px',color:'var(--text-muted)'}}>Coloque seu nome pelo link — sem custo</div>
                </div>
              </div>

              {/* BOTÃO PRINCIPAL */}
              <a href={f.linkDeLista} target="_blank" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',width:'100%',background:'#C8963C',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px',borderRadius:'8px'}}>
                Colocar nome na lista
              </a>

              {/* COMO FUNCIONA */}
              <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 18px'}}>
                <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'12px'}}>Como funciona</div>
                {[
                  ['1','Clique em "Colocar nome na lista" e preencha com seu nome completo'],
                  ['2','No dia do evento, chegue até o horário indicado para garantir a entrada'],
                  ['3','Na porta, diga que está na lista Direct Network e apresente seu documento'],
                ].map(([n, txt]) => (
                  <div key={n} style={{display:'flex',alignItems:'flex-start',gap:'12px',marginBottom:'10px'}}>
                    <div style={{width:'22px',height:'22px',borderRadius:'50%',background:'var(--bg3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,color:'var(--text-muted)',flexShrink:0}}>{n}</div>
                    <div style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,paddingTop:'2px'}}>{txt}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* DESCRIÇÃO — só aparece se tiver */}
          {f.descricao && (
            <>
              <hr style={{border:'none',borderTop:'1px solid var(--border)'}} />
              <div>
                <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'12px'}}>Sobre o evento</div>
                <div style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.75,whiteSpace:'pre-line'}}>{f.descricao}</div>
              </div>
            </>
          )}

          {/* FLYER — só aparece se tiver */}
          {flyerUrl && (
            <div style={{borderRadius:'12px',overflow:'hidden',border:'1px solid var(--border)',opacity: passou ? 0.65 : 1}}>
              <img src={`https:${flyerUrl}`} alt={`Flyer da lista VIP ${f.nome} em ${f.local}`} style={{width:'100%',height:'auto',display:'block'}} />
            </div>
          )}

          {/* WHATSAPP */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}>
            <div>
              <strong style={{fontFamily:'var(--font-display)',fontSize:'13px',fontWeight:600,display:'block',marginBottom:'2px'}}>Quer receber as próximas listas?</strong>
              <p style={{fontSize:'12px',color:'var(--text-muted)'}}>Entre no grupo WhatsApp da Direct Network.</p>
            </div>
            <a href="https://chat.whatsapp.com/DYcOSP7iF8U3OYgBHpU0tG" target="_blank" style={{display:'flex',alignItems:'center',gap:'7px',background:'#25D366',color:'#fff',fontSize:'12px',fontWeight:500,padding:'9px 16px',borderRadius:'6px',whiteSpace:'nowrap'}}>Entrar</a>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
