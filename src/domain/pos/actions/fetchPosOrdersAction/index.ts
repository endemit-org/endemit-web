"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  getAllPosOrders,
  type GetAllPosOrdersParams,
  type GetAllPosOrdersResult,
} from "@/domain/pos/operations/getAllPosOrders";

export async function fetchPosOrdersAction(
  params?: GetAllPosOrdersParams
): Promise<GetAllPosOrdersResult> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.POS_ORDERS_READ),
    "User not authorized to view POS orders"
  );

  return await getAllPosOrders(params);
}
