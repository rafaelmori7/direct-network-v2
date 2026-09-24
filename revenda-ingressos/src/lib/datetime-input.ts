// Campos <input type="datetime-local"> trabalham no horário de Brasília (UTC-3 fixo).

/** "2026-10-17T23:00" (Brasília) → Date. Vazio → null. */
export function parseBrtInput(value: FormDataEntryValue | null): Date | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const date = new Date(`${v}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → "2026-10-17T23:00" para preencher o campo. */
export function toBrtInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - 3 * 3600_000).toISOString().slice(0, 16);
}
