"use client";

import { useState } from "react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="field">
      <div className="widget-code">{code}</div>
      <button
        type="button"
        className="btn btn-outline"
        style={{ alignSelf: "flex-start" }}
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copiado!" : "Copiar código"}
      </button>
    </div>
  );
}
