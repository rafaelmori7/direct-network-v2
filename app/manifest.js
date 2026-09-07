export default function manifest() {
  return {
    name: 'Direct Network — As melhores festas com desconto exclusivo',
    short_name: 'Direct Network',
    description: 'Agenda de festas em São Paulo com desconto exclusivo, listas VIP e cortesias.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
