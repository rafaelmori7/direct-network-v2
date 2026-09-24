"use client";

import { useEffect } from "react";
import { WIDGET_HEIGHT_MESSAGE } from "@/lib/partners/widget";

/** Avisa o widget.js da altura do conteúdo, para o iframe não ter barra de rolagem. */
export function HeightReporter({ id }: { id: string }) {
  useEffect(() => {
    if (window.parent === window) return;
    const root = document.querySelector(".embed");
    if (!root) return;
    const report = () => window.parent.postMessage({ type: WIDGET_HEIGHT_MESSAGE, id, height: Math.ceil(root.getBoundingClientRect().height) }, "*");
    const observer = new ResizeObserver(report);
    observer.observe(root);
    report();
    return () => observer.disconnect();
  }, [id]);
  return null;
}
