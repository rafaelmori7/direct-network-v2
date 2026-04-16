import Nav from '../components/Nav'
import Footer from '../components/Footer'

export const metadata = {
  title: 'Quem Somos | Direct Network',
  description: 'A Direct Network conecta você às melhores festas do Brasil com desconto exclusivo, lista VIP e cortesias. Curadoria ativa, parcerias diretas com produtores e venues.',
}

export default function QuemSomosPage() {
  return (
    <>
      <Nav />
      <main>

        {/* HERO */}
        <section style={{padding:'72px var(--px) 56px',maxWidth:'800px',margin:'0 auto'}}>
          <div style={{display:'inline-block',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.2)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            Quem somos
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(30px,6vw,48px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Acesso privilegiado<br />às melhores <span style={{color:'var(--pink)'}}>festas do Brasil</span>
          </h1>
          <p style={{fontSize:'17px',color:'var(--text-muted)',lineHeight:1.75,maxWidth:'600px'}}>
            A Direct Network é uma agência de promoções e eventos com mais de 10 anos conectando pessoas às melhores festas do Brasil.
          </p>
        </section>

        {/* O QUE FAZEMOS */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 56px'}}>
          <hr style={{border:'none',borderTop:'1px solid var(--border)',marginBottom:'48px'}} />
          <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'16px'}}>O que fazemos</div>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,30px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Selecionamos experiências que <span style={{color:'var(--pink)'}}>realmente valem a pena</span>
          </h2>
          <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.8}}>
            Trabalhamos diretamente com produtores, artistas e venues para garantir condições exclusivas — cupons de desconto, listas VIP e vantagens que você não encontra em outro lugar.
          </p>
        </section>

        {/* ACESSO */}
        <section style={{maxWidth:'800px',margin:'0 auto',padding:'0 var(--px) 80px'}}>
          <hr style={{border:'none',borderTop:'1px solid var(--border)',marginBottom:'48px'}} />
          <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'16px'}}>Acesso</div>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,30px)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'28px'}}>
            Faça parte da nossa comunidade.<br />Não perca mais nenhum evento.
          </h2>

          <div className="plans-grid">
            {/* Gratuito */}
            <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px',display:'flex',flexDirection:'column'}}>
              <div style={{display:'inline-block',fontSize:'10px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.2)',padding:'3px 10px',borderRadius:'20px',marginBottom:'16px',alignSelf:'flex-start'}}>
                Grupos gratuitos
              </div>
              <div style={{fontFamily:'var(--font-display)',fontSize:'20px',fontWeight:700,marginBottom:'4px'}}>Direct Network</div>
              <div style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'20px'}}>Gratuito</div>
              <div style={{display:'flex',flexDirection:'column',gap:'10px',flex:1}}>
                {['Programação semanal completa','Desconto já aplicado no link','Listas VIP com horário','Pix sem taxa em eventos parceiros'].map(item => (
                  <div key={item} style={{display:'flex',alignItems:'flex-start',gap:'8px',fontSize:'14px',color:'var(--text-muted)'}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--pink)" strokeWidth="1.5" style={{flexShrink:0,marginTop:'2px'}}><path d="M2 7l3 3 7-7"/></svg>
                    {item}
                  </div>
                ))}
              </div>
              <a href="https://chat.whatsapp.com/DylGoK7gscc9e4wJkqxspx" target="_blank"
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'24px',padding:'12px 20px',borderRadius:'7px',fontSize:'13px',fontWeight:600,background:'#25D366',color:'#fff'}}>
                Entrar no grupo WhatsApp
              </a>
            </div>

            {/* Direct Club */}
            <div style={{background:'#0f0a00',border:'1px solid rgba(200,150,60,0.35)',borderRadius:'var(--radius)',padding:'24px',display:'flex',flexDirection:'column'}}>
              <div style={{display:'inline-block',fontSize:'10px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C8963C',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.25)',padding:'3px 10px',borderRadius:'20px',marginBottom:'16px',alignSelf:'flex-start'}}>
                Direct Club
              </div>
              <div style={{fontFamily:'var(--font-display)',fontSize:'20px',fontWeight:700,marginBottom:'4px'}}>Acesso VIP</div>
              <div style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'20px'}}>Veja os planos no site</div>
              <div style={{display:'flex',flexDirection:'column',gap:'10px',flex:1}}>
                {['Tudo do grupo gratuito','Lista VIP sem horário','Acesso a áreas VIP','Cortesias exclusivas','Eventos não divulgados publicamente'].map(item => (
                  <div key={item} style={{display:'flex',alignItems:'flex-start',gap:'8px',fontSize:'14px',color:'var(--text-muted)'}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#C8963C" strokeWidth="1.5" style={{flexShrink:0,marginTop:'2px'}}><path d="M2 7l3 3 7-7"/></svg>
                    {item}
                  </div>
                ))}
              </div>
              <a href="https://www.directclub.com.br" target="_blank"
                style={{display:'block',marginTop:'24px',textAlign:'center',padding:'12px 20px',borderRadius:'7px',fontSize:'13px',fontWeight:600,background:'#C8963C',color:'#fff'}}>
                Conhecer o Direct Club →
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
