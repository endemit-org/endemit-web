-- CreateEnum
CREATE TYPE "TicketTransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "TicketTransfer" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "TicketTransferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedByUserId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketTransfer_token_key" ON "TicketTransfer"("token");

-- CreateIndex
CREATE INDEX "TicketTransfer_ticketId_status_idx" ON "TicketTransfer"("ticketId", "status");

-- CreateIndex
CREATE INDEX "TicketTransfer_recipientEmail_status_idx" ON "TicketTransfer"("recipientEmail", "status");

-- AddForeignKey
ALTER TABLE "TicketTransfer" ADD CONSTRAINT "TicketTransfer_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTransfer" ADD CONSTRAINT "TicketTransfer_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
