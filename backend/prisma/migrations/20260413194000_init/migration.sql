-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "posName" TEXT,
    "pitArea" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "truckNumber" TEXT NOT NULL,
    "truckType" TEXT NOT NULL,
    "truckTypeLabel" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Checkout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "truckId" INTEGER NOT NULL,
    "truckCode" TEXT NOT NULL,
    "truckNumber" TEXT NOT NULL,
    "truckType" TEXT NOT NULL,
    "truckTypeLabel" TEXT NOT NULL,
    "pitOwner" TEXT NOT NULL,
    "excaId" TEXT NOT NULL,
    "excaOperator" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByRole" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "photo" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Checkout_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_code_key" ON "Truck"("code");

-- CreateIndex
CREATE INDEX "Truck_truckNumber_idx" ON "Truck"("truckNumber");

-- CreateIndex
CREATE INDEX "Truck_status_idx" ON "Truck"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Checkout_code_key" ON "Checkout"("code");

-- CreateIndex
CREATE INDEX "Checkout_truckId_idx" ON "Checkout"("truckId");

-- CreateIndex
CREATE INDEX "Checkout_truckCode_idx" ON "Checkout"("truckCode");

-- CreateIndex
CREATE INDEX "Checkout_status_idx" ON "Checkout"("status");
