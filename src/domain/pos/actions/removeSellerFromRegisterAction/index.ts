"use server";

import assert from "node:assert";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { removeSellerFromRegister } from "@/domain/pos/operations/removeSellerFromRegister";

export async function removeSellerFromRegisterAction(
  registerId: string,
  userId: string
): Promise<void> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_REGISTERS_WRITE),
    "User not authorized to manage POS registers"
  );

  await removeSellerFromRegister({ registerId, userId });
  revalidatePath("/admin/pos/registers");
}
