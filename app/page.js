import Nav from './components/Nav'
import Footer from './components/Footer'
import EventsGrid from './components/EventsGrid'
import Link from 'next/link'
import { getEventos, getTodosEventos, getTodasListas } from '../lib/contentful'

export const revalidate = 300

function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default async function Home() {
  let eventos = []
  try {
    eventos = await getEventos()
  } catch (e) {
    eventos = []
  }

  // Monta a lista de gêneros a partir de tudo que existe no Contentful
  let generos = []
  try {
    const [todosEventos, todasListas] = await Promise.all([getTodosEventos(), getTodasListas()])
    const mapa = new Map()
    ;[...todosEventos, ...todasListas].forEach(i => {
      const nome = i.fields.gnero
      const slug = slugify(nome)
      if (slug && !mapa.has(slug)) mapa.set(slug, nome)
    })
    generos = Array.from(mapa, ([slug, nome]) => ({ slug, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  } catch (e) {
    generos = []
  }

  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section style={{padding:'60px var(--px) 48px',textAlign:'center',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-60px',left:'50%',transform:'translateX(-50%)',width:'600px',height:'300px',background:'radial-gradient(ellipse, rgba(233,30,140,0.12) 0%, transparent 70%)',pointerEvents:'none'}} />
          <div style={{display:'inline-block',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.25)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            Agenda — São Paulo &amp; Brasil
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(28px, 5vw, 52px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'16px'}}>
            As melhores festas,<br />com <span style={{color:'var(--pink)'}}>desconto exclusivo</span>
          </h1>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'480px',margin:'0 auto'}}>
            Código já aplicado no link. Só clicar e garantir seu ingresso.
          </p>
        </section>

        {/* GÊNEROS */}
        {generos.length > 0 && (
          <nav aria-label="Festas por gênero" style={{padding:'0 var(--px) 32px',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)'}}>
              Navegue por gênero
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',justifyContent:'center',maxWidth:'640px'}}>
              {generos.map(g => (
                <Link
                  key={g.slug}
                  href={`/festas/${g.slug}`}
                  style={{fontSize:'13px',fontWeight:500,color:'var(--text-muted)',background:'var(--bg2)',border:'1px solid var(--border)',padding:'9px 18px',borderRadius:'20px',whiteSpace:'nowrap'}}
                >
                  {g.nome}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* EVENTS COM FILTRO */}
        <EventsGrid eventos={eventos} />

        {/* WPP BANNER */}
        <div className="banner-flex" style={{margin:'0 var(--px) 40px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px'}}>
          <div>
            <strong style={{fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,display:'block',marginBottom:'4px'}}>Receba os próximos eventos em primeira mão</strong>
            <p style={{fontSize:'13px',color:'var(--text-muted)'}}>Entre no grupo e nunca perca uma festa com desconto.</p>
          </div>
          <a href="https://chat.whatsapp.com/DYcOSP7iF8U3OYgBHpU0tG" target="_blank" style={{display:'flex',alignItems:'center',gap:'8px',background:'#25D366',color:'#fff',fontSize:'13px',fontWeight:500,padding:'11px 20px',borderRadius:'6px',whiteSpace:'nowrap',flexShrink:0}}>
            Entrar no grupo
          </a>
        </div>

        {/* DIRECT CLUB */}
        <div style={{margin:'0 var(--px) 48px',background:'#0f0a00',border:'1px solid rgba(200,150,60,0.3)',borderRadius:'16px',overflow:'hidden'}}>
          <div className="club-grid" style={{padding:'28px'}}>
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'11px',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'#C8963C',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.25)',padding:'5px 12px',borderRadius:'20px',marginBottom:'14px'}}>
                Direct Club — Acesso VIP
              </div>
              <div style={{fontFamily:'var(--font-display)',fontSize:'clamp(20px,4vw,26px)',fontWeight:700,letterSpacing:'-0.02em',lineHeight:1.15,color:'#fff',marginBottom:'10px'}}>
                Além do desconto.<br /><span style={{color:'#C8963C'}}>Acesso VIP de verdade.</span>
              </div>
              <p style={{fontSize:'14px',color:'#777',lineHeight:1.65,marginBottom:'16px',maxWidth:'520px'}}>
                Lista VIP sem horário, área VIP, cortesias exclusivas e eventos que nem chegam aos grupos comuns.
              </p>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'20px'}}>
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
            <div className="club-plans">
              {[{name:'Anual',price:'R$ 48',sub:'R$ 474 à vista',featured:true},{name:'Semestral',price:'R$ 56',sub:'R$ 299 à vista'},{name:'Mensal',price:'R$ 68',sub:''}].map(p => (
                <div key={p.name} style={{background:p.featured?'rgba(200,150,60,0.06)':'rgba(255,255,255,0.03)',border:`1px solid ${p.featured?'rgba(200,150,60,0.4)':'rgba(200,150,60,0.12)'}`,borderRadius:'10px',padding:'14px 18px',textAlign:'center',minWidth:'140px',position:'relative'}}>
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
