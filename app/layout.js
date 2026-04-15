import './globals.css'

export const metadata = {
  title: 'Direct Network — As melhores festas com desconto exclusivo',
  description: 'Agenda das melhores festas de São Paulo e do Brasil com descontos exclusivos já aplicados no link.',
  openGraph: {
    siteName: 'Direct Network',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
