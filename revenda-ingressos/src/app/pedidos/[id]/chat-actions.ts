"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { BLOCKED_MESSAGE_WARNING, canSendMessage, screenMessage, type ChatRole } from "@/lib/chat/policy";
import { prisma } from "@/lib/db";

export type ChatState = { warning: string | null; sentAt: number };

export async function sendMessage(orderId: string, _prev: ChatState, form: FormData): Promise<ChatState> {
  const user = await getCurrentUser();
  if (!user) return { warning: "Entre na sua conta.", sentAt: 0 };
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { listing: { select: { sellerId: true } } } });
  if (!order) return { warning: "Pedido não encontrado.", sentAt: 0 };

  const role: ChatRole | null =
    order.buyerId === user.id ? "COMPRADOR" : order.listing.sellerId === user.id ? "VENDEDOR" : user.isAdmin ? "ADMIN" : null;
  if (!role) return { warning: "Você não participa deste pedido.", sentAt: 0 };
  if (!canSendMessage(order.status, role)) return { warning: "O chat deste pedido está fechado.", sentAt: 0 };

  const raw = String(form.get("mensagem") ?? "");
  const screened = screenMessage(raw);
  if (!screened.ok) {
    // Tentativa de passar contato fica guardada (só o admin vê) como sinal de risco.
    if (raw.trim() && !screened.reasons.includes("mensagem vazia")) {
      await prisma.message.create({ data: { orderId, senderId: user.id, role, kind: "BLOQUEADA", body: raw.slice(0, 1000) } });
    }
    const onlyFormat = screened.reasons.every((r) => r === "mensagem vazia" || r.startsWith("máximo"));
    return { warning: onlyFormat ? `Mensagem inválida: ${screened.reasons.join(", ")}.` : BLOCKED_MESSAGE_WARNING, sentAt: 0 };
  }

  await prisma.message.create({ data: { orderId, senderId: user.id, role, kind: "USUARIO", body: screened.body } });
  revalidatePath(`/pedidos/${orderId}`);
  return { warning: null, sentAt: Date.now() };
}
