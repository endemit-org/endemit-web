-- CreateTable
CREATE TABLE "WalletPassRegistration" (
    "id" TEXT NOT NULL,
    "deviceLibraryId" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "passTypeId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "authToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletPassRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletPassRegistration_device_pass_serial_key" ON "WalletPassRegistration"("deviceLibraryId", "passTypeId", "serialNumber");

-- CreateIndex
CREATE INDEX "WalletPassRegistration_serialNumber_idx" ON "WalletPassRegistration"("serialNumber");
