-- CreateTable
CREATE TABLE "TranslationEntry" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranslationEntry_complete_idx" ON "TranslationEntry"("complete");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationEntry_locale_key_key" ON "TranslationEntry"("locale", "key");

-- AddForeignKey
ALTER TABLE "TranslationEntry" ADD CONSTRAINT "TranslationEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
