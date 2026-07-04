import {
  AdminBackLinkSkeleton,
  AdminDetailSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminWalletDetailLoading() {
  return (
    <div>
      <AdminBackLinkSkeleton />
      <AdminDetailSkeleton />
    </div>
  );
}
