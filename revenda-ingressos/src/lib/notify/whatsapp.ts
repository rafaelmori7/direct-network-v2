import { prisma } from "@/lib/db";

/**
 * Avisos pelo WhatsApp Cloud API (Meta). Mensagem iniciada pela empresa só
 * sai com modelo aprovado pela Meta: cada modelo abaixo precisa ser
 * cadastrado no WhatsApp Manager com o mesmo nome, idioma pt_BR, categoria
 * "Utilidade" e exatamente este texto.
 */
export const WHATSAPP_TEMPLATES = {
  pagamento_confirmado:
    "Olá, {{1}}! Seu pagamento de {{2}} para {{3}} foi confirmado e está retido com segurança. O vendedor tem até {{4}} para transferir o ingresso pelo app oficial. Acompanhe: {{5}}",
  venda_transferir:
    "Olá, {{1}}! Seu ingresso de {{2}} foi vendido. Transfira pelo app oficial até {{3}}, com os dados do comprador que estão na página do pedido, e clique em \"Já transferi\": {{4}}",
  ingresso_transferido:
    "Olá, {{1}}! O vendedor informou que transferiu seu ingresso de {{2}}. Abra o app oficial, aceite a transferência se for pedido e confirme o recebimento: {{3}}",
  lembrete_transferencia:
    "Olá, {{1}}! Faltam poucas horas: transfira o ingresso de {{2}} até {{3}}. Se não transferir, a venda é cancelada e o comprador reembolsado. Pedido: {{4}}",
  reembolso:
    "Olá, {{1}}! Vamos devolver {{2}} do pedido de {{3}} para a conta que fez o Pix. Detalhes: {{4}}",
  pagamento_liberado:
    "Olá, {{1}}! {{2}} da venda de {{3}} foram liberados na sua conta de recebimento. Pedido: {{4}}",
  disputa_aberta:
    "Olá, {{1}}! Foi aberta uma disputa no pedido de {{2}}. Nossa equipe vai analisar e o dinheiro segue retido até a decisão: {{3}}",
} as const;

export type WhatsAppTemplate = keyof typeof WHATSAPP_TEMPLATES;

export interface WhatsAppMessage {
  /** Celular como está no cadastro (só dígitos, com DDD). */
  phone: string;
  template: WhatsAppTemplate;
  params: string[];
  kind: string;
  orderId?: string | null;
}

/** Celular brasileiro com DDD → formato internacional sem "+" (5511912345678). */
export function toWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length === 13 && digits.startsWith("55") ? digits.slice(2) : digits;
  return /^[1-9]{2}9?\d{8}$/.test(local) ? `55${local}` : null;
}

/** A Meta recusa parâmetro com quebra de linha, tab ou mais de 4 espaços seguidos. */
export function cleanParam(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, 900) || "-";
}

export function renderTemplate(template: WhatsAppTemplate, params: string[]): string {
  return WHATSAPP_TEMPLATES[template].replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] ?? "");
}

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Envia quando WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID estão definidos; sem
 * eles, só registra. Nunca lança erro: aviso não pode travar o pedido.
 */
export async function sendWhatsApp(message: WhatsAppMessage): Promise<void> {
  const to = toWhatsAppNumber(message.phone);
  const params = message.params.map(cleanParam);
  let status: "ENVIADO" | "REGISTRADO" | "FALHOU" = "REGISTRADO";
  let error: string | null = to ? null : "Celular inválido";

  if (!to) status = "FALHOU";
  else if (whatsappConfigured()) {
    const version = process.env.WHATSAPP_API_VERSION ?? "v21.0";
    try {
      const res = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: message.template,
            language: { code: "pt_BR" },
            components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
          },
        }),
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
    .create({
      data: {
        channel: "WHATSAPP",
        to: to ?? message.phone,
        subject: message.template,
        body: renderTemplate(message.template, params),
        kind: message.kind,
        orderId: message.orderId ?? null,
        status,
        error,
      },
    })
    .catch(() => undefined);
}
