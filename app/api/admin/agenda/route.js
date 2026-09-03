import { NextResponse } from 'next/server'
import { getEventos, getListas } from '../../../../lib/contentful'

export async function GET(request) {
  const tipo = new URL(request.url).searchParams.get('tipo')
  const items = tipo === 'listas' ? await getListas() : await getEventos()
  return NextResponse.json({ items })
}
