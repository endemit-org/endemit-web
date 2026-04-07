-- CreateEnum
CREATE TYPE "EventClaimStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateTable
CREATE TABLE "EventClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "status" "EventClaimStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventClaim_userId_idx" ON "EventClaim"("userId");

-- CreateIndex
CREATE INDEX "EventClaim_status_idx" ON "EventClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EventClaim_userId_eventId_key" ON "EventClaim"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "EventClaim" ADD CONSTRAINT "EventClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
