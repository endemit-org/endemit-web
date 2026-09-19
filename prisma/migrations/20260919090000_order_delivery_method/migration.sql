-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('SHIPPING', 'PICKUP');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'SHIPPING',
ADD COLUMN     "pickupEventDate" TIMESTAMP(3),
ADD COLUMN     "pickupEventName" TEXT,
ADD COLUMN     "pickupEventUid" TEXT;
