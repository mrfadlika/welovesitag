require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { DEFAULT_RETASE_RATES, RETASE_RATE_KEYS } = require('../utils/settings');

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
      registeredBy: 'Dedi Kurniawan',
      registeredByRole: 'Checker Pit',
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
      registeredBy: 'Dedi Kurniawan',
      registeredByRole: 'Checker Pit',
      registeredAt: new Date(Date.now() - 3600000),
      status: 'in_checkout',
      photo: null,
    },
  });

  const truckTwo = await prisma.truck.upsert({
    where: { code: 'TRK-002' },
    update: {
      truckNumber: 'DD 5678 CD',
      truckType: 'fuso',
      truckTypeLabel: 'Fuso',
      registeredBy: 'Dedi Kurniawan',
      registeredByRole: 'Checker Pit',
      registeredAt: new Date(Date.now() - 7200000),
      status: 'exited',
      photo: null,
      lastUpdatedBy: 'Budi Santoso',
      lastUpdatedAt: new Date(Date.now() - 5400000),
    },
    create: {
      code: 'TRK-002',
      truckNumber: 'DD 5678 CD',
      truckType: 'fuso',
      truckTypeLabel: 'Fuso',
      registeredBy: 'Dedi Kurniawan',
      registeredByRole: 'Checker Pit',
      registeredAt: new Date(Date.now() - 7200000),
      status: 'exited',
      photo: null,
      lastUpdatedBy: 'Budi Santoso',
      lastUpdatedAt: new Date(Date.now() - 5400000),
    },
  });

  const truckThree = await prisma.truck.upsert({
    where: { code: 'TRK-003' },
    update: {
      truckNumber: 'DD 9012 EF',
      truckType: 'fuso',
      truckTypeLabel: 'Fuso',
      registeredBy: 'Dedi Kurniawan',
      registeredByRole: 'Checker Pit',
      registeredAt: new Date(Date.now() - 10800000),
      status: 'exited',
      photo: null,
      lastUpdatedBy: 'Budi Santoso',
      lastUpdatedAt: new Date(Date.now() - 9000000),
    },
    create: {
      code: 'TRK-003',
      truckNumber: 'DD 9012 EF',
      truckType: 'fuso',
      truckTypeLabel: 'Fuso',
      registeredBy: 'Dedi Kurniawan',
      registeredByRole: 'Checker Pit',
      registeredAt: new Date(Date.now() - 10800000),
      status: 'exited',
      photo: null,
      lastUpdatedBy: 'Budi Santoso',
      lastUpdatedAt: new Date(Date.now() - 9000000),
    },
  });

  await prisma.checkout.upsert({
    where: { code: 'RET-001' },
    update: {
      truckId: truckOne.id,
      truckCode: truckOne.code,
      truckNumber: truckOne.truckNumber,
      truckType: truckOne.truckType,
      truckTypeLabel: truckOne.truckTypeLabel,
      materialType: 'Tanah timbunan',
      pitOwner: 'Pit Anugrah',
      excaId: 'Hitachi-01',
      excaOperator: '',
      contractor: 'H Beddu',
      createdBy: 'Dedi Kurniawan',
      createdByRole: 'Checker Pit',
      createdAt: new Date(Date.now() - 1800000),
      status: 'ready_for_exit',
      verifiedBy: null,
      verifiedAt: null,
      photo: null,
    },
    create: {
      code: 'RET-001',
      truckId: truckOne.id,
      truckCode: truckOne.code,
      truckNumber: truckOne.truckNumber,
      truckType: truckOne.truckType,
      truckTypeLabel: truckOne.truckTypeLabel,
      materialType: 'Tanah timbunan',
      pitOwner: 'Pit Anugrah',
      excaId: 'Hitachi-01',
      excaOperator: '',
      contractor: 'H Beddu',
      createdBy: 'Dedi Kurniawan',
      createdByRole: 'Checker Pit',
      createdAt: new Date(Date.now() - 1800000),
      status: 'ready_for_exit',
      verifiedBy: null,
      verifiedAt: null,
      photo: null,
    },
  });

  await prisma.checkout.upsert({
    where: { code: 'RET-002' },
    update: {
      truckId: truckTwo.id,
      truckCode: truckTwo.code,
      truckNumber: truckTwo.truckNumber,
      truckType: truckTwo.truckType,
      truckTypeLabel: truckTwo.truckTypeLabel,
      materialType: 'Batu gajah',
      pitOwner: 'Pit Geostone Family',
      excaId: 'Komatsu-01',
      excaOperator: '',
      contractor: 'Sapri',
      createdBy: 'Dedi Kurniawan',
      createdByRole: 'Checker Pit',
      createdAt: new Date(Date.now() - 6300000),
      status: 'verified',
      verifiedBy: 'Budi Santoso',
      verifiedAt: new Date(Date.now() - 5400000),
      photo: null,
    },
    create: {
      code: 'RET-002',
      truckId: truckTwo.id,
      truckCode: truckTwo.code,
      truckNumber: truckTwo.truckNumber,
      truckType: truckTwo.truckType,
      truckTypeLabel: truckTwo.truckTypeLabel,
      materialType: 'Batu gajah',
      pitOwner: 'Pit Geostone Family',
      excaId: 'Komatsu-01',
      excaOperator: '',
      contractor: 'Sapri',
      createdBy: 'Dedi Kurniawan',
      createdByRole: 'Checker Pit',
      createdAt: new Date(Date.now() - 6300000),
      status: 'verified',
      verifiedBy: 'Budi Santoso',
      verifiedAt: new Date(Date.now() - 5400000),
      photo: null,
    },
  });

  await prisma.checkout.upsert({
    where: { code: 'RET-003' },
    update: {
      truckId: truckThree.id,
      truckCode: truckThree.code,
      truckNumber: truckThree.truckNumber,
      truckType: truckThree.truckType,
      truckTypeLabel: truckThree.truckTypeLabel,
      materialType: 'Tanah timbunan',
      pitOwner: 'Pit H Naja',
      excaId: 'Hitachi-02',
      excaOperator: '',
      contractor: 'H Abbas',
      createdBy: 'Dedi Kurniawan',
      createdByRole: 'Checker Pit',
      createdAt: new Date(Date.now() - 9900000),
      status: 'verified',
      verifiedBy: 'Budi Santoso',
      verifiedAt: new Date(Date.now() - 9000000),
      photo: null,
    },
    create: {
      code: 'RET-003',
      truckId: truckThree.id,
      truckCode: truckThree.code,
      truckNumber: truckThree.truckNumber,
      truckType: truckThree.truckType,
      truckTypeLabel: truckThree.truckTypeLabel,
      materialType: 'Tanah timbunan',
      pitOwner: 'Pit H Naja',
      excaId: 'Hitachi-02',
      excaOperator: '',
      contractor: 'H Abbas',
      createdBy: 'Dedi Kurniawan',
      createdByRole: 'Checker Pit',
      createdAt: new Date(Date.now() - 9900000),
      status: 'verified',
      verifiedBy: 'Budi Santoso',
      verifiedAt: new Date(Date.now() - 9000000),
      photo: null,
    },
  });
}

async function seedSettings() {
  await prisma.appSetting.upsert({
    where: { key: RETASE_RATE_KEYS.fuso },
    update: { value: String(DEFAULT_RETASE_RATES.fuso) },
    create: {
      key: RETASE_RATE_KEYS.fuso,
      value: String(DEFAULT_RETASE_RATES.fuso),
    },
  });

  await prisma.appSetting.upsert({
    where: { key: RETASE_RATE_KEYS.dyna },
    update: { value: String(DEFAULT_RETASE_RATES.dyna) },
    create: {
      key: RETASE_RATE_KEYS.dyna,
      value: String(DEFAULT_RETASE_RATES.dyna),
    },
  });
}

async function main() {
  await seedUsers();
  await seedSettings();
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
