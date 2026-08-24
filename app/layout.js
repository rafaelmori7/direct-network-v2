import './globals.css'

export const metadata = {
  title: 'Direct Network — As melhores festas com desconto exclusivo',
  description: 'Agenda de festas em São Paulo com desconto exclusivo já aplicado no link. Eletrônica, pagode, sertanejo, open bar e muito mais. Listas VIP gratuitas toda semana.',
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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
