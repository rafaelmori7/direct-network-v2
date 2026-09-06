import { getCortesia } from '../../../lib/contentful'
import { notFound } from 'next/navigation'
import CortesiaSlugClient from './CortesiaSlugClient'

export const revalidate = 86400

export async function generateMetadata({ params }) {
  return {
    alternates: { canonical: `/cortesia/${params.slug}` },
  }
}

export default async function CortesiaSlugPage({ params }) {
  let cortesia
  try { cortesia = await getCortesia(params.slug) } catch { notFound() }
  if (!cortesia) notFound()

  const f = cortesia.fields
  const imagemUrl = f.imagem?.fields?.file?.url ? `https:${f.imagem.fields.file.url}` : null

  const dados = {
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
  }

  return <CortesiaSlugClient cortesia={dados} />
}
