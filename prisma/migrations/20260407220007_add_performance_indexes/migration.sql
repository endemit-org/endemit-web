-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PosOrder_status_expiresAt_idx" ON "PosOrder"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Ticket_eventId_status_idx" ON "Ticket"("eventId", "status");

-- CreateIndex
CREATE INDEX "Ticket_eventId_isGuestList_idx" ON "Ticket"("eventId", "isGuestList");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
