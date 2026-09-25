import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { formatCpf } from "@/lib/auth/cpf";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { blockUser, setVerified, unblockUser } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; filtro?: string }> }) {
  const admin = await requireAdminPage("/admin/usuarios");
  const { q = "", filtro = "" } = await searchParams;
  const digits = q.replace(/\D/g, "");
  const where: Prisma.UserWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        ...(digits.length >= 3 ? [{ cpf: { contains: digits } }] : []),
      ],
    }),
    ...(filtro === "pendentes" && { verifiedAt: null, blockedAt: null, gatewayAccountId: { not: null } }),
    ...(filtro === "bloqueados" && { blockedAt: { not: null } }),
    ...(filtro === "saque" && { withdrawals: { some: { status: "FALHOU" } }, withdrawalDueAt: { not: null } }),
  };
  const users = await prisma.user.findMany({
    where,
    include: { _count: { select: { listings: true, orders: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="form-page" style={{ maxWidth: 960 }}>
      <Link href="/admin" className="back">
        ← Painel
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Usuários
      </h1>
      <form className="search" action="/admin/usuarios" role="search">
        <input name="q" defaultValue={q} placeholder="Nome, e-mail ou CPF" aria-label="Buscar usuários" />
        {filtro && <input type="hidden" name="filtro" value={filtro} />}
      </form>
      <nav className="chips">
        {[
          ["", "Todos"],
          ["pendentes", "Verificação pendente"],
          ["bloqueados", "Bloqueados"],
          ["saque", "Pix com falha"],
        ].map(([value, label]) => (
          <Link key={value} href={`/admin/usuarios?${new URLSearchParams({ ...(q && { q }), ...(value && { filtro: value }) })}`} className={`chip ${filtro === value ? "chip-active" : ""}`}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="offers">
        {users.length === 0 && <p className="empty">Nenhum usuário encontrado.</p>}
        {users.map((u) => (
          <article className="offer" key={u.id}>
            <div>
              <div className="tag-row">
                {u.blockedAt ? (
                  <span className="type-badge" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>Bloqueado</span>
                ) : u.verifiedAt ? (
                  <span className="type-badge" style={{ background: "var(--safe-soft)", color: "var(--safe)" }}>Recebimento aprovado</span>
                ) : u.gatewayAccountId ? (
                  <span className="type-badge">Cadastro em análise</span>
                ) : (
                  <span className="type-badge">Só compra</span>
                )}
                {u.isAdmin && <span className="type-badge">Admin</span>}
              </div>
              <h3 style={{ marginTop: 6 }}>{u.name}</h3>
              <div className="offer-sub">
                {u.email} · CPF {formatCpf(u.cpf)} · desde {formatDateTime(u.createdAt)}
              </div>
              <div className="offer-sub">
                {u._count.listings} anúncios · {u._count.orders} compras
                {u.blockedReason && ` · bloqueio: ${u.blockedReason}`}
              </div>
            </div>
            <div className="offer-side" style={{ gap: 6 }}>
              {!u.blockedAt && (
                <form action={setVerified.bind(null, u.id, !u.verifiedAt)}>
                  <button className={`btn ${u.verifiedAt ? "btn-outline" : "btn-primary"}`}>{u.verifiedAt ? "Remover aprovação" : "Aprovar recebimento"}</button>
                </form>
              )}
              {u.id !== admin.id &&
                (u.blockedAt ? (
                  <form action={unblockUser.bind(null, u.id)}>
                    <button className="btn btn-outline">Desbloquear</button>
                  </form>
                ) : (
                  <form action={blockUser.bind(null, u.id)} style={{ display: "flex", gap: 6 }}>
                    <input name="motivo" className="input" placeholder="Motivo do bloqueio" style={{ height: 42, width: 170 }} required />
                    <button className="btn btn-outline" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
                      Bloquear
                    </button>
                  </form>
                ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
