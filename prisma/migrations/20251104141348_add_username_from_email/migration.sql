-- Add column as optional first
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Generate username from email (part before @)
UPDATE "User"
SET "username" = SPLIT_PART("email", '@', 1)
WHERE "username" IS NULL;

-- Handle duplicates by appending numbers
WITH duplicates AS (
  SELECT "username", ROW_NUMBER() OVER (PARTITION BY "username" ORDER BY "createdAt") as rn
  FROM "User"
)
UPDATE "User" u
SET "username" = u."username" || '_' || d.rn
FROM duplicates d
WHERE u."username" = d."username" AND d.rn > 1;

-- Make it required and unique
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");
