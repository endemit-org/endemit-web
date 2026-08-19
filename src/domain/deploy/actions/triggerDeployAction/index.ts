"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { VERCEL_DEPLOY_HOOK_URL } from "@/lib/services/env/private";

export interface TriggerDeployResult {
  success: boolean;
  message?: string;
}

export async function triggerDeployAction(): Promise<TriggerDeployResult> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.DEPLOY_TRIGGER),
    "User not authorized to trigger deploys"
  );

  if (!VERCEL_DEPLOY_HOOK_URL) {
    return { success: false, message: "Deploy hook is not configured" };
  }

  try {
    const response = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: "POST" });
    if (!response.ok) {
      console.error(
        "Failed to trigger Vercel deploy:",
        response.status,
        await response.text()
      );
      return { success: false, message: "Deploy hook request failed" };
    }

    console.log(
      `Vercel deploy triggered from admin by ${user.email ?? user.id}`
    );
    return { success: true };
  } catch (error) {
    console.error("Error triggering Vercel deploy:", error);
    return { success: false, message: "Deploy hook request failed" };
  }
}
