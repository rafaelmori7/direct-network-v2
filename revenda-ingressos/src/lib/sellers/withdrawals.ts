import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money/fees";
import { sendEmail } from "@/lib/notify/email";
import type { PaymentProvider, TransferResult } from "@/lib/payments/provider";

/**
 * Saque automático: depois do repasse, o saldo da conta de recebimento do
 * vendedor (subconta BaaS, sem acesso ao painel do Asaas) vai por Pix para a
 * chave CPF dele. Só CPF: garante que o dinheiro sai para a mesma pessoa.
 *
 * `User.withdrawalDueAt` marca que há saque a fazer e serve de trava: a rotina
 * só pega usuários com a data vencida e empurra a data para frente ao pegar.
 */

/** Enquanto um saque está em andamento, a rotina volta a consultar depois deste intervalo. */
const RECHECK_MS = 15 * 60_000;
/** Depois de uma falha (ex.: CPF sem chave Pix), tenta de novo no dia seguinte. */
const RETRY_AFTER_FAILURE_MS = 24 * 3600_000;
/** Tarifa do Pix de saída cobrada da subconta, se houver (centavos). */
function withdrawalFeeCents(): number {
  const n = Number(process.env.WITHDRAWAL_FEE_CENTS);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export type WithdrawalOutcome = "ENVIADO" | "AGUARDANDO" | "SEM_SALDO" | "FALHOU" | "IGNORADO";

/** Marca o vendedor para sacar o saldo na próxima rodada (chamado quando um repasse conclui). */
export async function scheduleWithdrawal(userId: string, now = new Date()): Promise<void> {
  await prisma.user.updateMany({ where: { id: userId, withdrawalDueAt: null }, data: { withdrawalDueAt: now } });
}

export async function processWithdrawal(userId: string, provider: PaymentProvider, now = new Date()): Promise<WithdrawalOutcome> {
  const claimed = await prisma.user.updateMany({
    where: { id: userId, withdrawalDueAt: { lte: now } },
    data: { withdrawalDueAt: new Date(now.getTime() + RECHECK_MS) },
  });
  if (claimed.count === 0) return "IGNORADO";

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, cpf: true, verifiedAt: true, blockedAt: true, gatewayApiKeyEnc: true },
  });
  // Sem conta de recebimento aprovada (ou em desenvolvimento, sem subconta): nada a sacar.
  if (!user.verifiedAt || !user.gatewayApiKeyEnc || user.blockedAt) {
    await setDue(userId, null);
    return "IGNORADO";
  }
  const apiKey = decrypt(user.gatewayApiKeyEnc);

  // Um saque ainda em andamento: só acompanha, não abre outro.
  const open = await prisma.sellerWithdrawal.findFirst({
    where: { userId, status: { in: ["SOLICITADO", "AGUARDANDO_APROVACAO"] } },
    orderBy: { createdAt: "desc" },
  });
  if (open && !open.transferId) {
    // Registro sem transferência: a chamada ao gateway foi interrompida. Se passou
    // do tempo, encerra; como o próximo saque usa o saldo real, não paga duas vezes.
    if (now.getTime() - open.createdAt.getTime() < RECHECK_MS) return "AGUARDANDO";
    await prisma.sellerWithdrawal.update({ where: { id: open.id }, data: { status: "FALHOU", error: "Interrompido antes da resposta do gateway" } });
  } else if (open?.transferId) {
    const result = await provider.getAccountTransfer(apiKey, open.transferId);
    await saveResult(open.id, result);
    if (result.status === "SOLICITADO" || result.status === "AGUARDANDO_APROVACAO") return "AGUARDANDO";
    if (result.status === "FALHOU") return failed(userId, user, result.error ?? "Transferência recusada", now);
    await notifySent(user, open.cents);
    // Concluído: segue para ver se entrou mais saldo enquanto isso.
  }

  const balance = await provider.getAccountBalance(apiKey);
  const cents = balance - withdrawalFeeCents();
  if (cents <= 0) {
    await setDue(userId, null);
    return "SEM_SALDO";
  }

  const withdrawal = await prisma.sellerWithdrawal.create({ data: { userId, cents, pixKey: user.cpf, status: "SOLICITADO" } });
  let result: TransferResult;
  try {
    result = await provider.withdrawToPix(apiKey, {
      cents,
      cpf: user.cpf,
      externalReference: `saque-${withdrawal.id}`,
      description: "Vendas de ingressos",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.sellerWithdrawal.update({ where: { id: withdrawal.id }, data: { status: "FALHOU", error: message.slice(0, 500) } });
    return failed(userId, user, message, now);
  }
  await saveResult(withdrawal.id, result);
  if (result.status === "FALHOU") return failed(userId, user, result.error ?? "Transferência recusada", now);
  if (result.status !== "CONCLUIDO") return "AGUARDANDO";
  await notifySent(user, cents);
  await setDue(userId, null);
  return "ENVIADO";
}

/** Rotina: saques vencidos (novos, em andamento ou para tentar de novo). */
export async function processDueWithdrawals(provider: PaymentProvider, now = new Date()): Promise<number> {
  const due = await prisma.user.findMany({ where: { withdrawalDueAt: { lte: now } }, select: { id: true }, take: 50 });
  let sent = 0;
  for (const { id } of due) {
    try {
      if ((await processWithdrawal(id, provider, now)) === "ENVIADO") sent++;
    } catch {
      // Erro de rede etc.: a trava já adiou a próxima tentativa.
    }
  }
  return sent;
}

async function setDue(userId: string, at: Date | null) {
  await prisma.user.update({ where: { id: userId }, data: { withdrawalDueAt: at } });
}

async function saveResult(id: string, result: TransferResult) {
  await prisma.sellerWithdrawal.update({
    where: { id },
    data: { transferId: result.transferId || undefined, status: result.status, error: result.error?.slice(0, 500) ?? null },
  });
}

type Seller = { name: string; email: string; cpf: string };

async function failed(userId: string, user: Seller, reason: string, now: Date): Promise<WithdrawalOutcome> {
  // Avisa o vendedor só na primeira falha seguida; depois tenta todo dia em silêncio.
  const previous = await prisma.sellerWithdrawal.count({
    where: { userId, status: "FALHOU", createdAt: { gte: new Date(now.getTime() - RETRY_AFTER_FAILURE_MS * 1.5) } },
  });
  if (previous <= 1) {
    await sendEmail({
      to: user.email,
      kind: "SAQUE_FALHOU",
      subject: "Não conseguimos enviar o seu Pix",
      text:
        `Oi, ${user.name.split(" ")[0]}! Tentamos enviar o dinheiro das suas vendas por Pix para a chave CPF ${formatCpfKey(user.cpf)}, mas não deu certo.\n` +
        `Confira se o seu CPF está cadastrado como chave Pix no seu banco. Tentamos de novo automaticamente a cada 24 horas; o dinheiro continua guardado na sua conta de recebimento.\n\n` +
        `Detalhe: ${reason.slice(0, 200)}`,
    });
  }
  await setDue(userId, new Date(now.getTime() + RETRY_AFTER_FAILURE_MS));
  return "FALHOU";
}

async function notifySent(user: Seller, cents: number) {
  await sendEmail({
    to: user.email,
    kind: "SAQUE_ENVIADO",
    subject: `Pix de ${formatBRL(cents)} enviado`,
    text: `Oi, ${user.name.split(" ")[0]}! Enviamos ${formatBRL(cents)} das suas vendas por Pix para a chave CPF ${formatCpfKey(user.cpf)}.`,
  });
}

function formatCpfKey(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : cpf;
}
