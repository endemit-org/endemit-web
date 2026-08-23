"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  getPosRegisterPayouts,
  type PosRegisterPayoutsResult,
} from "@/domain/pos/operations/getPosRegisterPayouts";

export async function fetchPosRegisterPayoutsAction(
  registerId: string
): Promise<PosRegisterPayoutsResult> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_TIPS_WITHDRAW),
    "User not authorized to view payouts"
  );

  return await getPosRegisterPayouts(registerId);
}
