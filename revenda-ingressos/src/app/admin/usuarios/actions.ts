"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export async function setVerified(userId: string, verified: boolean): Promise<void> {
  await requireAdminAction();
  // Aprovação manual (ex.: problema no gateway). Normalmente vem do aviso do Asaas.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({
    where: { id: userId },
    data: {
      verifiedAt: verified ? new Date() : null,
      gatewayAccountStatus: verified ? "APROVADA" : user.gatewayAccountId ? "EM_ANALISE" : "NENHUM",
    },
  });
  revalidatePath("/admin/usuarios");
}

/** Bloqueia a conta: encerra as sessões e tira os anúncios do ar. Pedidos em andamento seguem pelo fluxo normal. */
export async function blockUser(userId: string, form: FormData): Promise<void> {
  const admin = await requireAdminAction();
  if (userId === admin.id) throw new Error("Você não pode bloquear a própria conta.");
  const reason = String(form.get("motivo") ?? "").trim() || "Sem motivo informado";
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { blockedAt: new Date(), blockedReason: reason } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.listing.updateMany({ where: { sellerId: userId, status: "ATIVO" }, data: { status: "PAUSADO" } }),
    prisma.wantedPost.updateMany({ where: { buyerId: userId, active: true }, data: { active: false } }),
  ]);
  revalidatePath("/admin/usuarios");
}

export async function unblockUser(userId: string): Promise<void> {
  await requireAdminAction();
  await prisma.user.update({ where: { id: userId }, data: { blockedAt: null, blockedReason: null } });
  revalidatePath("/admin/usuarios");
}
