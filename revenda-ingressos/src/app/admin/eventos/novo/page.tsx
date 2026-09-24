import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { CATEGORIES } from "@/lib/data/repo";
import { saveEvent } from "../actions";
import { EventForm } from "../event-form";

export default async function NewEvent() {
  await requireAdminPage("/admin/eventos/novo");
  return (
    <main className="form-page">
      <Link href="/admin/eventos" className="back">
        ← Eventos
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Novo evento
      </h1>
      <EventForm
        action={saveEvent.bind(null, null)}
        categories={CATEGORIES}
        values={{
          nome: "", local: "", cidade: "São Paulo, SP", categoria: CATEGORIES[0], ticketeira: "INGRESSE", transferencia: "DESCONHECIDO",
          inicio: "", fim: "", transferenciaAbre: "", transferenciaFecha: "", prazoVendedor: "", setores: "",
          esportivo: false, biometria: false, revendaOficial: false, cor: 260,
        }}
      />
    </main>
  );
}
