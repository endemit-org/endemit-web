-- CreateEnum
CREATE TYPE "PosPrintJobStatus" AS ENUM ('PENDING', 'PRINTED', 'FAILED');

-- CreateTable
CREATE TABLE "PosPrintJob" (
    "id" TEXT NOT NULL,
    "posOrderId" TEXT NOT NULL,
    "status" "PosPrintJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" TIMESTAMP(3),

    CONSTRAINT "PosPrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PosPrintJob_status_createdAt_idx" ON "PosPrintJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PosPrintJob" ADD CONSTRAINT "PosPrintJob_posOrderId_fkey" FOREIGN KEY ("posOrderId") REFERENCES "PosOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
