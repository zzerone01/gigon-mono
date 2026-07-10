const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const LOOKUP: Record<number, number> = {};
for (let i = 0; i < B64.length; i++) LOOKUP[B64.charCodeAt(i)] = i;

/** Minimal base64 → bytes decoder (no atob/Buffer dependency in Hermes). */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      ((LOOKUP[clean.charCodeAt(i)] ?? 0) << 18) |
      ((LOOKUP[clean.charCodeAt(i + 1)] ?? 0) << 12) |
      ((LOOKUP[clean.charCodeAt(i + 2)] ?? 0) << 6) |
      (LOOKUP[clean.charCodeAt(i + 3)] ?? 0);
    out[o++] = (n >> 16) & 0xff;
    if (o < len) out[o++] = (n >> 8) & 0xff;
    if (o < len) out[o++] = n & 0xff;
  }
  return out;
}
