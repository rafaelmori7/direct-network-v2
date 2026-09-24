"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { requestRefund } from "@/lib/orders/service";
import { getPaymentProvider } from "@/lib/payments";

export async function retryRefund(orderId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Apenas administradores.");
  await requestRefund(orderId, "FALHOU", getPaymentProvider());
  revalidatePath("/admin/reembolsos");
}
