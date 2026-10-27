/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Réveillon Utopic Festival 2027 foi cancelado — redireciona quem
      // ainda chegar pelo link antigo (anúncio, favorito, busca) pro hub,
      // em vez de deixar a URL cair num 404.
      {
        source: '/reveillon-utopic-2027',
        destination: '/reveillon-sao-paulo',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
      {
        protocol: 'https',
        hostname: 'downloads.ctfassets.net',
      },
    ],
  },
}

module.exports = nextConfig
