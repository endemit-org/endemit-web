import { prisma } from "@/lib/services/prisma";
import type { PosRegister, PosRegisterStatus } from "@prisma/client";

export interface CreatePosRegisterInput {
  name: string;
  description?: string;
  status?: PosRegisterStatus;
  canTopUp?: boolean;
}

export async function createPosRegister(
  input: CreatePosRegisterInput
): Promise<PosRegister> {
  const register = await prisma.posRegister.create({
    data: {
      name: input.name,
      description: input.description,
      status: input.status ?? "ACTIVE",
      canTopUp: input.canTopUp ?? false,
    },
  });

  return register;
}
