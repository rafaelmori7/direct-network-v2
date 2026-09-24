import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldIcon } from "@/components/chrome";
import { saleState } from "@/lib/data/event-status";
import { getEvent, getListing, rulesFor } from "@/lib/data/store";
import { TICKET_TYPE_LABEL, formatDateLong } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import { PLATFORMS } from "@/lib/platforms/profiles";
import type { BuyerIdentifier } from "@/lib/rules/types";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const listing = getListing(listingId);
  const event = listing && getEvent(listing.eventId);
  if (!listing || !event) notFound();

  const rules = rulesFor(event);
  const platformName = PLATFORMS[event.platform].name;
  const state = saleState(event);
  const labels: Record<BuyerIdentifier, { label: string; hint: string }> = {
    EMAIL: { label: `E-mail da sua conta ${platformName}`, hint: "O ingresso é enviado para esta conta." },
    CPF: { label: "CPF", hint: "O mesmo cadastrado na ticketeira." },
    NOME_COMPLETO: { label: "Nome completo", hint: "Como aparece no documento." },
    QUENTRO_ID: { label: "Quentro ID (opcional)", hint: "Você encontra no seu perfil do app Quentro. Crie sua conta antes." },
  };

  return (
    <main className="form-page">
      <Link href={`/evento/${event.slug}`} className="back">
        ← {event.name}
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Finalizar compra
      </h1>

      <div className="aside-card" style={{ marginBottom: 20 }}>
        <div className="aside-head">
          {event.name} · {formatDateLong(event.startsAt)}
        </div>
        <div className="aside-body summary">
          <div className="summary-row">
            <span>
              {listing.sector} · {TICKET_TYPE_LABEL[listing.ticketType]}
            </span>
            <b>{formatBRL(listing.priceCents)}</b>
          </div>
          <div className="summary-row offer-sub">
            <span>Vendedor</span>
            <span>{listing.sellerName}</span>
          </div>
          <div className="summary-row offer-sub">
            <span>Entrega</span>
            <span>
              Transferência pelo app {platformName} em até {rules.sellerTransferDeadlineHours}h
            </span>
          </div>
          <div className="notice notice-safe" style={{ marginTop: 8 }}>
            <ShieldIcon />
            <div>
              <b>Compra garantida</b>O vendedor só recebe depois do evento. Se o ingresso não chegar, você recebe o valor
              de volta.
            </div>
          </div>
        </div>
      </div>

      {state.kind !== "ABERTA" ? (
        <div className="notice notice-warn">
          <div>
            <b>Compra indisponível</b>
            {state.kind === "EM_BREVE" ? "As compras deste evento ainda não abriram." : "As vendas deste evento estão fechadas."}
          </div>
        </div>
      ) : (
        <CheckoutForm
          listingId={listing.id}
          unitPriceCents={listing.priceCents}
          maxQuantity={listing.quantityAvailable}
          identifiers={rules.buyerIdentifiers.map((id) => ({ id, ...labels[id], required: id !== "QUENTRO_ID" }))}
          requiresHalfPrice={listing.ticketType === "MEIA"}
          platformName={platformName}
        />
      )}
    </main>
  );
}
