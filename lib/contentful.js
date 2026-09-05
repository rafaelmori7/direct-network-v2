import { createClient } from 'contentful'
import { unstable_cache } from 'next/cache'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
})

// TTL do cache de dados. Curto de propósito — o objetivo aqui não é manter
// dado velho por muito tempo, é deduplicar chamadas que acontecem quase
// juntas (generateMetadata + corpo da mesma página, ou as várias páginas de
// /festas/[genero] refazendo a mesma busca do catálogo inteiro no mesmo
// build). Frescor de verdade em produção vem do webhook do Contentful
// chamando revalidateTag() em /api/revalidate, não deste TTL.
const CACHE_REVALIDATE = 300

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

export const getEventos = unstable_cache(async () => {
  const agora = new Date()
  const entries = await client.getEntries({
    content_type: 'evento',
    order: 'fields.data',
    'fields.data[gte]': limiteDeConsulta(agora),
  })
  return entries.items.filter(e => !eventoPassou(e.fields.data, agora))
}, ['getEventos'], { revalidate: CACHE_REVALIDATE, tags: ['evento'] })

export const getListas = unstable_cache(async () => {
  const agora = new Date()
  const entries = await client.getEntries({
    content_type: 'lista',
    order: 'fields.data',
    'fields.data[gte]': limiteDeConsulta(agora),
  })
  return entries.items.filter(l => !eventoPassou(l.fields.data, agora))
}, ['getListas'], { revalidate: CACHE_REVALIDATE, tags: ['lista'] })

// ---- ARQUIVO COMPLETO (sem filtro de data) — sitemap e generateStaticParams ----

export const getTodosEventos = unstable_cache(async () => {
  const entries = await client.getEntries({
    content_type: 'evento',
    order: '-fields.data',
    limit: 1000,
  })
  return entries.items
}, ['getTodosEventos'], { revalidate: CACHE_REVALIDATE, tags: ['evento'] })

export const getTodasListas = unstable_cache(async () => {
  const entries = await client.getEntries({
    content_type: 'lista',
    order: '-fields.data',
    limit: 1000,
  })
  return entries.items
}, ['getTodasListas'], { revalidate: CACHE_REVALIDATE, tags: ['lista'] })

// ---- ITEM ÚNICO ----

export const getEvento = unstable_cache(async (slug) => {
  const entries = await client.getEntries({
    content_type: 'evento',
    'fields.slug': slug,
    limit: 1,
  })
  return entries.items[0] || null
}, ['getEvento'], { revalidate: CACHE_REVALIDATE, tags: ['evento'] })

export const getLista = unstable_cache(async (slug) => {
  const entries = await client.getEntries({
    content_type: 'lista',
    'fields.slug': slug,
    limit: 1,
  })
  return entries.items[0] || null
}, ['getLista'], { revalidate: CACHE_REVALIDATE, tags: ['lista'] })

export const getTodasCortesias = unstable_cache(async () => {
  const entries = await client.getEntries({
    content_type: 'cortesia',
    limit: 1000,
  })
  return entries.items
}, ['getTodasCortesias'], { revalidate: CACHE_REVALIDATE, tags: ['cortesia'] })

export const getCortesia = unstable_cache(async (slug) => {
  const entries = await client.getEntries({
    content_type: 'cortesia',
    'fields.slug': slug,
    limit: 1,
  })
  return entries.items[0] || null
}, ['getCortesia'], { revalidate: CACHE_REVALIDATE, tags: ['cortesia'] })
