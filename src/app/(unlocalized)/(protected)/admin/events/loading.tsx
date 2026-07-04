import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminEventsLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="Events"
        subtitle="View and manage event tickets"
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={8} />
    </div>
  );
}
