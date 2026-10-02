import { describe, expect, it } from "vitest";
import { formatPhone, isValidMobile } from "@/lib/auth/phone";
import { gatewayErrorMessage } from "@/lib/payments/provider";

describe("celular", () => {
  it("aceita celular com DDD existente", () => {
    expect(isValidMobile("(11) 98765-4321")).toBe(true);
    expect(isValidMobile("21987654323")).toBe(true);
  });

  it("recusa fixo, DDD inexistente e números repetidos (recusados pelo Asaas)", () => {
    expect(isValidMobile("1132654321")).toBe(false); // fixo, 10 dígitos
    expect(isValidMobile("11387654321")).toBe(false); // não começa com 9
    expect(isValidMobile("20987654321")).toBe(false); // DDD 20 não existe
    expect(isValidMobile("11999999999")).toBe(false);
  });

  it("formata", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("1132654321")).toBe("(11) 3265-4321");
  });
});

describe("mensagem do gateway", () => {
  it("mostra só a descrição do Asaas", () => {
    const error = new Error('Asaas POST /accounts falhou: 400 {"errors":[{"code":"invalid_mobilePhone","description":"O celular informado é inválido."}]}');
    expect(gatewayErrorMessage(error)).toBe("O celular informado é inválido.");
    expect(gatewayErrorMessage(new Error("fetch failed"))).toBe("fetch failed");
  });
});
