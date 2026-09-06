import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{borderTop:'1px solid var(--border)',padding:'40px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px',flexWrap:'wrap'}}>
      <img src="/logo.png" alt="Direct Network" style={{height:'28px',opacity:0.7}} />
      <div style={{display:'flex',gap:'24px',flexWrap:'wrap'}}>
        <Link href="/" style={{fontSize:'12px',color:'var(--text-faint)'}}>Festas</Link>
        <Link href="/listas" style={{fontSize:'12px',color:'var(--text-faint)'}}>Listas VIP</Link>
        <Link href="/cortesia" style={{fontSize:'12px',color:'var(--text-faint)'}}>Cortesias</Link>
        <Link href="/virada-estaiada-2027" style={{fontSize:'12px',color:'var(--text-faint)'}}>Réveillon 2027</Link>
        <Link href="/grupo" style={{fontSize:'12px',color:'var(--text-faint)'}}>Entrar no grupo</Link>
        <Link href="/quem-somos" style={{fontSize:'12px',color:'var(--text-faint)'}}>Quem somos</Link>
        <a href="https://www.directclub.com.br" target="_blank" style={{fontSize:'12px',color:'var(--text-faint)'}}>Direct Club</a>
      </div>
      <span style={{fontSize:'12px',color:'var(--text-faint)'}}>© 2026 Direct Network</span>
    </footer>
  )
}
