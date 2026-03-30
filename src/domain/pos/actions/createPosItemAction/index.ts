"use server";

import assert from "node:assert";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { createPosItem, type CreatePosItemInput } from "@/domain/pos/operations/createPosItem";
import type { PosItem } from "@prisma/client";

export async function createPosItemAction(
  input: CreatePosItemInput
): Promise<PosItem> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_ITEMS_WRITE),
    "User not authorized to create POS items"
  );

  const item = await createPosItem(input);
  revalidatePath("/admin/pos/items");
  return item;
}
