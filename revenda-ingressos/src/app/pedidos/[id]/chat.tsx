"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import type { ChatState } from "./chat-actions";

export interface ChatMessage {
  id: string;
  role: string;
  kind: "USUARIO" | "SISTEMA" | "BLOQUEADA";
  body: string;
  mine: boolean;
  time: string;
}

const ROLE_LABEL: Record<string, string> = { COMPRADOR: "Comprador", VENDEDOR: "Vendedor", ADMIN: "Equipe", SISTEMA: "Aviso" };
const POLL_MS = 8000;

export function OrderChat({
  messages,
  canSend,
  quickReplies,
  action,
}: {
  messages: ChatMessage[];
  canSend: boolean;
  quickReplies: string[];
  action: (prev: ChatState, form: FormData) => Promise<ChatState>;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, { warning: null, sentAt: 0 });
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Atualiza a conversa periodicamente enquanto a página está aberta.
  useEffect(() => {
    if (!canSend) return;
    const timer = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [canSend, router]);

  useEffect(() => {
    if (state.sentAt) setText("");
  }, [state.sentAt]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  return (
    <div className="aside-card">
      <div className="aside-head">Conversa do pedido</div>
      <div className="aside-body">
        <div className="chat-list" ref={listRef}>
          {messages.length === 0 && <p className="offer-sub" style={{ margin: 0 }}>Nenhuma mensagem ainda.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`chat-msg ${m.kind === "SISTEMA" ? "chat-system" : m.mine ? "chat-mine" : "chat-theirs"} ${m.kind === "BLOQUEADA" ? "chat-blocked" : ""}`}>
              {m.kind !== "SISTEMA" && (
                <span className="chat-author">
                  {ROLE_LABEL[m.role] ?? m.role}
                  {m.kind === "BLOQUEADA" && " · bloqueada (só a equipe vê)"}
                </span>
              )}
              <span>{m.body}</span>
              <span className="chat-time">{m.time}</span>
            </div>
          ))}
        </div>

        {canSend ? (
          <form action={formAction} className="form" style={{ gap: 10, marginTop: 12 }}>
            {state.warning && (
              <div className="notice notice-danger" role="alert">
                <div>{state.warning}</div>
              </div>
            )}
            <div className="chips" style={{ padding: 0 }}>
              {quickReplies.map((q) => (
                <button type="button" key={q} className="chip" onClick={() => setText(q)}>
                  {q}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                name="mensagem"
                className="input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva uma mensagem"
                maxLength={1000}
                autoComplete="off"
              />
              <button className="btn btn-primary" disabled={pending || !text.trim()}>
                Enviar
              </button>
            </div>
            <span className="hint">Não troque telefone, e-mail ou links. Pagamentos por fora não têm garantia.</span>
          </form>
        ) : (
          <p className="hint" style={{ margin: "12px 0 0" }}>
            O chat abre depois do pagamento e fica só para leitura quando o pedido termina.
          </p>
        )}
      </div>
    </div>
  );
}
