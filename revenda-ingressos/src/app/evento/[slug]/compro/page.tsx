import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getEventBySlug } from "@/lib/data/repo";
import { formatDateLong } from "@/lib/format";
import { WantedForm } from "./wanted-form";

export default async function WantedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireUser(`/evento/${slug}/compro`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  return (
    <main className="form-page">
      <Link href={`/evento/${event.slug}`} className="back">
        ← {event.name}
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Quero comprar
      </h1>
      <p className="page-sub">
        {event.name} · {formatDateLong(event.startsAt)}
      </p>
      <WantedForm eventSlug={event.slug} sectors={event.sectors.map((s) => s.name)} />
    </main>
  );
}
