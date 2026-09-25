"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { requestPayout } from "@/lib/orders/service";
import { getPaymentProvider } from "@/lib/payments";

export async function retryPayout(orderId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Apenas administradores.");
  await requestPayout(orderId, "FALHOU", getPaymentProvider());
  revalidatePath("/admin/disputas");
  revalidatePath("/admin");
}
