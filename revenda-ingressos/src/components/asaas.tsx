/**
 * Transparência do modelo BaaS (Resolução Conjunta nº 16/2025 e playbook de BaaS do Asaas):
 * onde houver movimentação de dinheiro, o usuário precisa saber que os serviços
 * financeiros são prestados pelo Asaas e como falar com o suporte dele.
 */

// Selo individual enviado pelo suporte do Asaas na homologação do BaaS.
const SEAL_ID = process.env.ASAAS_SEAL_ID || "9589c497-df6b-41ed-988c-1d0d5bf94e11";
const sealUrl = (variant: "Positivo" | "Negativo-Branco") =>
  `https://baas.asaas.com/selos/Servicos_financeiros_Asaas-Reduzida-${variant}.svg?id=${SEAL_ID}`;

export const ASAAS = {
  legalName: "Asaas Gestão Financeira Instituição de Pagamento S.A.",
  phone: "0800 009 0037",
  email: "contato@asaas.com.br",
};

/**
 * Selo clicável. Não usar referrerPolicy "no-referrer" na imagem: o Asaas usa o
 * Referer para verificar se o site carregou o selo.
 */
export function AsaasSeal({ width = 160 }: { width?: number }) {
  const height = Math.round((width * 48) / 160);
  return (
    <a href="https://asaas.com" target="_blank" rel="noopener noreferrer" className="asaas-seal">
      <picture>
        <source srcSet={sealUrl("Negativo-Branco")} media="(prefers-color-scheme: dark)" />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG externo homologado pelo Asaas */}
        <img src={sealUrl("Positivo")} alt="Serviços financeiros Asaas" width={width} height={height} style={{ display: "inline-block" }} />
      </picture>
    </a>
  );
}

/** Selo + texto de quem presta o serviço financeiro e onde pedir suporte. */
export function AsaasDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <div className="asaas-disclosure">
      <AsaasSeal width={compact ? 120 : 160} />
      <p className="hint" style={{ margin: 0 }}>
        Pix, contas de pagamento e transferências são serviços financeiros prestados pelo {ASAAS.legalName}, instituição de pagamento
        autorizada pelo Banco Central. Suporte do Asaas: {ASAAS.phone} · {ASAAS.email}.
      </p>
    </div>
  );
}
