import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Create a Scrypt password hash.
 * Format: $scrypt$n=16384,r=8,p=1$<saltB64>$<keyB64>
 */
export function hashPassword(password: string): string {
  const N = 16384;
  const r = 8;
  const p = 1;
  const keyLen = 32;

  const salt = randomBytes(32);
  const key = scryptSync(Buffer.from(password, "utf8"), salt, keyLen, { N, r, p });

  return `$scrypt$n=${N},r=${r},p=${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

/**
 * Verify a plaintext password against a $scrypt$ hash.
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    // Example structure:
    // $scrypt$n=16384,r=8,p=1$<salt>$<key>
    const match = /^\$scrypt\$n=(\d+),r=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/.exec(stored);
    if (!match) return false;

    const [_, nStr, rStr, pStr, saltB64, keyB64] = match;
    const N = parseInt(nStr, 10);
    const r = parseInt(rStr, 10);
    const p = parseInt(pStr, 10);

    const salt = Buffer.from(saltB64, "base64");
    const expectedKey = Buffer.from(keyB64, "base64");

    const actualKey = scryptSync(Buffer.from(password, "utf8"), salt, expectedKey.length, { N, r, p });

    return timingSafeEqual(actualKey, expectedKey);
  } catch (err) {
    console.error("verifyPassword error:", err);
    return false;
  }
}
