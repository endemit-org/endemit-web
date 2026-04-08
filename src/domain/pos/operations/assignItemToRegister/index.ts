import "server-only";

import { prisma } from "@/lib/services/prisma";
import { bustOnPosRegisterChanged } from "@/lib/services/cache";

export interface AssignItemToRegisterInput {
  registerId: string;
  itemId: string;
}

export async function assignItemToRegister(
  input: AssignItemToRegisterInput
): Promise<void> {
  await prisma.posRegisterItem.create({
    data: {
      registerId: input.registerId,
      itemId: input.itemId,
    },
  });

  await bustOnPosRegisterChanged();
}
