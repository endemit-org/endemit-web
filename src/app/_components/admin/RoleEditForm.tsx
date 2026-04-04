"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createRoleAction } from "@/domain/role/actions/createRoleAction";
import { updateRoleAction } from "@/domain/role/actions/updateRoleAction";
import { deleteRoleAction } from "@/domain/role/actions/deleteRoleAction";
import {
  PERMISSIONS,
  PERMISSION_METADATA,
  type Permission,
} from "@/domain/auth/config/permissions.config";
import type { SerializedRole, CreateRoleInput, UpdateRoleInput } from "@/domain/role/types";

interface RoleEditFormProps {
  role?: SerializedRole;
  canUpdate: boolean;
  canDelete: boolean;
}

function groupPermissionsByResource(permissions: Permission[]) {
  const grouped: Record<string, { permission: Permission; meta: (typeof PERMISSION_METADATA)[Permission] }[]> = {};

  for (const permission of permissions) {
    const meta = PERMISSION_METADATA[permission];
    if (!meta) continue;

    if (!grouped[meta.resource]) {
      grouped[meta.resource] = [];
    }
    grouped[meta.resource].push({ permission, meta });
  }

  return grouped;
}

export default function RoleEditForm({ role, canUpdate, canDelete }: RoleEditFormProps) {
  const router = useRouter();
  const isNew = !role;

  const [name, setName] = useState(role?.name ?? "");
  const [slug, setSlug] = useState(role?.slug ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    role?.permissions ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allPermissions = useMemo(() => Object.values(PERMISSIONS) as Permission[], []);
  const groupedPermissions = useMemo(
    () => groupPermissionsByResource(allPermissions),
    [allPermissions]
  );

  const handlePermissionToggle = (permission: Permission) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSelectAllInGroup = (resource: string) => {
    const groupPerms = groupedPermissions[resource].map(p => p.permission);
    const allSelected = groupPerms.every(p => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !groupPerms.includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...groupPerms])]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isNew) {
        const input: CreateRoleInput = {
          name,
          slug,
          description: description || undefined,
          permissions: selectedPermissions,
        };
        await createRoleAction(input);
      } else {
        const input: UpdateRoleInput = {
          name,
          slug,
          description: description || null,
          permissions: selectedPermissions,
        };
        await updateRoleAction(role.id, input);
      }
      router.push("/admin/roles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!role || role.isSystem) return;

    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteRoleAction(role.id);
      router.push("/admin/roles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const canModify = isNew || canUpdate;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Role Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!canModify}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g., Content Editor"
            />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              disabled={!canModify || (role?.isSystem ?? false)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 font-mono"
              placeholder="e.g., content-editor"
            />
            {role?.isSystem && (
              <p className="mt-1 text-xs text-gray-500">
                System role slugs cannot be changed
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!canModify}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Brief description of this role's purpose"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Permissions ({selectedPermissions.length})
          </h2>
          {canModify && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedPermissions(allPermissions)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedPermissions([])}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([resource, permissions]) => {
            const allSelected = permissions.every(p =>
              selectedPermissions.includes(p.permission)
            );

            return (
              <div key={resource} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 capitalize">
                    {resource}
                  </h3>
                  {canModify && (
                    <button
                      type="button"
                      onClick={() => handleSelectAllInGroup(resource)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {permissions.map(({ permission, meta }) => (
                    <label
                      key={permission}
                      className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        selectedPermissions.includes(permission)
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      } ${!canModify ? "cursor-not-allowed opacity-75" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                        disabled={!canModify}
                        className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {meta.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {meta.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {role && !role.isSystem && canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Role"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/roles")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          {canModify && (
            <button
              type="submit"
              disabled={isSubmitting || !name || !slug}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isNew ? "Create Role" : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
