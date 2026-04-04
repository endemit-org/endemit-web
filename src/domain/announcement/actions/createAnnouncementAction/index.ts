"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { createAnnouncement } from "@/domain/announcement/operations/createAnnouncement";
import { CreateAnnouncementInput } from "@/domain/announcement/types/announcement";
import assert from "assert";

export async function createAnnouncementAction(input: CreateAnnouncementInput) {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ANNOUNCEMENTS_WRITE),
    "User not authorized to create announcements"
  );

  const announcement = await createAnnouncement(input);

  revalidatePath("/admin/announcements");
  revalidatePath("/profile");

  return announcement;
}
