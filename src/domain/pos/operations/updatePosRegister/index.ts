import { prisma } from "@/lib/services/prisma";
import type { PosRegister, PosRegisterStatus } from "@prisma/client";

export interface UpdatePosRegisterInput {
  id: string;
  name?: string;
  description?: string | null;
  status?: PosRegisterStatus;
  canTopUp?: boolean;
}

export async function updatePosRegister(
  input: UpdatePosRegisterInput
): Promise<PosRegister> {
  const register = await prisma.posRegister.update({
    where: { id: input.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.canTopUp !== undefined && { canTopUp: input.canTopUp }),
    },
  });

  return register;
}
