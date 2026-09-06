import Link from 'next/link'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { getTodasCortesias } from '../../lib/contentful'

export const revalidate = 86400

export const metadata = {
  alternates: { canonical: '/cortesia' },
}

function Card({ cortesia }) {
  const f = cortesia.fields
  const imagemUrl = f.imagem?.fields?.file?.url
  const ativo = f.ativo !== false

  return (
    <Link href={`/cortesia/${f.slug}`} style={{display:'flex',gap:'14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px',alignItems:'center',opacity: ativo ? 1 : 0.6}}>
      <div style={{width:'72px',height:'72px',borderRadius:'8px',overflow:'hidden',background:'var(--bg3)',flexShrink:0}}>
        {imagemUrl && (
          <img src={`https:${imagemUrl}?w=200&h=200&fit=fill&fm=jpg&q=70`} alt={`Cortesia de ${f.nome}`} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
        )}
      </div>
      <div style={{minWidth:0,flex:1}}>
        <div style={{display:'inline-block',fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',padding:'3px 9px',borderRadius:'20px',marginBottom:'6px',color:'var(--pink)',background:'rgba(233,30,140,0.1)',border:'1px solid rgba(233,30,140,0.2)'}}>
          {ativo ? 'Cortesia disponível' : 'Encerrada'}
        </div>
        <div style={{fontFamily:'var(--font-display)',fontSize:'14px',fontWeight:600,lineHeight:1.3,marginBottom:'3px'}}>{f.nome}</div>
        <div style={{fontSize:'12px',color:'var(--text-muted)'}}>
          {[f.data, f.local].filter(Boolean).join(' · ')}
        </div>
      </div>
    </Link>
  )
}

export default async function CortesiaPage() {
  let cortesias = []
  try { cortesias = await getTodasCortesias() } catch {}

  const comSlug = cortesias.filter(c => c.fields?.slug)
  const disponiveis = comSlug.filter(c => c.fields.ativo !== false)
  const encerradas = comSlug.filter(c => c.fields.ativo === false)

  return (
    <>
      <Nav />
      <main>
        <div style={{maxWidth:'720px',margin:'0 auto',padding:'32px var(--px) 64px',display:'flex',flexDirection:'column',gap:'24px'}}>

          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(24px,5vw,34px)',fontWeight:700,lineHeight:1.15,letterSpacing:'-0.02em',marginBottom:'8px'}}>
              Cortesias
            </h1>
            <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.6}}>
              Ingressos cortesia dos eventos parceiros da Direct Network. Escolha um evento abaixo e informe seu e-mail para liberar o link.
            </p>
          </div>

          {disponiveis.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {disponiveis.map(c => <Card key={c.fields.slug} cortesia={c} />)}
            </div>
          ) : (
            <p style={{fontSize:'14px',color:'var(--text-muted)'}}>Nenhuma cortesia disponível no momento.</p>
          )}

          {encerradas.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)'}}>Encerradas</div>
              {encerradas.map(c => <Card key={c.fields.slug} cortesia={c} />)}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}
