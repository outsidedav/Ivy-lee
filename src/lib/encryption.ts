import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT_PREFIX = "ivylee-task-enc-v1";

/**
 * Derives a per-user 256-bit encryption key from NEXTAUTH_SECRET + userId.
 * The key never touches the database — it only exists in memory at runtime.
 */
function deriveKey(userId: string): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set — cannot derive encryption key");
  }
  const salt = `${SALT_PREFIX}:${userId}`;
  return pbkdf2Sync(secret, salt, 100_000, 32, "sha256");
}

/**
 * Encrypts a plaintext string. Returns a base64-encoded string containing
 * IV + ciphertext + auth tag. Safe for storage in a text column.
 */
export function encryptTitle(plaintext: string, userId: string): string {
  const key = deriveKey(userId);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: IV (12) + authTag (16) + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString("base64");
}

/**
 * Decrypts a base64-encoded encrypted title back to plaintext.
 * Returns the original string, or the raw value if decryption fails
 * (graceful fallback for unencrypted legacy data).
 */
export function decryptTitle(encryptedBase64: string, userId: string): string {
  try {
    const packed = Buffer.from(encryptedBase64, "base64");

    // If it's too short to be encrypted data, it's probably plaintext
    if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      return encryptedBase64;
    }

    const iv = packed.subarray(0, IV_LENGTH);
    const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const key = deriveKey(userId);
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    // Graceful fallback: return as-is if it's not encrypted (legacy data)
    return encryptedBase64;
  }
}

/**
 * Encrypt a link URL. Reuses the same AES-256-GCM scheme as titles.
 * Returns null if the input is null/empty.
 */
export function encryptLinkUrl(url: string | null | undefined, userId: string): string | null {
  if (!url) return null;
  return encryptTitle(url, userId);
}

/**
 * Decrypt a link URL. Returns null if the input is null/empty.
 */
export function decryptLinkUrl(encryptedUrl: string | null | undefined, userId: string): string | null {
  if (!encryptedUrl) return null;
  return decryptTitle(encryptedUrl, userId);
}

/**
 * Decrypt an array of task objects, returning decrypted title and link_url.
 */
export function decryptTasks<T extends { title: string; link_url?: string | null }>(
  tasks: T[],
  userId: string
): T[] {
  return tasks.map((task) => ({
    ...task,
    title: decryptTitle(task.title, userId),
    link_url: task.link_url ? decryptLinkUrl(task.link_url, userId) : task.link_url,
  }));
}
