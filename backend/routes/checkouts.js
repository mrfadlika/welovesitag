const express = require('express');
const prisma = require('../lib/prisma');
const { getNextCode } = require('../utils/id-generator');
const { serializeCheckout } = require('../utils/serializers');
const { getRetaseRates } = require('../utils/settings');

const router = express.Router();
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_REKAP_PERIOD = 'daily';
const REKAP_PERIOD_LABELS = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
};
const VALID_REKAP_PERIODS = new Set(Object.keys(REKAP_PERIOD_LABELS));

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTruckNumber(value) {
  return normalizeText(value).toUpperCase();
}

function normalizeTruckTypeValue(value, label) {
  const source = normalizeText(value || label).toLowerCase();

  if (source === 'dyna') {
    return 'dyna';
  }

  if (source === 'fuso') {
    return 'fuso';
  }

  return 'lainnya';
}

function normalizeTruckTypeLabel(value, label) {
  const normalizedLabel = normalizeText(label);

  if (normalizedLabel) {
    return normalizedLabel;
  }

  const source = normalizeText(value).toLowerCase();

  if (source === 'dyna') {
    return 'Dyna';
  }

  if (source === 'fuso') {
    return 'Fuso';
  }

  return normalizeText(value) || 'Lainnya';
}

function normalizeRekapPeriod(value) {
  const period = normalizeText(value).toLowerCase();

  return VALID_REKAP_PERIODS.has(period) ? period : DEFAULT_REKAP_PERIOD;
}

function padTwoDigits(value) {
  return String(value).padStart(2, '0');
}

function toUtcDateOnly(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(value, days) {
  const nextDate = new Date(value);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function formatDateKey(value) {
  const date = toUtcDateOnly(value);

  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function formatDayName(value) {
  return new Date(value).toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' });
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatMonthName(value) {
  return new Date(value).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDateRangeLabel(startDate, endDate) {
  const startLabel = formatShortDate(startDate);
  const endLabel = formatShortDate(endDate);

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

function getStartOfUtcWeek(value) {
  const date = toUtcDateOnly(value);
  const dayIndex = date.getUTCDay();
  const daysFromMonday = (dayIndex + 6) % 7;

  return addUtcDays(date, -daysFromMonday);
}

function getIsoWeekInfo(value) {
  const date = toUtcDateOnly(value);
  const target = new Date(date);
  const dayNumber = target.getUTCDay() || 7;

  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);

  const weekYear = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const weekNumber = Math.ceil((((target - yearStart) / MILLISECONDS_PER_DAY) + 1) / 7);

  return { weekYear, weekNumber };
}

function buildPeriodInfo(value, period) {
  const date = toUtcDateOnly(value);

  if (!date) {
    return null;
  }

  if (period === 'weekly') {
    const startDate = getStartOfUtcWeek(date);
    const endDate = addUtcDays(startDate, 6);
    const { weekYear, weekNumber } = getIsoWeekInfo(date);

    return {
      key: `${weekYear}-W${padTwoDigits(weekNumber)}`,
      day: `Minggu ${padTwoDigits(weekNumber)}`,
      date: startDate,
      startDate,
      endDate,
      periodLabel: formatDateRangeLabel(startDate, endDate),
    };
  }

  if (period === 'monthly') {
    const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

    return {
      key: `${date.getUTCFullYear()}-${padTwoDigits(date.getUTCMonth() + 1)}`,
      day: formatMonthName(startDate),
      date: startDate,
      startDate,
      endDate,
      periodLabel: formatDateRangeLabel(startDate, endDate),
    };
  }

  return {
    key: formatDateKey(date),
    day: formatDayName(date),
    date,
    startDate: date,
    endDate: date,
    periodLabel: formatDateRangeLabel(date, date),
  };
}

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

router.get('/rekap', async (req, res, next) => {
  try {
    const {
      locationOwner,
      contractor,
      status = 'verified',
      startDate,
      endDate,
      period,
    } = req.query;
    const rekapPeriod = normalizeRekapPeriod(period);
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (locationOwner) {
      where.pitOwner = locationOwner;
    }

    if (contractor) {
      where.contractor = contractor;
    }

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }

      if (endDate) {
        where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const checkouts = await prisma.checkout.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    const rates = await getRetaseRates(prisma);

    const groupedRows = new Map();

    checkouts.forEach((checkout) => {
      const periodInfo = buildPeriodInfo(checkout.createdAt, rekapPeriod);

      if (!periodInfo) {
        return;
      }

      if (!groupedRows.has(periodInfo.key)) {
        groupedRows.set(periodInfo.key, {
          key: periodInfo.key,
          period: rekapPeriod,
          day: periodInfo.day,
          date: periodInfo.date,
          startDate: periodInfo.startDate,
          endDate: periodInfo.endDate,
          periodLabel: periodInfo.periodLabel,
          checkerPitSet: new Set(),
          checkerGateSet: new Set(),
          fusoCount: 0,
          dynaCount: 0,
          otherCount: 0,
        });
      }

      const currentRow = groupedRows.get(periodInfo.key);
      const truckType = normalizeTruckTypeValue(checkout.truckType, checkout.truckTypeLabel);

      if (truckType === 'fuso') {
        currentRow.fusoCount += 1;
      } else if (truckType === 'dyna') {
        currentRow.dynaCount += 1;
      } else {
        currentRow.otherCount += 1;
      }

      if (checkout.createdBy) {
        currentRow.checkerPitSet.add(checkout.createdBy);
      }

      if (checkout.verifiedBy) {
        currentRow.checkerGateSet.add(checkout.verifiedBy);
      }
    });

    let cumulativePrice = 0;
    const rows = Array.from(groupedRows.values()).map((row) => {
      const fusoPrice = row.fusoCount * rates.fuso;
      const dynaPrice = row.dynaCount * rates.dyna;
      const totalPrice = fusoPrice + dynaPrice;

      cumulativePrice += totalPrice;

      return {
        period: row.period,
        periodKey: row.key,
        day: row.day,
        date: row.date,
        startDate: row.startDate,
        endDate: row.endDate,
        periodLabel: row.periodLabel,
        checkerPit: Array.from(row.checkerPitSet).join(', ') || '-',
        checkerGate: Array.from(row.checkerGateSet).join(', ') || '-',
        fusoCount: row.fusoCount,
        dynaCount: row.dynaCount,
        otherCount: row.otherCount,
        fusoPrice,
        dynaPrice,
        totalPrice,
        cumulativePrice,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        rows,
        meta: {
          locationOwner: locationOwner || 'Semua lokasi',
          contractor: contractor || 'Semua kontraktor',
          period: rekapPeriod,
          periodLabel: REKAP_PERIOD_LABELS[rekapPeriod],
          startDate: startDate || null,
          endDate: endDate || null,
          rateLocked: true,
          rates,
        },
      },
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
        message: 'Data retase tidak ditemukan',
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
    const {
      truckNumber,
      truckType,
      truckTypeLabel,
      materialType,
      locationOwner,
      pitOwner,
      heavyEquipment,
      excaId,
      contractor,
      checkerPit,
      createdBy,
      createdByRole,
      photo,
    } = req.body;

    const normalizedTruckNumber = normalizeTruckNumber(truckNumber);
    const resolvedTruckType = normalizeTruckTypeValue(truckType, truckTypeLabel);
    const resolvedTruckTypeLabel = normalizeTruckTypeLabel(truckType, truckTypeLabel);
    const resolvedMaterialType = normalizeText(materialType);
    const resolvedLocationOwner = normalizeText(locationOwner || pitOwner);
    const resolvedHeavyEquipment = normalizeText(heavyEquipment || excaId);
    const resolvedCheckerPit = normalizeText(checkerPit || createdBy);
    const resolvedContractor = normalizeText(contractor) || null;

    if (
      !normalizedTruckNumber ||
      !resolvedTruckTypeLabel ||
      !resolvedMaterialType ||
      !resolvedLocationOwner ||
      !resolvedHeavyEquipment ||
      !resolvedCheckerPit
    ) {
      return res.status(400).json({
        success: false,
        message:
          'No. polisi, jenis material, lokasi, alat berat, jenis truk, dan checker pit wajib diisi',
      });
    }

    const existingCheckout = await prisma.checkout.findFirst({
      where: {
        truckNumber: normalizedTruckNumber,
        status: 'ready_for_exit',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingCheckout) {
      return res.status(400).json({
        success: false,
        message: 'Truck ini masih menunggu verifikasi gate',
        existingId: existingCheckout.code,
      });
    }

    const latestTruck = await prisma.truck.findFirst({
      where: {
        truckNumber: normalizedTruckNumber,
      },
      orderBy: { registeredAt: 'desc' },
    });

    const newCheckout = await prisma.$transaction(async (transaction) => {
      const truckRecord = latestTruck
        ? await transaction.truck.update({
            where: { id: latestTruck.id },
            data: {
              truckType: resolvedTruckType,
              truckTypeLabel: resolvedTruckTypeLabel,
              registeredBy: latestTruck.registeredBy || resolvedCheckerPit,
              registeredByRole: latestTruck.registeredByRole || createdByRole || 'Checker Pit',
              status: 'in_checkout',
              lastUpdatedBy: resolvedCheckerPit,
              lastUpdatedAt: new Date(),
            },
          })
        : await transaction.truck.create({
            data: {
              code: await getNextCode(transaction.truck, 'TRK'),
              truckNumber: normalizedTruckNumber,
              truckType: resolvedTruckType,
              truckTypeLabel: resolvedTruckTypeLabel,
              registeredBy: resolvedCheckerPit,
              registeredByRole: createdByRole || 'Checker Pit',
              status: 'in_checkout',
              photo: photo || null,
            },
          });

      const checkout = await transaction.checkout.create({
        data: {
          code: await getNextCode(transaction.checkout, 'RET'),
          truckId: truckRecord.id,
          truckCode: truckRecord.code,
          truckNumber: normalizedTruckNumber,
          truckType: resolvedTruckType,
          truckTypeLabel: resolvedTruckTypeLabel,
          materialType: resolvedMaterialType,
          pitOwner: resolvedLocationOwner,
          excaId: resolvedHeavyEquipment,
          excaOperator: '',
          contractor: resolvedContractor,
          createdBy: resolvedCheckerPit,
          createdByRole: createdByRole || 'Checker Pit',
          status: 'ready_for_exit',
          photo: photo || null,
        },
      });

      return checkout;
    });

    return res.status(201).json({
      success: true,
      message: 'Data retase berhasil disimpan dan menunggu verifikasi gate',
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
        message: 'Data retase tidak ditemukan',
      });
    }

    if (checkout.status !== 'ready_for_exit') {
      return res.status(400).json({
        success: false,
        message: 'Data retase tidak berada dalam antrean verifikasi gate',
      });
    }

    const verifiedAt = new Date();
    const verifierName = normalizeText(verifiedBy) || 'Unknown';

    const updatedCheckout = await prisma.$transaction(async (transaction) => {
      const nextStatus = approved ? 'verified' : 'rejected';
      const nextTruckStatus = approved ? 'exited' : 'entered';

      const result = await transaction.checkout.update({
        where: { code: req.params.id },
        data: {
          status: nextStatus,
          verifiedBy: verifierName,
          verifiedAt,
        },
      });

      await transaction.truck.update({
        where: { id: checkout.truckId },
        data: {
          status: nextTruckStatus,
          lastUpdatedBy: verifierName,
          lastUpdatedAt: verifiedAt,
        },
      });

      return result;
    });

    return res.status(200).json({
      success: true,
      message: approved
        ? 'Retase berhasil diverifikasi gate'
        : 'Retase ditolak dan dikembalikan ke antrean',
      data: serializeCheckout(updatedCheckout),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
