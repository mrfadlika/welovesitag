const express = require('express');
const prisma = require('../lib/prisma');
const { getNextCode } = require('../utils/id-generator');
const { serializeTruck } = require('../utils/serializers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    const trucks = await prisma.truck.findMany({
      where: status ? { status } : undefined,
      orderBy: { registeredAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: trucks.map(serializeTruck),
      count: trucks.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const truck = await prisma.truck.findUnique({
      where: { code: req.params.id },
    });

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeTruck(truck),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      truckNumber,
      truckType,
      photo,
      registeredBy,
      registeredByRole,
      createdBy,
      createdByRole,
    } = req.body;

    if (!truckNumber || !truckType) {
      return res.status(400).json({
        success: false,
        message: 'No. polisi dan jenis truk wajib diisi',
      });
    }

    const normalizedTruckNumber = truckNumber.toUpperCase();
    const existingTruck = await prisma.truck.findFirst({
      where: {
        truckNumber: normalizedTruckNumber,
        status: { not: 'exited' },
      },
      orderBy: { registeredAt: 'desc' },
    });

    if (existingTruck) {
      return res.status(400).json({
        success: false,
        message: 'Truck sudah terdaftar dan belum keluar',
        existingId: existingTruck.code,
      });
    }

    const newTruck = await prisma.truck.create({
      data: {
        code: await getNextCode(prisma.truck, 'TRK'),
        truckNumber: normalizedTruckNumber,
        truckType,
        truckTypeLabel: truckType === 'dyna' ? 'Dyna' : 'Fuso',
        registeredBy: registeredBy || createdBy || 'Unknown',
        registeredByRole: registeredByRole || createdByRole || 'Staff Pos',
        status: 'entered',
        photo: photo || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Truck berhasil didaftarkan masuk',
      data: serializeTruck(newTruck),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, updatedBy } = req.body;

    const truck = await prisma.truck.findUnique({
      where: { code: req.params.id },
    });

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck tidak ditemukan',
      });
    }

    const updatedTruck = await prisma.truck.update({
      where: { code: req.params.id },
      data: {
        status,
        lastUpdatedBy: updatedBy || null,
        lastUpdatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Status truck berhasil diperbarui',
      data: serializeTruck(updatedTruck),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
