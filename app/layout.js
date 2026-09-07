import './globals.css'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Syne, DM_Sans } from 'next/font/google'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

// Estático, sem dependência do Contentful — zero custo de API. Base para
// presença de marca no SERP (knowledge panel, sitelinks searchbox) em
// buscas por "Direct Network". Sem sameAs: não há perfil social oficial
// referenciado em nenhum lugar do código hoje (o link de WhatsApp é um
// convite de grupo específico, não um perfil estável da marca) — não
// forçamos um valor que não existe.
const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Direct Network',
  url: 'https://www.directnw.com.br',
  logo: 'https://www.directnw.com.br/logo.png',
}

// Sem SearchAction: o site não tem uma página de busca interna que a
// suporte — declarar uma sem funcionalidade real por trás seria enganoso
// pro Google, não só inútil.
const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Direct Network',
  url: 'https://www.directnw.com.br',
  publisher: { '@type': 'Organization', name: 'Direct Network', url: 'https://www.directnw.com.br' },
}

export const metadata = {
  title: 'Direct Network — As melhores festas com desconto exclusivo',
  description: 'Agenda de festas em São Paulo com desconto exclusivo já aplicado no link. Eletrônica, pagode, sertanejo, open bar e muito mais. Listas VIP gratuitas toda semana.',
  metadataBase: new URL('https://www.directnw.com.br'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'Direct Network',
    type: 'website',
  },
  verification: {
    google: 'AGQ-tnIrxxEND-84S-92SbITkPWO4_6Yy22tUA2GiTI',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }} />
        {children}
      </body>
      <GoogleAnalytics gaId="G-RFHFTJEJ5D" />
    </html>
  )
}
