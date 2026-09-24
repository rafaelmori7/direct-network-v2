"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { applyAction, handlePaymentReceived } from "@/lib/orders/service";
import type { Actor, OrderAction } from "@/lib/orders/state-machine";
import { getPaymentProvider } from "@/lib/payments";

export type OrderFormState = { error: string | null };

async function act(orderId: string, role: "COMPRADOR" | "VENDEDOR", action: OrderAction): Promise<OrderFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Entre na sua conta." };
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { listing: true } });
  if (!order) return { error: "Pedido não encontrado." };
  const isParty = role === "COMPRADOR" ? order.buyerId === user.id : order.listing.sellerId === user.id;
  if (!isParty) return { error: "Você não participa deste pedido." };
  const result = await applyAction(orderId, action, role as Actor, user.id, getPaymentProvider());
  revalidatePath(`/pedidos/${orderId}`);
  return { error: result.ok ? null : result.error };
}

export async function markTransferred(orderId: string, _prev: OrderFormState, _form: FormData) {
  return act(orderId, "VENDEDOR", { type: "VENDEDOR_TRANSFERIU" });
}

export async function confirmReceipt(orderId: string, _prev: OrderFormState, form: FormData) {
  const total = Number(form.get("totalItens"));
  const checked = form.getAll("item").length;
  return act(orderId, "COMPRADOR", { type: "COMPRADOR_CONFIRMOU_RECEBIMENTO", checklistConfirmed: checked === total });
}

export async function openDispute(orderId: string, _prev: OrderFormState, form: FormData) {
  const user = await getCurrentUser();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { listing: true } });
  const role = order && user && order.listing.sellerId === user.id ? "VENDEDOR" : "COMPRADOR";
  return act(orderId, role, { type: "ABRIR_DISPUTA", reason: String(form.get("motivo") ?? "") });
}

/** Só em testes (mock ou sandbox do Asaas): paga o Pix e processa o aviso como o webhook faria. */
export async function simulatePayment(orderId: string, _prev: OrderFormState, _form: FormData): Promise<OrderFormState> {
  const provider = getPaymentProvider();
  if (!provider.simulatePayment || (provider.kind === "asaas" && !(provider as { isSandbox?: boolean }).isSandbox)) {
    return { error: "Disponível só no modo de teste." };
  }
  const user = await getCurrentUser();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!user || !order || order.buyerId !== user.id) return { error: "Pedido não encontrado." };
  if (!order.chargeId) return { error: "Pedido sem cobrança Pix." };
  await provider.simulatePayment(order.chargeId);
  const outcome = await handlePaymentReceived(order.chargeId, provider);
  revalidatePath(`/pedidos/${orderId}`);
  return { error: outcome === "CONFIRMADO" ? null : "Pagamento não pôde ser confirmado." };
}
