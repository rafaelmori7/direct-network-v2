import { describe, expect, it } from "vitest";
import { ageAt, formatCpf, isValidCpf } from "@/lib/auth/cpf";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("CPF", () => {
  it("aceita CPFs válidos com ou sem pontuação", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("11144477735")).toBe(true);
  });

  it("recusa dígitos errados, repetidos e tamanho errado", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("1234567890")).toBe(false);
  });

  it("formata", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  it("calcula idade considerando o aniversário", () => {
    const birth = new Date("2008-09-25T00:00:00Z");
    expect(ageAt(birth, new Date("2026-09-24T12:00:00Z"))).toBe(17);
    expect(ageAt(birth, new Date("2026-09-25T12:00:00Z"))).toBe(18);
  });
});

describe("senha", () => {
  it("confere a senha certa e recusa a errada", async () => {
    const hash = await hashPassword("segredo123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("segredo123", hash)).toBe(true);
    expect(await verifyPassword("segredo124", hash)).toBe(false);
    expect(await verifyPassword("segredo123", "lixo")).toBe(false);
  });
});
