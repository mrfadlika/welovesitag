-- AlterTable
ALTER TABLE "Checkout" ADD COLUMN "materialType" TEXT;
ALTER TABLE "Checkout" ADD COLUMN "contractor" TEXT;

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Checkout_materialType_idx" ON "Checkout"("materialType");

-- CreateIndex
CREATE INDEX "Checkout_contractor_idx" ON "Checkout"("contractor");
