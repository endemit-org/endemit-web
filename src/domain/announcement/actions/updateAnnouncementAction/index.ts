"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { updateAnnouncement } from "@/domain/announcement/operations/updateAnnouncement";
import { UpdateAnnouncementInput } from "@/domain/announcement/types/announcement";
import assert from "assert";

export async function updateAnnouncementAction(input: UpdateAnnouncementInput) {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ANNOUNCEMENTS_WRITE),
    "User not authorized to update announcements"
  );

  const announcement = await updateAnnouncement(input);

  revalidatePath("/admin/announcements");
  revalidatePath("/profile");

  return announcement;
}
