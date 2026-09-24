import { prisma } from "@/lib/db";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  kind: string;
  orderId?: string | null;
}

/**
 * Envia pelo Resend quando RESEND_API_KEY e EMAIL_FROM estão definidos; sem
 * eles, só registra (desenvolvimento). Nunca lança erro: aviso por e-mail não
 * pode travar pagamento, reembolso ou liberação.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  let status: "ENVIADO" | "REGISTRADO" | "FALHOU" = "REGISTRADO";
  let error: string | null = null;

  if (apiKey && from) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text }),
      });
      if (res.ok) status = "ENVIADO";
      else {
        status = "FALHOU";
        error = `${res.status} ${(await res.text()).slice(0, 300)}`;
      }
    } catch (e) {
      status = "FALHOU";
      error = e instanceof Error ? e.message : String(e);
    }
  }

  await prisma.emailLog
    .create({ data: { to: message.to, subject: message.subject, body: message.text, kind: message.kind, orderId: message.orderId ?? null, status, error } })
    .catch(() => undefined);
}

/** Já existe aviso deste tipo para esta pessoa neste pedido (desde `since`, se informado)? */
export async function alreadySent(orderId: string, kind: string, to: string, since?: Date): Promise<boolean> {
  const found = await prisma.emailLog.findFirst({
    where: { orderId, kind, to, status: { not: "FALHOU" }, ...(since && { createdAt: { gte: since } }) },
    select: { id: true },
  });
  return found !== null;
}
