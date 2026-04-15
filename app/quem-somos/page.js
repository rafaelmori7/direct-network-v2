import Nav from '../components/Nav'
import Footer from '../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Quem Somos | Direct Network — Acesso privilegiado aos melhores eventos',
  description: 'A Direct Network conecta você às melhores festas de São Paulo com desconto, lista VIP e cortesias exclusivas.',
}

export default function QuemSomosPage() {
  return (
    <>
      <Nav />
      <main>
        <div style={{padding:'80px 32px 64px',maxWidth:'800px',margin:'0 auto'}}>
          <div style={{display:'inline-block',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.2)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            Quem somos
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(32px, 5vw, 48px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'20px'}}>
            Acesso privilegiado<br />às melhores <span style={{color:'var(--pink)'}}>festas do Brasil</span>
          </h1>
          <p style={{fontSize:'18px',color:'var(--text-muted)',lineHeight:1.7,maxWidth:'640px'}}>
            A Direct Network não é só um agregador de links. Somos um canal de distribuição com curadoria ativa, parcerias diretas com produtores e venues, e um time dedicado a colocar você nos melhores eventos — com desconto, na lista, ou com cortesia.
          </p>
        </div>

        <div style={{maxWidth:'800px',margin:'0 auto',padding:'0 32px 80px',display:'flex',flexDirection:'column',gap:'64px'}}>

          <div>
            <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'20px'}}>O que fazemos</div>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:'28px',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'16px'}}>Conectamos você a experiências que <span style={{color:'var(--pink)'}}>valem a pena</span></h2>
            <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.8,marginBottom:'14px'}}>
              Toda semana, nosso time seleciona os melhores eventos de São Paulo e do Brasil — eletrônica, pagode, sertanejo, shows e muito mais. Negociamos diretamente com produtores e venues para garantir condições que não estão disponíveis em outros canais.
            </p>
            <p style={{fontSize:'16px',color:'var(--text-muted)',lineHeight:1.8}}>
              Não é coincidência. É relacionamento. <strong style={{color:'var(--text)',fontWeight:500}}>Cada benefício foi negociado pela nossa equipe</strong> com quem produz o evento.
            </p>
          </div>

          <hr style={{border:'none',borderTop:'1px solid var(--border)'}} />

          <div>
            <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'20px'}}>Números</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:'16px'}}>
              {[['18','Grupos ativos no WhatsApp'],['16k+','Pessoas na nossa comunidade'],['20+','Eventos por mês']].map(([val, label]) => (
                <div key={label} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px 20px'}}>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'36px',fontWeight:700,color:'var(--pink)',lineHeight:1,marginBottom:'8px'}}>{val}</div>
                  <div style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5}}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <hr style={{border:'none',borderTop:'1px solid var(--border)'}} />

          <div>
            <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'20px'}}>Acesso</div>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:'28px',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'20px'}}>Dois níveis. Você escolhe o seu.</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
              <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px'}}>
                <div style={{display:'inline-block',fontSize:'10px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.2)',padding:'3px 10px',borderRadius:'20px',marginBottom:'14px'}}>Grupos gratuitos</div>
                <div style={{fontFamily:'var(--font-display)',fontSize:'18px',fontWeight:700,marginBottom:'6px'}}>Direct Network</div>
                <div style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'16px'}}>Gratuito</div>
                {['Programação semanal completa','Desconto já aplicado no link','Listas VIP com horário','Pix sem taxa em eventos parceiros'].map(item => (
                  <div key={item} style={{display:'flex',alignItems:'flex-start',gap:'8px',marginBottom:'8px',fontSize:'13px',color:'var(--text-muted)'}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--pink)" strokeWidth="1.5" style={{flexShrink:0,marginTop:'2px'}}><path d="M2 7l3 3 7-7"/></svg>
                    {item}
                  </div>
                ))}
                <a href="https://chat.whatsapp.com/DylGoK7gscc9e4wJkqxspx" target="_blank" style={{display:'block',marginTop:'20px',textAlign:'center',padding:'10px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:500,background:'transparent',border:'1px solid var(--pink)',color:'var(--pink)'}}>Entrar no grupo</a>
              </div>
              <div style={{background:'#0f0a00',border:'1px solid rgba(200,150,60,0.3)',borderRadius:'var(--radius)',padding:'24px'}}>
                <div style={{display:'inline-block',fontSize:'10px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C8963C',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.25)',padding:'3px 10px',borderRadius:'20px',marginBottom:'14px'}}>Direct Club</div>
                <div style={{fontFamily:'var(--font-display)',fontSize:'18px',fontWeight:700,marginBottom:'6px'}}>Acesso VIP</div>
                <div style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'16px'}}>A partir de <strong style={{color:'#C8963C'}}>R$48/mês</strong></div>
                {['Tudo do grupo gratuito','Lista VIP sem horário','Acesso a áreas VIP','Cortesias exclusivas','Eventos não divulgados publicamente'].map(item => (
                  <div key={item} style={{display:'flex',alignItems:'flex-start',gap:'8px',marginBottom:'8px',fontSize:'13px',color:'var(--text-muted)'}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#C8963C" strokeWidth="1.5" style={{flexShrink:0,marginTop:'2px'}}><path d="M2 7l3 3 7-7"/></svg>
                    {item}
                  </div>
                ))}
                <a href="https://www.directclub.com.br" target="_blank" style={{display:'block',marginTop:'20px',textAlign:'center',padding:'10px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:500,background:'#C8963C',border:'1px solid #C8963C',color:'#fff'}}>Assinar o Direct Club</a>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
