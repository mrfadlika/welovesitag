-- AlterTable
ALTER TABLE "Truck" ADD COLUMN "equipmentId" TEXT;
ALTER TABLE "Truck" ADD COLUMN "hullNumber" TEXT;
ALTER TABLE "Truck" ADD COLUMN "notes" TEXT;
ALTER TABLE "Truck" ADD COLUMN "ownerName" TEXT;

-- CreateIndex
CREATE INDEX "Truck_hullNumber_idx" ON "Truck"("hullNumber");
