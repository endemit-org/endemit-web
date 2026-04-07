"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import { dismissAnnouncementAction } from "@/domain/announcement/actions/dismissAnnouncementAction";
import { fetchActiveAnnouncementsAction } from "@/domain/announcement/actions/fetchActiveAnnouncementsAction";
import AnnouncementBanner from "@/app/_components/profile/AnnouncementBanner";
import type { Announcement } from "@prisma/client";

interface ProfileAnnouncementsBannerProps {
  initialAnnouncements: Announcement[];
}

export default function ProfileAnnouncementsBanner({
  initialAnnouncements,
}: ProfileAnnouncementsBannerProps) {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(initialAnnouncements);
  const dismissedIdsRef = useRef<Set<string>>(new Set());

  // Fetch announcements (for scheduled ones that become active)
  const fetchAnnouncements = useCallback(async () => {
    try {
      const fresh = await fetchActiveAnnouncementsAction();
      // Filter out any we've dismissed this session
      const filtered = fresh.filter(
        (a: Announcement) => !dismissedIdsRef.current.has(a.id)
      );
      setAnnouncements(filtered);
    } catch {
      // Silent fail - don't disrupt user experience
    }
  }, []);

  // Refresh only when user returns to tab (catches scheduled announcements)
  // No interval polling - realtime handles immediate announcements
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchAnnouncements();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchAnnouncements]);

  // Subscribe to new announcements
  useRealtimeChannel({
    channelName: "announcements:global",
    event: "announcement_created",
    onMessage: (payload) => {
      setAnnouncements((prev) => [
        {
          id: payload.id,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          isActive: true,
          startsAt: null,
          endsAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...prev,
      ]);
    },
  });

  // Subscribe to updated announcements
  useRealtimeChannel({
    channelName: "announcements:global",
    event: "announcement_updated",
    onMessage: (payload) => {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === payload.id
            ? {
                ...a,
                title: payload.title,
                message: payload.message,
                type: payload.type,
              }
            : a
        )
      );
    },
  });

  // Subscribe to deleted announcements
  useRealtimeChannel({
    channelName: "announcements:global",
    event: "announcement_deleted",
    onMessage: (payload) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== payload.id));
    },
  });

  const handleDismiss = async (id: string) => {
    // Track dismissed ID so polling doesn't bring it back
    dismissedIdsRef.current.add(id);

    // Optimistically remove from UI
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));

    try {
      await dismissAnnouncementAction(id);
    } catch (error) {
      console.error("Failed to dismiss announcement:", error);
      // Could restore the announcement on error, but dismissal is non-critical
    }
  };

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {announcements.map((announcement) => (
        <AnnouncementBanner
          key={announcement.id}
          announcement={announcement}
          onDismiss={() => handleDismiss(announcement.id)}
        />
      ))}
    </div>
  );
}
