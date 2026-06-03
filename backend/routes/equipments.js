const express = require('express');
const prisma = require('../lib/prisma');
const { getNextCode } = require('../utils/id-generator');

const router = express.Router();

function serializeEquipment(eq) {
  return {
    id: eq.code,
    equipmentId: eq.equipmentId,
    brand: eq.brand || null,
    type: eq.type || null,
    ownerName: eq.ownerName || null,
    notes: eq.notes || null,
    registeredBy: eq.registeredBy,
    registeredByRole: eq.registeredByRole,
    registeredAt: eq.registeredAt,
    status: eq.status,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    const equipments = await prisma.heavyEquipment.findMany({
      where: status ? { status } : undefined,
      orderBy: { registeredAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: equipments.map(serializeEquipment),
      count: equipments.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      equipmentId,
      brand,
      type,
      ownerName,
      notes,
      registeredBy,
      registeredByRole,
      createdBy,
      createdByRole,
    } = req.body;

    if (!equipmentId) {
      return res.status(400).json({
        success: false,
        message: 'Id Alat wajib diisi',
      });
    }

    const newEquipment = await prisma.heavyEquipment.create({
      data: {
        code: await getNextCode(prisma.heavyEquipment, 'EQP'),
        equipmentId: String(equipmentId).trim(),
        brand: brand ? String(brand).trim() : null,
        type: type ? String(type).trim() : null,
        ownerName: ownerName ? String(ownerName).trim() : null,
        notes: notes ? String(notes).trim() : null,
        registeredBy: registeredBy || createdBy || 'Unknown',
        registeredByRole: registeredByRole || createdByRole || 'Admin',
        status: 'active',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Alat gali berhasil didaftarkan',
      data: serializeEquipment(newEquipment),
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const {
      equipmentId,
      brand,
      type,
      ownerName,
      notes,
    } = req.body;

    const equipment = await prisma.heavyEquipment.findUnique({
      where: { code: req.params.id },
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Alat gali tidak ditemukan',
      });
    }

    const updatedEquipment = await prisma.heavyEquipment.update({
      where: { code: req.params.id },
      data: {
        equipmentId: equipmentId !== undefined ? (equipmentId ? String(equipmentId).trim() : null) : equipment.equipmentId,
        brand: brand !== undefined ? (brand ? String(brand).trim() : null) : equipment.brand,
        type: type !== undefined ? (type ? String(type).trim() : null) : equipment.type,
        ownerName: ownerName !== undefined ? (ownerName ? String(ownerName).trim() : null) : equipment.ownerName,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : equipment.notes,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Data alat gali berhasil diperbarui',
      data: serializeEquipment(updatedEquipment),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const equipment = await prisma.heavyEquipment.findUnique({
      where: { code: req.params.id },
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Alat gali tidak ditemukan',
      });
    }

    await prisma.heavyEquipment.delete({
      where: { code: req.params.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Alat gali berhasil dihapus',
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
