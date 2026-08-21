/**
 * HMAC-SHA256 imzolangan admin sessiya tokeni.
 *
 * Oldin cookie qiymati doimiy "authenticated" matni edi — hujumchi uni
 * curl bilan qo'lda yozib, butun admin paneliga kirardi (audit X1).
 *
 * Web Crypto ishlatiladi (node:crypto EMAS) — proxy edge runtime'da
 * ishlashi mumkin, u yerda node:crypto yo'q.
 *
 * Format: base64url(payload) + "." + base64url(hmac)
 *   payload: {"email":"...","exp":<ms>}
 */
export const ADMIN_COOKIE = "admin_session";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ⚠️ Uint8Array<ArrayBuffer> qaytariladi (oddiy Uint8Array emas):
// crypto.subtle.verify BufferSource kutadi, ArrayBufferLike esa unga
// mos kelmaydi (SharedArrayBuffer ehtimoli sababli).
function unb64url(s: string): Uint8Array<ArrayBuffer> {
  const p = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(p + "=".repeat((4 - (p.length % 4)) % 4));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  // Fallback qiymat YO'Q: sir sozlanmagan bo'lsa kirish ochiq qolmasin.
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET sozlanmagan (kamida 32 belgi)");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  email: string,
  exp = Date.now() + MAX_AGE_MS
): Promise<string> {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ email, exp })));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await key(),
    new TextEncoder().encode(payload)
  );
  return `${payload}.${b64url(new Uint8Array(sig))}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<{ email: string } | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await key(),
      unb64url(sig),
      new TextEncoder().encode(payload)
    );
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    if (typeof data.email !== "string" || !data.email) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}
