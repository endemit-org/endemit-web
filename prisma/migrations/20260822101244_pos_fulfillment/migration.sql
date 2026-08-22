-- CreateEnum
CREATE TYPE "PosFulfillmentStatus" AS ENUM ('OPEN', 'COMPLETED');

-- AlterTable
ALTER TABLE "PosOrder" ADD COLUMN     "fulfilledAt" TIMESTAMP(3),
ADD COLUMN     "fulfillmentStatus" "PosFulfillmentStatus",
ADD COLUMN     "note" TEXT,
ADD COLUMN     "queueNumber" INTEGER;

-- AlterTable
ALTER TABLE "PosRegister" ADD COLUMN     "trackFulfillment" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PosOrder_registerId_fulfillmentStatus_idx" ON "PosOrder"("registerId", "fulfillmentStatus");
