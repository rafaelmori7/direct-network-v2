'use client'
import { useState } from 'react'

const SPACE_ID = 'jlayhg56ixnc'
const ACCESS_TOKEN = 'LlltVYQHPrduF1DBWcyJRRuGws0YpaenPH9ljMSm7F0'
const SENHA = '121576'
const SITE = 'https://www.directnw.com.br'

function urlLista(f) {
  return f.slug ? `${SITE}/listas/${f.slug}` : (f.linkCurto || f.linkDeLista || '')
}

function urlEvento(f) {
  return f.slug ? `${SITE}/eventos/${f.slug}` : (f.linkCurto || f.linkAfiliado || '')
}

function formatDataCurta(dateStr) {
  const d = new Date(dateStr)
  const offsetMs = -3 * 60 * 60 * 1000
  const local = new Date(d.getTime() + offsetMs + d.getTimezoneOffset() * 60000)
  return local.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getDiaSemana(dateStr) {
  const DIAS = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO']
  const d = new Date(dateStr)
  const offsetMs = -3 * 60 * 60 * 1000
  const local = new Date(d.getTime() + offsetMs + d.getTimezoneOffset() * 60000)
  return DIAS[local.getDay()]
}

function getSemanaAtual() {
  const hoje = new Date()
  const offsetMs = -3 * 60 * 60 * 1000
  const local = new Date(hoje.getTime() + offsetMs + hoje.getTimezoneOffset() * 60000)
  const inicio = new Date(local)
  inicio.setHours(0,0,0,0)
  const fim = new Date(inicio)
  fim.setDate(fim.getDate() + 6)
  return { inicio, fim }
}

async function fetchListas() {
  const hoje = new Date().toISOString()
  const res = await fetch(`https://cdn.contentful.com/spaces/${SPACE_ID}/entries?content_type=lista&fields.data[gte]=${hoje}&order=fields.data&limit=100`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
  })
  const data = await res.json()
  return data.items || []
}

async function fetchEventos() {
  const hoje = new Date().toISOString()
  const res = await fetch(`https://cdn.contentful.com/spaces/${SPACE_ID}/entries?content_type=evento&fields.data[gte]=${hoje}&order=fields.data&limit=100`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
  })
  const data = await res.json()
  return data.items || []
}

function gerarTextoListas(listas, incluirFestas, eventos, soFestas = false) {
  const { inicio, fim } = getSemanaAtual()

  const listasSemana = soFestas ? [] : listas.filter(l => {
    const d = new Date(l.fields.data)
    const offsetMs = -3 * 60 * 60 * 1000
    const local = new Date(d.getTime() + offsetMs + d.getTimezoneOffset() * 60000)
    local.setHours(0,0,0,0)
    return local >= inicio && local <= fim
  })

  const eventosSemana = (incluirFestas || soFestas) ? eventos.filter(e => {
    const d = new Date(e.fields.data)
    const offsetMs = -3 * 60 * 60 * 1000
    const local = new Date(d.getTime() + offsetMs + d.getTimezoneOffset() * 60000)
    local.setHours(0,0,0,0)
    return local >= inicio && local <= fim
  }) : []

  const porDia = {}

  listasSemana.forEach(l => {
    const d = new Date(l.fields.data)
    const offsetMs = -3 * 60 * 60 * 1000
    const local = new Date(d.getTime() + offsetMs + d.getTimezoneOffset() * 60000)
    local.setHours(0,0,0,0)
    const key = local.toISOString()
    if (!porDia[key]) porDia[key] = { data: l.fields.data, listas: [], eventos: [] }
    porDia[key].listas.push(l)
  })

  eventosSemana.forEach(e => {
    const d = new Date(e.fields.data)
    const offsetMs = -3 * 60 * 60 * 1000
    const local = new Date(d.getTime() + offsetMs + d.getTimezoneOffset() * 60000)
    local.setHours(0,0,0,0)
    const key = local.toISOString()
    if (!porDia[key]) porDia[key] = { data: e.fields.data, listas: [], eventos: [] }
    porDia[key].eventos.push(e)
  })

  const diasOrdenados = Object.keys(porDia).sort()
  let texto = ''

  diasOrdenados.forEach(key => {
    const { data, listas, eventos } = porDia[key]
    const dia = getDiaSemana(data)
    const dataCurta = formatDataCurta(data)
    texto += `📆 ${dia} - ${dataCurta}\n`

    listas.forEach(l => {
      const f = l.fields
      texto += `* ${f.nome} — ${f.local}\n`
      texto += `📝 ${f.benefcio}: ${urlLista(f)}\n`
    })

    eventos.forEach(e => {
      const f = e.fields
      texto += `* ${f.nome}\n`
      texto += `🎟️ ${urlEvento(f)}\n`
    })

    texto += '\n'
  })

  return texto.trim()
}

function gerarTextoCalendario(eventos) {
  let texto = '🗓️ CALENDÁRIO COM AS PRÓXIMAS FESTAS\nLinks com desconto aplicado\n\n'

  eventos.forEach(e => {
    const f = e.fields
    const data = formatDataCurta(f.data)
    texto += `📅 ${data} - ${f.nome}\n`
    texto += `🎟️ ${urlEvento(f)}\n`
    texto += '\n'
  })

  texto += '📲 Grupo do WhatsApp: https://curt.link/grupo-direct\n'
  texto += '🔐 GRUPO VIP - Muito mais benefícios:\nwww.directclub.com.br'

  return texto.trim()
}

export default function AdminAgenda() {
  const [senha, setSenha] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [erroSenha, setErroSenha] = useState(false)
  const [listas, setListas] = useState([])
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState('listas')
  const [copiado, setCopiado] = useState(false)

  function autenticar() {
    if (senha === SENHA) {
      setAutenticado(true)
      setLoading(true)
      Promise.all([fetchListas(), fetchEventos()]).then(([l, e]) => {
        setListas(l)
        setEventos(e)
        setLoading(false)
      })
    } else {
      setErroSenha(true)
    }
  }

  const texto = autenticado
    ? modo === 'calendario'
      ? gerarTextoCalendario(eventos)
      : modo === 'festas'
      ? gerarTextoListas([], false, eventos, true)
      : gerarTextoListas(listas, modo === 'listas+festas', eventos)
    : ''

  function copiar() {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  if (!autenticado) {
    return (
      <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
        <div style={{background:'#111',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'32px',width:'100%',maxWidth:'360px'}}>
          <div style={{fontFamily:'Syne, sans-serif',fontSize:'20px',fontWeight:700,marginBottom:'8px',color:'#fff'}}>Admin</div>
          <div style={{fontSize:'13px',color:'#888',marginBottom:'24px'}}>Direct Network — Agenda</div>
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErroSenha(false) }}
            onKeyDown={e => e.key === 'Enter' && autenticar()}
            style={{width:'100%',boxSizing:'border-box',background:'#0a0a0a',border:`1px solid ${erroSenha?'#ff6b6b':'rgba(255,255,255,0.07)'}`,borderRadius:'8px',color:'#fff',fontSize:'14px',padding:'12px 16px',outline:'none',marginBottom:'8px'}}
          />
          {erroSenha && <div style={{fontSize:'12px',color:'#ff6b6b',marginBottom:'8px'}}>Senha incorreta</div>}
          <button onClick={autenticar} style={{width:'100%',background:'#E91E8C',border:'none',borderRadius:'8px',color:'#fff',fontSize:'14px',fontWeight:600,padding:'13px',cursor:'pointer'}}>
            Entrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',padding:'32px 20px'}}>
      <div style={{maxWidth:'720px',margin:'0 auto'}}>
        <div style={{fontFamily:'Syne, sans-serif',fontSize:'22px',fontWeight:700,color:'#fff',marginBottom:'4px'}}>Agenda</div>
        <div style={{fontSize:'13px',color:'#888',marginBottom:'24px'}}>Direct Network</div>

        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}>
          {[
            { key:'listas', label:'📝 Só listas da semana' },
            { key:'festas', label:'🎟️ Só festas da semana' },
            { key:'listas+festas', label:'📝🎟️ Listas + Festas da semana' },
            { key:'calendario', label:'🗓️ Calendário completo' },
          ].map(m => (
            <button key={m.key} onClick={() => setModo(m.key)} style={{fontSize:'13px',fontWeight:500,padding:'8px 16px',borderRadius:'20px',cursor:'pointer',background:modo===m.key?'#E91E8C':'#111',color:modo===m.key?'#fff':'#888',border:modo===m.key?'1px solid #E91E8C':'1px solid rgba(255,255,255,0.07)'}}>
              {m.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{color:'#888',fontSize:'14px'}}>Carregando...</div>
        ) : (
          <>
            <textarea
              readOnly
              value={texto}
              style={{width:'100%',boxSizing:'border-box',background:'#111',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',color:'#fff',fontSize:'13px',lineHeight:1.7,padding:'16px',minHeight:'400px',outline:'none',resize:'vertical',fontFamily:'monospace'}}
            />
            <button onClick={copiar} style={{marginTop:'12px',width:'100%',background:copiado?'#25D366':'#E91E8C',border:'none',borderRadius:'8px',color:'#fff',fontSize:'14px',fontWeight:600,padding:'14px',cursor:'pointer'}}>
              {copiado ? '✓ Copiado!' : 'Copiar texto'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
