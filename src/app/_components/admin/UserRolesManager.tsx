"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { assignRoleAction } from "@/domain/user/actions/assignRoleAction";
import { removeRoleAction } from "@/domain/user/actions/removeRoleAction";
import type { SerializedRole } from "@/domain/role/types";
import {
  PERMISSION_METADATA,
  type Permission,
} from "@/domain/auth/config/permissions.config";
import clsx from "clsx";

interface UserRolesManagerProps {
  userId: string;
  currentRoles: string[];
  allRoles: SerializedRole[];
  canManageRoles: boolean;
}

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 border-purple-300",
  moderator: "bg-blue-100 text-blue-800 border-blue-300",
  scanner: "bg-green-100 text-green-800 border-green-300",
  user: "bg-gray-100 text-gray-800 border-gray-300",
  seller: "bg-orange-100 text-orange-800 border-orange-300",
};

// Group permissions by resource for display
function groupPermissionsByResource(permissions: Permission[]) {
  const grouped: Record<string, Permission[]> = {};
  for (const perm of permissions) {
    const meta = PERMISSION_METADATA[perm];
    if (meta) {
      if (!grouped[meta.resource]) {
        grouped[meta.resource] = [];
      }
      grouped[meta.resource].push(perm);
    }
  }
  return grouped;
}

export default function UserRolesManager({
  userId,
  currentRoles,
  allRoles,
  canManageRoles,
}: UserRolesManagerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRoles = allRoles.filter(
    role => !currentRoles.includes(role.slug)
  );

  // Compute aggregated permissions from all assigned roles (using DB data)
  const aggregatedPermissions = useMemo(() => {
    const permSet = new Set<Permission>();
    for (const roleSlug of currentRoles) {
      const roleDef = allRoles.find(r => r.slug === roleSlug);
      if (roleDef) {
        for (const perm of roleDef.permissions) {
          permSet.add(perm);
        }
      }
    }
    return Array.from(permSet).sort();
  }, [currentRoles, allRoles]);

  const groupedPermissions = useMemo(
    () => groupPermissionsByResource(aggregatedPermissions),
    [aggregatedPermissions]
  );

  const handleAddRole = async (roleSlug: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await assignRoleAction(userId, roleSlug);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRole = async (roleSlug: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await removeRoleAction(userId, roleSlug);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {currentRoles.length > 0 ? (
          currentRoles.map(role => (
            <span
              key={role}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border",
                roleColors[role] || "bg-gray-100 text-gray-800 border-gray-300"
              )}
            >
              {role}
              {canManageRoles && (
                <button
                  onClick={() => handleRemoveRole(role)}
                  disabled={isLoading}
                  className="hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Remove role"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-500">No roles assigned</span>
        )}
      </div>

      {canManageRoles && availableRoles.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            onChange={e => {
              if (e.target.value) {
                handleAddRole(e.target.value);
                e.target.value = "";
              }
            }}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">+ Add Role</option>
            {availableRoles.map(role => (
              <option key={role.slug} value={role.slug}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Aggregated Permissions Display */}
      {aggregatedPermissions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Aggregated Permissions ({aggregatedPermissions.length})
          </h4>
          <div className="space-y-3">
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource}>
                <span className="text-xs font-semibold text-gray-700 capitalize">
                  {resource}
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {perms.map(perm => {
                    const meta = PERMISSION_METADATA[perm];
                    return (
                      <span
                        key={perm}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                        title={meta?.description}
                      >
                        {meta?.action || perm}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
