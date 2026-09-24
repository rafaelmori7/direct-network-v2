import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { addDays } from "@/lib/time";

const COOKIE = "sessao";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = addDays(new Date(), SESSION_DAYS);
  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  canBuy: boolean;
  /** Conta de recebimento criada: pode anunciar (com limite enquanto em análise). */
  hasPayoutAccount: boolean;
  /** Conta de recebimento aprovada: recebe os pagamentos e anuncia sem limite de novato. */
  payoutApproved: boolean;
  isAdmin: boolean;
};

/** Usuário logado, ou null. Uma consulta por requisição. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { id: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || session.user.blockedAt) return null;
  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    canBuy: user.cpfCheckedAt !== null,
    hasPayoutAccount: user.gatewayAccountId !== null,
    payoutApproved: user.verifiedAt !== null,
    isAdmin: user.isAdmin,
  };
});

export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?voltar=${encodeURIComponent(returnTo)}`);
  return user;
}
