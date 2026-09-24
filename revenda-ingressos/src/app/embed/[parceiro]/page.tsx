import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { ShieldIcon } from "@/components/chrome";
import { BRAND } from "@/lib/brand";
import { listEvents, listingSummary } from "@/lib/data/repo";
import { prisma } from "@/lib/db";
import { isValidPartnerSlug } from "@/lib/partners/slug";
import { parseWidgetOptions } from "@/lib/partners/widget";
import { HeightReporter } from "./height-reporter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const THEME = { auto: undefined, claro: "light", escuro: "dark" } as const;

/**
 * Vitrine que a agência coloca no site dela (via public/widget.js).
 * Os cards abrem o evento no nosso site em outra aba, com ?ref= do parceiro:
 * o cookie de indicação é gravado lá, como primeiro acesso, e não dentro do iframe.
 */
export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ parceiro: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const slug = (await params).parceiro.toLowerCase();
  const options = parseWidgetOptions(await searchParams);
  const partner = isValidPartnerSlug(slug) ? await prisma.partner.findUnique({ where: { slug } }) : null;
  if (!partner?.active) notFound();

  const all = await listEvents();
  const own = all.filter((e) => e.partnerId === partner.id);
  const events = (options.eventos === "proprios" ? own : [...own, ...all.filter((e) => e.partnerId !== partner.id)]).slice(0, options.limite);
  const summary = await listingSummary(events.map((e) => e.id));
  const ref = encodeURIComponent(partner.slug);

  return (
    <div className="embed" data-theme={THEME[options.tema]}>
      <HeightReporter id={options.id} />
      <div className="embed-head">
        <div>
          <div className="embed-title">Revenda {partner.name}</div>
          <div className="embed-sub">
            <ShieldIcon size={14} /> Transferência pelo app oficial e pagamento protegido até o fim do evento
          </div>
        </div>
        {partner.discountBps > 0 && (
          <span className="pill pill-safe">
            Cupom {partner.couponCode}: {(partner.discountBps / 100).toLocaleString("pt-BR")}% off
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <p className="empty">Nenhum ingresso de revenda no momento.</p>
      ) : (
        <div className="grid">
          {events.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              {...(summary.get(e.id) ?? { available: 0, cheapest: null })}
              officialBadge={e.partnerId === partner.id ? "Revenda oficial" : undefined}
              href={`/evento/${e.slug}?ref=${ref}`}
              newTab
            />
          ))}
        </div>
      )}

      <div className="embed-foot">
        <a href={`/${ref}`} target="_blank" rel="noopener" className="btn btn-outline">
          Ver todos os eventos
        </a>
        <span className="offer-sub">
          Revenda segura por <b>{BRAND.name}</b>
        </span>
      </div>
    </div>
  );
}
