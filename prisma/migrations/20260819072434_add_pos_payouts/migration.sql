-- CreateEnum
CREATE TYPE "PosPayoutType" AS ENUM ('TIPS', 'CASH');

-- CreateTable
CREATE TABLE "PosPayout" (
    "id" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "type" "PosPayoutType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PosPayout_registerId_createdAt_idx" ON "PosPayout"("registerId", "createdAt");

-- CreateIndex
CREATE INDEX "PosPayout_registerId_type_idx" ON "PosPayout"("registerId", "type");

-- AddForeignKey
ALTER TABLE "PosPayout" ADD CONSTRAINT "PosPayout_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "PosRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosPayout" ADD CONSTRAINT "PosPayout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
