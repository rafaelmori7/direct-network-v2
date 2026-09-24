import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Projeto dentro de outro repositório: evita que o Next use a raiz errada.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
