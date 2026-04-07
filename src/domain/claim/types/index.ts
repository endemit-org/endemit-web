// Note: EventClaimStatus will be available from @prisma/client after running migration
export type EventClaimStatus = "PENDING" | "APPROVED";

export interface CreateEventClaimData {
  userId: string;
  eventId: string;
  eventName: string;
}

export interface EventClaimWithEvent {
  id: string;
  userId: string;
  eventId: string;
  eventName: string;
  status: EventClaimStatus;
  createdAt: Date;
  approvedAt: Date | null;
}

export enum EventClaimQueueEvent {
  PROCESS_CLAIM = "event-claim/process",
}

export interface EventClaimQueueData {
  claimId: string;
  userId: string;
  userEmail: string;
  eventId: string;
  eventName: string;
}
