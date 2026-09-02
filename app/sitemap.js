import { getTodosEventos, getTodasListas } from '../lib/contentful'

// /cortesia/[slug] busca direto na Content Delivery API (mesmas credenciais
// já expostas no bundle do cliente em app/cortesia/[slug]/CortesiaSlugClient.js),
// em vez do client server-side de lib/contentful.js — mantemos o mesmo acesso aqui.
const CORTESIA_SPACE_ID = 'jlayhg56ixnc'
const CORTESIA_ACCESS_TOKEN = 'LlltVYQHPrduF1DBWcyJRRuGws0YpaenPH9ljMSm7F0'

async function getTodasCortesias() {
  const url = `https://cdn.contentful.com/spaces/${CORTESIA_SPACE_ID}/entries?content_type=cortesia&select=fields.slug,sys.updatedAt&limit=1000`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${CORTESIA_ACCESS_TOKEN}` } })
  const data = await res.json()
  return data.items || []
}

export default async function sitemap() {
  const baseUrl = 'https://www.directnw.com.br'
  const agora = new Date()

  let eventos = []
  let listas = []
  let cortesias = []
  try { eventos = await getTodosEventos() } catch {}
  try { listas = await getTodasListas() } catch {}
  try { cortesias = await getTodasCortesias() } catch {}

  const eventoUrls = eventos.map(e => {
    const passou = new Date(e.fields.data) < agora
    return {
      url: `${baseUrl}/eventos/${e.fields.slug}`,
      lastModified: new Date(e.sys.updatedAt),
      changeFrequency: passou ? 'yearly' : 'weekly',
      priority: passou ? 0.3 : 0.8,
    }
  })

  const listaUrls = listas.map(l => {
    const passou = new Date(l.fields.data) < agora
    return {
      url: `${baseUrl}/listas/${l.fields.slug}`,
      lastModified: new Date(l.sys.updatedAt),
      changeFrequency: passou ? 'yearly' : 'weekly',
      priority: passou ? 0.3 : 0.7,
    }
  })

  const cortesiaUrls = cortesias
    .filter(c => c.fields?.slug)
    .map(c => ({
      url: `${baseUrl}/cortesia/${c.fields.slug}`,
      lastModified: new Date(c.sys.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.5,
    }))

  return [
    {
      url: baseUrl,
      lastModified: agora,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/quem-somos`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/listas`,
      lastModified: agora,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/virada-estaiada-2027`,
      lastModified: agora,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cortesia`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    ...eventoUrls,
    ...listaUrls,
    ...cortesiaUrls,
  ]
}
