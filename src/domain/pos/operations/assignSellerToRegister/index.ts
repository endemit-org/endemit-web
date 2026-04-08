import "server-only";

import { prisma } from "@/lib/services/prisma";
import { bustOnPosRegisterChanged } from "@/lib/services/cache";

export interface AssignSellerToRegisterInput {
  registerId: string;
  userId: string;
}

export async function assignSellerToRegister(
  input: AssignSellerToRegisterInput
): Promise<void> {
  await prisma.posRegisterSeller.create({
    data: {
      registerId: input.registerId,
      userId: input.userId,
    },
  });

  await bustOnPosRegisterChanged();
}
