// Datas são guardadas em UTC. Regras de "dia útil" usam o horário de Brasília,
// que não tem horário de verão desde 2019 (UTC-3 fixo).
const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** "AAAA-MM-DD" no horário de Brasília. */
export function brtDateKey(date: Date): string {
  return new Date(date.getTime() + BRT_OFFSET_MS).toISOString().slice(0, 10);
}

function isBusinessDay(date: Date, holidays: ReadonlySet<string>): boolean {
  const weekday = new Date(date.getTime() + BRT_OFFSET_MS).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !holidays.has(brtDateKey(date));
}

/**
 * Avança `days` dias úteis a partir de `date` e devolve o fim desse dia
 * (23:59:59.999 em Brasília). O dia de partida não conta.
 */
export function endOfNthBusinessDay(
  date: Date,
  days: number,
  holidays: ReadonlySet<string> = new Set(),
): Date {
  let cursor = date;
  let counted = 0;
  while (counted < days) {
    cursor = addDays(cursor, 1);
    if (isBusinessDay(cursor, holidays)) counted++;
  }
  const endOfDayBrt = Date.parse(`${brtDateKey(cursor)}T23:59:59.999Z`) - BRT_OFFSET_MS;
  return new Date(endOfDayBrt);
}

export function maxDate(...dates: Date[]): Date {
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export function minDate(...dates: Date[]): Date {
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}
