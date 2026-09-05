import { NextResponse } from 'next/server'
import { getCortesia } from '../../../../lib/contentful'

// Antes desta linha, cada visita à página de cortesia batia direto no
// Contentful sem cache nenhum — o ponto mais exposto do site em termos de
// consumo de API (escala 1:1 com pageviews, sem nenhuma rede de segurança).
// Alinhado com a janela das outras rotas de detalhe (7200s) — o
// unstable_cache em lib/contentful.js (TTL de 300s) já cobre o grosso do
// deduplicamento; isso aqui é só o teto de regeneração da própria rota.
export const revalidate = 86400

export async function GET(request, { params }) {
  const cortesia = await getCortesia(params.slug)
  if (!cortesia) return NextResponse.json(null, { status: 404 })

  const f = cortesia.fields
  const imagemUrl = f.imagem?.fields?.file?.url ? `https:${f.imagem.fields.file.url}` : null

  return NextResponse.json({
    nome: f.nome || '',
    data: f.data || '',
    horario: f.horrio || '',
    local: f.local || '',
    endereco: f.endereo || '',
    imagemUrl,
    linkCortesia: f.linkCortesia || '',
    appsScriptUrl: f.appsScriptUrl || '',
    linkCortesiaMasc: f.linkCortesiaMasc || '',
    appsScriptUrlMasc: f.appsScriptUrlMasc || '',
    ativo: f.ativo !== false,
    mensagemEncerrada: f.mensagemEncerrada || 'As cortesias para este evento foram encerradas.',
    linkWhatsApp: f.linkWhatsApp || '',
    descricao: f.descricao || '',
  })
}
