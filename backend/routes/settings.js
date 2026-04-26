const express = require('express');
const prisma = require('../lib/prisma');
const {
  addPitLocationOption,
  getPitLocationOptions,
  getRetaseRates,
} = require('../utils/settings');

const router = express.Router();

router.get('/rates', async (req, res, next) => {
  try {
    const rates = await getRetaseRates();

    return res.status(200).json({
      success: true,
      data: {
        ...rates,
        locked: true,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/rates', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Harga retase adalah parameter tetap dan tidak bisa diubah dari aplikasi',
  });
});

router.get('/pit-locations', async (req, res, next) => {
  try {
    const options = await getPitLocationOptions(prisma);

    return res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/pit-locations', async (req, res, next) => {
  try {
    const { label, createdByRole } = req.body;

    if (createdByRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Lokasi / pemilik pit baru hanya dapat ditambahkan administrator',
      });
    }

    const options = await addPitLocationOption(prisma, label);

    return res.status(200).json({
      success: true,
      message: 'Lokasi / pemilik pit berhasil disimpan',
      data: {
        options,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
