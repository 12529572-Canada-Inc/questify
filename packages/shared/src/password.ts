import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Hash a password using the Scrypt key-derivation function.
 * Produces output like: $scrypt$n=16384,r=8,p=1$<salt>$<hash>
 */
export function hashPassword(password: string): string {
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(32);
  const keyLen = 32;

  const derivedKey = scryptSync(password, salt, keyLen, { N, r, p });
  const saltB64 = salt.toString("base64");
  const keyB64 = derivedKey.toString("base64");

  return `$scrypt$n=${N},r=${r},p=${p}$${saltB64}$${keyB64}`;
}

/**
 * Verify a plaintext password against a $scrypt$ hash.
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    const parts = hash.split("$");
    if (parts.length !== 6 || parts[1] !== "scrypt") return false;

    const paramStr = parts[2]; // n=16384,r=8,p=1
    const saltB64 = parts[3];
    const keyB64 = parts[4];

    const N = parseInt(paramStr.match(/n=(\d+)/)![1], 10);
    const r = parseInt(paramStr.match(/r=(\d+)/)![1], 10);
    const p = parseInt(paramStr.match(/p=(\d+)/)![1], 10);

    const salt = Buffer.from(saltB64, "base64");
    const key = Buffer.from(keyB64, "base64");

    const derived = scryptSync(password, salt, key.length, { N, r, p });
    return timingSafeEqual(derived, key);
  } catch {
    return false;
  }
}
