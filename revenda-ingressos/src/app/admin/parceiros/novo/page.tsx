import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { savePartner } from "../actions";
import { PartnerForm } from "../partner-form";

export default async function NewPartner() {
  await requireAdminPage("/admin/parceiros/novo");
  return (
    <main className="form-page">
      <Link href="/admin/parceiros" className="back">
        ← Parceiros
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Novo parceiro
      </h1>
      <PartnerForm
        action={savePartner.bind(null, null)}
        siteUrl={(process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}
        values={{ nome: "", slug: "", cupom: "", cor: "#5b2ee6", logo: "", wallet: "", participacao: "50", desconto: "0", ativo: true }}
      />
    </main>
  );
}
