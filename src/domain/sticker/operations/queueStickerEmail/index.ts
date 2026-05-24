import "server-only";

import { inngest } from "@/lib/services/inngest";
import {
  StickerQueueEvent,
  type StickerLinkedNotificationData,
  type StickerUnlinkedNotificationData,
  type StickerReplacedNotificationData,
} from "@/domain/sticker/types";

export const queueStickerLinkedEmail = async (
  data: StickerLinkedNotificationData
) => {
  return await inngest.send({
    name: StickerQueueEvent.NOTIFY_LINKED,
    data,
  });
};

export const queueStickerUnlinkedEmail = async (
  data: StickerUnlinkedNotificationData
) => {
  return await inngest.send({
    name: StickerQueueEvent.NOTIFY_UNLINKED,
    data,
  });
};

export const queueStickerReplacedEmail = async (
  data: StickerReplacedNotificationData
) => {
  return await inngest.send({
    name: StickerQueueEvent.NOTIFY_REPLACED,
    data,
  });
};
