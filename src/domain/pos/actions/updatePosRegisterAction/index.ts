"use server";

import assert from "node:assert";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  updatePosRegister,
  type UpdatePosRegisterInput,
} from "@/domain/pos/operations/updatePosRegister";
import type { PosRegister } from "@prisma/client";

export async function updatePosRegisterAction(
  input: UpdatePosRegisterInput
): Promise<PosRegister> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_REGISTERS_WRITE),
    "User not authorized to update POS registers"
  );

  const register = await updatePosRegister(input);
  revalidatePath("/admin/pos/registers");
  return register;
}
