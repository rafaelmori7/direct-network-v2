import { notFound } from "next/navigation";
import { getCurrentUser, requireUser, type CurrentUser } from "./session";

/** Página de admin: pede login e esconde a página de quem não é admin. */
export async function requireAdminPage(returnTo: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!user.isAdmin) notFound();
  return user;
}

/** Ação de admin: recusa quem não é admin. */
export async function requireAdminAction(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Apenas administradores.");
  return user;
}

/** Página do painel do parceiro: pede login e exige fazer parte de uma agência. */
export async function requirePartnerPage(returnTo: string): Promise<CurrentUser & { partner: NonNullable<CurrentUser["partner"]> }> {
  const user = await requireUser(returnTo);
  if (!user.partner) notFound();
  return user as CurrentUser & { partner: NonNullable<CurrentUser["partner"]> };
}

export async function requirePartnerAction(): Promise<CurrentUser & { partner: NonNullable<CurrentUser["partner"]> }> {
  const user = await getCurrentUser();
  if (!user?.partner) throw new Error("Apenas membros de parceiros.");
  return user as CurrentUser & { partner: NonNullable<CurrentUser["partner"]> };
}
