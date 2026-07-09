-- CreateEnum
CREATE TYPE "StickerCodeProperty" AS ENUM ('Festival26Black', 'Festival26Red', 'Festival26Blue');

-- AlterTable
ALTER TABLE "StickerCode" ADD COLUMN     "property" "StickerCodeProperty";
