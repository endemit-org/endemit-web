-- CreateEnum
CREATE TYPE "PosItemDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "PosItemStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PosRegisterStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PosOrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WalletTransactionType" ADD VALUE 'POS_PURCHASE';
ALTER TYPE "WalletTransactionType" ADD VALUE 'POS_TIP';
ALTER TYPE "WalletTransactionType" ADD VALUE 'CARD_TOPUP';
ALTER TYPE "WalletTransactionType" ADD VALUE 'CASH_TOPUP';

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "posOrderId" TEXT;

-- CreateTable
CREATE TABLE "PosItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" INTEGER NOT NULL,
    "direction" "PosItemDirection" NOT NULL,
    "status" "PosItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosRegister" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PosRegisterStatus" NOT NULL DEFAULT 'ACTIVE',
    "canTopUp" BOOLEAN NOT NULL DEFAULT false,
    "tipPool" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosRegisterItem" (
    "id" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosRegisterItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosRegisterSeller" (
    "id" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosRegisterSeller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosOrder" (
    "id" TEXT NOT NULL,
    "orderHash" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "customerId" TEXT,
    "walletId" TEXT,
    "subtotal" INTEGER NOT NULL,
    "tipAmount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "status" "PosOrderStatus" NOT NULL DEFAULT 'PENDING',
    "scannedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "copiedFromId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "PosOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PosItem_status_idx" ON "PosItem"("status");

-- CreateIndex
CREATE INDEX "PosRegister_status_idx" ON "PosRegister"("status");

-- CreateIndex
CREATE INDEX "PosRegisterItem_registerId_idx" ON "PosRegisterItem"("registerId");

-- CreateIndex
CREATE INDEX "PosRegisterItem_itemId_idx" ON "PosRegisterItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "PosRegisterItem_registerId_itemId_key" ON "PosRegisterItem"("registerId", "itemId");

-- CreateIndex
CREATE INDEX "PosRegisterSeller_registerId_idx" ON "PosRegisterSeller"("registerId");

-- CreateIndex
CREATE INDEX "PosRegisterSeller_userId_idx" ON "PosRegisterSeller"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PosRegisterSeller_registerId_userId_key" ON "PosRegisterSeller"("registerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PosOrder_orderHash_key" ON "PosOrder"("orderHash");

-- CreateIndex
CREATE UNIQUE INDEX "PosOrder_shortCode_key" ON "PosOrder"("shortCode");

-- CreateIndex
CREATE INDEX "PosOrder_orderHash_idx" ON "PosOrder"("orderHash");

-- CreateIndex
CREATE INDEX "PosOrder_shortCode_idx" ON "PosOrder"("shortCode");

-- CreateIndex
CREATE INDEX "PosOrder_registerId_idx" ON "PosOrder"("registerId");

-- CreateIndex
CREATE INDEX "PosOrder_sellerId_idx" ON "PosOrder"("sellerId");

-- CreateIndex
CREATE INDEX "PosOrder_customerId_idx" ON "PosOrder"("customerId");

-- CreateIndex
CREATE INDEX "PosOrder_status_idx" ON "PosOrder"("status");

-- CreateIndex
CREATE INDEX "PosOrder_expiresAt_idx" ON "PosOrder"("expiresAt");

-- CreateIndex
CREATE INDEX "PosOrderItem_orderId_idx" ON "PosOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "PosOrderItem_itemId_idx" ON "PosOrderItem"("itemId");

-- CreateIndex
CREATE INDEX "WalletTransaction_posOrderId_idx" ON "WalletTransaction"("posOrderId");

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_posOrderId_fkey" FOREIGN KEY ("posOrderId") REFERENCES "PosOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosRegisterItem" ADD CONSTRAINT "PosRegisterItem_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "PosRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosRegisterItem" ADD CONSTRAINT "PosRegisterItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PosItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosRegisterSeller" ADD CONSTRAINT "PosRegisterSeller_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "PosRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosRegisterSeller" ADD CONSTRAINT "PosRegisterSeller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "PosRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrderItem" ADD CONSTRAINT "PosOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PosOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrderItem" ADD CONSTRAINT "PosOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PosItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

