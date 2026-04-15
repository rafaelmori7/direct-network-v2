import { getLista, getListas } from '../../../lib/contentful'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  try {
    const listas = await getListas()
    return listas.map(l => ({ slug: l.fields.slug }))
  } catch { return [] }
}

export async function generateMetadata({ params }) {
  try {
    const lista = await getLista(params.slug)
    if (!lista) return {}
    const f = lista.fields
    return {
      title: `${f.nome} — Lista VIP, ${f.beneficio} | Direct Network`,
      description: `Coloque seu nome na lista VIP de ${f.nome} em ${f.local} e garanta ${f.beneficio.toLowerCase()}.`,
    }
  } catch { return {} }
}

export default async function ListaPage({ params }) {
  let lista
  try { lista = await getLista(params.slug) } catch { notFound() }
  if (!lista) notFound()

  const f = lista.fields
  const flyerUrl = f.flyer?.fields?.file?.url
  const dataFormatada = new Date(f.data).toLocaleDateString('pt-BR', {weekday:'long',day:'2-digit',month:'long',year:'numeric'})

  return (
    <>
      <Nav />
      <main>
        <div style={{background:'var(--bg)',padding:'16px 32px 0'}}>
          <div style={{fontSize:'12px',color:'var(--text-faint)',display:'flex',gap:'6px',alignItems:'center',marginBottom:'20px'}}>
            <Link href="/">Início</Link>
            <span>›</span>
            <Link href="/listas" style={{color:'var(--text-faint)'}}>Listas VIP</Link>
            <span>›</span>
            <span style={{color:'var(--text-muted)'}}>{f.nome}</span>
          </div>
        </div>

        <div style={{maxWidth:'960px',margin:'0 auto',padding:'0 32px 64px',display:'grid',gridTemplateColumns:'340px 1fr',gap:'40px',alignItems:'start'}}>
          <div style={{position:'sticky',top:'88px'}}>
            <div style={{width:'100%',aspectRatio:'1/1',borderRadius:'12px',overflow:'hidden',background:'#BA751715',border:'1px solid rgba(186,117,23,0.2)',marginBottom:'12px'}}>
              {flyerUrl ? (
                <img src={`https:${flyerUrl}`} alt={f.nome} style={{width:'100%',height:'100%',objectFit:'cover'}} />
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'8px'}}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="5" y="7" width="38" height="34" rx="6" stroke="#BA7517" strokeWidth="1.5"/><path d="M16 7V4M32 7V4" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 17h38" stroke="#BA7517" strokeWidth="1"/></svg>
                  <span style={{fontSize:'11px',color:'var(--text-faint)'}}>Flyer do evento</span>
                </div>
              )}
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'20px',paddingTop:'20px'}}>
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'11px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C8963C',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.25)',padding:'5px 14px',borderRadius:'20px',marginBottom:'10px'}}>
                Lista VIP — {f.genero}
              </div>
              <h1 style={{fontFamily:'var(--font-display)',fontSize:'36px',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'6px'}}>{f.nome}</h1>
              <div style={{fontSize:'16px',color:'var(--text-muted)'}}>{f.local}</div>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:'10px'}}>
              <div style={{fontSize:'13px',color:'var(--text-muted)',background:'var(--bg2)',border:'1px solid var(--border)',padding:'7px 14px',borderRadius:'6px'}}>{dataFormatada}</div>
              <div style={{fontSize:'13px',color:'var(--text-muted)',background:'var(--bg2)',border:'1px solid var(--border)',padding:'7px 14px',borderRadius:'6px'}}>{f.cidade}</div>
            </div>

            <hr style={{border:'none',borderTop:'1px solid var(--border)'}} />

            <div style={{background:'rgba(200,150,60,0.08)',border:'1px solid rgba(200,150,60,0.2)',borderRadius:'var(--radius)',padding:'18px 20px',display:'flex',alignItems:'center',gap:'14px'}}>
              <div style={{width:'44px',height:'44px',borderRadius:'8px',background:'rgba(200,150,60,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#C8963C" strokeWidth="1.5" strokeLinecap="round"><polygon points="11,2 13.5,8 20,8.5 15,13 16.5,20 11,17 5.5,20 7,13 2,8.5 8.5,8"/></svg>
              </div>
              <div>
                <div style={{fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,color:'#C8963C',marginBottom:'3px'}}>{f.beneficio}</div>
                <div style={{fontSize:'13px',color:'var(--text-muted)'}}>Coloque seu nome pelo link — sem custo</div>
              </div>
            </div>

            <a href={f.linkDeLista} target="_blank" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',width:'100%',background:'#C8963C',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'16px',borderRadius:'8px'}}>
              Colocar nome na lista
            </a>

            <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'18px 20px'}}>
              <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'14px'}}>Como funciona</div>
              {[
                ['1','Clique em "Colocar nome na lista" e preencha com seu nome completo'],
                ['2','No dia do evento, chegue até o horário indicado para garantir a entrada'],
                ['3','Na porta, diga que está na lista Direct Network e apresente seu documento'],
              ].map(([n, txt]) => (
                <div key={n} style={{display:'flex',alignItems:'flex-start',gap:'12px',marginBottom:'12px'}}>
                  <div style={{width:'24px',height:'24px',borderRadius:'50%',background:'var(--bg3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:600,color:'var(--text-muted)',flexShrink:0}}>{n}</div>
                  <div style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,paddingTop:'3px'}}>{txt}</div>
                </div>
              ))}
            </div>

            <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px'}}>
              <div>
                <strong style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,display:'block',marginBottom:'3px'}}>Quer receber as próximas listas?</strong>
                <p style={{fontSize:'12px',color:'var(--text-muted)'}}>Entre no grupo VIP da Direct Network.</p>
              </div>
              <a href="https://chat.whatsapp.com/DylGoK7gscc9e4wJkqxspx" target="_blank" style={{display:'flex',alignItems:'center',gap:'7px',background:'#25D366',color:'#fff',fontSize:'12px',fontWeight:500,padding:'9px 16px',borderRadius:'6px',whiteSpace:'nowrap'}}>Entrar</a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
