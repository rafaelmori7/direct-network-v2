'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Nav() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div style={{background:'var(--pink)',padding:'9px 20px',textAlign:'center',fontSize:'12px',fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',color:'#fff'}}>
        Desconto já aplicado no link — sem código necessário
      </div>

      <nav style={{background:'var(--bg)',borderBottom:'1px solid var(--border)',padding:'0 20px',height:'56px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:200}}>
        <Link href="/" style={{display:'flex',alignItems:'center',zIndex:201}} onClick={()=>setOpen(false)}>
          <img src="/logo.png" alt="Direct Network" style={{height:'28px',width:'auto'}} />
        </Link>

        {/* Desktop */}
        <div className="nav-desktop" style={{display:'flex',alignItems:'center',gap:'32px'}}>
          <Link href="/" style={{fontSize:'13px',color:path==='/'?'#fff':'var(--text-muted)'}}>Festas</Link>
          <Link href="/listas" style={{fontSize:'13px',color:path.startsWith('/listas')?'#fff':'var(--text-muted)'}}>Listas VIP</Link>
          <Link href="/quem-somos" style={{fontSize:'13px',color:path==='/quem-somos'?'#fff':'var(--text-muted)'}}>Quem somos</Link>
          <a href="https://chat.whatsapp.com/DylGoK7gscc9e4wJkqxspx" target="_blank"
            style={{background:'#25D366',color:'#fff',padding:'9px 18px',borderRadius:'6px',fontSize:'13px',fontWeight:500}}>
            Grupo WhatsApp
          </a>
        </div>

        {/* Hambúrguer — só mobile */}
        <button
          onClick={()=>setOpen(!open)}
          className="nav-burger"
          aria-label="Menu"
          style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'none',flexDirection:'column',gap:'5px',zIndex:201}}
        >
          <span style={{display:'block',width:'22px',height:'2px',background:'#fff',transition:'0.25s',transform:open?'rotate(45deg) translate(5px,5px)':'none'}}/>
          <span style={{display:'block',width:'22px',height:'2px',background:'#fff',transition:'0.25s',opacity:open?0:1}}/>
          <span style={{display:'block',width:'22px',height:'2px',background:'#fff',transition:'0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':'none'}}/>
        </button>
      </nav>

      {/* Menu mobile — drawer */}
      {open && (
        <div style={{
          position:'fixed',top:'calc(32px + 56px)',left:0,right:0,bottom:0,
          background:'var(--bg)',zIndex:199,
          padding:'16px 20px 32px',
          display:'flex',flexDirection:'column',gap:'0',
          borderTop:'1px solid var(--border)',
          overflowY:'auto'
        }}>
          <Link href="/" onClick={()=>setOpen(false)} style={{fontSize:'17px',fontWeight:500,padding:'16px 0',borderBottom:'1px solid var(--border)',color:path==='/'?'var(--pink)':'#fff',display:'block'}}>Festas</Link>
          <Link href="/listas" onClick={()=>setOpen(false)} style={{fontSize:'17px',fontWeight:500,padding:'16px 0',borderBottom:'1px solid var(--border)',color:path.startsWith('/listas')?'var(--pink)':'#fff',display:'block'}}>Listas VIP</Link>
          <Link href="/quem-somos" onClick={()=>setOpen(false)} style={{fontSize:'17px',fontWeight:500,padding:'16px 0',borderBottom:'1px solid var(--border)',color:path==='/quem-somos'?'var(--pink)':'#fff',display:'block'}}>Quem somos</Link>
          <a
            href="https://chat.whatsapp.com/DylGoK7gscc9e4wJkqxspx"
            target="_blank"
            onClick={()=>setOpen(false)}
            style={{marginTop:'20px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'#25D366',color:'#fff',padding:'14px 20px',borderRadius:'8px',fontSize:'15px',fontWeight:600}}
          >
            Grupo WhatsApp
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-burger  { display: flex !important; }
        }
      `}</style>
    </>
  )
}
