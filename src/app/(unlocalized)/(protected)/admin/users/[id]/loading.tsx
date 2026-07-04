import {
  AdminBackLinkSkeleton,
  AdminDetailSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminUserDetailLoading() {
  return (
    <div>
      <AdminBackLinkSkeleton />
      <AdminDetailSkeleton />
    </div>
  );
}
