"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllPosItems } from "@/domain/pos/operations/getAllPosItems";
import type { PosItem } from "@prisma/client";

export async function fetchPosItemsAction(): Promise<PosItem[]> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_ITEMS_READ),
    "User not authorized to view POS items"
  );

  const { items } = await getAllPosItems();
  return items;
}
