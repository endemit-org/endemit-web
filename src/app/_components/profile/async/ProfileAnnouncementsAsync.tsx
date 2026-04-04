import { getActiveAnnouncements } from "@/domain/announcement/operations/getActiveAnnouncements";
import ProfileAnnouncementsBanner from "@/app/_components/profile/ProfileAnnouncementsBanner";

interface ProfileAnnouncementsAsyncProps {
  userId: string;
}

export default async function ProfileAnnouncementsAsync({
  userId,
}: ProfileAnnouncementsAsyncProps) {
  const announcements = await getActiveAnnouncements(userId);

  // Always render client component to maintain realtime subscription
  // even when no announcements exist initially
  return (
    <ProfileAnnouncementsBanner
      userId={userId}
      initialAnnouncements={announcements}
    />
  );
}
