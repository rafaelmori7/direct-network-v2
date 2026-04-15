import { createClient } from 'contentful'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
})

export async function getEventos() {
  const entries = await client.getEntries({
    content_type: 'evento',
    order: 'fields.data',
  })
  return entries.items
}

export async function getEvento(slug) {
  const entries = await client.getEntries({
    content_type: 'evento',
    'fields.slug': slug,
    limit: 1,
  })
  return entries.items[0] || null
}

export async function getListas() {
  const entries = await client.getEntries({
    content_type: 'lista',
    order: 'fields.data',
  })
  return entries.items
}

export async function getLista(slug) {
  const entries = await client.getEntries({
    content_type: 'lista',
    'fields.slug': slug,
    limit: 1,
  })
  return entries.items[0] || null
}
