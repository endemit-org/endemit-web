"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  getAllPosRegisters,
  type PosRegisterWithRelations,
} from "@/domain/pos/operations/getAllPosRegisters";

export async function fetchPosRegistersAction(): Promise<
  PosRegisterWithRelations[]
> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_REGISTERS_READ),
    "User not authorized to view POS registers"
  );

  const { registers } = await getAllPosRegisters();
  return registers;
}
