import { describe, expect, it } from "vitest";
import { WIDGET_DEFAULT_EVENTS, WIDGET_MAX_EVENTS, parseWidgetOptions, widgetSnippet } from "@/lib/partners/widget";

describe("opções do widget", () => {
  it("usa padrões seguros", () => {
    expect(parseWidgetOptions({})).toEqual({ eventos: "todos", tema: "auto", limite: WIDGET_DEFAULT_EVENTS, id: "" });
  });

  it("aceita só valores conhecidos", () => {
    const o = parseWidgetOptions({ eventos: "proprios", tema: "escuro", limite: "5", id: "w1" });
    expect(o).toEqual({ eventos: "proprios", tema: "escuro", limite: 5, id: "w1" });
    expect(parseWidgetOptions({ eventos: "x", tema: "roxo" })).toMatchObject({ eventos: "todos", tema: "auto" });
  });

  it("limita a quantidade de eventos", () => {
    expect(parseWidgetOptions({ limite: "999" }).limite).toBe(WIDGET_MAX_EVENTS);
    expect(parseWidgetOptions({ limite: "0" }).limite).toBe(1);
    expect(parseWidgetOptions({ limite: "abc" }).limite).toBe(WIDGET_DEFAULT_EVENTS);
  });

  it("limpa o id do iframe", () => {
    expect(parseWidgetOptions({ id: '"><script>' }).id).toBe("script");
  });

  it("gera o código para colar no site", () => {
    expect(widgetSnippet("https://revenda.com.br/", "timelapse")).toBe(
      '<script async src="https://revenda.com.br/widget.js" data-parceiro="timelapse"></script>',
    );
    expect(widgetSnippet("https://revenda.com.br", "timelapse", { eventos: "proprios", tema: "claro" })).toContain(
      'data-eventos="proprios" data-tema="claro"',
    );
  });
});
