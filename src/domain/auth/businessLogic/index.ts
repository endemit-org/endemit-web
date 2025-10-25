import { validatePassword } from "@/domain/auth/actions/validatePassword";

export const isPasswordValid = async (
  password: string,
  hash: string
): Promise<boolean> => await validatePassword(password, hash);

export const isUserActive = (status: string) => status === "ACTIVE";
