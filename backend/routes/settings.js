const express = require('express');
const prisma = require('../lib/prisma');
const { getRetaseRates, upsertRetaseRates } = require('../utils/settings');

const router = express.Router();

router.get('/rates', async (req, res, next) => {
  try {
    const rates = await getRetaseRates(prisma);

    return res.status(200).json({
      success: true,
      data: rates,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/rates', async (req, res, next) => {
  try {
    const { fuso, dyna } = req.body;
    const parsedFuso = Number.parseInt(fuso, 10);
    const parsedDyna = Number.parseInt(dyna, 10);

    if (!Number.isFinite(parsedFuso) || parsedFuso < 0 || !Number.isFinite(parsedDyna) || parsedDyna < 0) {
      return res.status(400).json({
        success: false,
        message: 'Tarif Fuso dan Dyna harus berupa angka 0 atau lebih',
      });
    }

    const rates = await upsertRetaseRates(prisma, {
      fuso: parsedFuso,
      dyna: parsedDyna,
    });

    return res.status(200).json({
      success: true,
      message: 'Tarif retase berhasil diperbarui',
      data: rates,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
