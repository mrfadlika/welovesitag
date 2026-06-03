/*
  Warnings:

  - You are about to drop the `HeavyEquipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LocationData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `brand` on the `Truck` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "HeavyEquipment_status_idx";

-- DropIndex
DROP INDEX "HeavyEquipment_equipmentId_idx";

-- DropIndex
DROP INDEX "HeavyEquipment_code_key";

-- DropIndex
DROP INDEX "LocationData_status_idx";

-- DropIndex
DROP INDEX "LocationData_name_idx";

-- DropIndex
DROP INDEX "LocationData_code_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "HeavyEquipment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LocationData";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ContractorData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactNumber" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "registeredBy" TEXT NOT NULL,
    "registeredByRole" TEXT NOT NULL,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Truck" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "truckNumber" TEXT NOT NULL,
    "truckType" TEXT NOT NULL,
    "truckTypeLabel" TEXT NOT NULL,
    "hullNumber" TEXT,
    "equipmentId" TEXT,
    "ownerName" TEXT,
    "notes" TEXT,
    "registeredBy" TEXT NOT NULL,
    "registeredByRole" TEXT NOT NULL,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "photo" TEXT,
    "lastUpdatedBy" TEXT,
    "lastUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Truck" ("code", "createdAt", "equipmentId", "id", "lastUpdatedAt", "lastUpdatedBy", "notes", "ownerName", "photo", "registeredAt", "registeredBy", "registeredByRole", "status", "truckNumber", "truckType", "truckTypeLabel", "updatedAt") SELECT "code", "createdAt", "equipmentId", "id", "lastUpdatedAt", "lastUpdatedBy", "notes", "ownerName", "photo", "registeredAt", "registeredBy", "registeredByRole", "status", "truckNumber", "truckType", "truckTypeLabel", "updatedAt" FROM "Truck";
DROP TABLE "Truck";
ALTER TABLE "new_Truck" RENAME TO "Truck";
CREATE UNIQUE INDEX "Truck_code_key" ON "Truck"("code");
CREATE INDEX "Truck_truckNumber_idx" ON "Truck"("truckNumber");
CREATE INDEX "Truck_hullNumber_idx" ON "Truck"("hullNumber");
CREATE INDEX "Truck_status_idx" ON "Truck"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ContractorData_code_key" ON "ContractorData"("code");

-- CreateIndex
CREATE INDEX "ContractorData_name_idx" ON "ContractorData"("name");

-- CreateIndex
CREATE INDEX "ContractorData_status_idx" ON "ContractorData"("status");
