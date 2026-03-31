import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminPosRegistersLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="POS Registers"
        subtitle="Manage registers, assign items and sellers"
      />
      <AdminStatsSkeleton count={6} />
      <AdminTableSkeleton rows={6} />
    </div>
  );
}
