"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  getAggregatedDonors,
  type AggregatedDonorsResult,
} from "@/domain/order/operations/getAggregatedDonors";

export async function fetchAggregatedDonors(): Promise<AggregatedDonorsResult> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ORDERS_READ_ALL),
    "User not authorized to read orders"
  );

  return await getAggregatedDonors();
}
