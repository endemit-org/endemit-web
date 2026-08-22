-- AlterTable
ALTER TABLE "PosItem" ADD COLUMN     "ticketEventId" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "posOrderId" TEXT;

-- CreateIndex
CREATE INDEX "Ticket_posOrderId_idx" ON "Ticket"("posOrderId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_posOrderId_fkey" FOREIGN KEY ("posOrderId") REFERENCES "PosOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
