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

-- CreateIndex
CREATE UNIQUE INDEX "HeavyEquipment_code_key" ON "HeavyEquipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HeavyEquipment_equipmentId_key" ON "HeavyEquipment"("equipmentId");

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
