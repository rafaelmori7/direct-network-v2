import Link from "next/link";
import { PlatformTag, PosterArt, ShieldIcon } from "@/components/chrome";
import { saleState } from "@/lib/data/event-status";
import type { EventRecord } from "@/lib/data/repo";
import { formatDateLong, formatDateShort, formatRemaining } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";

export function EventCard({
  event,
  available,
  cheapest,
  officialBadge,
  href,
  newTab,
}: {
  event: EventRecord;
  available: number;
  cheapest: number | null;
  /** Selo "revenda oficial" na página do parceiro dono do evento. */
  officialBadge?: string;
  /** Destino do card (o widget acrescenta ?ref= do parceiro). */
  href?: string;
  /** No widget o evento abre em outra aba, fora do site da agência. */
  newTab?: boolean;
}) {
  return (
    <Link
      href={href ?? `/evento/${event.slug}`}
      className="event-card"
      {...(newTab && { target: "_blank", rel: "noopener" })}
    >
      <div className="poster">
        <PosterArt hue={event.hue}>
          <span className="poster-date">{formatDateShort(event.startsAt)}</span>
          <span className="poster-name">{event.name}</span>
          <div className="poster-bar">
            <strong>{cardBadge(event, available)}</strong>
            <span>Ver ingressos de revenda →</span>
          </div>
        </PosterArt>
      </div>
      <h2 className="event-name">{event.name}</h2>
      <div className="event-meta">
        {event.venue}, {event.city}
        <br />
        {formatDateLong(event.startsAt)}
      </div>
      <div className="tag-row">
        {officialBadge && (
          <span className="platform-tag" style={{ background: "var(--safe-soft)", color: "var(--safe)", borderColor: "transparent" }}>
            <ShieldIcon size={14} /> {officialBadge}
          </span>
        )}
        <PlatformTag platform={event.platform} />
      </div>
      {cheapest !== null && (
        <div className="event-price">
          {available} {available === 1 ? "ingresso" : "ingressos"} a partir de <b>{formatBRL(cheapest)}</b> + taxa
        </div>
      )}
    </Link>
  );
}

function cardBadge(event: EventRecord, available: number): string {
  const state = saleState(event);
  if (state.kind === "BLOQUEADA") return "Revenda em análise";
  if (state.kind === "ENCERRADA") return "Vendas encerradas";
  if (state.kind === "EM_BREVE") return "Revenda abre em breve";
  const remaining = state.closesAt.getTime() - Date.now();
  if (remaining < 48 * 3_600_000) return `Últimas horas · encerra em ${formatRemaining(remaining)}`;
  if (available === 0) return "Seja o primeiro a anunciar";
  if (available <= 3) return "Últimos ingressos";
  return "Ingressos disponíveis";
}
