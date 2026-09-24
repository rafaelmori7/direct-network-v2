import Link from "next/link";
import { notFound } from "next/navigation";
import { saleState } from "@/lib/data/event-status";
import { getEventBySlug, listEvents, rulesFor } from "@/lib/data/store";
import { formatDateLong } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import { PLATFORMS } from "@/lib/platforms/profiles";
import { maxPriceCents } from "@/lib/rules/engine";
import { ListingForm } from "./listing-form";

export const dynamic = "force-dynamic";

export default async function SellPage({ searchParams }: { searchParams: Promise<{ evento?: string }> }) {
  const { evento } = await searchParams;

  if (!evento) {
    const events = listEvents().filter((e) => {
      const kind = saleState(e).kind;
      return kind === "ABERTA" || kind === "EM_BREVE";
    });
    return (
      <main className="form-page">
        <h1 className="page-title">Vender meu ingresso</h1>
        <p className="page-sub">Escolha o evento. Só aparecem eventos com transferência oficial liberada.</p>
        <div className="offers">
          {events.map((e) => (
            <Link key={e.id} href={`/anunciar?evento=${e.slug}`} className="offer">
              <div>
                <h3>{e.name}</h3>
                <div className="offer-sub">
                  {formatDateLong(e.startsAt)} · {e.venue}
                </div>
              </div>
              <span className="platform-tag">{PLATFORMS[e.platform].name}</span>
            </Link>
          ))}
        </div>
      </main>
    );
  }

  const event = getEventBySlug(evento);
  if (!event) notFound();
  const rules = rulesFor(event);
  const state = saleState(event);
  const capExample = maxPriceCents(rules, 10_000);
  const priceCapNote =
    rules.priceCapMode === "VALOR_DE_FACE"
      ? "Evento esportivo: o preço não pode passar do valor original (Lei 14.597/2023)."
      : capExample !== null
        ? `Preço máximo: até ${rules.maxMarkupPercent}% acima do valor original.`
        : null;

  return (
    <main className="form-page">
      <Link href="/anunciar" className="back">
        ← Trocar evento
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        {event.name}
      </h1>
      <p className="page-sub">
        {formatDateLong(event.startsAt)} · {event.venue}, {event.city}
      </p>

      {state.kind === "ENCERRADA" || state.kind === "BLOQUEADA" ? (
        <div className="notice notice-warn">
          <div>
            <b>Não é possível anunciar</b>
            {state.kind === "BLOQUEADA" ? state.reason : "O prazo de transferência deste evento acabou."}
          </div>
        </div>
      ) : (
        <>
          <div className="notice notice-safe" style={{ marginBottom: 20 }}>
            <div>
              <b>Como transferir na {PLATFORMS[event.platform].name}</b>
              {rules.transferInstructions}
            </div>
          </div>
          <ListingForm
            eventSlug={event.slug}
            sectors={event.sectors.map((s) => ({ name: s.name, faceValue: formatBRL(s.faceValueCents) }))}
            sellerMustBeOriginalBuyer={rules.sellerMustBeOriginalBuyer}
            priceCapNote={priceCapNote}
            maxTickets={rules.maxTicketsPerSellerPerEvent}
            transferDeadlineHours={rules.sellerTransferDeadlineHours}
            platformName={PLATFORMS[event.platform].name}
          />
        </>
      )}
    </main>
  );
}
