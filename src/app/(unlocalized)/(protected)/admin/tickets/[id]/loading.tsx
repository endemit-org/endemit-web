import {
  AdminBackLinkSkeleton,
  AdminDetailSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminTicketDetailLoading() {
  return (
    <div>
      <AdminBackLinkSkeleton />
      <AdminDetailSkeleton />
    </div>
  );
}
