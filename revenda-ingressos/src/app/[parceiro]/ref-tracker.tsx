"use client";

import { useEffect } from "react";
import { rememberPartner } from "./ref-actions";

export function RefTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void rememberPartner(slug);
  }, [slug]);
  return null;
}
