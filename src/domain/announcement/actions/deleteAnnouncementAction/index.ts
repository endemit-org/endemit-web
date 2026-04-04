"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { deleteAnnouncement } from "@/domain/announcement/operations/deleteAnnouncement";
import assert from "assert";

export async function deleteAnnouncementAction(id: string) {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ANNOUNCEMENTS_WRITE),
    "User not authorized to delete announcements"
  );

  await deleteAnnouncement(id);

  revalidatePath("/admin/announcements");
  revalidatePath("/profile");
}
