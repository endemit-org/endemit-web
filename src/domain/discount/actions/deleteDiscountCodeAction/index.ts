"use server";

import assert from "node:assert";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { deleteDiscountCode } from "@/domain/discount/operations/deleteDiscountCode";

export async function deleteDiscountCodeAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.DISCOUNTS_WRITE),
    "User not authorized to delete discount codes"
  );

  await deleteDiscountCode(id);
  revalidatePath("/admin/discounts");
}
