import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldIcon } from "@/components/chrome";
import { requireUser } from "@/lib/auth/session";
import { getEvent, rulesFor } from "@/lib/data/repo";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { TICKET_TYPE_LABEL, formatDateLong, formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import type { OrderStatus } from "@/lib/orders/state-machine";
import type { BuyerIdentifier } from "@/lib/rules/types";
import { confirmReceipt, decideDispute, markTransferred, openDispute, simulatePayment } from "./actions";
import { DisputeDecisionForm, DisputeForm, ReceiptChecklist, SimpleActionButton } from "./order-actions";
import { OrderChat } from "./chat";
import { sendMessage } from "./chat-actions";
import { QUICK_REPLIES, canReadChat, canSendMessage } from "@/lib/chat/policy";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<OrderStatus, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago · aguardando transferência",
  TRANSFERIDO: "Transferido · confira no app",
  RECEBIDO: "Recebido · pagamento retido até o evento",
  EM_DISPUTA: "Em análise pela equipe",
  LIBERADO: "Concluído",
  REEMBOLSADO: "Reembolsado",
  CANCELADO: "Cancelado",
};

const IDENTIFIER_LABEL: Record<BuyerIdentifier, string> = {
  EMAIL: "E-mail",
  CPF: "CPF",
  NOME_COMPLETO: "Nome completo",
  QUENTRO_ID: "Quentro ID",
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/pedidos/${id}`);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { listing: { include: { seller: { select: { name: true } } } }, buyer: { select: { name: true } }, logs: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const isBuyer = order.buyerId === user.id;
  const isSeller = order.listing.sellerId === user.id;
  if (!isBuyer && !isSeller && !user.isAdmin) notFound();

  const event = await getEvent(order.listing.eventId);
  if (!event) notFound();
  const rules = rulesFor(event);
  const identifiers = order.buyerIdentifiers as Partial<Record<BuyerIdentifier, string>>;
  const provider = getPaymentProvider();
  const isMock = provider.kind === "mock" || (provider as { isSandbox?: boolean }).isSandbox === true;
  const messages = await prisma.message.findMany({
    where: { orderId: order.id, ...(user.isAdmin ? {} : { kind: { not: "BLOQUEADA" } }) },
    orderBy: { createdAt: "asc" },
  });
  const chatRole = isBuyer ? "COMPRADOR" : isSeller ? "VENDEDOR" : "ADMIN";
  const canDispute = ["PAGO", "TRANSFERIDO", "RECEBIDO"].includes(order.status) && new Date() <= order.disputeDeadlineAt;

  return (
    <main className="form-page">
      <Link href={isSeller ? "/conta" : `/evento/${event.slug}`} className="back">
        ← {isSeller ? "Minha conta" : event.name}
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Pedido
      </h1>
      <p className="page-sub">
        <span className="type-badge">{STATUS_LABEL[order.status]}</span>
      </p>

      <div className="aside-card" style={{ marginBottom: 20 }}>
        <div className="aside-head">
          {event.name} · {formatDateLong(event.startsAt)}
        </div>
        <div className="aside-body summary">
          <div className="summary-row">
            <span>
              {order.quantity}× {order.listing.sector} · {TICKET_TYPE_LABEL[order.listing.ticketType]}
            </span>
            <b>{formatBRL(order.totalCents)}</b>
          </div>
          {order.discountCents > 0 && (isBuyer || user.isAdmin) && (
            <div className="summary-row offer-sub">
              <span>Desconto do cupom (já aplicado)</span>
              <span>− {formatBRL(order.discountCents)}</span>
            </div>
          )}
          {user.isAdmin && order.partnerId && (
            <div className="summary-row offer-sub">
              <span>Parceiro ({order.partnerAttribution?.toLowerCase()})</span>
              <span>{formatBRL(order.partnerFeeCents)}</span>
            </div>
          )}
          {isSeller && (
            <>
              <div className="summary-row offer-sub">
                <span>Comissão</span>
                <span>− {formatBRL(order.platformFeeCents)}</span>
              </div>
              <div className="summary-row">
                <span>Você recebe</span>
                <b>{formatBRL(order.sellerNetCents)}</b>
              </div>
            </>
          )}
          <div className="summary-row offer-sub">
            <span>{isSeller ? "Comprador" : "Vendedor"}</span>
            <span>{(isSeller ? order.buyer.name : order.listing.seller.name).split(" ")[0]}</span>
          </div>
          {order.status !== "AGUARDANDO_PAGAMENTO" && order.status !== "CANCELADO" && (
            <div className="summary-row offer-sub">
              <span>Liberação ao vendedor</span>
              <span>{formatDateTime(order.releaseAt)}, se não houver disputa</span>
            </div>
          )}
        </div>
      </div>

      <div className="form">
        {order.status === "AGUARDANDO_PAGAMENTO" && isBuyer && (
          <>
            <div className="notice notice-warn">
              <div>
                <b>Pague até {formatDateTime(order.paymentExpiresAt)}</b>
                Os ingressos ficam reservados para você até lá. Use uma conta no <b>seu CPF</b>: Pix de outra pessoa é devolvido.
              </div>
            </div>
            {order.pixCopyPaste && (
              <div className="field">
                <span className="label">Pix copia e cola</span>
                <div className="pix-code">{order.pixCopyPaste}</div>
              </div>
            )}
            {isMock && <SimpleActionButton action={simulatePayment.bind(null, order.id)} label="Simular pagamento (modo teste)" variant="outline" />}
          </>
        )}
        {order.status === "AGUARDANDO_PAGAMENTO" && isSeller && (
          <div className="notice notice-warn">
            <div>
              <b>Aguardando o comprador pagar</b>Você será avisado assim que o Pix for confirmado.
            </div>
          </div>
        )}

        {order.status === "PAGO" && isSeller && (
          <>
            <div className="notice notice-safe">
              <ShieldIcon />
              <div>
                <b>Pagamento confirmado e retido. Transfira até {order.transferDeadlineAt && formatDateTime(order.transferDeadlineAt)}</b>
                {rules.transferInstructions}
              </div>
            </div>
            <div className="aside-card">
              <div className="aside-head">Dados do comprador para a transferência</div>
              <div className="aside-body summary">
                {Object.entries(identifiers).map(([key, value]) => (
                  <div className="summary-row" key={key}>
                    <span className="offer-sub">{IDENTIFIER_LABEL[key as BuyerIdentifier]}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            </div>
            <SimpleActionButton action={markTransferred.bind(null, order.id)} label="Já transferi pelo app oficial" />
          </>
        )}
        {order.status === "PAGO" && isBuyer && (
          <div className="notice notice-safe">
            <ShieldIcon />
            <div>
              <b>Pagamento confirmado</b>O vendedor tem até {order.transferDeadlineAt && formatDateTime(order.transferDeadlineAt)} para
              transferir pelo app {event.platformName}. Se não transferir, você recebe o dinheiro de volta automaticamente.
            </div>
          </div>
        )}

        {order.status === "TRANSFERIDO" && isBuyer && (
          <>
            <div className="notice notice-safe">
              <div>
                <b>O vendedor informou que transferiu</b>Abra o app {event.platformName}, aceite a transferência se for pedido e confirme abaixo.
              </div>
            </div>
            <ReceiptChecklist action={confirmReceipt.bind(null, order.id)} items={rules.receiptChecklist} />
          </>
        )}
        {order.status === "TRANSFERIDO" && isSeller && (
          <div className="notice notice-safe">
            <div>
              <b>Aguardando o comprador conferir</b>O pagamento será liberado em {formatDateTime(order.releaseAt)}, se não houver disputa.
            </div>
          </div>
        )}

        {order.status === "RECEBIDO" && (
          <div className="notice notice-safe">
            <ShieldIcon />
            <div>
              <b>Ingresso entregue</b>
              {isSeller
                ? `Seu pagamento será liberado em ${formatDateTime(order.releaseAt)}, se não houver disputa.`
                : "Aproveite o evento! Se tiver problema na entrada, abra uma disputa até 48h depois do fim do evento."}
            </div>
          </div>
        )}

        {order.status === "EM_DISPUTA" && (
          <div className="notice notice-warn">
            <div>
              <b>Disputa aberta</b>Nossa equipe está analisando o histórico do pedido. O dinheiro continua retido até a decisão.
            </div>
          </div>
        )}

        {order.refundStatus !== "NENHUM" && (isBuyer || user.isAdmin) && (
          <div className={`notice ${order.refundStatus === "CONCLUIDO" ? "notice-safe" : "notice-warn"}`}>
            <div>
              <b>{order.refundStatus === "CONCLUIDO" ? "Dinheiro devolvido" : "Devolução em andamento"}</b>
              {order.refundStatus === "CONCLUIDO"
                ? `Devolvemos ${formatBRL(order.totalCents)} para a conta que fez o Pix.`
                : `Vamos devolver ${formatBRL(order.totalCents)} para a conta que fez o Pix. Você será avisado quando o valor for devolvido.`}
            </div>
          </div>
        )}

        {order.status === "EM_DISPUTA" && user.isAdmin && (
          <DisputeDecisionForm
            action={decideDispute.bind(null, order.id)}
            reason={(await prisma.dispute.findFirst({ where: { orderId: order.id, resolvedAt: null } }))?.reason ?? null}
          />
        )}

        {canDispute && (isBuyer || isSeller) && <DisputeForm action={openDispute.bind(null, order.id)} />}

        {canReadChat(order.status) && (
          <OrderChat
            messages={messages.map((m) => ({
              id: m.id,
              role: m.role,
              kind: m.kind,
              body: m.body,
              mine: m.senderId === user.id,
              time: formatDateTime(m.createdAt),
            }))}
            canSend={canSendMessage(order.status, chatRole)}
            quickReplies={chatRole === "ADMIN" ? [] : QUICK_REPLIES[chatRole]}
            action={sendMessage.bind(null, order.id)}
          />
        )}

        <div className="aside-card">
          <div className="aside-head">Histórico</div>
          <div className="aside-body">
            <div className="wanted-item">
              <span>Pedido criado</span>
              <span className="offer-sub">{formatDateTime(order.createdAt)}</span>
            </div>
            {order.logs.map((log) => (
              <div className="wanted-item" key={log.id}>
                <span>{STATUS_LABEL[log.toStatus]}</span>
                <span className="offer-sub">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
