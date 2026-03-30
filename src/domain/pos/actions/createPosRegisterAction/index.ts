"use server";

import assert from "node:assert";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  createPosRegister,
  type CreatePosRegisterInput,
} from "@/domain/pos/operations/createPosRegister";
import type { PosRegister } from "@prisma/client";

export async function createPosRegisterAction(
  input: CreatePosRegisterInput
): Promise<PosRegister> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_REGISTERS_WRITE),
    "User not authorized to create POS registers"
  );

  const register = await createPosRegister(input);
  revalidatePath("/admin/pos/registers");
  return register;
}
