import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Projeto dentro de outro repositório: evita que o Next use a raiz errada.
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      // Só o widget pode ser colocado em iframe (site das agências).
      { source: "/embed/:path*", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }] },
      // O resto do site não abre dentro de outros sites (proteção contra clickjacking).
      {
        source: "/:path((?!embed/).*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      { source: "/widget.js", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
    ];
  },
};

export default nextConfig;
