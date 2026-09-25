import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { signOut } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { PLATFORMS } from "@/lib/platforms/profiles";
import type { PlatformCode } from "@/lib/rules/types";

export function ShieldIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="logo" aria-label={`${BRAND.name} — início`}>
          <span className="logo-mark">
            <ShieldIcon size={18} />
          </span>
          {BRAND.name}
        </Link>
        <span className="header-guarantee">
          <ShieldIcon /> Pagamento protegido até o fim do evento
        </span>
        <nav className="header-nav">
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="header-link">
                  Painel
                </Link>
              )}
              {user.partner && (
                <Link href="/parceiro" className="header-link">
                  {user.partner.name}
                </Link>
              )}
              <Link href="/conta" className="header-link">
                {user.name.split(" ")[0]}
              </Link>
              <form action={signOut}>
                <button className="header-link header-link-button">Sair</button>
              </form>
            </>
          ) : (
            <Link href="/entrar" className="header-link">
              Entrar
            </Link>
          )}
          <Link href="/anunciar" className="btn btn-primary">
            <span>
              Vender<span className="hide-mobile"> meu ingresso</span>
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <nav className="footer-links">
          <Link href="/como-funciona">Como funciona</Link>
          <Link href="/termos">Termos de uso</Link>
          <Link href="/privacidade">Privacidade</Link>
        </nav>
        {BRAND.name} é um intermediador independente de revenda entre pessoas. Não somos parceiros das ticketeiras
        citadas; os ingressos são transferidos pelos apps oficiais delas.
      </div>
    </footer>
  );
}

export function PlatformTag({ platform }: { platform: PlatformCode }) {
  return <span className="platform-tag">Transferência oficial · {PLATFORMS[platform].name}</span>;
}

/** Cartaz provisório gerado a partir do nome, até termos a imagem do evento. */
export function PosterArt({ hue, children }: { hue: number; children?: React.ReactNode }) {
  const background = `radial-gradient(120% 80% at 20% 10%, hsl(${(hue + 40) % 360} 90% 62%) 0%, transparent 60%),
    radial-gradient(90% 70% at 90% 90%, hsl(${(hue + 320) % 360} 85% 45%) 0%, transparent 65%),
    linear-gradient(160deg, hsl(${hue} 70% 38%), hsl(${(hue + 20) % 360} 75% 14%))`;
  return (
    <div className="poster-art" style={{ background }}>
      {children}
    </div>
  );
}

export function posterGradient(hue: number): string {
  return `linear-gradient(135deg, hsl(${hue} 70% 40%), hsl(${(hue + 40) % 360} 80% 30%))`;
}
