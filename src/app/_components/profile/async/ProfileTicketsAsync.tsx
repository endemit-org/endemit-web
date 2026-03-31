import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import ProfileTicketsPreview from "@/app/_components/profile/ProfileTicketsPreview";

interface ProfileTicketsAsyncProps {
  userId: string;
}

export default async function ProfileTicketsAsync({
  userId,
}: ProfileTicketsAsyncProps) {
  const upcomingTickets = await getTicketsByUserId(userId, { upcomingOnly: true });

  if (upcomingTickets.length === 0) {
    return null;
  }

  const recentTickets = upcomingTickets.slice(0, 5);

  return (
    <ProfileTicketsPreview
      tickets={recentTickets}
      totalCount={upcomingTickets.length}
    />
  );
}
