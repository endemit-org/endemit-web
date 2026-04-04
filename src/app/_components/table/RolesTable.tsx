"use client";

import clsx from "clsx";
import type { SerializedRole } from "@/domain/role/types";

interface RolesTableProps {
  roles: SerializedRole[];
  onRowClick?: (role: SerializedRole) => void;
}

export default function RolesTable({ roles, onRowClick }: RolesTableProps) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Name
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Slug
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Description
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Permissions
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Users
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Type
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {roles.map((role, index) => (
          <tr
            key={role.id}
            onClick={() => onRowClick?.(role)}
            className={clsx(
              index % 2 === 0 ? "bg-white" : "bg-gray-50",
              onRowClick && "cursor-pointer hover:bg-blue-50"
            )}
          >
            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
              {role.name}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 font-mono">
              {role.slug}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
              {role.description || "-"}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-center text-gray-900">
              {role.permissions.length}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-center text-gray-900">
              {role.userCount}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-center">
              {role.isSystem ? (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  System
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                  Custom
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
