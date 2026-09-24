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
