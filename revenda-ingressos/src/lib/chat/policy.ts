import type { OrderStatus } from "@/lib/orders/state-machine";

export type ChatRole = "COMPRADOR" | "VENDEDOR" | "ADMIN";

/**
 * O chat abre só depois do pagamento confirmado: antes disso não existe
 * negociação, o que evita combinar pagamento por fora. Depois que o pedido
 * termina, a conversa fica só para leitura (prova em disputas).
 */
const OPEN_STATUSES: ReadonlySet<OrderStatus> = new Set(["PAGO", "TRANSFERIDO", "RECEBIDO", "EM_DISPUTA"]);

export function canSendMessage(status: OrderStatus, role: ChatRole): boolean {
  if (role === "ADMIN") return status !== "AGUARDANDO_PAGAMENTO" && status !== "CANCELADO";
  return OPEN_STATUSES.has(status);
}

export function canReadChat(status: OrderStatus): boolean {
  return status !== "AGUARDANDO_PAGAMENTO" && status !== "CANCELADO";
}

export const MAX_MESSAGE_LENGTH = 1000;

const BLOCKED_PATTERNS: { reason: string; pattern: RegExp }[] = [
  { reason: "telefone", pattern: /(?:\+?55[\s-]?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s.-]?\d{4}\b/ },
  { reason: "e-mail", pattern: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  { reason: "link", pattern: /\bhttps?:\/\/|\bwww\.|\b[\w-]+\.(?:com|br|me|net|ly|io|link)\b/i },
  { reason: "CPF/CNPJ", pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/ },
  {
    reason: "contato ou pagamento fora da plataforma",
    // "paguei o pix" é normal; "manda um pix", "chave pix" e "por fora" não.
    pattern:
      /\b(?:por fora|fora d[ao] (?:site|plataforma)|whats(?:app)?|wpp|zap|telegram|insta(?:gram)?|me chama|meu n[uú]mero|chave pix|(?:manda|mande|faz|faça|fa[cç]o|passa|passo)r? (?:um |o )?pix)\b/i,
  },
];

export type ScreenResult = { ok: true; body: string } | { ok: false; reasons: string[] };

/**
 * Bloqueia mensagens com contato ou dados de pagamento. O golpe mais comum em
 * grupo é "me paga por fora que sai mais barato": fora da plataforma não há garantia.
 */
export function screenMessage(raw: string): ScreenResult {
  const body = raw.trim();
  if (!body) return { ok: false, reasons: ["mensagem vazia"] };
  if (body.length > MAX_MESSAGE_LENGTH) return { ok: false, reasons: [`máximo de ${MAX_MESSAGE_LENGTH} caracteres`] };
  const reasons = BLOCKED_PATTERNS.filter(({ pattern }) => pattern.test(body)).map(({ reason }) => reason);
  return reasons.length > 0 ? { ok: false, reasons } : { ok: true, body };
}

export const BLOCKED_MESSAGE_WARNING =
  "Por segurança, não é permitido trocar telefone, e-mail, links ou combinar pagamento fora da plataforma. " +
  "Negociações por fora não têm garantia de reembolso.";

/** Respostas rápidas mostradas como botões no chat. */
export const QUICK_REPLIES: Record<"COMPRADOR" | "VENDEDOR", string[]> = {
  COMPRADOR: [
    "Oi! Já consegue fazer a transferência?",
    "Os dados para a transferência estão na tela do pedido.",
    "Recebi, deu tudo certo. Obrigado!",
    "Ainda não apareceu na minha carteira do app.",
  ],
  VENDEDOR: [
    "Oi! Vou transferir agora.",
    "Transferi! Confere no app e aceita a transferência, por favor.",
    "A transferência só abre na data definida pela ticketeira, faço assim que liberar.",
  ],
};

/** Mensagem automática postada no chat a cada mudança de status. */
export const SYSTEM_MESSAGES: Partial<Record<OrderStatus, string>> = {
  PAGO: "Pagamento confirmado e retido com segurança. Vendedor: transfira o ingresso pelo app oficial dentro do prazo.",
  TRANSFERIDO: "O vendedor marcou o ingresso como transferido. Comprador: confira no app oficial e confirme o recebimento.",
  RECEBIDO: "O comprador confirmou o recebimento. O pagamento será liberado após o evento.",
  EM_DISPUTA: "Uma disputa foi aberta. Nossa equipe vai analisar esta conversa e o histórico do pedido.",
  LIBERADO: "Pagamento liberado ao vendedor. Pedido concluído.",
  REEMBOLSADO: "O valor foi devolvido ao comprador. Pedido encerrado.",
};
