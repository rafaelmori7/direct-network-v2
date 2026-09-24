// Opções do widget que a agência cola no próprio site (public/widget.js → /embed/[parceiro]).

export type WidgetEvents = "todos" | "proprios";
export type WidgetTheme = "auto" | "claro" | "escuro";

export interface WidgetOptions {
  eventos: WidgetEvents;
  tema: WidgetTheme;
  limite: number;
  /** Identifica o iframe na página da agência, para o ajuste de altura. */
  id: string;
}

export const WIDGET_MAX_EVENTS = 24;
export const WIDGET_DEFAULT_EVENTS = 12;
/** Tipo da mensagem que o iframe manda para o widget.js com a altura do conteúdo. */
export const WIDGET_HEIGHT_MESSAGE = "revenda-widget:altura";

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseWidgetOptions(params: Params): WidgetOptions {
  const eventos = first(params.eventos) === "proprios" ? "proprios" : "todos";
  const temaParam = first(params.tema);
  const tema: WidgetTheme = temaParam === "claro" || temaParam === "escuro" ? temaParam : "auto";
  const limiteParam = Number.parseInt(first(params.limite), 10);
  const limite = Number.isFinite(limiteParam) ? Math.min(Math.max(limiteParam, 1), WIDGET_MAX_EVENTS) : WIDGET_DEFAULT_EVENTS;
  const id = first(params.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  return { eventos, tema, limite, id };
}

/** Código que a agência cola no site dela. */
export function widgetSnippet(site: string, slug: string, options: Partial<Pick<WidgetOptions, "eventos" | "tema">> = {}): string {
  const attrs = [`src="${site.replace(/\/$/, "")}/widget.js"`, `data-parceiro="${slug}"`];
  if (options.eventos && options.eventos !== "todos") attrs.push(`data-eventos="${options.eventos}"`);
  if (options.tema && options.tema !== "auto") attrs.push(`data-tema="${options.tema}"`);
  return `<script async ${attrs.join(" ")}></script>`;
}
