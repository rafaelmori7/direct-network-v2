import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{borderTop:'1px solid var(--border)',padding:'40px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px',flexWrap:'wrap'}}>
      <img src="/logo.png" alt="Direct Network" style={{height:'28px',opacity:0.7}} />
      <div style={{display:'flex',gap:'24px'}}>
        <Link href="/" style={{fontSize:'12px',color:'var(--text-faint)'}}>Festas</Link>
        <Link href="/listas" style={{fontSize:'12px',color:'var(--text-faint)'}}>Listas VIP</Link>
        <Link href="/quem-somos" style={{fontSize:'12px',color:'var(--text-faint)'}}>Quem somos</Link>
        <a href="https://www.directclub.com.br" target="_blank" style={{fontSize:'12px',color:'var(--text-faint)'}}>Direct Club</a>
      </div>
      <span style={{fontSize:'12px',color:'var(--text-faint)'}}>© 2026 Direct Network</span>
    </footer>
  )
}
