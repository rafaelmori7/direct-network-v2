import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { ShieldIcon } from "@/components/chrome";
import { BRAND } from "@/lib/brand";
import { listEvents, listingSummary } from "@/lib/data/repo";
import { prisma } from "@/lib/db";
import { isValidPartnerSlug } from "@/lib/partners/attribution";
import { RefTracker } from "./ref-tracker";

export const dynamic = "force-dynamic";

async function findPartner(slug: string) {
  if (!isValidPartnerSlug(slug)) return null;
  const partner = await prisma.partner.findUnique({ where: { slug } });
  return partner?.active ? partner : null;
}

export async function generateMetadata({ params }: { params: Promise<{ parceiro: string }> }): Promise<Metadata> {
  const partner = await findPartner((await params).parceiro);
  return partner ? { title: `Revenda ${partner.name} — ${BRAND.name}` } : {};
}

export default async function PartnerPage({ params }: { params: Promise<{ parceiro: string }> }) {
  const partner = await findPartner((await params).parceiro);
  if (!partner) notFound();

  const events = await listEvents();
  const summary = await listingSummary(events.map((e) => e.id));
  const own = events.filter((e) => e.partnerId === partner.id);
  const others = events.filter((e) => e.partnerId !== partner.id);
  const card = (e: (typeof events)[number], official?: string) => (
    <EventCard key={e.id} event={e} {...(summary.get(e.id) ?? { available: 0, cheapest: null })} officialBadge={official} />
  );

  return (
    <main>
      <RefTracker slug={partner.slug} />
      <section className="partner-hero" style={{ background: `linear-gradient(135deg, ${partner.color}, #111114)` }}>
        <div className="container">
          {partner.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.logoUrl} alt={partner.name} className="partner-logo" />
          ) : (
            <div className="partner-logo partner-logo-text">{partner.name}</div>
          )}
          <h1>Revenda oficial {partner.name}</h1>
          <p>
            Compre e venda ingressos com segurança: transferência pelo app oficial e pagamento protegido até o fim do evento.
          </p>
          <div className="tag-row">
            <span className="pill pill-safe">
              <ShieldIcon size={16} /> Parceiro {BRAND.name}
            </span>
            {partner.discountBps > 0 && (
              <span className="pill pill-light">
                Cupom {partner.couponCode}: {(partner.discountBps / 100).toLocaleString("pt-BR")}% de desconto
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        {own.length > 0 && (
          <>
            <h2 className="section-title" style={{ marginTop: 32 }}>
              Eventos {partner.name}
            </h2>
            <div className="grid">{own.map((e) => card(e, "Revenda oficial"))}</div>
          </>
        )}
        <h2 className="section-title" style={{ marginTop: 32 }}>
          {own.length > 0 ? "Outros eventos" : "Eventos"}
        </h2>
        {others.length === 0 ? <p className="empty">Nenhum outro evento no momento.</p> : <div className="grid">{others.map((e) => card(e))}</div>}
      </div>
    </main>
  );
}
