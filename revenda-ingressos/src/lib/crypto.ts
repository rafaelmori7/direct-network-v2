import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Criptografia simétrica (AES-256-GCM) para segredos guardados no banco, como a
// chave de API da subconta do vendedor. ENCRYPTION_KEY: qualquer texto longo e aleatório.
function key(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw new Error("ENCRYPTION_KEY ausente ou curta (mínimo 32 caracteres)");
  return createHash("sha256").update(secret).digest();
}

/** Formato: "v1.<iv>.<tag>.<dados>" em base64url. */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function decrypt(payload: string): string {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Formato criptografado inválido");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}
