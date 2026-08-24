'use client'
import { useState } from 'react'
import Link from 'next/link'

const GENERO_COLORS = {
  'Eletrônica': '#534AB7',
  'Pagode': '#BA7517',
  'Sertanejo': '#993556',
  'Show': '#185FA5',
  'Forró': '#B84A14',
  'Open format': '#2A7A4B',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' }).replace('.', '')
}

function getMonthLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
    .replace(/^\w/, c => c.toUpperCase())
}

function getMonthKey(dateStr) {
  const str = new Date(dateStr).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', timeZone: 'America/Sao_Paulo' })
  const [m, y] = str.split('/')
  return `${y}-${m}`
}

export default function EventsGrid({ eventos }) {
  const [busca, setBusca] = useState('')
  const [generoFiltro, setGeneroFiltro] = useState('Todos')

  const generos = ['Todos', ...Array.from(new Set(eventos.map(e => e.fields?.gnero).filter(Boolean)))]

  const filtrados = eventos.filter(e => {
    const f = e.fields
    const matchBusca = busca === '' ||
      f.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      f.local?.toLowerCase().includes(busca.toLowerCase())
    const matchGenero = generoFiltro === 'Todos' || f.gnero === generoFiltro
    return matchBusca && matchGenero
  })

  const porMes = {}
  filtrados.forEach(evento => {
    const key = evento.fields?.data ? getMonthKey(evento.fields.data) : 'sem-data'
    const label = evento.fields?.data ? getMonthLabel(evento.fields.data) : 'Sem data'
    if (!porMes[key]) porMes[key] = { label, eventos: [] }
    porMes[key].eventos.push(evento)
  })
  const mesesOrdenados = Object.keys(porMes).sort()

  return (
    <section style={{padding:'0 var(--px) 48px'}}>
      <div style={{marginBottom:'16px'}}>
        <input
          type="text"
          placeholder="Buscar evento ou local..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{width:'100%',boxSizing:'border-box',padding:'12px 16px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontSize:'14px',outline:'none'}}
        />
      </div>

      <div style={{display:'flex',gap:'8px',overflowX:'auto',marginBottom:'32px',paddingBottom:'4px',scrollbarWidth:'none',msOverflowStyle:'none'}}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {generos.map(g => (
          <button
            key={g}
            onClick={() => setGeneroFiltro(g)}
            style={{
              fontSize:'12px',fontWeight:500,padding:'6px 14px',borderRadius:'20px',cursor:'pointer',transition:'all 0.15s',
              flexShrink:0,
              background: generoFiltro === g ? 'var(--pink)' : 'var(--bg2)',
              color: generoFiltro === g ? '#fff' : 'var(--text-muted)',
              border: generoFiltro === g ? '1px solid var(--pink)' : '1px solid var(--border)',
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-faint)'}}>
          <p style={{fontSize:'16px',marginBottom:'8px'}}>Nenhum evento encontrado</p>
          <p style={{fontSize:'13px'}}>Tente outro filtro ou busca.</p>
        </div>
      ) : (
        mesesOrdenados.map(key => (
          <div key={key} style={{marginBottom:'48px'}}>
            <div style={{display:'flex',alignItems:'baseline',gap:'12px',marginBottom:'20px',paddingBottom:'16px',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontFamily:'var(--font-display)',fontSize:'20px',fontWeight:600}}>{porMes[key].label}</span>
              <span style={{fontSize:'12px',color:'var(--text-faint)'}}>{porMes[key].eventos.length} evento{porMes[key].eventos.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="events-grid">
              {porMes[key].eventos.map((evento) => {
                const f = evento.fields
                const color = GENERO_COLORS[f.gnero] || '#534AB7'
                const flyerUrl = f.flyer?.fields?.file?.url
                return (
                  <Link key={evento.sys.id} href={`/eventos/${f.slug}`} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
                    <div style={{width:'100%',aspectRatio:'3/4',overflow:'hidden',position:'relative',background:flyerUrl?'var(--bg3)':`${color}18`}}>
                      {flyerUrl ? (
                        <img src={`https:${flyerUrl}?w=600&fm=webp&q=80`} alt={f.nome} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                      ) : (
                        <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="6" width="32" height="28" rx="5" stroke={color} strokeWidth="1.5"/><path d="M13 6V3M27 6V3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M4 14h32" stroke={color} strokeWidth="1"/></svg>
                        </div>
                      )}
                      <span style={{position:'absolute',top:'8px',right:'8px',fontSize:'10px',fontWeight:500,padding:'3px 8px',borderRadius:'4px',background:`${color}dd`,color:'#fff'}}>{f.gnero}</span>
                    </div>
                    <div style={{padding:'12px',display:'flex',flexDirection:'column',flex:1}}>
                      <div style={{fontSize:'11px',fontWeight:600,color:'var(--pink)',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                        {f.data ? formatDate(f.data) : ''}
                      </div>
                      <div style={{fontFamily:'var(--font-display)',fontSize:'13px',fontWeight:600,lineHeight:1.3,marginBottom:'4px'}}>{f.nome}</div>
                      <div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'10px'}}>{f.local}</div>
                      <div style={{marginTop:'auto'}}>
                        <div className="card-cta">Ver evento + desconto</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))
      )}
    </section>
  )
}
