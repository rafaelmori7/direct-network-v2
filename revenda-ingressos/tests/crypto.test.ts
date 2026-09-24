import { beforeAll, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "@/lib/crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "chave-de-teste-com-mais-de-32-caracteres!!";
});

describe("criptografia de segredos", () => {
  it("criptografa e volta ao original, com resultado diferente a cada vez", () => {
    const a = encrypt("$aact_segredo");
    const b = encrypt("$aact_segredo");
    expect(a).not.toBe(b);
    expect(a).not.toContain("segredo");
    expect(decrypt(a)).toBe("$aact_segredo");
  });

  it("recusa dado adulterado", () => {
    const token = encrypt("abc");
    const parts = token.split(".");
    parts[3] = Buffer.from("xyz").toString("base64url");
    expect(() => decrypt(parts.join("."))).toThrow();
  });
});
