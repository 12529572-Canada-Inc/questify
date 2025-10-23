async function getNodeCrypto() {
  if (typeof process !== 'undefined' && process.versions?.node) {
    return await import('node:crypto')
  }

  throw new Error('Password utilities require a Node.js environment')
}

function getNodeCryptoSync() {
  if (typeof process !== 'undefined' && process.versions?.node) {
    // Use eval to avoid bundler trying to process require at build time
    // eslint-disable-next-line no-eval
    return eval('require')('node:crypto') as typeof import('node:crypto')
  }

  throw new Error('Password utilities require a Node.js environment')
}

/**
 * Create a Scrypt password hash.
 * Format: $scrypt$n=16384,r=8,p=1$<saltB64>$<keyB64>
 */
export function hashPassword(password: string): string {
  const { randomBytes, scryptSync } = getNodeCryptoSync()

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
    const { scryptSync, timingSafeEqual } = getNodeCryptoSync()

    // Expected format: $scrypt$n=16384,r=8,p=1$<salt>$<key>
    const match = /^\$scrypt\$n=(\d+),r=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/.exec(stored);

    if (!match) {
      console.error("Invalid scrypt hash format");
      return false;
    }

    // Explicitly assert to satisfy TypeScript (no undefineds)
    const nStr = match[1]!;
    const rStr = match[2]!;
    const pStr = match[3]!;
    const saltB64 = match[4]!;
    const keyB64 = match[5]!;

    const N = parseInt(nStr, 10);
    const r = parseInt(rStr, 10);
    const p = parseInt(pStr, 10);

    if ([N, r, p].some((val) => isNaN(val))) {
      console.error("Invalid scrypt parameters");
      return false;
    }

    const salt = Buffer.from(saltB64, "base64");
    const expectedKey = Buffer.from(keyB64, "base64");

    const actualKey = scryptSync(Buffer.from(password, "utf8"), salt, expectedKey.length, { N, r, p });

    return timingSafeEqual(actualKey, expectedKey);
  } catch (err) {
    console.error("verifyPassword error:", err);
    return false;
  }
}
