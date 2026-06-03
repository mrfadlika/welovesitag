/*
  Warnings:

  - You are about to drop the column `hullNumber` on the `Truck` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "HeavyEquipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "brand" TEXT,
    "type" TEXT,
    "ownerName" TEXT,
    "notes" TEXT,
    "registeredBy" TEXT NOT NULL,
    "registeredByRole" TEXT NOT NULL,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LocationData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT,
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
    "brand" TEXT,
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
CREATE INDEX "Truck_status_idx" ON "Truck"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "HeavyEquipment_code_key" ON "HeavyEquipment"("code");

-- CreateIndex
CREATE INDEX "HeavyEquipment_equipmentId_idx" ON "HeavyEquipment"("equipmentId");

-- CreateIndex
CREATE INDEX "HeavyEquipment_status_idx" ON "HeavyEquipment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LocationData_code_key" ON "LocationData"("code");

-- CreateIndex
CREATE INDEX "LocationData_name_idx" ON "LocationData"("name");

-- CreateIndex
CREATE INDEX "LocationData_status_idx" ON "LocationData"("status");
