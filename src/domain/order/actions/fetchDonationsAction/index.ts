"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  getAllDonations,
  type PaginatedDonations,
} from "@/domain/order/operations/getAllDonations";

export async function fetchDonations(page?: number): Promise<PaginatedDonations> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ORDERS_READ_ALL),
    "User not authorized to read orders"
  );

  return await getAllDonations({ page });
}
