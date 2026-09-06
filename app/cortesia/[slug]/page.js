import { getCortesia } from '../../../lib/contentful'
import { notFound } from 'next/navigation'
import CortesiaSlugClient from './CortesiaSlugClient'

export const revalidate = 86400

export async function generateMetadata({ params }) {
  try {
    const cortesia = await getCortesia(params.slug)
    if (!cortesia) return {}
    const f = cortesia.fields
    const ativo = f.ativo !== false
    const title = ativo
      ? `Cortesia — ${f.nome} | Direct Network`
      : `${f.nome} — Cortesia Encerrada | Direct Network`
    const description = ativo
      ? `Garanta sua cortesia para ${f.nome}${f.local ? ` em ${f.local}` : ''}. Informe seu e-mail e libere o link exclusivo Direct Network.`
      : `As cortesias para ${f.nome} foram encerradas. Veja outras cortesias disponíveis na Direct Network.`
    const url = `https://www.directnw.com.br/cortesia/${params.slug}`
    const imagemUrl = f.imagem?.fields?.file?.url
    const images = imagemUrl
      ? [{ url: `https:${imagemUrl}?w=1200&fm=jpg&q=80`, width: 1200, height: 630, alt: f.nome }]
      : [{ url: '/logo.png', alt: 'Direct Network' }]
    return {
      title,
      description,
      alternates: { canonical: `/cortesia/${params.slug}` },
      openGraph: { title, description, type: 'website', siteName: 'Direct Network', url, images },
      twitter: { card: imagemUrl ? 'summary_large_image' : 'summary', title, description, images: images.map(i => i.url) },
    }
  } catch {
    return { alternates: { canonical: `/cortesia/${params.slug}` } }
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
