const express = require('express');
const prisma = require('../lib/prisma');
const {
  addPitLocationOption,
  getPitLocationOptions,
  getAllRetaseRates,
  saveRatesLahan,
  saveRatesPt,
  MATERIAL_SETTING_KEY,
  HEAVY_EQUIPMENT_SETTING_KEY,
  CONTRACTOR_SETTING_KEY,
  getDynamicOptionsByKey,
} = require('../utils/settings');

const router = express.Router();

router.get('/rates', async (req, res, next) => {
  try {
    const rates = await getAllRetaseRates(prisma);

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

router.patch('/rates', async (req, res, next) => {
  try {
    const { ratesLahan, ratesPt, createdByRole } = req.body;

    if (createdByRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Harga retase hanya dapat diubah oleh administrator',
      });
    }

    if (ratesLahan) await saveRatesLahan(prisma, ratesLahan);
    if (ratesPt) await saveRatesPt(prisma, ratesPt);

    const rates = await getAllRetaseRates(prisma);

    return res.status(200).json({
      success: true,
      message: 'Harga retase lahan dan PT berhasil disimpan',
      data: rates,
    });
  } catch (error) {
    return next(error);
  }
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

router.get('/dynamic-options', async (req, res, next) => {
  try {
    const [materials, equipments, contractors, locations] = await Promise.all([
      getDynamicOptionsByKey(prisma, MATERIAL_SETTING_KEY),
      getDynamicOptionsByKey(prisma, HEAVY_EQUIPMENT_SETTING_KEY),
      getDynamicOptionsByKey(prisma, CONTRACTOR_SETTING_KEY),
      getPitLocationOptions(prisma),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        materials,
        equipments,
        contractors,
        locations,
      },
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
