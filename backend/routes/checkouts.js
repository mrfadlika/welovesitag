const express = require('express');
const prisma = require('../lib/prisma');
const { getNextCode } = require('../utils/id-generator');
const { serializeCheckout } = require('../utils/serializers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { status, truckId } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (truckId) {
      where.truckCode = truckId;
    }

    const checkouts = await prisma.checkout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: checkouts.map(serializeCheckout),
      count: checkouts.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/truck/:truckId', async (req, res, next) => {
  try {
    const checkouts = await prisma.checkout.findMany({
      where: { truckCode: req.params.truckId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: checkouts.map(serializeCheckout),
      count: checkouts.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const checkout = await prisma.checkout.findUnique({
      where: { code: req.params.id },
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Checkout tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeCheckout(checkout),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    let {
      truckId,
      truckNumber,
      pitOwner,
      excaId,
      excaOperator,
      createdBy,
      createdByRole,
      photo,
    } = req.body;

    if ((!truckId && !truckNumber) || !pitOwner || !excaId || !excaOperator) {
      return res.status(400).json({
        success: false,
        message:
          'Truck ID/Number, Pit Owner, Excavator ID, dan Operator nama wajib diisi',
      });
    }

    const normalizedTruckNumber = truckNumber ? truckNumber.toUpperCase() : null;

    const truck = truckId
      ? await prisma.truck.findUnique({ where: { code: truckId } })
      : await prisma.truck.findFirst({
          where: {
            truckNumber: normalizedTruckNumber,
            status: { in: ['entered', 'in_checkout'] },
          },
          orderBy: { registeredAt: 'desc' },
        });

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck tidak ditemukan. Pastikan truck sudah terdaftar sebelumnya.',
      });
    }

    truckId = truck.code;

    const existingCheckout = await prisma.checkout.findFirst({
      where: {
        truckCode: truck.code,
        status: 'ready_for_exit',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingCheckout) {
      return res.status(400).json({
        success: false,
        message: 'Truck ini sudah ada checkout yang belum selesai',
        existingId: existingCheckout.code,
      });
    }

    const newCheckout = await prisma.$transaction(async (transaction) => {
      const checkout = await transaction.checkout.create({
        data: {
          code: await getNextCode(transaction.checkout, 'CHK'),
          truckId: truck.id,
          truckCode: truck.code,
          truckNumber: truck.truckNumber,
          truckType: truck.truckType,
          truckTypeLabel: truck.truckTypeLabel,
          pitOwner,
          excaId: excaId.toUpperCase(),
          excaOperator,
          createdBy: createdBy || 'Unknown',
          createdByRole: createdByRole || 'Checker',
          status: 'ready_for_exit',
          photo: photo || null,
        },
      });

      await transaction.truck.update({
        where: { id: truck.id },
        data: {
          status: 'in_checkout',
          lastUpdatedAt: new Date(),
        },
      });

      return checkout;
    });

    return res.status(201).json({
      success: true,
      message: 'Checkout entry berhasil dibuat',
      data: serializeCheckout(newCheckout),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/verify', async (req, res, next) => {
  try {
    const { verifiedBy, approved } = req.body;

    const checkout = await prisma.checkout.findUnique({
      where: { code: req.params.id },
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Checkout tidak ditemukan',
      });
    }

    const verifiedAt = new Date();

    const updatedCheckout = await prisma.$transaction(async (transaction) => {
      const nextStatus = approved ? 'verified' : 'rejected';
      const nextTruckStatus = approved ? 'exited' : 'entered';

      const result = await transaction.checkout.update({
        where: { code: req.params.id },
        data: {
          status: nextStatus,
          verifiedBy: verifiedBy || 'Unknown',
          verifiedAt,
        },
      });

      await transaction.truck.update({
        where: { id: checkout.truckId },
        data: {
          status: nextTruckStatus,
          lastUpdatedBy: verifiedBy || 'Unknown',
          lastUpdatedAt: verifiedAt,
        },
      });

      return result;
    });

    return res.status(200).json({
      success: true,
      message: approved
        ? 'Checkout berhasil diverifikasi - Truck keluar'
        : 'Checkout ditolak',
      data: serializeCheckout(updatedCheckout),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
