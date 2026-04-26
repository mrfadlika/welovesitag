const express = require('express');
const db = require('../data/db');

const router = express.Router();

/**
 * GET /api/trucks
 * Get all trucks
 */
router.get('/', (req, res) => {
  const { status } = req.query;

  let trucks = db.trucks;

  if (status) {
    trucks = trucks.filter((t) => t.status === status);
  }

  return res.status(200).json({
    success: true,
    data: trucks,
    count: trucks.length,
  });
});

/**
 * GET /api/trucks/:id
 * Get single truck
 */
router.get('/:id', (req, res) => {
  const truck = db.trucks.find((t) => t.id === req.params.id);

  if (!truck) {
    return res.status(404).json({
      success: false,
      message: 'Truck tidak ditemukan',
    });
  }

  return res.status(200).json({
    success: true,
    data: truck,
  });
});

/**
 * POST /api/trucks
 * Register new truck entering (Staff POS)
 * Body: { truckNumber, truckType, photo?, registeredBy, registeredByRole }
 */
router.post('/', (req, res) => {
  const { truckNumber, truckType, photo, registeredBy, registeredByRole } =
    req.body;

  // Validation
  if (!truckNumber || !truckType) {
    return res.status(400).json({
      success: false,
      message: 'No. polisi dan jenis truk wajib diisi',
    });
  }

  // Check if truck already registered today
  const existing = db.trucks.find(
    (t) => t.truckNumber === truckNumber && t.status !== 'exited'
  );

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Truck sudah terdaftar dan belum keluar',
      existingId: existing.id,
    });
  }

  // Create new truck entry
  const newTruck = {
    id: `TRK-${String(++db.counters.trucks).padStart(3, '0')}`,
    truckNumber: truckNumber.toUpperCase(),
    truckType: truckType,
    truckTypeLabel: truckType === 'dyna' ? 'Dyna' : 'Fuso',
    registeredBy: registeredBy || 'Unknown',
    registeredByRole: registeredByRole || 'Staff Pos',
    registeredAt: new Date().toISOString(),
    status: 'entered',
    photo: photo || null,
  };

  db.trucks.push(newTruck);

  return res.status(201).json({
    success: true,
    message: 'Truck berhasil didaftarkan masuk',
    data: newTruck,
  });
});

/**
 * PATCH /api/trucks/:id/status
 * Update truck status
 * Body: { status, updatedBy }
 */
router.patch('/:id/status', (req, res) => {
  const { status, updatedBy } = req.body;
  const truck = db.trucks.find((t) => t.id === req.params.id);

  if (!truck) {
    return res.status(404).json({
      success: false,
      message: 'Truck tidak ditemukan',
    });
  }

  truck.status = status;
  truck.lastUpdatedBy = updatedBy;
  truck.lastUpdatedAt = new Date().toISOString();

  return res.status(200).json({
    success: true,
    message: 'Status truck berhasil diperbarui',
    data: truck,
  });
});

module.exports = router;
