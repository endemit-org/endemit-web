"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { dismissAnnouncement } from "@/domain/announcement/operations/dismissAnnouncement";
import assert from "assert";

export async function dismissAnnouncementAction(announcementId: string) {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");

  await dismissAnnouncement(announcementId, user.id);

  revalidatePath("/profile");
}
