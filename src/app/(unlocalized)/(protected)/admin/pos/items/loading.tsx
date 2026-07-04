import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminPosItemsLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="POS Items"
        subtitle="Manage items available for sale at POS registers"
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={8} />
    </div>
  );
}
