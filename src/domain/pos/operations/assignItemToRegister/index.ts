import { prisma } from "@/lib/services/prisma";

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
}
