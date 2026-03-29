import { prisma } from "@/lib/services/prisma";
import type { PosItem } from "@prisma/client";

export interface GetAllPosItemsResult {
  items: PosItem[];
}

export async function getAllPosItems(): Promise<GetAllPosItemsResult> {
  const items = await prisma.posItem.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return { items };
}
