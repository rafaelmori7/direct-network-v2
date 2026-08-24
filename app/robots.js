export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/cortesia/', '/api/'],
    },
    sitemap: 'https://www.directnw.com.br/sitemap.xml',
  }
}
