import "server-only";

import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import {
  getPasswordKeyLength,
  getPasswordSaltLength,
} from "@/domain/auth/config/password.config";

const scryptAsync = promisify(scrypt);

export async function createPasswordHash(password: string): Promise<string> {
  const saltLength = getPasswordSaltLength();
  const keyLength = getPasswordKeyLength();

  const salt = randomBytes(saltLength).toString("hex");

  const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;

  return `${salt}.${derivedKey.toString("hex")}`;
}
