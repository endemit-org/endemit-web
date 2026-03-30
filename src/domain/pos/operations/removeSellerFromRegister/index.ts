import { prisma } from "@/lib/services/prisma";

export interface RemoveSellerFromRegisterInput {
  registerId: string;
  userId: string;
}

export async function removeSellerFromRegister(
  input: RemoveSellerFromRegisterInput
): Promise<void> {
  await prisma.posRegisterSeller.delete({
    where: {
      registerId_userId: {
        registerId: input.registerId,
        userId: input.userId,
      },
    },
  });
}
