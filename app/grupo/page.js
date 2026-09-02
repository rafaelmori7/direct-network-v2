import Nav from '../components/Nav'
import Footer from '../components/Footer'

export const metadata = {
  title: 'Entrar no Grupo — Direct Network',
  description: 'Escolha entre o grupo gratuito ou o acesso VIP da Direct Network.',
  alternates: { canonical: '/grupo' },
}

export default function GrupoPage() {
  return (
    <>
      <Nav />
      <main style={{minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px var(--px)'}}>
        <div style={{width:'100%',maxWidth:'480px',textAlign:'center'}}>

          {/* Badge */}
          <div style={{display:'inline-block',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.25)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            Direct Network
          </div>

          {/* Título */}
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(26px,5vw,40px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'12px'}}>
            Escolha seu acesso
          </h1>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.6,marginBottom:'40px'}}>
            Receba listas VIP, descontos e a programação dos melhores eventos de SP.
          </p>

          {/* GRATUITO — destaque principal */}
          <a
            href="https://chat.whatsapp.com/DYcOSP7iF8U3OYgBHpU0tG"
            target="_blank"
            style={{display:'block',background:'var(--bg2)',border:'2px solid #25D366',borderRadius:'var(--radius)',padding:'28px 24px',textDecoration:'none',marginBottom:'16px'}}
          >
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'12px'}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span style={{fontFamily:'var(--font-display)',fontSize:'20px',fontWeight:700,color:'#fff'}}>Grupo Gratuito</span>
            </div>
            <p style={{fontSize:'14px',color:'var(--text-muted)',marginBottom:'20px',lineHeight:1.5}}>
              Receba a programação semanal, listas VIP e descontos exclusivos nos melhores eventos de SP.
            </p>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',marginBottom:'20px'}}>
              {['📅 Agenda semanal','🎟️ Listas VIP','💸 Descontos exclusivos','🆓 Gratuito'].map(b => (
                <div key={b} style={{fontSize:'12px',fontWeight:500,color:'#fff',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',padding:'5px 12px',borderRadius:'20px'}}>{b}</div>
              ))}
            </div>
            <div style={{background:'#25D366',color:'#fff',fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,padding:'14px 24px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Entrar no grupo grátis
            </div>
          </a>

          {/* Divisor */}
          <div style={{display:'flex',alignItems:'center',gap:'12px',margin:'8px 0'}}>
            <div style={{flex:1,height:'1px',background:'var(--border)'}}/>
            <span style={{fontSize:'12px',color:'var(--text-faint)'}}>ou para quem quer mais</span>
            <div style={{flex:1,height:'1px',background:'var(--border)'}}/>
          </div>

          {/* VIP — secundário */}
          <a
            href="https://www.directclub.com.br"
            target="_blank"
            style={{display:'block',background:'#0f0a00',border:'1px solid rgba(200,150,60,0.3)',borderRadius:'var(--radius)',padding:'20px 24px',textDecoration:'none',marginTop:'8px'}}
          >
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8963C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div style={{textAlign:'left',flex:1}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,color:'#C8963C',marginBottom:'2px'}}>Acesso VIP — Direct Club</div>
                <div style={{fontSize:'12px',color:'#666'}}>Lista sem horário, área VIP e cortesias · a partir de R$48/mês</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="#C8963C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </a>

        </div>
      </main>
      <Footer />
    </>
  )
}
