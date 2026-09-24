import Link from "next/link";
import { EventForm } from "@/app/admin/eventos/event-form";
import { requirePartnerPage } from "@/lib/auth/admin";
import { CATEGORIES } from "@/lib/data/repo";
import { savePartnerEvent } from "../../actions";

export default async function PartnerNewEvent() {
  await requirePartnerPage("/parceiro/eventos/novo");
  return (
    <main className="form-page">
      <Link href="/parceiro" className="back">
        ← Painel da agência
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Novo evento
      </h1>
      <EventForm
        action={savePartnerEvent.bind(null, null)}
        categories={CATEGORIES}
        partners={[]}
        values={{
          nome: "", local: "", cidade: "São Paulo, SP", categoria: CATEGORIES[0], ticketeira: "INGRESSE", transferencia: "SIM",
          inicio: "", fim: "", transferenciaAbre: "", transferenciaFecha: "", prazoVendedor: "", setores: "",
          esportivo: false, biometria: false, revendaOficial: false, cor: 260, parceiro: "",
        }}
      />
    </main>
  );
}
