const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { getRetaseRates } = require('./settings');

const DEFAULT_REKAP_EXPORT_TIMEZONE = process.env.REKAP_EXPORT_TIMEZONE || 'Asia/Singapore';
const DEFAULT_REKAP_EXPORT_DIR = process.env.REKAP_EXPORT_DIR
  ? path.resolve(process.env.REKAP_EXPORT_DIR)
  : path.resolve(__dirname, '../exports/rekap-nota');
const DEFAULT_REKAP_STATUS = 'verified';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const formatterCache = new Map();

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function padTwoDigits(value) {
  return String(value).padStart(2, '0');
}

function formatDateKeyFromParts(parts) {
  return `${parts.year}-${padTwoDigits(parts.month)}-${padTwoDigits(parts.day)}`;
}

function normalizeDateKey(value) {
  const text = normalizeText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const [year, month, day] = text.split('-').map((item) => Number.parseInt(item, 10));

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return text;
}

function getFormatter(timeZone) {
  const cacheKey = normalizeText(timeZone) || DEFAULT_REKAP_EXPORT_TIMEZONE;

  if (!formatterCache.has(cacheKey)) {
    formatterCache.set(
      cacheKey,
      new Intl.DateTimeFormat('en-US', {
        timeZone: cacheKey,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }

  return formatterCache.get(cacheKey);
}

function getDateTimeParts(date, timeZone) {
  const parts = getFormatter(timeZone).formatToParts(date);
  const mapped = {};

  parts.forEach((part) => {
    if (part.type === 'literal') {
      return;
    }

    mapped[part.type] = Number.parseInt(part.value, 10);
  });

  return {
    year: mapped.year,
    month: mapped.month,
    day: mapped.day,
    hour: mapped.hour,
    minute: mapped.minute,
    second: mapped.second,
  };
}

function getDateKeyInTimeZone(date = new Date(), timeZone = DEFAULT_REKAP_EXPORT_TIMEZONE) {
  return formatDateKeyFromParts(getDateTimeParts(date, timeZone));
}

function getTimeZoneOffsetMilliseconds(date, timeZone) {
  const parts = getDateTimeParts(date, timeZone);
  const timestampAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return timestampAsUtc - date.getTime();
}

function zonedDateTimeToUtc(parts, timeZone) {
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour || 0,
    parts.minute || 0,
    parts.second || 0,
    parts.millisecond || 0,
  );

  const initialOffset = getTimeZoneOffsetMilliseconds(new Date(utcGuess), timeZone);
  let utcTimestamp = utcGuess - initialOffset;

  const adjustedOffset = getTimeZoneOffsetMilliseconds(new Date(utcTimestamp), timeZone);
  if (adjustedOffset !== initialOffset) {
    utcTimestamp = utcGuess - adjustedOffset;
  }

  return new Date(utcTimestamp);
}

function getUtcRangeForDateKey(dateKey, timeZone = DEFAULT_REKAP_EXPORT_TIMEZONE) {
  const safeDateKey = normalizeDateKey(dateKey);

  if (!safeDateKey) {
    throw new Error('Format tanggal tidak valid. Gunakan YYYY-MM-DD.');
  }

  const [year, month, day] = safeDateKey.split('-').map((item) => Number.parseInt(item, 10));
  const startUtc = zonedDateTimeToUtc({ year, month, day, hour: 0, minute: 0, second: 0 }, timeZone);
  const endUtc = new Date(startUtc.getTime() + MILLISECONDS_PER_DAY - 1);

  return { startUtc, endUtc };
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

function formatCurrency(value) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function formatDateLabel(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function buildDailyRow(checkouts, rates, dateKey) {
  const checkerPitSet = new Set();
  const checkerGateSet = new Set();

  let fusoCount = 0;
  let dynaCount = 0;
  let otherCount = 0;

  checkouts.forEach((checkout) => {
    const type = normalizeTruckTypeValue(checkout.truckType, checkout.truckTypeLabel);

    if (type === 'fuso') {
      fusoCount += 1;
    } else if (type === 'dyna') {
      dynaCount += 1;
    } else {
      otherCount += 1;
    }

    if (checkout.createdBy) {
      checkerPitSet.add(checkout.createdBy);
    }

    if (checkout.verifiedBy) {
      checkerGateSet.add(checkout.verifiedBy);
    }
  });

  const fusoPrice = fusoCount * rates.fuso;
  const dynaPrice = dynaCount * rates.dyna;
  const totalPrice = fusoPrice + dynaPrice;

  return {
    day: new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('id-ID', {
      weekday: 'long',
      timeZone: 'UTC',
    }),
    dateLabel: formatDateLabel(dateKey),
    checkerPit: Array.from(checkerPitSet).join(', ') || '-',
    checkerGate: Array.from(checkerGateSet).join(', ') || '-',
    fusoCount,
    dynaCount,
    otherCount,
    fusoPrice,
    dynaPrice,
    totalPrice,
  };
}

function buildNotaPdfBuffer({
  row,
  dateKey,
  locationOwner,
  contractor,
  exportedBy,
  exportedAt,
}) {
  let PDFDocument;

  try {
    PDFDocument = require('pdfkit');
  } catch {
    throw new Error('Paket "pdfkit" belum terpasang. Jalankan npm install di folder backend.');
  }

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margin: 32,
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const formWidth = 470;
    const formX = (pageWidth - formWidth) / 2;
    const formTop = 52;

    const headerDate = new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      timeZone: 'UTC',
    }).replace(/\//g, ' / ');

    const lineItems = [
      {
        jumlah: String(row.fusoCount),
        namaBarang: 'FUSO',
        total: 'RET',
      },
      {
        jumlah: String(row.dynaCount),
        namaBarang: 'DYNA',
        total: 'RET',
      },
    ];

    if (row.otherCount > 0) {
      lineItems.push({
        jumlah: String(row.otherCount),
        namaBarang: 'LAINNYA',
        total: 'RET',
      });
    }

    const drawDottedLine = (startX, endX, y) => {
      doc.save();
      doc.dash(1, { space: 2 });
      doc.moveTo(startX, y).lineTo(endX, y).lineWidth(1).strokeColor('#374151').stroke();
      doc.undash();
      doc.restore();
    };

    const drawCellText = (text, x, y, width, height, align = 'left', isBold = false) => {
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(11)
        .fillColor('#111827')
        .text(String(text ?? ''), x + 4, y + ((height - 11) / 2), {
          width: width - 8,
          align,
          lineBreak: false,
        });
    };

    doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827')
      .text((locationOwner || 'ANUGRAH').toUpperCase(), formX, formTop);
    doc.text((row.day || '').toUpperCase(), formX + formWidth - 130, formTop, {
      width: 130,
      align: 'right',
    });

    const rightLabelX = formX + formWidth - 165;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Tuan', rightLabelX, formTop + 28);
    drawDottedLine(rightLabelX + 36, formX + formWidth, formTop + 42);
    doc.text(headerDate, rightLabelX + 42, formTop + 28);

    doc.text('Toko', rightLabelX, formTop + 50);
    drawDottedLine(rightLabelX + 36, formX + formWidth, formTop + 64);

    doc.font('Helvetica-Bold').fontSize(16).text('NOTA NO.', formX, formTop + 58);
    drawDottedLine(formX + 98, formX + 220, formTop + 74);
    doc.fontSize(14).text('RETASE', formX + 103, formTop + 58);

    const tableTop = formTop + 98;
    const columns = [
      { key: 'jumlah', label: 'JUMLAH', width: 100, align: 'center' },
      { key: 'namaBarang', label: 'NAMA BARANG', width: 250, align: 'center' },
      { key: 'total', label: 'TOTAL', width: 120, align: 'center' },
    ];
    const headerHeight = 28;
    const bodyRowHeight = 27;
    const bodyRowCount = 12;
    const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const tableHeight = headerHeight + (bodyRowHeight * bodyRowCount);

    doc.rect(formX, tableTop, tableWidth, tableHeight).lineWidth(1).strokeColor('#4b5563').stroke();

    let cursorX = formX;
    columns.forEach((column, index) => {
      if (index > 0) {
        doc.moveTo(cursorX, tableTop).lineTo(cursorX, tableTop + tableHeight).stroke();
      }
      drawCellText(column.label, cursorX, tableTop, column.width, headerHeight, column.align, true);
      cursorX += column.width;
    });

    for (let rowIndex = 0; rowIndex <= bodyRowCount; rowIndex += 1) {
      const y = tableTop + headerHeight + (rowIndex * bodyRowHeight);
      doc.moveTo(formX, y).lineTo(formX + tableWidth, y).stroke();
    }

    lineItems.slice(0, bodyRowCount).forEach((item, index) => {
      let x = formX;
      const y = tableTop + headerHeight + (index * bodyRowHeight);

      columns.forEach((column) => {
        drawCellText(item[column.key], x, y, column.width, bodyRowHeight, column.align);
        x += column.width;
      });
    });

    const bottomLineY = tableTop + tableHeight + 26;
    const amountLabelX = formX + tableWidth - 180;
    const amountValueX = formX + tableWidth - 95;
    const amountLineEnd = formX + tableWidth;

    doc.font('Helvetica-Bold').fontSize(11).text('Jumlah Rp.', amountLabelX, bottomLineY);
    drawDottedLine(amountValueX, amountLineEnd, bottomLineY + 14);
    doc.text(formatCurrency(row.totalPrice), amountValueX + 3, bottomLineY);

    const signatureTop = bottomLineY + 46;
    doc.font('Helvetica').fontSize(12);
    doc.text('Tanda Terima', formX, signatureTop + 56);
    doc.text('Hormat kami,', formX + tableWidth - 130, signatureTop + 56, {
      width: 130,
      align: 'right',
    });

    doc.moveTo(formX, signatureTop + 48).lineTo(formX + 110, signatureTop + 48).strokeColor('#6b7280').stroke();
    doc.moveTo(formX + tableWidth - 110, signatureTop + 48)
      .lineTo(formX + tableWidth, signatureTop + 48)
      .strokeColor('#6b7280')
      .stroke();

    doc.font('Helvetica').fontSize(10);
    doc.text(contractor || exportedBy || 'Kontraktor', formX + tableWidth - 130, signatureTop + 10, {
      width: 130,
      align: 'right',
    });
    doc.text(`Dicetak: ${exportedAt.toLocaleString('id-ID')}`, formX, signatureTop + 74);

    doc.end();
  });
}

async function generateDailyNota({
  dateKey,
  locationOwner,
  contractor,
  exportedBy,
  status = DEFAULT_REKAP_STATUS,
  timeZone = DEFAULT_REKAP_EXPORT_TIMEZONE,
}) {
  const safeDateKey = normalizeDateKey(dateKey) || getDateKeyInTimeZone(new Date(), timeZone);
  const { startUtc, endUtc } = getUtcRangeForDateKey(safeDateKey, timeZone);

  const where = {
    status,
    createdAt: {
      gte: startUtc,
      lte: endUtc,
    },
  };

  if (locationOwner) {
    where.pitOwner = locationOwner;
  }

  if (contractor) {
    where.contractor = contractor;
  }

  const [checkouts, rates] = await Promise.all([
    prisma.checkout.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    }),
    getRetaseRates(prisma),
  ]);

  const dailyRow = buildDailyRow(checkouts, rates, safeDateKey);
  const exportedAt = new Date();
  const safeFileName = `Nota_Rekap_Retase_daily_${safeDateKey}.pdf`;

  const buffer = await buildNotaPdfBuffer({
    row: dailyRow,
    dateKey: safeDateKey,
    locationOwner,
    contractor,
    exportedBy,
    exportedAt,
  });

  return {
    buffer,
    fileName: safeFileName,
    dateKey: safeDateKey,
    timeZone,
    startUtc,
    endUtc,
    row: dailyRow,
    count: checkouts.length,
    rates,
    exportedAt,
  };
}

async function saveDailyNotaToDisk(result, outputDir = DEFAULT_REKAP_EXPORT_DIR) {
  fs.mkdirSync(outputDir, { recursive: true });

  const targetPath = path.resolve(outputDir, result.fileName);
  fs.writeFileSync(targetPath, result.buffer);

  return targetPath;
}

module.exports = {
  DEFAULT_REKAP_EXPORT_TIMEZONE,
  DEFAULT_REKAP_EXPORT_DIR,
  getDateKeyInTimeZone,
  normalizeDateKey,
  getUtcRangeForDateKey,
  generateDailyNota,
  saveDailyNotaToDisk,
};
