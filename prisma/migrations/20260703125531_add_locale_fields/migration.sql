-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'sl';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'sl';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'sl';
