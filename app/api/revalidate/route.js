import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// Rotas que dependem de cada content_type do Contentful. '/eventos/[slug]'
// (e afins) usados literalmente + type:'page' revalidam todas as páginas
// já geradas para aquele segmento dinâmico, não só uma entrada específica —
// evita depender do formato/locale do payload do webhook pra achar o slug.
const ROTAS_POR_TIPO = {
  evento: [['/', undefined], ['/eventos/[slug]', 'page'], ['/festas/[genero]', 'page']],
  lista: [['/listas', undefined], ['/listas/[slug]', 'page'], ['/festas/[genero]', 'page']],
  cortesia: [['/cortesia/[slug]', 'page']],
}

const TODAS_AS_ROTAS = Object.values(ROTAS_POR_TIPO).flat()
const TODAS_AS_TAGS = Object.keys(ROTAS_POR_TIPO)

export async function POST(request) {
  const secret = request.headers.get('x-revalidate-secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}

  const contentType = body?.sys?.contentType?.sys?.id
  // /sitemap.xml agrega evento + lista + cortesia, entao revalida sempre,
  // independente do content_type que disparou o webhook
  const rotas = [...(ROTAS_POR_TIPO[contentType] || TODAS_AS_ROTAS), ['/sitemap.xml', undefined]]
  const tags = TODAS_AS_TAGS.includes(contentType) ? [contentType] : TODAS_AS_TAGS

  rotas.forEach(([path, type]) => revalidatePath(path, type))
  // revalidateTag limpa o cache de dados de lib/contentful.js (unstable_cache)
  // -- sem isso, o revalidatePath acima regeneraria a pagina mas ainda leria
  // dado velho do cache de dados ate o TTL dele vencer sozinho
  tags.forEach(tag => revalidateTag(tag))

  return NextResponse.json({ revalidated: true, contentType: contentType || null, rotas: rotas.map(r => r[0]), tags })
}
