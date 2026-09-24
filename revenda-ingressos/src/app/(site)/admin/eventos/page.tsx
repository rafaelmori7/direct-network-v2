import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { saleState } from "@/lib/data/event-status";
import { listEvents } from "@/lib/data/repo";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATE_LABEL = { ABERTA: "Vendendo", EM_BREVE: "Abre em breve", ENCERRADA: "Encerrada", BLOQUEADA: "Bloqueada" } as const;

export default async function AdminEvents() {
  await requireAdminPage("/admin/eventos");
  const events = await listEvents();
  return (
    <main className="form-page" style={{ maxWidth: 900 }}>
      <Link href="/admin" className="back">
        ← Painel
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Eventos
        </h1>
        <Link href="/admin/eventos/novo" className="btn btn-primary">
          Novo evento
        </Link>
      </div>
      <div className="offers" style={{ marginTop: 20 }}>
        {events.map((e) => {
          const state = saleState(e);
          return (
            <Link key={e.id} href={`/admin/eventos/${e.id}`} className="offer">
              <div>
                <span className="type-badge">{STATE_LABEL[state.kind]}</span>
                <h3 style={{ marginTop: 6 }}>{e.name}</h3>
                <div className="offer-sub">
                  {formatDateTime(e.startsAt)} · {e.platformName}
                  {e.transferEndsAt && ` · transferência até ${formatDateTime(e.transferEndsAt)}`}
                </div>
                {state.kind === "BLOQUEADA" && <div className="offer-sub">{state.reason}</div>}
              </div>
              <span className="offer-sub">Editar →</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
