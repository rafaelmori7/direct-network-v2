import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { ENVIADO: "Enviado", REGISTRADO: "Só registrado (sem provedor)", FALHOU: "Falhou" } as const;

export default async function AdminEmails() {
  await requireAdminPage("/admin/emails");
  const emails = await prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const configured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  return (
    <main className="form-page" style={{ maxWidth: 900 }}>
      <Link href="/admin" className="back">
        ← Painel
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        E-mails
      </h1>
      {!configured && (
        <div className="notice notice-warn" style={{ marginBottom: 16 }}>
          <div>
            <b>Envio desligado</b>Configure RESEND_API_KEY e EMAIL_FROM para os e-mails saírem de verdade. Até lá, eles ficam só
            registrados aqui.
          </div>
        </div>
      )}
      <div className="offers">
        {emails.length === 0 && <p className="empty">Nenhum e-mail ainda.</p>}
        {emails.map((e) => (
          <details key={e.id} className="offer" style={{ display: "block" }}>
            <summary style={{ cursor: "pointer" }}>
              <span className="type-badge">{STATUS_LABEL[e.status]}</span> <b>{e.subject}</b>
              <div className="offer-sub">
                Para {e.to} · {formatDateTime(e.createdAt)} · {e.kind}
                {e.error && ` · erro: ${e.error}`}
              </div>
            </summary>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "12px 0 0" }}>{e.body}</pre>
          </details>
        ))}
      </div>
    </main>
  );
}
