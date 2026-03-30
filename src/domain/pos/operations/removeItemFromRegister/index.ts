import { prisma } from "@/lib/services/prisma";

export interface RemoveItemFromRegisterInput {
  registerId: string;
  itemId: string;
}

export async function removeItemFromRegister(
  input: RemoveItemFromRegisterInput
): Promise<void> {
  await prisma.posRegisterItem.delete({
    where: {
      registerId_itemId: {
        registerId: input.registerId,
        itemId: input.itemId,
      },
    },
  });
}
