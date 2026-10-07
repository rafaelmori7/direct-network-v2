import { describe, expect, it } from "vitest";
import { canReadChat, canSendMessage, screenMessage } from "@/lib/chat/policy";

describe("quando o chat abre", () => {
  it("fechado antes do pagamento", () => {
    expect(canSendMessage("AGUARDANDO_PAGAMENTO", "COMPRADOR")).toBe(false);
    expect(canReadChat("AGUARDANDO_PAGAMENTO")).toBe(false);
  });

  it("aberto do pagamento até o fim da disputa", () => {
    for (const status of ["PAGO", "TRANSFERIDO", "RECEBIDO", "EM_DISPUTA"] as const) {
      expect(canSendMessage(status, "COMPRADOR")).toBe(true);
      expect(canSendMessage(status, "VENDEDOR")).toBe(true);
    }
  });

  it("só leitura depois de concluído; admin ainda pode escrever", () => {
    expect(canSendMessage("LIBERADO", "VENDEDOR")).toBe(false);
    expect(canReadChat("LIBERADO")).toBe(true);
    expect(canSendMessage("REEMBOLSADO", "ADMIN")).toBe(true);
  });
});

describe("filtro de mensagens", () => {
  const allowed = [
    "Oi! Já consegue fazer a transferência?",
    "Transferi agora, confere no app Quentro",
    "Paguei o pix e já apareceu como pago aqui",
    "O evento é dia 17/10/2026 às 23:00",
    "Setor pista, valor R$ 1.050,00",
    "Recebi, deu tudo certo. Obrigado!",
  ];
  it.each(allowed)("permite: %s", (text) => {
    expect(screenMessage(text).ok).toBe(true);
  });

  const blocked: [string, string][] = [
    ["me chama no 11 98939-8009", "telefone"],
    ["(11) 973991159", "telefone"],
    ["+55 11 99451-5044", "telefone"],
    ["manda no fulano@gmail.com", "e-mail"],
    ["compra por esse link https://bit.ly/abc", "link"],
    ["meu cpf 123.456.789-00", "CPF/CNPJ"],
    ["faz um pix direto que sai mais barato", "contato ou pagamento fora da plataforma"],
    ["chama no whats", "contato ou pagamento fora da plataforma"],
    ["vamos fechar por fora", "contato ou pagamento fora da plataforma"],
  ];
  it.each(blocked)("bloqueia: %s", (text, reason) => {
    const result = screenMessage(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons).toContain(reason);
  });

  it("recusa mensagem vazia ou longa demais", () => {
    expect(screenMessage("   ").ok).toBe(false);
    expect(screenMessage("a".repeat(1001)).ok).toBe(false);
  });
});
