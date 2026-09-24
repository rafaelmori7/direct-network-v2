import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/chrome";

/** Páginas do site com cabeçalho e rodapé. O widget (/embed) fica fora deste grupo. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
