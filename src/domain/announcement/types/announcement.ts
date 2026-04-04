import { Announcement, AnnouncementType } from "@prisma/client";

export type { Announcement, AnnouncementType };

export interface AnnouncementWithStatus extends Announcement {
  status: "active" | "scheduled" | "expired" | "inactive";
}

export interface CreateAnnouncementInput {
  title?: string;
  message: string;
  type?: AnnouncementType;
  isActive?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export interface UpdateAnnouncementInput {
  id: string;
  title?: string;
  message?: string;
  type?: AnnouncementType;
  isActive?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export function getAnnouncementStatus(
  announcement: Announcement
): "active" | "scheduled" | "expired" | "inactive" {
  if (!announcement.isActive) {
    return "inactive";
  }

  const now = new Date();

  // Check if scheduled for future
  if (announcement.startsAt && announcement.startsAt > now) {
    return "scheduled";
  }

  // Check if expired
  if (announcement.endsAt && announcement.endsAt <= now) {
    return "expired";
  }

  return "active";
}
