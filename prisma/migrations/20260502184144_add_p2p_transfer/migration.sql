-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'P2P_TRANSFER';

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN "relatedTransactionId" TEXT,
                                 ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_relatedTransactionId_key" ON "WalletTransaction"("relatedTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
