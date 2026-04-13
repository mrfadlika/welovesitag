require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedUsers() {
  const users = [
    {
      username: 'admin',
      password: 'admin123',
      name: 'Ahmad Rizki',
      role: 'admin',
      email: 'admin@sitag.co.id',
      avatar: null,
      pitArea: null,
    },
    {
      username: 'staffpos',
      password: 'staff123',
      name: 'Budi Santoso',
      role: 'staff_pos',
      email: 'budi@sitag.co.id',
      avatar: null,
      pitArea: null,
    },
    {
      username: 'checker',
      password: 'checker123',
      name: 'Dedi Kurniawan',
      role: 'checker',
      email: 'dedi@sitag.co.id',
      avatar: null,
      pitArea: 'Pit 3 - Blok B',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: user,
      create: user,
    });
  }
}

async function seedTrucksAndCheckouts() {
  const truckOne = await prisma.truck.upsert({
    where: { code: 'TRK-001' },
    update: {
      truckNumber: 'DD 1234 AB',
      truckType: 'dyna',
      truckTypeLabel: 'Dyna',
      registeredBy: 'Budi Santoso',
      registeredByRole: 'Staff Pos',
      registeredAt: new Date(Date.now() - 3600000),
      status: 'in_checkout',
      photo: null,
      lastUpdatedBy: null,
      lastUpdatedAt: null,
    },
    create: {
      code: 'TRK-001',
      truckNumber: 'DD 1234 AB',
      truckType: 'dyna',
      truckTypeLabel: 'Dyna',
      registeredBy: 'Budi Santoso',
      registeredByRole: 'Staff Pos',
      registeredAt: new Date(Date.now() - 3600000),
      status: 'in_checkout',
      photo: null,
    },
  });

  await prisma.truck.upsert({
    where: { code: 'TRK-002' },
    update: {
      truckNumber: 'DD 5678 CD',
      truckType: 'fuso',
      truckTypeLabel: 'Fuso',
      registeredBy: 'Budi Santoso',
      registeredByRole: 'Staff Pos',
      registeredAt: new Date(Date.now() - 7200000),
      status: 'entered',
      photo: null,
      lastUpdatedBy: null,
      lastUpdatedAt: null,
    },
    create: {
      code: 'TRK-002',
      truckNumber: 'DD 5678 CD',
      truckType: 'fuso',
      truckTypeLabel: 'Fuso',
      registeredBy: 'Budi Santoso',
      registeredByRole: 'Staff Pos',
      registeredAt: new Date(Date.now() - 7200000),
      status: 'entered',
      photo: null,
    },
  });

  await prisma.checkout.upsert({
    where: { code: 'CHK-001' },
    update: {
      truckId: truckOne.id,
      truckCode: truckOne.code,
      truckNumber: truckOne.truckNumber,
      truckType: truckOne.truckType,
      truckTypeLabel: truckOne.truckTypeLabel,
      pitOwner: 'PT Mandiri Jaya',
      excaId: 'EXC-001',
      excaOperator: 'Hasan Maulana',
      createdBy: 'Dedi Kurniawan',
      createdByRole: 'Checker',
      createdAt: new Date(Date.now() - 1800000),
      status: 'ready_for_exit',
      verifiedBy: null,
      verifiedAt: null,
      photo: null,
    },
    create: {
      code: 'CHK-001',
      truckId: truckOne.id,
      truckCode: truckOne.code,
      truckNumber: truckOne.truckNumber,
      truckType: truckOne.truckType,
      truckTypeLabel: truckOne.truckTypeLabel,
      pitOwner: 'PT Mandiri Jaya',
      excaId: 'EXC-001',
      excaOperator: 'Hasan Maulana',
      createdBy: 'Dedi Kurniawan',
      createdByRole: 'Checker',
      createdAt: new Date(Date.now() - 1800000),
      status: 'ready_for_exit',
      verifiedBy: null,
      verifiedAt: null,
      photo: null,
    },
  });
}

async function main() {
  await seedUsers();
  await seedTrucksAndCheckouts();
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
