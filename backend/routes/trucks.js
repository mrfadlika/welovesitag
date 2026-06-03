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
      brand,
      equipmentId,
      ownerName,
      notes,
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

    const newTruck = await prisma.truck.create({
      data: {
        code: await getNextCode(prisma.truck, 'TRK'),
        truckNumber: normalizedTruckNumber,
        truckType,
        truckTypeLabel: truckType === 'dyna' ? 'Dyna' : truckType === 'fuso' ? 'Fuso' : truckType,
        brand: brand ? String(brand).trim() : null,
        equipmentId: equipmentId ? String(equipmentId).trim() : null,
        ownerName: ownerName ? String(ownerName).trim() : null,
        notes: notes ? String(notes).trim() : null,
        registeredBy: registeredBy || createdBy || 'Unknown',
        registeredByRole: registeredByRole || createdByRole || 'Admin',
        status: 'registered',
        photo: photo || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Dump truck berhasil didaftarkan',
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

router.put('/:id', async (req, res, next) => {
  try {
    const {
      truckNumber,
      truckType,
      brand,
      equipmentId,
      ownerName,
      notes,
    } = req.body;

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
        truckNumber: truckNumber ? truckNumber.toUpperCase() : truck.truckNumber,
        truckType: truckType || truck.truckType,
        truckTypeLabel: truckType
          ? (truckType === 'dyna' ? 'Dyna' : truckType === 'fuso' ? 'Fuso' : truckType)
          : truck.truckTypeLabel,
        brand: brand !== undefined ? (brand ? String(brand).trim() : null) : truck.brand,
        equipmentId: equipmentId !== undefined ? (equipmentId ? String(equipmentId).trim() : null) : truck.equipmentId,
        ownerName: ownerName !== undefined ? (ownerName ? String(ownerName).trim() : null) : truck.ownerName,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : truck.notes,
        lastUpdatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Data truck berhasil diperbarui',
      data: serializeTruck(updatedTruck),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
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

    // Delete associated checkouts to avoid foreign key constraints
    await prisma.checkout.deleteMany({
      where: { truckId: truck.id },
    });

    await prisma.truck.delete({
      where: { code: req.params.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Truck berhasil dihapus',
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
