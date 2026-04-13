const express = require('express');
const db = require('../data/db');

const router = express.Router();

/**
 * GET /api/checkouts
 * Get all checkouts
 */
router.get('/', (req, res) => {
  const { status, truckId } = req.query;

  let checkouts = db.checkouts;

  if (status) {
    checkouts = checkouts.filter((c) => c.status === status);
  }

  if (truckId) {
    checkouts = checkouts.filter((c) => c.truckId === truckId);
  }

  return res.status(200).json({
    success: true,
    data: checkouts,
    count: checkouts.length,
  });
});

/**
 * GET /api/checkouts/:id
 * Get single checkout
 */
router.get('/:id', (req, res) => {
  const checkout = db.checkouts.find((c) => c.id === req.params.id);

  if (!checkout) {
    return res.status(404).json({
      success: false,
      message: 'Checkout tidak ditemukan',
    });
  }

  return res.status(200).json({
    success: true,
    data: checkout,
  });
});

/**
 * POST /api/checkouts
 * Create checkout entry (Checker input)
 * Body: { truckId or truckNumber, pitOwner, excaId, excaOperator, createdBy, photo? }
 */
router.post('/', (req, res) => {
  let {
    truckId,
    truckNumber,
    pitOwner,
    excaId,
    excaOperator,
    createdBy,
    photo,
  } = req.body;

  // Validation - need truck info, pit, excavator
  if ((!truckId && !truckNumber) || !pitOwner || !excaId || !excaOperator) {
    return res.status(400).json({
      success: false,
      message:
        'Truck ID/Number, Pit Owner, Excavator ID, dan Operator nama wajib diisi',
    });
  }

  // If only truckNumber provided, look up the truck
  let truck;
  if (truckId) {
    truck = db.trucks.find((t) => t.id === truckId);
  } else if (truckNumber) {
    truck = db.trucks.find((t) => t.truckNumber === truckNumber);
  }

  if (!truck) {
    return res.status(404).json({
      success: false,
      message: 'Truck tidak ditemukan. Pastikan truck sudah terdaftar sebelumnya.',
    });
  }

  truckId = truck.id;

  // Check if already has checkout
  const existingCheckout = db.checkouts.find(
    (c) => c.truckId === truckId && c.status !== 'exited'
  );

  if (existingCheckout) {
    return res.status(400).json({
      success: false,
      message: 'Truck ini sudah ada checkout yang belum selesai',
      existingId: existingCheckout.id,
    });
  }

  // Create new checkout
  const newCheckout = {
    id: `CHK-${String(++db.counters.checkouts).padStart(3, '0')}`,
    truckId,
    truckNumber: truck.truckNumber,
    pitOwner,
    excaId: excaId.toUpperCase(),
    excaOperator,
    createdBy: createdBy || 'Unknown',
    createdAt: new Date().toISOString(),
    status: 'ready_for_exit', // ready_for_exit -> verified -> exited
    verifiedBy: null,
    verifiedAt: null,
    photo: photo || null,
  };

  db.checkouts.push(newCheckout);

  // Update truck status
  truck.status = 'in_checkout';

  return res.status(201).json({
    success: true,
    message: 'Checkout entry berhasil dibuat',
    data: newCheckout,
  });
});

/**
 * PATCH /api/checkouts/:id/verify
 * Verify checkout (Staff POS approval)
 * Body: { verifiedBy, approved }
 */
router.patch('/:id/verify', (req, res) => {
  const { verifiedBy, approved } = req.body;
  const checkout = db.checkouts.find((c) => c.id === req.params.id);

  if (!checkout) {
    return res.status(404).json({
      success: false,
      message: 'Checkout tidak ditemukan',
    });
  }

  if (!approved) {
    // Rejection
    checkout.status = 'rejected';
    checkout.verifiedBy = verifiedBy || 'Unknown';
    checkout.verifiedAt = new Date().toISOString();

    // Revert truck status
    const truck = db.trucks.find((t) => t.id === checkout.truckId);
    if (truck) {
      truck.status = 'entered';
    }

    return res.status(200).json({
      success: true,
      message: 'Checkout ditolak',
      data: checkout,
    });
  }

  // Approval
  checkout.status = 'verified';
  checkout.verifiedBy = verifiedBy || 'Unknown';
  checkout.verifiedAt = new Date().toISOString();

  // Update truck status to exited
  const truck = db.trucks.find((t) => t.id === checkout.truckId);
  if (truck) {
    truck.status = 'exited';
  }

  return res.status(200).json({
    success: true,
    message: 'Checkout berhasil diverifikasi - Truck keluar',
    data: checkout,
  });
});

/**
 * GET /api/checkouts/truck/:truckId
 * Get all checkouts for a specific truck
 */
router.get('/truck/:truckId', (req, res) => {
  const checkouts = db.checkouts.filter((c) => c.truckId === req.params.truckId);

  return res.status(200).json({
    success: true,
    data: checkouts,
    count: checkouts.length,
  });
});

module.exports = router;
