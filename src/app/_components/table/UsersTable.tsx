"use client";

import { Column, Table } from "@/app/_components/table/Table";
import type { SerializedUser } from "@/domain/user/types";
import ClientDate from "@/app/_components/ui/ClientDate";
import clsx from "clsx";

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  moderator: "bg-blue-100 text-blue-800",
  scanner: "bg-green-100 text-green-800",
  user: "bg-gray-100 text-gray-800",
};

export default function UsersTable({
  users,
  onRowClick,
}: {
  users: SerializedUser[];
  onRowClick?: (row: SerializedUser) => void;
}) {
  const columns: Column<SerializedUser>[] = [
    {
      key: "username",
      header: "Username",
      sortable: true,
      render: user => (
        <span className="font-medium text-gray-900">{user.username}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: user => (
        <span className="text-sm text-gray-600">{user.email || "-"}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: user => <span className="text-sm">{user.name || "-"}</span>,
    },
    {
      key: "roles",
      header: "Roles",
      render: user => (
        <div className="flex flex-wrap gap-1">
          {user.roles.length > 0 ? (
            user.roles.map(role => (
              <span
                key={role}
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  roleColors[role] || "bg-gray-100 text-gray-800"
                )}
              >
                {role}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No roles</span>
          )}
        </div>
      ),
    },
    {
      key: "lastLoginAt",
      header: "Last Login",
      sortable: true,
      render: user => (
        user.lastLoginAt ? (
          <ClientDate date={user.lastLoginAt} className="text-sm text-gray-600" />
        ) : (
          <span className="text-sm text-gray-600">Never</span>
        )
      ),
      accessor: user =>
        user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0,
    },
  ];

  return (
    <Table
      data={users}
      columns={columns}
      onRowClick={onRowClick}
      emptyMessage="No users found"
      maxHeight="calc(100vh - 400px)"
    />
  );
}
