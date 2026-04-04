import {
  AdminBackLinkSkeleton,
  AdminDetailSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminOrderDetailLoading() {
  return (
    <div>
      <AdminBackLinkSkeleton />
      <AdminDetailSkeleton />
    </div>
  );
}
