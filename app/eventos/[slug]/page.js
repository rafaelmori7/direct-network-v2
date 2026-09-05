import { getEvento, getTodosEventos, eventoPassou } from '../../../lib/contentful'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 86400

function formatarData(dateStr, opts) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', ...opts })
}

function formatarHorario(dateStr) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseLineup(str) {
  return String(str || '').split(',').map(nome => nome.trim()).filter(Boolean)
}

export async function generateStaticParams() {
  try {
    const eventos = await getTodosEventos()
    return eventos.map(e => ({ slug: e.fields.slug }))
  } catch { return [] }
}

export async function generateMetadata({ params }) {
  try {
    const evento = await getEvento(params.slug)
    if (!evento) return {}
    const f = evento.fields
    const flyerUrl = f.flyer?.fields?.file?.url
    const dataFormatada = formatarData(f.data, {day:'2-digit',month:'long',year:'numeric'})
    const passou = eventoPassou(f.data)
    const title = passou
      ? `${f.nome} — Evento Encerrado`
      : `${f.nome} | Ingressos com Desconto`
    const description = passou
      ? `${f.nome} aconteceu em ${dataFormatada} no ${f.local}, ${f.cidade}. Veja os próximos eventos com desconto exclusivo Direct Network.`
      : `${f.nome} em ${f.local}, ${f.cidade}. Use o cupom DIRECT e garanta seu ingresso com desconto exclusivo Direct Network.`
    const url = `https://www.directnw.com.br/eventos/${params.slug}`
    return {
      title,
      description,
      alternates: { canonical: `/eventos/${params.slug}` },
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

export default async function EventoPage({ params }) {
  let evento
  try { evento = await getEvento(params.slug) } catch { notFound() }
  if (!evento) notFound()

  const f = evento.fields
  const flyerUrl = f.flyer?.fields?.file?.url
  const dataFormatada = formatarData(f.data, {weekday:'long',day:'2-digit',month:'long',year:'numeric'})
  const horario = formatarHorario(f.data)
  const passou = eventoPassou(f.data)
  const lineup = parseLineup(f.lineup)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: f.nome,
    description: f.descrio || `${f.nome} em ${f.local}, ${f.cidade}.`,
    startDate: f.data,
    ...(flyerUrl && { image: [`https:${flyerUrl}?w=1200&fm=jpg&q=80`] }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: f.local, address: { '@type': 'PostalAddress', addressLocality: f.cidade, addressRegion: 'SP', addressCountry: 'BR' } },
    organizer: { '@type': 'Organization', name: 'Direct Network', url: 'https://www.directnw.com.br' },
    ...(!passou && {
      offers: f.precoDe
        ? { '@type': 'AggregateOffer', lowPrice: f.precoDe, priceCurrency: 'BRL', url: f.linkAfiliado, availability: 'https://schema.org/InStock' }
        : { '@type': 'Offer', url: f.linkAfiliado, availability: 'https://schema.org/InStock' },
    }),
    ...(lineup.length > 0 && { performer: lineup.map(nome => ({ '@type': 'MusicGroup', name: nome })) }),
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
            <span style={{color:'var(--text-muted)'}}>{f.gnero}</span>
            <span>›</span>
            <span style={{color:'var(--text-muted)'}}>{f.nome}</span>
          </div>
        </div>

        <div style={{maxWidth:'960px',margin:'0 auto',padding:'0 var(--px) 64px'}}>
          <div className="detail-grid">
            {/* FLYER */}
            <div className="detail-flyer" style={{position:'sticky',top:'88px'}}>
              <div style={{width:'100%',borderRadius:'12px',overflow:'hidden',background:'#534AB715',border:'1px solid rgba(83,74,183,0.2)',opacity: passou ? 0.65 : 1}}>
                {flyerUrl ? (
                  <img src={`https:${flyerUrl}`} alt={`Flyer do evento ${f.nome} em ${f.cidade}`} style={{width:'100%',height:'auto',display:'block'}} />
                ) : (
                  <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'8px'}}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="5" y="7" width="38" height="34" rx="6" stroke="#534AB7" strokeWidth="1.5"/><path d="M16 7V4M32 7V4" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 17h38" stroke="#534AB7" strokeWidth="1"/></svg>
                    <span style={{fontSize:'11px',color:'var(--text-faint)'}}>Flyer do evento</span>
                  </div>
                )}
              </div>
            </div>

            {/* CONTENT */}
            <div style={{display:'flex',flexDirection:'column',gap:'20px',paddingTop:'4px'}}>
              <div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'8px'}}>
                  <div style={{display:'inline-block',fontSize:'11px',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.2)',padding:'4px 12px',borderRadius:'20px'}}>{f.gnero}</div>
                  {passou && (
                    <div style={{display:'inline-block',fontSize:'11px',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-muted)',background:'var(--bg3)',border:'1px solid var(--border)',padding:'4px 12px',borderRadius:'20px'}}>Evento encerrado</div>
                  )}
                </div>
                <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(24px,5vw,36px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'6px'}}>{f.nome}</h1>
                <div style={{fontSize:'15px',color:'var(--text-muted)'}}>{f.local}</div>
              </div>

              <div style={{display:'flex',flexWrap:'wrap',gap:'10px'}}>
                <div style={{fontSize:'13px',color:'var(--text-muted)',background:'var(--bg2)',border:'1px solid var(--border)',padding:'7px 14px',borderRadius:'6px'}}>{dataFormatada}</div>
                <div style={{fontSize:'13px',color:'var(--text-muted)',background:'var(--bg2)',border:'1px solid var(--border)',padding:'7px 14px',borderRadius:'6px'}}>A partir das {horario}</div>
                <div style={{fontSize:'13px',color:'var(--text-muted)',background:'var(--bg2)',border:'1px solid var(--border)',padding:'7px 14px',borderRadius:'6px'}}>{f.cidade}</div>
                {f.plataforma && <div style={{fontSize:'11px',fontWeight:500,padding:'4px 10px',borderRadius:'4px',background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text-muted)'}}>{f.plataforma}</div>}
              </div>

              <hr style={{border:'none',borderTop:'1px solid var(--border)'}} />

              {passou ? (
                <>
                  <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px',textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-display)',fontSize:'16px',fontWeight:600,marginBottom:'6px'}}>Este evento já aconteceu</div>
                    <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6}}>Aconteceu em {dataFormatada}. Confira a agenda dos próximos eventos com desconto exclusivo.</p>
                  </div>

                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <Link href="/" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',background:'var(--pink)',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px',borderRadius:'8px'}}>
                      Ver próximos eventos
                    </Link>
                    <Link href="/listas" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--text)',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px',borderRadius:'8px'}}>
                      Ver listas VIP
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div style={{background:'rgba(233,30,140,0.05)',border:'1px solid rgba(233,30,140,0.25)',borderRadius:'var(--radius)',padding:'16px',display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{width:'40px',height:'40px',borderRadius:'8px',background:'rgba(233,30,140,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="#E91E8C" strokeWidth="1.5" strokeLinecap="round"><path d="M10 3H6a2 2 0 00-2 2v4l8.5 8.5a1.5 1.5 0 002.1 0l4-4a1.5 1.5 0 000-2.1L10 3z"/><circle cx="7.5" cy="7.5" r="1" fill="#E91E8C" stroke="none"/></svg>
                    </div>
                    <div>
                      <div style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,marginBottom:'2px'}}>Desconto exclusivo Direct Network</div>
                      <div style={{fontSize:'12px',color:'var(--text-muted)'}}>Já aplicado no link — só clicar e comprar</div>
                    </div>
                  </div>

                  {f.precoDe && (
                    <p style={{fontSize:'14px',fontWeight:600,color:'var(--text)'}}>
                      Ingressos a partir de R$ {formatarPreco(f.precoDe)}
                    </p>
                  )}

                  {/* BOTÕES DE COMPRA */}
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <a href={f.linkAfiliado} target="_blank" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',background:'var(--pink)',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px',borderRadius:'8px'}}>
                      Garantir ingresso com desconto
                    </a>
                    {f.linkPix && (
                      <a href={f.linkPix} target="_blank" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',background:'#32BCAD',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px',borderRadius:'8px'}}>
                        Pagar no Pix sem taxa
                      </a>
                    )}
                  </div>

                  {f.plataforma && (
                    <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6}}>
                      Os ingressos do {f.nome} são vendidos pela {f.plataforma}. Comprando pelo link da Direct, o cupom DIRECT já vem aplicado.
                    </p>
                  )}
                </>
              )}

              {f.descrio && (
                <>
                  <hr style={{border:'none',borderTop:'1px solid var(--border)'}} />
                  <div>
                    <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'12px'}}>Sobre o evento</div>
                    <div style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.75,whiteSpace:'pre-line'}}>{f.descrio}</div>
                  </div>
                </>
              )}

              {lineup.length > 0 && (
                <>
                  <hr style={{border:'none',borderTop:'1px solid var(--border)'}} />
                  <div>
                    <h2 style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'12px'}}>Line-up</h2>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                      {lineup.map(nome => (
                        <span key={nome} style={{fontSize:'13px',color:'var(--text-muted)',background:'var(--bg2)',border:'1px solid var(--border)',padding:'6px 12px',borderRadius:'6px'}}>{nome}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden'}}>
                {[['Data',dataFormatada],['Horário',`A partir das ${horario}`],['Local',f.local],['Cidade',f.cidade],['Gênero',f.gnero]].map(([label,value]) => (
                  <div key={label} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
                    <div style={{width:'30px',height:'30px',borderRadius:'6px',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="var(--text-muted)" strokeWidth="1.2"><rect x="1" y="2.5" width="13" height="11" rx="2"/><path d="M5 1.5v2M10 1.5v2M1 7h13"/></svg>
                    </div>
                    <div>
                      <div style={{fontSize:'11px',color:'var(--text-faint)',marginBottom:'1px'}}>{label}</div>
                      <div style={{fontSize:'13px',fontWeight:500}}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}>
                <div>
                  <strong style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,display:'block',marginBottom:'3px'}}>Quer receber os próximos antes de todo mundo?</strong>
                  <p style={{fontSize:'12px',color:'var(--text-muted)'}}>Entre no grupo WhatsApp da Direct Network.</p>
                </div>
                <a href="https://chat.whatsapp.com/DYcOSP7iF8U3OYgBHpU0tG" target="_blank" style={{display:'flex',alignItems:'center',gap:'7px',background:'#25D366',color:'#fff',fontSize:'12px',fontWeight:500,padding:'9px 16px',borderRadius:'6px',whiteSpace:'nowrap'}}>Entrar</a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
