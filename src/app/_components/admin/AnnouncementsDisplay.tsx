"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AnnouncementWithStatus } from "@/domain/announcement/types/announcement";
import { createAnnouncementAction } from "@/domain/announcement/actions/createAnnouncementAction";
import { updateAnnouncementAction } from "@/domain/announcement/actions/updateAnnouncementAction";
import { deleteAnnouncementAction } from "@/domain/announcement/actions/deleteAnnouncementAction";
import { AnnouncementType } from "@prisma/client";
import ClientDate from "@/app/_components/ui/ClientDate";

interface AnnouncementsDisplayProps {
  initialData: AnnouncementWithStatus[];
  canWrite: boolean;
}

type FormMode = "closed" | "create" | "edit";

interface FormData {
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

const emptyForm: FormData = {
  title: "",
  message: "",
  type: "INFO",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

function formatDateForInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function StatusBadge({ status }: { status: AnnouncementWithStatus["status"] }) {
  const config = {
    active: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
    scheduled: { bg: "bg-blue-100", text: "text-blue-800", label: "Scheduled" },
    expired: { bg: "bg-gray-100", text: "text-gray-600", label: "Expired" },
    inactive: { bg: "bg-red-100", text: "text-red-800", label: "Inactive" },
  }[status];

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}

function TypeBadge({ type }: { type: AnnouncementType }) {
  const config = {
    INFO: { bg: "bg-blue-50", text: "text-blue-700", label: "Info" },
    WARNING: { bg: "bg-amber-50", text: "text-amber-700", label: "Warning" },
  }[type];

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}

export default function AnnouncementsDisplay({
  initialData,
  canWrite,
}: AnnouncementsDisplayProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initialData);
  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync state when initialData changes (after router.refresh())
  useEffect(() => {
    setAnnouncements(initialData);
  }, [initialData]);

  const handleCreate = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormMode("create");
  };

  const handleEdit = (announcement: AnnouncementWithStatus) => {
    setFormData({
      title: announcement.title || "",
      message: announcement.message,
      type: announcement.type,
      isActive: announcement.isActive,
      startsAt: formatDateForInput(announcement.startsAt),
      endsAt: formatDateForInput(announcement.endsAt),
    });
    setEditingId(announcement.id);
    setFormMode("edit");
  };

  const handleCancel = () => {
    setFormMode("closed");
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setIsSubmitting(true);
    try {
      if (formMode === "create") {
        await createAnnouncementAction({
          title: formData.title || undefined,
          message: formData.message,
          type: formData.type,
          isActive: formData.isActive,
          startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
          endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
        });
      } else if (formMode === "edit" && editingId) {
        await updateAnnouncementAction({
          id: editingId,
          title: formData.title || undefined,
          message: formData.message,
          type: formData.type,
          isActive: formData.isActive,
          startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
          endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
        });
      }
      handleCancel();
      router.refresh();
    } catch (error) {
      console.error("Failed to save announcement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteAnnouncementAction(id);
      setDeleteConfirmId(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Total:{" "}
            <strong className="text-gray-900">{announcements.length}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && formMode === "closed" && (
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Create Announcement
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {formMode !== "closed" && (
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {formMode === "create" ? "New Announcement" : "Edit Announcement"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (optional)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Announcement message"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as AnnouncementType,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starts At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) =>
                    setFormData({ ...formData, startsAt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ends At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) =>
                    setFormData({ ...formData, endsAt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.message.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : formMode === "create"
                    ? "Create"
                    : "Update"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {announcements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  {canWrite && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        {announcement.title && (
                          <div className="text-sm font-medium text-gray-900">
                            {announcement.title}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {announcement.message}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={announcement.type} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={announcement.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {announcement.startsAt || announcement.endsAt ? (
                        <div className="space-y-1">
                          {announcement.startsAt && (
                            <div>
                              From:{" "}
                              <ClientDate date={announcement.startsAt} />
                            </div>
                          )}
                          {announcement.endsAt && (
                            <div>
                              Until:{" "}
                              <ClientDate date={announcement.endsAt} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Always</span>
                      )}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        {deleteConfirmId === announcement.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">
                              Delete?
                            </span>
                            <button
                              onClick={() => handleDelete(announcement.id)}
                              disabled={isSubmitting}
                              className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(announcement)}
                              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirmId(announcement.id)
                              }
                              className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No announcements yet
          </div>
        )}
      </div>
    </>
  );
}
