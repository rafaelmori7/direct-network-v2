"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ageAt, isValidCpf, normalizeCpf } from "@/lib/auth/cpf";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export type AuthState = { errors: string[] };

/** Só aceita caminhos internos, para não virar redirecionamento aberto. */
function safeReturn(value: FormDataEntryValue | null): string {
  const path = String(value ?? "");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get("nome") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const cpf = normalizeCpf(String(form.get("cpf") ?? ""));
  const phone = String(form.get("telefone") ?? "").replace(/\D/g, "");
  const birthRaw = String(form.get("nascimento") ?? "");
  const birthDate = new Date(`${birthRaw}T00:00:00Z`);
  const password = String(form.get("senha") ?? "");

  const errors: string[] = [];
  if (name.split(/\s+/).length < 2) errors.push("Informe nome e sobrenome, como no documento.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("E-mail inválido.");
  if (!isValidCpf(cpf)) errors.push("CPF inválido.");
  if (phone.length < 10 || phone.length > 11) errors.push("Celular inválido (com DDD).");
  if (!birthRaw || Number.isNaN(birthDate.getTime())) errors.push("Informe a data de nascimento.");
  else if (ageAt(birthDate, new Date()) < 18) errors.push("É preciso ter 18 anos ou mais.");
  if (password.length < MIN_PASSWORD_LENGTH) errors.push(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  if (!form.get("termos")) errors.push("Aceite os termos de uso.");
  if (errors.length > 0) return { errors };

  try {
    const user = await prisma.user.create({
      data: { name, email, cpf, phone, whatsappOptIn: form.get("whatsapp") === "on", birthDate, passwordHash: await hashPassword(password), cpfCheckedAt: new Date() },
    });
    await createSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: ["Já existe uma conta com este e-mail ou CPF."] };
    }
    throw error;
  }
  redirect(safeReturn(form.get("voltar")));
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("senha") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  // Mesma mensagem para e-mail inexistente e senha errada.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { errors: ["E-mail ou senha incorretos."] };
  }
  if (user.blockedAt) return { errors: ["Esta conta está bloqueada. Fale com o suporte."] };
  await createSession(user.id);
  redirect(safeReturn(form.get("voltar")));
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/");
}

/** Liga ou desliga os avisos pelo WhatsApp (Minha conta). */
export async function setWhatsAppOptIn(enabled: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?voltar=/conta");
  await prisma.user.update({ where: { id: user.id }, data: { whatsappOptIn: enabled } });
  revalidatePath("/conta");
}
