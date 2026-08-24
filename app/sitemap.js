import { getEventos, getListas } from '../lib/contentful'

export default async function sitemap() {
  const baseUrl = 'https://www.directnw.com.br'

  let eventos = []
  let listas = []

  try { eventos = await getEventos() } catch {}
  try { listas = await getListas() } catch {}

  const eventoUrls = eventos.map(e => ({
    url: `${baseUrl}/eventos/${e.fields.slug}`,
    lastModified: new Date(e.sys.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const listaUrls = listas.map(l => ({
    url: `${baseUrl}/listas/${l.fields.slug}`,
    lastModified: new Date(l.sys.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/quem-somos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/listas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    ...eventoUrls,
    ...listaUrls,
  ]
}
