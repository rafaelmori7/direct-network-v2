import { createClient } from 'contentful'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
})

// ---- REGRA DE EXPIRAÇÃO — evento/lista vira a madrugada, expira só às 06:00
// do dia seguinte à data cadastrada (horário de São Paulo, fixo em UTC-3) ----

const OFFSET_SP_MS = 3 * 60 * 60 * 1000

export function eventoPassou(dataISO, agora = new Date()) {
  const diaSP = new Date(new Date(dataISO).getTime() - OFFSET_SP_MS)
  const limite = new Date(Date.UTC(diaSP.getUTCFullYear(), diaSP.getUTCMonth(), diaSP.getUTCDate() + 1, 9, 0, 0))
  return agora >= limite
}

// margem de segurança para a query ao Contentful: cobre o pior caso (evento
// cadastrado à meia-noite SP, cujo limite de expiração cai ~30h depois)
function limiteDeConsulta(agora) {
  return new Date(agora.getTime() - 30 * 60 * 60 * 1000).toISOString()
}

// ---- LISTAGENS (só futuros) — usadas na home e na página /listas ----

export async function getEventos() {
  const agora = new Date()
  const entries = await client.getEntries({
    content_type: 'evento',
    order: 'fields.data',
    'fields.data[gte]': limiteDeConsulta(agora),
  })
  return entries.items.filter(e => !eventoPassou(e.fields.data, agora))
}

export async function getListas() {
  const agora = new Date()
  const entries = await client.getEntries({
    content_type: 'lista',
    order: 'fields.data',
    'fields.data[gte]': limiteDeConsulta(agora),
  })
  return entries.items.filter(l => !eventoPassou(l.fields.data, agora))
}

// ---- ARQUIVO COMPLETO (sem filtro de data) — sitemap e generateStaticParams ----

export async function getTodosEventos() {
  const entries = await client.getEntries({
    content_type: 'evento',
    order: '-fields.data',
    limit: 1000,
  })
  return entries.items
}

export async function getTodasListas() {
  const entries = await client.getEntries({
    content_type: 'lista',
    order: '-fields.data',
    limit: 1000,
  })
  return entries.items
}

// ---- ITEM ÚNICO ----

export async function getEvento(slug) {
  const entries = await client.getEntries({
    content_type: 'evento',
    'fields.slug': slug,
    limit: 1,
  })
  return entries.items[0] || null
}

export async function getLista(slug) {
  const entries = await client.getEntries({
    content_type: 'lista',
    'fields.slug': slug,
    limit: 1,
  })
  return entries.items[0] || null
}
