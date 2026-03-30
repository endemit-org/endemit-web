-- CreateEnum
CREATE TYPE "SignInType" AS ENUM ('PASSWORD', 'OTC');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "signInType" "SignInType" NOT NULL DEFAULT 'PASSWORD';

-- CreateTable
CREATE TABLE "OtcToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "magicLink" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtcToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtcRateLimit" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtcRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OtcToken_magicLink_key" ON "OtcToken"("magicLink");

-- CreateIndex
CREATE INDEX "OtcToken_userId_idx" ON "OtcToken"("userId");

-- CreateIndex
CREATE INDEX "OtcToken_code_idx" ON "OtcToken"("code");

-- CreateIndex
CREATE INDEX "OtcToken_magicLink_idx" ON "OtcToken"("magicLink");

-- CreateIndex
CREATE INDEX "OtcToken_expiresAt_idx" ON "OtcToken"("expiresAt");

-- CreateIndex
CREATE INDEX "OtcRateLimit_email_idx" ON "OtcRateLimit"("email");

-- CreateIndex
CREATE INDEX "OtcRateLimit_createdAt_idx" ON "OtcRateLimit"("createdAt");

-- AddForeignKey
ALTER TABLE "OtcToken" ADD CONSTRAINT "OtcToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
