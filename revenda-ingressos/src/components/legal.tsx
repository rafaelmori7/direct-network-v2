import { BRAND } from "@/lib/brand";

/** Dados da empresa (cartão CNPJ). Aparecem no rodapé, nos termos e na política (Decreto 7.962/2013). */
export const COMPANY = {
  legalName: process.env.COMPANY_LEGAL_NAME || "Skin Soluções em Eventos Ltda.",
  cnpj: process.env.COMPANY_CNPJ || "46.181.529/0001-50",
  address: process.env.COMPANY_ADDRESS || "Av. Agostinho Rubin, 374, Jardim Germânia, São Paulo/SP, CEP 05848-000",
  contactEmail: process.env.CONTACT_EMAIL || "[e-mail de contato]",
  privacyEmail: process.env.PRIVACY_EMAIL || process.env.CONTACT_EMAIL || "[e-mail do encarregado de dados]",
};

export const LEGAL_UPDATED_AT = "25 de setembro de 2026";

/** Aviso de rascunho: some quando LEGAL_REVIEWED=1 (depois da revisão do advogado). */
export function DraftNotice() {
  if (process.env.LEGAL_REVIEWED === "1") return null;
  return (
    <div className="notice notice-warn" style={{ marginBottom: 24 }}>
      <div>
        <b>Versão preliminar</b>Texto em revisão jurídica antes do lançamento do {BRAND.name}.
      </div>
    </div>
  );
}
