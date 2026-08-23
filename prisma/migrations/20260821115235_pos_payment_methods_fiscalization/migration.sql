-- CreateEnum
CREATE TYPE "PosPaymentMethod" AS ENUM ('WALLET', 'CASH', 'CARD');

-- CreateEnum
CREATE TYPE "FiscalInvoiceStatus" AS ENUM ('PENDING', 'SUBMITTED', 'FAILED');

-- AlterTable
ALTER TABLE "PosOrder" ADD COLUMN     "paymentMethod" "PosPaymentMethod";

-- AlterTable
ALTER TABLE "PosRegister" ADD COLUMN     "acceptsCard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsCash" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsWallet" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fiscalizeInvoices" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "taxNumber" TEXT;

-- CreateTable
CREATE TABLE "FiscalInvoice" (
    "id" TEXT NOT NULL,
    "posOrderId" TEXT NOT NULL,
    "invoiceNumber" INTEGER NOT NULL,
    "businessPremiseId" TEXT NOT NULL,
    "electronicDeviceId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "zoi" TEXT NOT NULL,
    "eor" TEXT,
    "status" "FiscalInvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "isStorno" BOOLEAN NOT NULL DEFAULT false,
    "referenceInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalCounter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FiscalCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalInvoice_status_idx" ON "FiscalInvoice"("status");

-- CreateIndex
CREATE INDEX "FiscalInvoice_invoiceNumber_idx" ON "FiscalInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalInvoice_posOrderId_isStorno_key" ON "FiscalInvoice"("posOrderId", "isStorno");

-- CreateIndex
CREATE INDEX "PosOrder_registerId_status_paymentMethod_idx" ON "PosOrder"("registerId", "status", "paymentMethod");

-- AddForeignKey
ALTER TABLE "FiscalInvoice" ADD CONSTRAINT "FiscalInvoice_posOrderId_fkey" FOREIGN KEY ("posOrderId") REFERENCES "PosOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalInvoice" ADD CONSTRAINT "FiscalInvoice_referenceInvoiceId_fkey" FOREIGN KEY ("referenceInvoiceId") REFERENCES "FiscalInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: all historical paid orders were wallet payments
UPDATE "PosOrder" SET "paymentMethod" = 'WALLET' WHERE "status" = 'PAID';

-- Seed the single-row fiscal counter
INSERT INTO "FiscalCounter" ("id", "lastNumber") VALUES (1, 0) ON CONFLICT DO NOTHING;
