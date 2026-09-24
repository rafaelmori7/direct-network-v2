import Link from "next/link";
import { notFound } from "next/navigation";
import { saleState } from "@/lib/data/event-status";
import { requireUser } from "@/lib/auth/session";
import { getEventBySlug, listEvents, rulesFor } from "@/lib/data/repo";
import { formatDateLong } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import { NEW_SELLER_MAX_ACTIVE_TICKETS, maxPriceCents } from "@/lib/rules/engine";
import { ListingForm } from "./listing-form";

export const dynamic = "force-dynamic";

export default async function SellPage({ searchParams }: { searchParams: Promise<{ evento?: string }> }) {
  const { evento } = await searchParams;
  const user = await requireUser(evento ? `/anunciar?evento=${evento}` : "/anunciar");

  if (!evento) {
    const events = (await listEvents()).filter((e) => {
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
              <span className="platform-tag">{e.platformName}</span>
            </Link>
          ))}
        </div>
      </main>
    );
  }

  const event = await getEventBySlug(evento);
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

      {!user.hasPayoutAccount ? (
        <div className="form">
          <div className="notice notice-warn">
            <div>
              <b>Falta só a sua conta de recebimento</b>
              Leva 2 minutos e é feita uma única vez. Você anuncia na hora e recebe depois da aprovação dos documentos.
            </div>
          </div>
          <Link href={`/conta/recebimento?voltar=${encodeURIComponent(`/anunciar?evento=${event.slug}`)}`} className="btn btn-primary btn-block">
            Criar conta de recebimento
          </Link>
        </div>
      ) : state.kind === "ENCERRADA" || state.kind === "BLOQUEADA" ? (
        <div className="notice notice-warn">
          <div>
            <b>Não é possível anunciar</b>
            {state.kind === "BLOQUEADA" ? state.reason : "O prazo de transferência deste evento acabou."}
          </div>
        </div>
      ) : (
        <>
          {!user.payoutApproved && (
            <div className="notice notice-warn" style={{ marginBottom: 12 }}>
              <div>
                <b>Cadastro em análise</b>
                Você pode anunciar até {NEW_SELLER_MAX_ACTIVE_TICKETS} ingressos. O pagamento das vendas fica guardado até a
                aprovação dos seus documentos (e sempre sai depois do evento).{" "}
                <Link href="/conta/recebimento">Ver cadastro</Link>
              </div>
            </div>
          )}
          <div className="notice notice-safe" style={{ marginBottom: 20 }}>
            <div>
              <b>Como transferir na {event.platformName}</b>
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
            platformName={event.platformName}
          />
        </>
      )}
    </main>
  );
}
