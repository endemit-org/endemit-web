"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  getPosRegisterReport,
  type PosRegisterReport,
} from "@/domain/pos/operations/getPosRegisterReport";

export async function fetchPosRegisterReportAction(
  registerId: string
): Promise<PosRegisterReport> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_REGISTERS_READ),
    "User not authorized to view POS registers"
  );

  return await getPosRegisterReport(registerId);
}
