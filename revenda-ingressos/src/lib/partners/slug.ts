// Sem dependências de banco: usado também pelo middleware (roda em todas as páginas).

export const REF_COOKIE = "parceiro";
export const REF_COOKIE_DAYS = 30;

/**
 * Caminhos de primeiro nível que não podem virar página de parceiro
 * (/timelapse é parceiro; /conta não).
 */
export const RESERVED_SLUGS = new Set([
  "admin", "anunciar", "embed", "widget", "api", "cadastro", "comprar", "conta", "entrar", "evento", "pedidos", "parceiro", "parceiros",
  "sobre", "ajuda", "como-funciona", "termos", "privacidade", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
]);

export function isValidPartnerSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug) && !RESERVED_SLUGS.has(slug);
}
