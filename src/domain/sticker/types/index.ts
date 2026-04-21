export enum StickerQueueEvent {
  NOTIFY_LINKED = "sticker/notify.linked",
  NOTIFY_UNLINKED = "sticker/notify.unlinked",
  NOTIFY_REPLACED = "sticker/notify.replaced",
}

export interface StickerLinkedNotificationData {
  userId: string;
  code: string;
}

export interface StickerUnlinkedNotificationData {
  userId: string;
  code: string;
}

export interface StickerReplacedNotificationData {
  userId: string;
  oldCode: string;
  newCode: string;
}
