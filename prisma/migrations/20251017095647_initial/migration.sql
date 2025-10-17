-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'EXPIRED', 'REFUND_REQUESTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'CANCELLED', 'SCANNED', 'VALIDATED', 'BANNED', 'REFUND_REQUESTED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "stripeSession" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "shippingAmount" DECIMAL(10,2),
    "shippingRequired" BOOLEAN NOT NULL,
    "shippingAddress" JSONB,
    "items" JSONB NOT NULL,
    "metadata" JSONB,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "shortId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "ticketHolderName" TEXT NOT NULL,
    "ticketPayerEmail" TEXT NOT NULL,
    "ticketHash" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "qrContent" JSONB,
    "metadata" JSONB,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSession_key" ON "Order"("stripeSession");

-- CreateIndex
CREATE INDEX "Order_stripeSession_idx" ON "Order"("stripeSession");

-- CreateIndex
CREATE INDEX "Order_email_idx" ON "Order"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_shortId_key" ON "Ticket"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketHash_key" ON "Ticket"("ticketHash");

-- CreateIndex
CREATE INDEX "Ticket_ticketHash_idx" ON "Ticket"("ticketHash");

-- CreateIndex
CREATE INDEX "Ticket_eventId_idx" ON "Ticket"("eventId");

-- CreateIndex
CREATE INDEX "Ticket_ticketPayerEmail_idx" ON "Ticket"("ticketPayerEmail");

-- CreateIndex
CREATE INDEX "Ticket_orderId_idx" ON "Ticket"("orderId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
