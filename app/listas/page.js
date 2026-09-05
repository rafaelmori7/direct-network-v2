import Link from 'next/link'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { getListas } from '../../lib/contentful'

export const revalidate = 3600

export const metadata = {
  title: 'Listas VIP | Direct Network',
  description: 'Coloque seu nome na lista VIP e entre grátis ou com desconto nas melhores festas de São Paulo.',
  alternates: { canonical: '/listas' },
}

const DIAS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado']
const DIAS_ORDEM = ['quarta','quinta','sexta','sábado','domingo','segunda','terça']

function getDiaSemana(dateStr) {
  const d = new Date(dateStr)
  const offsetMs = -3 * 60 * 60 * 1000
  const local = new Date(d.getTime() + offsetMs + d.getTimezoneOffset() * 60000)
  return DIAS[local.getDay()]
}

function formatDataCurta(dateStr) {
  const d = new Date(dateStr)
  const offsetMs = -3 * 60 * 60 * 1000
  const local = new Date(d.getTime() + offsetMs + d.getTimezoneOffset() * 60000)
  return local.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export default async function ListasPage() {
  let listas = []
  try { listas = await getListas() } catch { listas = [] }

  const grupos = {}
  listas.forEach(lista => {
    const dia = getDiaSemana(lista.fields.data)
    if (!grupos[dia]) grupos[dia] = []
    grupos[dia].push(lista)
  })

  const diasOrdenados = DIAS_ORDEM.filter(d => grupos[d])

  return (
    <>
      <Nav />
      <main>
        <section style={{padding:'64px 20px 40px',textAlign:'center',background:'var(--bg)'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#C8963C',background:'rgba(200,150,60,0.1)',border:'1px solid rgba(200,150,60,0.2)',padding:'5px 14px',borderRadius:'20px',marginBottom:'20px'}}>
            Listas VIP — Entrada gratuita
          </div>
                   <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(28px,5vw,44px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:'14px'}}>
            Acesso VIP aos melhores<br />clubs e bares de <span style={{color:'#C8963C'}}>SP</span>
          </h1>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'440px',margin:'0 auto'}}>
            Coloque seu nome na lista VIP e garanta entrada gratuita ou com desconto especial na porta.
          </p>
        </section>

        <section style={{maxWidth:'680px',margin:'0 auto',padding:'16px 20px 64px'}}>
          {listas.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-faint)'}}>
              <p style={{fontSize:'16px',marginBottom:'8px'}}>Em breve novas listas</p>
              <p style={{fontSize:'13px'}}>Entre no grupo WhatsApp para receber primeiro.</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'32px'}}>
              {diasOrdenados.map(dia => (
                <div key={dia}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
                    <span style={{fontFamily:'var(--font-display)',fontSize:'13px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C8963C'}}>
                      {dia.charAt(0).toUpperCase() + dia.slice(1)}
                    </span>
                    <span style={{fontSize:'12px',color:'var(--text-faint)'}}>
                      {formatDataCurta(grupos[dia][0].fields.data)}
                    </span>
                    <div style={{flex:1,height:'1px',background:'var(--border)'}} />
                  </div>

                  <div style={{display:'flex',flexDirection:'column',gap:'1px'}}>
                    {grupos[dia].map((lista, i) => {
                      const f = lista.fields
                      return (
                        <Link
                          key={lista.sys.id}
                          href={`/listas/${f.slug}`}
                          style={{
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'space-between',
                            gap:'16px',
                            padding:'14px 16px',
                            background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg)',
                            border:'1px solid var(--border)',
                            borderRadius: grupos[dia].length === 1 ? '8px' :
                                          i === 0 ? '8px 8px 0 0' :
                                          i === grupos[dia].length - 1 ? '0 0 8px 8px' : '0',
                            borderTop: i > 0 ? 'none' : '1px solid var(--border)',
                            textDecoration:'none',
                          }}
                        >
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,fontSize:'14px',color:'#fff',lineHeight:1.3,marginBottom:'3px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                              {f.nome}
                            </div>
                            <div style={{fontSize:'12px',color:'var(--text-muted)'}}>
                              {f.local}
                              {f.benefcio && <span style={{marginLeft:'8px',color:'#C8963C'}}>· {f.benefcio}</span>}
                            </div>
                          </div>
                          <div style={{flexShrink:0,fontSize:'12px',fontWeight:600,color:'#C8963C',border:'1px solid rgba(200,150,60,0.4)',padding:'6px 14px',borderRadius:'6px',whiteSpace:'nowrap'}}>
                            Entrar na lista →
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{margin:'0 20px 48px',maxWidth:'680px',marginLeft:'auto',marginRight:'auto',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px',flexWrap:'wrap'}}>
          <div>
            <strong style={{fontFamily:'var(--font-display)',fontSize:'15px',fontWeight:600,display:'block',marginBottom:'3px'}}>Receba as listas antes de todo mundo</strong>
            <p style={{fontSize:'13px',color:'var(--text-muted)'}}>Entre no grupo WhatsApp e nunca fique de fora.</p>
          </div>
          <a href="https://chat.whatsapp.com/DYcOSP7iF8U3OYgBHpU0tG" target="_blank" style={{display:'flex',alignItems:'center',gap:'8px',background:'#25D366',color:'#fff',fontSize:'13px',fontWeight:500,padding:'11px 20px',borderRadius:'6px',whiteSpace:'nowrap'}}>
            Entrar no grupo
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}
