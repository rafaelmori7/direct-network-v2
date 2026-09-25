import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money/fees";
import { sendEmail } from "@/lib/notify/email";
import type { PaymentProvider, TransferResult } from "@/lib/payments/provider";

/**
 * Saque automático: depois do repasse, o saldo da conta de recebimento (subconta
 * BaaS, sem acesso ao painel do Asaas) vai por Pix para a chave do próprio
 * titular: CPF do vendedor ou CNPJ da agência. Só essas chaves garantem que o
 * dinheiro sai para a mesma pessoa/empresa.
 *
 * `withdrawalDueAt` (em User e Partner) marca que há saque a fazer e serve de
 * trava: a rotina só pega quem está com a data vencida e empurra a data ao pegar.
 *
 * Testado no sandbox (25/09/2026): a chave da subconta pode sacar, mas o saque
 * fica PENDING / authorized: false esperando o token SMS enviado ao celular da
 * subconta (o do titular). Para o saque sair sozinho, o Asaas precisa ligar a
 * validação de saque por webhook (`/api/webhooks/asaas/saques`). Sem ela, o saque
 * parado é cancelado depois de AUTHORIZATION_TIMEOUT_MS e o admin vê a falha.
 */

export type WithdrawalOwner = { kind: "user"; id: string } | { kind: "partner"; id: string };

/** Enquanto um saque está em andamento, a rotina volta a consultar depois deste intervalo. */
const RECHECK_MS = 15 * 60_000;
/** Depois de uma falha (ex.: CPF/CNPJ sem chave Pix), tenta de novo no dia seguinte. */
const RETRY_AFTER_FAILURE_MS = 24 * 3600_000;
/**
 * Saque esperando autorização além disso é cancelado (o valor volta à subconta).
 * Com a validação por webhook o Asaas decide em segundos; sem ela, ninguém autoriza.
 */
const AUTHORIZATION_TIMEOUT_MS = 60 * 60_000;
const AUTHORIZATION_ERROR =
  "Cancelado: o saque esperava a autorização por token SMS da conta de recebimento. Peça ao Asaas para ligar a validação de saque por webhook.";
/** Tarifa do Pix de saída cobrada da subconta, se houver (centavos). */
function withdrawalFeeCents(): number {
  const n = Number(process.env.WITHDRAWAL_FEE_CENTS);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export type WithdrawalOutcome = "ENVIADO" | "AGUARDANDO" | "SEM_SALDO" | "FALHOU" | "IGNORADO";

/** Agenda o saque do saldo na próxima rodada (chamado quando um repasse conclui). */
export async function scheduleWithdrawal(owner: WithdrawalOwner, now = new Date()): Promise<void> {
  const args = { where: { id: owner.id, withdrawalDueAt: null }, data: { withdrawalDueAt: now } };
  if (owner.kind === "user") await prisma.user.updateMany(args);
  else await prisma.partner.updateMany(args);
}

interface Holder {
  firstName: string;
  email: string | null;
  pixKey: string;
  pixKeyType: "CPF" | "CNPJ";
  /** Conta aprovada, com chave da subconta e não bloqueada. */
  apiKeyEnc: string | null;
}

async function loadHolder(owner: WithdrawalOwner): Promise<Holder | null> {
  if (owner.kind === "user") {
    const u = await prisma.user.findUniqueOrThrow({
      where: { id: owner.id },
      select: { name: true, email: true, cpf: true, verifiedAt: true, blockedAt: true, gatewayApiKeyEnc: true },
    });
    const ok = u.verifiedAt && !u.blockedAt && u.gatewayApiKeyEnc;
    return { firstName: u.name.split(" ")[0], email: u.email, pixKey: u.cpf, pixKeyType: "CPF", apiKeyEnc: ok ? u.gatewayApiKeyEnc : null };
  }
  const p = await prisma.partner.findUniqueOrThrow({
    where: { id: owner.id },
    select: { name: true, payoutEmail: true, cnpj: true, gatewayAccountStatus: true, gatewayApiKeyEnc: true },
  });
  if (!p.cnpj) return null;
  const ok = p.gatewayAccountStatus === "APROVADA" && p.gatewayApiKeyEnc;
  return { firstName: p.name, email: p.payoutEmail, pixKey: p.cnpj, pixKeyType: "CNPJ", apiKeyEnc: ok ? p.gatewayApiKeyEnc : null };
}

async function setDue(owner: WithdrawalOwner, at: Date | null) {
  if (owner.kind === "user") await prisma.user.update({ where: { id: owner.id }, data: { withdrawalDueAt: at } });
  else await prisma.partner.update({ where: { id: owner.id }, data: { withdrawalDueAt: at } });
}

const ownerWhere = (owner: WithdrawalOwner) => (owner.kind === "user" ? { userId: owner.id } : { partnerId: owner.id });

export async function processWithdrawal(owner: WithdrawalOwner, provider: PaymentProvider, now = new Date()): Promise<WithdrawalOutcome> {
  const claimArgs = {
    where: { id: owner.id, withdrawalDueAt: { lte: now } },
    data: { withdrawalDueAt: new Date(now.getTime() + RECHECK_MS) },
  };
  const claimed = owner.kind === "user" ? await prisma.user.updateMany(claimArgs) : await prisma.partner.updateMany(claimArgs);
  if (claimed.count === 0) return "IGNORADO";

  const holder = await loadHolder(owner);
  // Sem conta de recebimento aprovada (ou agência que recebe na própria conta Asaas): nada a sacar.
  if (!holder?.apiKeyEnc) {
    await setDue(owner, null);
    return "IGNORADO";
  }
  const apiKey = decrypt(holder.apiKeyEnc);

  // Um saque ainda em andamento: só acompanha, não abre outro.
  const open = await prisma.withdrawal.findFirst({
    where: { ...ownerWhere(owner), status: { in: ["SOLICITADO", "AGUARDANDO_APROVACAO"] } },
    orderBy: { createdAt: "desc" },
  });
  if (open && !open.transferId) {
    // Registro sem transferência: a chamada ao gateway foi interrompida. Se passou
    // do tempo, encerra; como o próximo saque usa o saldo real, não paga duas vezes.
    if (now.getTime() - open.createdAt.getTime() < RECHECK_MS) return "AGUARDANDO";
    await prisma.withdrawal.update({ where: { id: open.id }, data: { status: "FALHOU", error: "Interrompido antes da resposta do gateway" } });
  } else if (open?.transferId) {
    let result = await provider.getAccountTransfer(apiKey, open.transferId);
    const unauthorized = result.status === "AGUARDANDO_APROVACAO" && now.getTime() - open.createdAt.getTime() >= AUTHORIZATION_TIMEOUT_MS;
    if (unauthorized) result = { ...(await provider.cancelAccountTransfer(apiKey, open.transferId)), error: AUTHORIZATION_ERROR };
    await saveResult(open.id, result);
    if (result.status === "SOLICITADO" || result.status === "AGUARDANDO_APROVACAO") return "AGUARDANDO";
    if (result.status === "FALHOU") return failed(owner, holder, result.error ?? "Transferência recusada", now, { notify: !unauthorized });
    await notifySent(holder, open.cents);
    // Concluído: segue para ver se entrou mais saldo enquanto isso.
  }

  const balance = await provider.getAccountBalance(apiKey);
  const cents = balance - withdrawalFeeCents();
  if (cents <= 0) {
    await setDue(owner, null);
    return "SEM_SALDO";
  }

  const withdrawal = await prisma.withdrawal.create({
    data: { ...ownerWhere(owner), cents, pixKey: holder.pixKey, pixKeyType: holder.pixKeyType, status: "SOLICITADO", createdAt: now },
  });
  let result: TransferResult;
  try {
    result = await provider.withdrawToPix(apiKey, {
      cents,
      pixKey: holder.pixKey,
      pixKeyType: holder.pixKeyType,
      externalReference: `saque-${withdrawal.id}`,
      description: owner.kind === "user" ? "Vendas de ingressos" : "Comissões de parceiro",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.withdrawal.update({ where: { id: withdrawal.id }, data: { status: "FALHOU", error: message.slice(0, 500) } });
    return failed(owner, holder, message, now);
  }
  await saveResult(withdrawal.id, result);
  if (result.status === "FALHOU") return failed(owner, holder, result.error ?? "Transferência recusada", now);
  if (result.status !== "CONCLUIDO") return "AGUARDANDO";
  await notifySent(holder, cents);
  await setDue(owner, null);
  return "ENVIADO";
}

/** Rotina: saques vencidos (novos, em andamento ou para tentar de novo), de vendedores e agências. */
export async function processDueWithdrawals(provider: PaymentProvider, now = new Date()): Promise<number> {
  const due = { where: { withdrawalDueAt: { lte: now } }, select: { id: true }, take: 50 };
  const owners: WithdrawalOwner[] = [
    ...(await prisma.user.findMany(due)).map(({ id }) => ({ kind: "user" as const, id })),
    ...(await prisma.partner.findMany(due)).map(({ id }) => ({ kind: "partner" as const, id })),
  ];
  let sent = 0;
  for (const owner of owners) {
    try {
      if ((await processWithdrawal(owner, provider, now)) === "ENVIADO") sent++;
    } catch {
      // Erro de rede etc.: a trava já adiou a próxima tentativa.
    }
  }
  return sent;
}

async function saveResult(id: string, result: TransferResult) {
  await prisma.withdrawal.update({
    where: { id },
    data: { transferId: result.transferId || undefined, status: result.status, error: result.error?.slice(0, 500) ?? null },
  });
}

async function failed(owner: WithdrawalOwner, holder: Holder, reason: string, now: Date, opts = { notify: true }): Promise<WithdrawalOutcome> {
  // Avisa só na primeira falha seguida; depois tenta todo dia em silêncio.
  // Falha de autorização não é culpa do titular: só o admin vê, e ela não conta
  // como aviso já dado (senão a primeira falha de chave Pix passaria em silêncio).
  const recent = await prisma.withdrawal.count({
    where: {
      ...ownerWhere(owner),
      status: "FALHOU",
      createdAt: { gte: new Date(now.getTime() - RETRY_AFTER_FAILURE_MS * 1.5) },
      OR: [{ error: null }, { NOT: { error: AUTHORIZATION_ERROR } }],
    },
  });
  if (opts.notify && recent <= 1 && holder.email) {
    await sendEmail({
      to: holder.email,
      kind: "SAQUE_FALHOU",
      subject: "Não conseguimos enviar o seu Pix",
      text:
        `Oi, ${holder.firstName}! Tentamos enviar o seu saldo por Pix para a chave ${holder.pixKeyType} ${maskKey(holder)}, mas não deu certo.\n` +
        `Confira se o ${holder.pixKeyType} está cadastrado como chave Pix no seu banco. Tentamos de novo automaticamente a cada 24 horas; o dinheiro continua guardado na sua conta de recebimento.\n\n` +
        `Detalhe: ${gatewayMessage(reason).slice(0, 200)}`,
    });
  }
  await setDue(owner, new Date(now.getTime() + RETRY_AFTER_FAILURE_MS));
  return "FALHOU";
}

async function notifySent(holder: Holder, cents: number) {
  if (!holder.email) return;
  await sendEmail({
    to: holder.email,
    kind: "SAQUE_ENVIADO",
    subject: `Pix de ${formatBRL(cents)} enviado`,
    text: `Oi, ${holder.firstName}! Enviamos ${formatBRL(cents)} por Pix para a chave ${holder.pixKeyType} ${maskKey(holder)}.`,
  });
}

/** "Asaas POST /transfers falhou: 400 {...\"description\":\"A chave informada não foi encontrada.\"}" → só a descrição. */
function gatewayMessage(reason: string): string {
  const m = /"description"\s*:\s*"([^"]+)"/.exec(reason);
  return m ? m[1] : reason;
}

function maskKey(holder: Holder): string {
  const d = holder.pixKey.replace(/\D/g, "");
  if (holder.pixKeyType === "CPF" && d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
  if (holder.pixKeyType === "CNPJ" && d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return holder.pixKey;
}
