import { prisma } from "@/lib/services/prisma";
import type { PosItem, PosItemDirection, PosItemStatus } from "@prisma/client";

export interface CreatePosItemInput {
  name: string;
  description?: string;
  cost: number;
  direction: PosItemDirection;
  status?: PosItemStatus;
}

export async function createPosItem(
  input: CreatePosItemInput
): Promise<PosItem> {
  const item = await prisma.posItem.create({
    data: {
      name: input.name,
      description: input.description,
      cost: input.cost,
      direction: input.direction,
      status: input.status ?? "ACTIVE",
    },
  });

  return item;
}
