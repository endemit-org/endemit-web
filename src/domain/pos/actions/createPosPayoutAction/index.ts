"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import type { PosPayoutType } from "@prisma/client";
import {
  createPosPayout,
  type CreatePosPayoutResult,
} from "@/domain/pos/operations/createPosPayout";

interface CreatePosPayoutActionInput {
  registerId: string;
  type: PosPayoutType;
  amount: number;
  note?: string;
}

export async function createPosPayoutAction(
  input: CreatePosPayoutActionInput
): Promise<CreatePosPayoutResult> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_TIPS_WITHDRAW),
    "User not authorized to record payouts"
  );

  return await createPosPayout({
    registerId: input.registerId,
    type: input.type,
    amount: input.amount,
    note: input.note,
    createdById: user.id,
  });
}
