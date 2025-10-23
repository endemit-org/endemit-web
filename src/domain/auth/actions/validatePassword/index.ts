import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getPasswordKeyLength } from "@/domain/auth/config/password.config";

const scryptAsync = promisify(scrypt);

export const validatePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const [salt, storedHash] = hash.split(".");
  const keyLength = getPasswordKeyLength();

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  return timingSafeEqual(derivedKey, storedHashBuffer);
};
