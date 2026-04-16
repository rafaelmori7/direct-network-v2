'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const path = usePathname()
  return (
    <>
      <div style={{background:'var(--pink)',padding:'9px 20px',textAlign:'center',fontSize:'12px',fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',color:'#fff'}}>
        Desconto já aplicado no link — sem código necessário
      </div>
      <nav style={{background:'var(--bg)',borderBottom:'1px solid var(--border)',padding:'0 32px',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <Link href="/" style={{display:'flex',alignItems:'center'}}>
          <img src="/logo.png" alt="Direct Network" style={{height:'36px',width:'auto'}} />
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
          <Link href="/" style={{fontSize:'13px',color:path==='/'?'#fff':'var(--text-muted)'}}>Festas</Link>
          <Link href="/listas" style={{fontSize:'13px',color:path.startsWith('/listas')?'#fff':'var(--text-muted)'}}>Listas VIP</Link>
          <Link href="/quem-somos" style={{fontSize:'13px',color:path==='/quem-somos'?'#fff':'var(--text-muted)'}}>Quem somos</Link>
          <a href="https://chat.whatsapp.com/DylGoK7gscc9e4wJkqxspx" target="_blank" style={{background:'#25D366',color:'#fff',padding:'9px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:500}}>Grupo do Whatsapp</a>
        </div>
      </nav>
    </>
  )
}
