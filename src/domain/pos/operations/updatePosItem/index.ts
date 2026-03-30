import { prisma } from "@/lib/services/prisma";
import type { PosItem, PosItemDirection, PosItemStatus } from "@prisma/client";

export interface UpdatePosItemInput {
  id: string;
  name?: string;
  description?: string | null;
  cost?: number;
  direction?: PosItemDirection;
  status?: PosItemStatus;
}

export async function updatePosItem(
  input: UpdatePosItemInput
): Promise<PosItem> {
  const item = await prisma.posItem.update({
    where: { id: input.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.cost !== undefined && { cost: input.cost }),
      ...(input.direction !== undefined && { direction: input.direction }),
      ...(input.status !== undefined && { status: input.status }),
    },
  });

  return item;
}
