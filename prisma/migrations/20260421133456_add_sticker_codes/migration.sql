-- CreateTable
CREATE TABLE "StickerCode" (
    "code" TEXT NOT NULL,
    "userId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StickerCode_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "StickerCode_userId_key" ON "StickerCode"("userId");

-- CreateIndex
CREATE INDEX "StickerCode_userId_idx" ON "StickerCode"("userId");

-- AddForeignKey
ALTER TABLE "StickerCode" ADD CONSTRAINT "StickerCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
