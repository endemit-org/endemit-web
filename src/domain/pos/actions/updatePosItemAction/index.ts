"use server";

import assert from "node:assert";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { updatePosItem, type UpdatePosItemInput } from "@/domain/pos/operations/updatePosItem";
import type { PosItem } from "@prisma/client";

export async function updatePosItemAction(
  input: UpdatePosItemInput
): Promise<PosItem> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_ITEMS_WRITE),
    "User not authorized to update POS items"
  );

  const item = await updatePosItem(input);
  revalidatePath("/admin/pos/items");
  return item;
}
