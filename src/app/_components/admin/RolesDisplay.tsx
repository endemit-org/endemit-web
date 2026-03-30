"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RolesTable from "@/app/_components/table/RolesTable";
import { fetchRoles } from "@/domain/role/actions/fetchRolesAction";
import type { SerializedRole } from "@/domain/role/types";

interface RolesDisplayProps {
  initialData: SerializedRole[];
  canCreate: boolean;
}

export default function RolesDisplay({ initialData, canCreate }: RolesDisplayProps) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    loadRoles();
  };

  const handleRoleClick = (role: SerializedRole) => {
    router.push(`/admin/roles/${role.id}`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Total Roles: <strong className="text-gray-900">{roles.length}</strong>
          </div>
          <div className="text-sm text-gray-600">
            System:{" "}
            <strong className="text-blue-600">
              {roles.filter(r => r.isSystem).length}
            </strong>
          </div>
          <div className="text-sm text-gray-600">
            Custom:{" "}
            <strong className="text-gray-900">
              {roles.filter(r => !r.isSystem).length}
            </strong>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Link
              href="/admin/roles/new"
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Create Role
            </Link>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {roles.length > 0 ? (
          <div className="overflow-x-auto">
            <RolesTable roles={roles} onRowClick={handleRoleClick} />
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">No roles found</div>
        )}
      </div>
    </>
  );
}
