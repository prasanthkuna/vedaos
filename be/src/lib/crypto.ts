import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { PII_ENCRYPTION_KEY } from "../config/secrets";

const ALGO = "aes-256-gcm";

const key = () => createHash("sha256").update(PII_ENCRYPTION_KEY()).digest();

export const encryptPII = (plain: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
};

export const decryptPII = (value: string): string => {
  const parts = value.split(".");
  if (parts.length !== 3) return value;
  try {
    const iv = Buffer.from(parts[0], "base64");
    const tag = Buffer.from(parts[1], "base64");
    const ciphertext = Buffer.from(parts[2], "base64");
    const decipher = createDecipheriv(ALGO, key(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    return value;
  }
};
