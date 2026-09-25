import { describe, expect, it } from "vitest";
import { WHATSAPP_TEMPLATES, cleanParam, renderTemplate, toWhatsAppNumber } from "@/lib/notify/whatsapp";

describe("WhatsApp", () => {
  it("converte o celular para o formato internacional", () => {
    expect(toWhatsAppNumber("11912345678")).toBe("5511912345678");
    expect(toWhatsAppNumber("(21) 91234-5678")).toBe("5521912345678");
    expect(toWhatsAppNumber("5511912345678")).toBe("5511912345678");
    expect(toWhatsAppNumber("1133334444")).toBe("551133334444");
    expect(toWhatsAppNumber("123")).toBeNull();
    expect(toWhatsAppNumber("01912345678")).toBeNull();
  });

  it("limpa parâmetros que a Meta recusa", () => {
    expect(cleanParam("Rock in Rio\nDia 1")).toBe("Rock in Rio Dia 1");
    expect(cleanParam("a     b")).toBe("a b");
    expect(cleanParam("   ")).toBe("-");
  });

  it("monta o texto do modelo com os parâmetros na ordem", () => {
    expect(renderTemplate("ingresso_transferido", ["Ana", "Lolla", "https://x/p/1"])).toBe(
      "Olá, Ana! O vendedor informou que transferiu seu ingresso de Lolla. Abra o app oficial, aceite a transferência se for pedido e confirme o recebimento: https://x/p/1",
    );
  });

  it("modelos numerados em sequência, sem buracos", () => {
    for (const body of Object.values(WHATSAPP_TEMPLATES)) {
      const nums = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
      expect(nums).toEqual(nums.map((_, i) => i + 1));
    }
  });
});
