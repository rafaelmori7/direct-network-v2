import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { CATEGORIES, getEvent } from "@/lib/data/repo";
import { toBrtInput } from "@/lib/datetime-input";
import { saveEvent } from "../actions";
import { EventForm } from "../event-form";

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/eventos/${id}`);
  const e = await getEvent(id);
  if (!e) notFound();
  return (
    <main className="form-page">
      <Link href="/admin/eventos" className="back">
        ← Eventos
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        {e.name}
      </h1>
      <p className="page-sub">
        <Link href={`/evento/${e.slug}`} style={{ color: "var(--brand)" }}>
          Ver página pública →
        </Link>
      </p>
      <EventForm
        action={saveEvent.bind(null, e.id)}
        categories={CATEGORIES}
        partners={await prisma.partner.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })}
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
          parceiro: e.partnerId ?? "",
        }}
      />
    </main>
  );
}
