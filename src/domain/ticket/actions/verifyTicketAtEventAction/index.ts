"use server";

import { verifyTicketHash } from "@/domain/ticket/operations/verifyTicketHash";
import { QrTicketPayload } from "@/domain/ticket/types/ticket";
import { getCurrentUser } from "@/lib/services/auth";
import assert from "node:assert";

export const verifyTicketAtEventAction = async (
  qrTicketPayload: QrTicketPayload
) => {
  const user = await getCurrentUser();

  assert(user, "User not authenticated");
  assert(user?.permissions.includes("tickets:validate"), "User not authorized");

  return { success: true, verified: verifyTicketHash(qrTicketPayload) };
};
