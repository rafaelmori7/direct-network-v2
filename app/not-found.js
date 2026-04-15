import Link from 'next/link'
import Nav from './components/Nav'
import Footer from './components/Footer'

export default function NotFound() {
  return (
    <>
      <Nav />
      <main style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 32px',minHeight:'60vh'}}>
        <div style={{textAlign:'center',maxWidth:'480px'}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:'120px',fontWeight:700,lineHeight:1,letterSpacing:'-0.04em',color:'var(--pink)',marginBottom:'8px',userSelect:'none'}}>404</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'24px',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'12px'}}>Esta página foi para a festa sem avisar</h1>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.65,marginBottom:'32px'}}>O link que você acessou não existe ou foi removido. Mas a programação segue — confira os eventos disponíveis agora.</p>
          <Link href="/" style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'var(--pink)',color:'#fff',fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,padding:'13px 28px',borderRadius:'8px'}}>
            Ver agenda de eventos →
          </Link>
          <div style={{display:'flex',gap:'20px',flexWrap:'wrap',justifyContent:'center',marginTop:'20px'}}>
            <Link href="/listas" style={{fontSize:'13px',color:'var(--text-muted)',borderBottom:'1px solid var(--border)',paddingBottom:'2px'}}>Listas VIP</Link>
            <a href="https://www.directclub.com.br" target="_blank" style={{fontSize:'13px',color:'var(--text-muted)',borderBottom:'1px solid var(--border)',paddingBottom:'2px'}}>Direct Club</a>
            <Link href="/quem-somos" style={{fontSize:'13px',color:'var(--text-muted)',borderBottom:'1px solid var(--border)',paddingBottom:'2px'}}>Quem somos</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
