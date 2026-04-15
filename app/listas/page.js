import Link from 'next/link'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { getListas } from '../../lib/contentful'

export const revalidate = 300

export const metadata = {
  description: 'Coloque seu nome na lista VIP e entre grátis ou com desconto nas melhores festas de São Paulo.',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

const GENERO_COLORS = { 'Eletrônica': '#534AB7', 'Pagode': '#BA7517', 'Sertanejo': '#993556', 'Show': '#185FA5' }

export default async function ListasPage() {
  let listas = []
  try { listas = await getListas() } catch { listas = [] }

  return (
    <>
      <Nav />
      <main>
        <section style={{padding:'72px 32px 56px',textAlign:'center',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#C8963C',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.2)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            Listas VIP — Entrada gratuita
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(30px, 5vw, 48px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'16px'}}>
            Entre grátis nas<br />melhores festas de <span style={{color:'#C8963C'}}>SP</span>
          </h1>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'460px',margin:'0 auto'}}>
            Coloque seu nome na lista VIP e garanta entrada gratuita ou com desconto especial na porta.
          </p>
        </section>

        <section style={{padding:'32px 32px 48px'}}>
          {listas.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-faint)'}}>
              <p style={{fontSize:'16px',marginBottom:'8px'}}>Em breve novas listas</p>
              <p style={{fontSize:'13px'}}>Entre no grupo VIP para receber primeiro.</p>
            </div>
          ) : (
            <>
              <div style={{display:'flex',alignItems:'baseline',gap:'12px',marginBottom:'20px',paddingBottom:'16px',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontFamily:'var(--font-display)',fontSize:'20px',fontWeight:600}}>Listas abertas</span>
                <span style={{fontSize:'12px',color:'var(--text-faint)'}}>{listas.length} lista{listas.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:'16px'}}>
                {listas.map((lista) => {
                  const f = lista.fields
                  const color = GENERO_COLORS[f.gnero] || '#534AB7'
                  const flyerUrl = f.flyer?.fields?.file?.url
                  return (
                    <Link key={lista.sys.id} href={`/listas/${f.slug}`} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',display:'block'}}>
                      <div style={{width:'100%',aspectRatio:'1/1',position:'relative',background:flyerUrl?'var(--bg3)':`${color}18`}}>
                        {flyerUrl ? (
                          <img src={`https:${flyerUrl}`} alt={f.nome} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                        ) : (
                          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="6" width="32" height="28" rx="5" stroke={color} strokeWidth="1.5"/><path d="M13 6V3M27 6V3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M4 14h32" stroke={color} strokeWidth="1"/></svg>
                          </div>
                        )}
                        <span style={{position:'absolute',bottom:'8px',left:'8px',fontSize:'11px',fontWeight:500,background:'rgba(0,0,0,0.75)',color:'#fff',padding:'3px 8px',borderRadius:'4px'}}>{formatDate(f.data)}</span>
                        <span style={{position:'absolute',top:'8px',right:'8px',fontSize:'10px',fontWeight:600,padding:'3px 8px',borderRadius:'4px',background:'#C8963C',color:'#fff'}}>VIP</span>
                      </div>
                      <div style={{padding:'14px'}}>
                        <div style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,lineHeight:1.3,marginBottom:'4px'}}>{f.nome}</div>
                        <div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'8px'}}>{f.local}</div>
                        <div style={{fontSize:'11px',fontWeight:500,color:'#C8963C',background:'rgba(200,150,60,0.08)',border:'1px solid rgba(200,150,60,0.15)',padding:'4px 10px',borderRadius:'4px',marginBottom:'10px',display:'inline-block'}}>{f.benefcio}</div>
                        <div style={{display:'block',width:'100%',background:'transparent',border:'1px solid #C8963C',color:'#C8963C',fontSize:'12px',fontWeight:500,padding:'8px',borderRadius:'6px',textAlign:'center'}}>
                          Colocar nome na lista
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </section>

        <div style={{margin:'0 32px 48px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px',flexWrap:'wrap'}}>
          <div>
            <strong style={{fontFamily:'var(--font-display)',fontSize:'16px',fontWeight:600,display:'block',marginBottom:'4px'}}>Receba as listas antes de todo mundo</strong>
            <p style={{fontSize:'13px',color:'var(--text-muted)'}}>Entre no grupo VIP e nunca fique de fora.</p>
          </div>
          <a href="https://chat.whatsapp.com/DylGoK7gscc9e4wJkqxspx" target="_blank" style={{display:'flex',alignItems:'center',gap:'8px',background:'#25D366',color:'#fff',fontSize:'13px',fontWeight:500,padding:'11px 20px',borderRadius:'6px',whiteSpace:'nowrap'}}>
            Entrar no grupo
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}
