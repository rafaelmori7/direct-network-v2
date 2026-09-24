import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/app/(site)/admin/eventos/event-form";
import { requirePartnerPage } from "@/lib/auth/admin";
import { CATEGORIES, getEvent } from "@/lib/data/repo";
import { toBrtInput } from "@/lib/datetime-input";
import { savePartnerEvent } from "../../actions";

export default async function PartnerEditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePartnerPage(`/parceiro/eventos/${id}`);
  const e = await getEvent(id);
  if (!e || e.partnerId !== user.partner.id) notFound();
  return (
    <main className="form-page">
      <Link href="/parceiro" className="back">
        ← Painel da agência
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        {e.name}
      </h1>
      <p className="page-sub">
        <Link href={`/evento/${e.slug}?ref=${user.partner.slug}`} style={{ color: "var(--brand)" }}>
          Ver página pública (com seu link) →
        </Link>
      </p>
      <EventForm
        action={savePartnerEvent.bind(null, e.id)}
        categories={CATEGORIES}
        partners={[]}
        values={{
          nome: e.name,
          local: e.venue,
          cidade: e.city,
          categoria: e.category,
          ticketeira: e.platform,
          transferencia: e.transferAllowed,
          inicio: toBrtInput(e.startsAt),
          fim: toBrtInput(e.endsAt),
          transferenciaAbre: toBrtInput(e.transferOpensAt),
          transferenciaFecha: toBrtInput(e.transferEndsAt),
          prazoVendedor: e.overrides.sellerTransferDeadlineHours ? String(e.overrides.sellerTransferDeadlineHours) : "",
          setores: e.sectors.map((s) => `${s.name}; ${(s.faceValueCents / 100).toFixed(2).replace(".", ",")}`).join("\n"),
          esportivo: e.isSports,
          biometria: e.nominalBiometric,
          revendaOficial: e.officialResaleActive,
          cor: e.hue,
          parceiro: "",
        }}
      />
    </main>
  );
}
