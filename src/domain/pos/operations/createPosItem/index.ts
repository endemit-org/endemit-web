import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { PosItem, PosItemDirection, PosItemStatus } from "@prisma/client";
import { bustOnPosItemChanged } from "@/lib/services/cache";

export interface CreatePosItemInput {
  name: string;
  description?: string;
  cost: number;
  direction: PosItemDirection;
  color?: string | null;
  ticketEventId?: string | null;
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
      color: input.color ?? null,
      ticketEventId: input.ticketEventId ?? null,
      status: input.status ?? "ACTIVE",
    },
  });

  await bustOnPosItemChanged();

  return item;
}
