"use server";

import assert from "node:assert";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { updateDiscountCode } from "@/domain/discount/operations/updateDiscountCode";
import type {
  DiscountCodeUpsertInput,
  DiscountRule,
} from "@/domain/discount/types/discount";
import { transformDiscountCodeToRule } from "@/domain/discount/transformers/transformDiscountCodeToRule";

export async function updateDiscountCodeAction(
  id: string,
  input: Partial<DiscountCodeUpsertInput>
): Promise<DiscountRule> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.DISCOUNTS_WRITE),
    "User not authorized to update discount codes"
  );

  const code = await updateDiscountCode(id, input);
  revalidatePath("/admin/discounts");
  return transformDiscountCodeToRule(code);
}
