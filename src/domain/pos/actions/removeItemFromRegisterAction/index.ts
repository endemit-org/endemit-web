"use server";

import assert from "node:assert";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { removeItemFromRegister } from "@/domain/pos/operations/removeItemFromRegister";

export async function removeItemFromRegisterAction(
  registerId: string,
  itemId: string
): Promise<void> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_REGISTERS_WRITE),
    "User not authorized to manage POS registers"
  );

  await removeItemFromRegister({ registerId, itemId });
  revalidatePath("/admin/pos/registers");
}
