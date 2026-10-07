import type { TicketType } from "@/lib/rules/types";

const TZ = "America/Sao_Paulo";

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "long", year: "numeric" }).toUpperCase();
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "short" }).replace(".", "");
}

export function formatDateTime(date: Date): string {
  const d = date.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });
  const t = date.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  return `${d} às ${t}`;
}

export function formatWeekdayTime(date: Date): string {
  const w = date.toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "short" }).replace(".", "");
  return `${w} • ${formatDateTime(date)}`;
}

export const TICKET_TYPE_LABEL: Record<TicketType, string> = {
  INTEIRA: "Inteira",
  MEIA: "Meia-entrada",
  MEIA_SOCIAL: "Meia social",
  CORTESIA: "Cortesia",
};

/** "12h", "3 dias": tempo restante, arredondado para baixo. */
export function formatRemaining(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "menos de 1h";
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)} dias`;
}

export function parseBRLToCents(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}
