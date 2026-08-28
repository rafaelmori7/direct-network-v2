import { createClient } from 'contentful'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
})

// ---- LISTAGENS (só futuros) — usadas na home e na página /listas ----

export async function getEventos() {
  const hoje = new Date().toISOString()
  const entries = await client.getEntries({
    content_type: 'evento',
    order: 'fields.data',
    'fields.data[gte]': hoje,
  })
  return entries.items
}

export async function getListas() {
  const hoje = new Date().toISOString()
  const entries = await client.getEntries({
    content_type: 'lista',
    order: 'fields.data',
    'fields.data[gte]': hoje,
  })
  return entries.items
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
