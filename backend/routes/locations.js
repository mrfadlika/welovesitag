const express = require('express');
const prisma = require('../lib/prisma');
const { getNextCode } = require('../utils/id-generator');

const router = express.Router();

function serializeLocation(loc) {
  return {
    id: loc.code,
    name: loc.name,
    ownerName: loc.ownerName || null,
    notes: loc.notes || null,
    registeredBy: loc.registeredBy,
    registeredByRole: loc.registeredByRole,
    registeredAt: loc.registeredAt,
    status: loc.status,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    const locations = await prisma.locationData.findMany({
      where: status ? { status } : undefined,
      orderBy: { registeredAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: locations.map(serializeLocation),
      count: locations.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      ownerName,
      notes,
      registeredBy,
      registeredByRole,
      createdBy,
      createdByRole,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama lokasi wajib diisi',
      });
    }

    const newLocation = await prisma.locationData.create({
      data: {
        code: await getNextCode(prisma.locationData, 'LOC'),
        name: String(name).trim(),
        ownerName: ownerName ? String(ownerName).trim() : null,
        notes: notes ? String(notes).trim() : null,
        registeredBy: registeredBy || createdBy || 'Unknown',
        registeredByRole: registeredByRole || createdByRole || 'Admin',
        status: 'active',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Lokasi berhasil didaftarkan',
      data: serializeLocation(newLocation),
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const {
      name,
      ownerName,
      notes,
    } = req.body;

    const location = await prisma.locationData.findUnique({
      where: { code: req.params.id },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Lokasi tidak ditemukan',
      });
    }

    const updatedLocation = await prisma.locationData.update({
      where: { code: req.params.id },
      data: {
        name: name !== undefined ? (name ? String(name).trim() : null) : location.name,
        ownerName: ownerName !== undefined ? (ownerName ? String(ownerName).trim() : null) : location.ownerName,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : location.notes,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Data lokasi berhasil diperbarui',
      data: serializeLocation(updatedLocation),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const location = await prisma.locationData.findUnique({
      where: { code: req.params.id },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Lokasi tidak ditemukan',
      });
    }

    await prisma.locationData.delete({
      where: { code: req.params.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Lokasi berhasil dihapus',
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
