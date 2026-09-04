import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

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

export async function POST(request) {
  const secret = request.headers.get('x-revalidate-secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}

  const contentType = body?.sys?.contentType?.sys?.id
  const rotas = ROTAS_POR_TIPO[contentType] || TODAS_AS_ROTAS

  rotas.forEach(([path, type]) => revalidatePath(path, type))

  return NextResponse.json({ revalidated: true, contentType: contentType || null, rotas: rotas.map(r => r[0]) })
}
