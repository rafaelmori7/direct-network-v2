import Link from 'next/link'
import Nav from './components/Nav'
import Footer from './components/Footer'
import { getEventos } from '../lib/contentful'

const GENERO_COLORS = {
  'Eletrônica': '#534AB7',
  'Pagode': '#BA7517',
  'Sertanejo': '#993556',
  'Show': '#185FA5',
}

const GENERO_LABELS = {
  'Eletrônica': 'eletro',
  'Pagode': 'pagode',
  'Sertanejo': 'sertanejo',
  'Show': 'show',
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export const revalidate = 300 // revalida a cada 5 minutos

export default async function Home() {
  let eventos = []
  try {
    eventos = await getEventos()
  } catch (e) {
    eventos = []
  }

  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section style={{padding:'80px 32px 64px',textAlign:'center',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-60px',left:'50%',transform:'translateX(-50%)',width:'600px',height:'300px',background:'radial-gradient(ellipse, rgba(233,30,140,0.12) 0%, transparent 70%)',pointerEvents:'none'}} />
          <div style={{display:'inline-block',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.25)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            Agenda — São Paulo &amp; Brasil
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(32px, 5vw, 52px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'16px'}}>
            As melhores festas,<br />com <span style={{color:'var(--pink)'}}>desconto exclusivo</span>
          </h1>
          <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'480px',margin:'0 auto'}}>
            Código já aplicado no link. Só clicar e garantir seu ingresso.
          </p>
        </section>

        {/* EVENTS GRID */}
        <section style={{padding:'32px 32px 48px'}}>
          {eventos.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-faint)'}}>
              <p style={{fontSize:'16px',marginBottom:'8px'}}>Em breve novos eventos</p>
              <p style={{fontSize:'13px'}}>Entre no grupo VIP para receber primeiro.</p>
            </div>
          ) : (
            <>
              <div style={{display:'flex',alignItems:'baseline',gap:'12px',marginBottom:'20px',paddingBottom:'16px',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontFamily:'var(--font-display)',fontSize:'20px',fontWeight:600}}>Próximos eventos</span>
                <span style={{fontSize:'12px',color:'var(--text-faint)'}}>{eventos.length} evento{eventos.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:'16px'}}>
                {eventos.map((evento) => {
                  const f = evento.fields
                  const color = GENERO_COLORS[f.gnero] || '#534AB7'
                  const flyerUrl = f.flyer?.fields?.file?.url
                  return (
                    <Link key={evento.sys.id} href={`/eventos/${f.slug}`} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',display:'block',transition:'border-color 0.2s, transform 0.2s'}}>
                      <div style={{width:'100%',aspectRatio:'1/1',overflow:'hidden',position:'relative',background:flyerUrl?'var(--bg3)':`${color}18`}}>
                        {flyerUrl ? (
                          <img src={`https:${flyerUrl}`} alt={f.nome} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                        ) : (
                          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'6px'}}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="6" width="32" height="28" rx="5" stroke={color} strokeWidth="1.5"/><path d="M13 6V3M27 6V3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M4 14h32" stroke={color} strokeWidth="1"/></svg>
                          </div>
                        )}
                        <span style={{position:'absolute',bottom:'8px',left:'8px',fontSize:'11px',fontWeight:500,background:'rgba(0,0,0,0.75)',color:'#fff',padding:'3px 8px',borderRadius:'4px',backdropFilter:'blur(4px)'}}>
                          {formatDate(f.data)}
                        </span>
                        <span style={{position:'absolute',top:'8px',right:'8px',fontSize:'10px',fontWeight:500,padding:'3px 8px',borderRadius:'4px',background:`${color}dd`,color:'#fff'}}>
                          {f.gnero}
                        </span>
                      </div>
                      <div style={{padding:'14px'}}>
                        <div style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,lineHeight:1.3,marginBottom:'4px'}}>{f.nome}</div>
                        <div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'12px'}}>{f.local}</div>
                        <div style={{display:'block',width:'100%',background:'var(--pink)',border:'1px solid var(--pink)',color:'#fff',fontSize:'12px',fontWeight:500,padding:'8px',borderRadius:'6px',textAlign:'center'}}>
                          Ver evento + desconto
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </section>

        {/* WPP BANNER */}
        <div style={{margin:'0 32px 48px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px',flexWrap:'wrap'}}>
          <div>
            <strong style={{fontFamily:'var(--font-display)',fontSize:'16px',fontWeight:600,display:'block',marginBottom:'4px'}}>Receba os próximos eventos em primeira mão</strong>
            <p style={{fontSize:'13px',color:'var(--text-muted)'}}>Entre no grupo e nunca perca uma festa com desconto.</p>
          </div>
          <a href="https://chat.whatsapp.com/DylGoK7gscc9e4wJkqxspx" target="_blank" style={{display:'flex',alignItems:'center',gap:'8px',background:'#25D366',color:'#fff',fontSize:'13px',fontWeight:500,padding:'11px 20px',borderRadius:'6px',whiteSpace:'nowrap'}}>
            Entrar no grupo
          </a>
        </div>

        {/* DIRECT CLUB */}
        <div style={{margin:'0 32px 48px',background:'#0f0a00',border:'1px solid rgba(200,150,60,0.3)',borderRadius:'16px',overflow:'hidden',position:'relative'}}>
          <div style={{padding:'36px 40px',display:'grid',gridTemplateColumns:'1fr auto',gap:'40px',alignItems:'center'}}>
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'11px',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'#C8963C',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.25)',padding:'5px 12px',borderRadius:'20px',marginBottom:'14px'}}>
                Direct Club — Acesso VIP
              </div>
              <div style={{fontFamily:'var(--font-display)',fontSize:'26px',fontWeight:700,letterSpacing:'-0.02em',lineHeight:1.15,color:'#fff',marginBottom:'10px'}}>
                Além do desconto.<br /><span style={{color:'#C8963C'}}>Acesso VIP de verdade.</span>
              </div>
              <p style={{fontSize:'14px',color:'#777',lineHeight:1.65,marginBottom:'20px',maxWidth:'520px'}}>
                Lista VIP sem horário, área VIP, cortesias exclusivas e eventos que nem chegam aos grupos comuns.
              </p>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'24px'}}>
                {['Lista VIP sem horário','Acesso a áreas VIP','Cortesias exclusivas','Eventos exclusivos'].map(b => (
                  <div key={b} style={{fontSize:'12px',fontWeight:500,color:'#C8963C',background:'rgba(200,150,60,0.08)',border:'1px solid rgba(200,150,60,0.15)',padding:'5px 12px',borderRadius:'20px'}}>{b}</div>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
                <a href="https://www.directclub.com.br" target="_blank" style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'#C8963C',color:'#fff',fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,padding:'12px 24px',borderRadius:'8px',whiteSpace:'nowrap'}}>
                  Quero acesso VIP →
                </a>
                <span style={{fontSize:'13px',color:'#555'}}>A partir de <strong style={{color:'#C8963C'}}>R$&nbsp;48/mês</strong></span>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px',flexShrink:0}}>
              {[{name:'Anual',price:'R$ 48',sub:'R$ 474 à vista',featured:true},{name:'Semestral',price:'R$ 56',sub:'R$ 299 à vista'},{name:'Mensal',price:'R$ 68',sub:''}].map(p => (
                <div key={p.name} style={{background:p.featured?'rgba(200,150,60,0.06)':'rgba(255,255,255,0.03)',border:`1px solid ${p.featured?'rgba(200,150,60,0.4)':'rgba(200,150,60,0.12)'}`,borderRadius:'10px',padding:'14px 18px',textAlign:'center',minWidth:'155px',position:'relative'}}>
                  {p.featured && <div style={{position:'absolute',top:'-10px',left:'50%',transform:'translateX(-50%)',fontSize:'10px',fontWeight:600,background:'#C8963C',color:'#fff',padding:'2px 10px',borderRadius:'20px',whiteSpace:'nowrap'}}>Melhor escolha</div>}
                  <div style={{fontSize:'11px',color:'#555',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.06em'}}>{p.name}</div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'20px',fontWeight:700,color:'#fff'}}>{p.price}<span style={{fontSize:'12px',fontWeight:400,color:'#555'}}>/mês</span></div>
                  {p.sub && <div style={{fontSize:'11px',color:'#444',marginTop:'2px'}}>{p.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
