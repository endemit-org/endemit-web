"use client";

import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";

interface ProfileTableProps {
  title: string;
  count?: number;
  countLabel?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyIcon?: ReactNode;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    href: string;
  };
  children: ReactNode;
  isEmpty?: boolean;
}

export default function ProfileTable({
  title,
  count,
  countLabel,
  viewAllHref,
  viewAllLabel,
  emptyIcon,
  emptyMessage = "No items yet",
  emptyAction,
  children,
  isEmpty = false,
}: ProfileTableProps) {
  if (isEmpty) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-200">{title}</h3>
        </div>
        <div className="text-center py-8">
          {emptyIcon && (
            <div className="w-12 h-12 mx-auto mb-3 bg-neutral-700 rounded-full flex items-center justify-center">
              {emptyIcon}
            </div>
          )}
          <p className="text-neutral-400 text-sm">{emptyMessage}</p>
          {emptyAction && (
            <Link
              href={emptyAction.href}
              className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              {emptyAction.label}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden p-2 max-sm:bg-neutral-800">
      <div className="flex items-center justify-between p-4 border-b border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-200">{title}</h3>
        {viewAllHref && count !== undefined && count > 5 ? (
          <Link
            href={viewAllHref}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {viewAllLabel || `View all (${count})`}
          </Link>
        ) : count !== undefined ? (
          <span className="text-sm text-neutral-500">
            {count} {countLabel || (count === 1 ? "item" : "items")}
          </span>
        ) : null}
      </div>

      <div>{children}</div>

      {viewAllHref && count !== undefined && count > 5 && (
        <div className="p-4 border-t border-neutral-700">
          <Link
            href={viewAllHref}
            className="block w-full text-center text-sm text-blue-400 hover:text-blue-300"
          >
            {viewAllLabel || `View all ${title.toLowerCase()}`}
          </Link>
        </div>
      )}
    </div>
  );
}

interface ProfileTableRowProps {
  href: string;
  index: number;
  children: ReactNode;
}

export function ProfileTableRow({
  href,
  index,
  children,
}: ProfileTableRowProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "p-4 flex items-center justify-between hover:bg-neutral-600/50 transition-colors block",
        index % 2 === 0 ? "bg-neutral-800" : "bg-neutral-700/50"
      )}
    >
      {children}
    </Link>
  );
}

interface ProfileTableRowDivProps {
  index: number;
  children: ReactNode;
}

export function ProfileTableRowDiv({
  index,
  children,
}: ProfileTableRowDivProps) {
  return (
    <div
      className={clsx(
        "p-4 flex items-center justify-between hover:bg-neutral-600/50 transition-colors",
        index % 2 === 0 ? "bg-neutral-800" : "bg-neutral-700/50"
      )}
    >
      {children}
    </div>
  );
}
