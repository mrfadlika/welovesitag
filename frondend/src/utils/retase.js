import { DEFAULT_RETASE_RATES } from '../data/retaseOptions';

const DATE_LOCALE = 'id-ID';

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.replace(/[^\d-]/g, '');
    const parsedValue = Number.parseInt(normalizedValue || '0', 10);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function toTimestamp(value) {
  if (!value) {
    return 0;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

export function formatDateParts(value) {
  const timestamp = toTimestamp(value);

  if (!timestamp) {
    return {
      date: '-',
      time: '-',
      day: '-',
      timestamp: 0,
    };
  }

  const parsedDate = new Date(timestamp);

  return {
    date: parsedDate.toLocaleDateString(DATE_LOCALE, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: parsedDate.toLocaleTimeString(DATE_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
    }),
    day: parsedDate.toLocaleDateString(DATE_LOCALE, {
      weekday: 'long',
    }),
    timestamp,
  };
}

export function normalizeTruckType(record = {}) {
  const rawType = String(record.truckType || '').toLowerCase();
  const rawLabel = String(record.truckTypeLabel || '').toLowerCase();

  if (rawType === 'dyna' || rawLabel === 'dyna') {
    return { value: 'dyna', label: record.truckTypeLabel || 'Dyna' };
  }

  if (rawType === 'fuso' || rawLabel === 'fuso') {
    return { value: 'fuso', label: record.truckTypeLabel || 'Fuso' };
  }

  return {
    value: rawType || 'lainnya',
    label: record.truckTypeLabel || record.truckType || 'Lainnya',
  };
}

export function normalizeRetaseRecord(record = {}) {
  const { date, time, day, timestamp } = formatDateParts(record.createdAt || record.verifiedAt);
  const normalizedTruckType = normalizeTruckType(record);
  const status = record.status || 'ready_for_exit';

  return {
    ...record,
    id: record.id || '-',
    truckNumber: record.truckNumber || '-',
    materialType: record.materialType || '-',
    locationOwner: record.locationOwner || record.pitOwner || '-',
    heavyEquipment: record.heavyEquipment || record.excaId || '-',
    contractor: record.contractor || '-',
    checkerPit: record.checkerPit || record.createdBy || '-',
    checkerGate: record.checkerGate || record.verifiedBy || '-',
    truckType: normalizedTruckType.value,
    truckTypeLabel: normalizedTruckType.label,
    date,
    time,
    day,
    timestamp,
    status,
    isPendingGate: status === 'ready_for_exit',
    isVerified: status === 'verified',
    isRejected: status === 'rejected',
  };
}

export function buildRetaseHistory(records = []) {
  return records
    .map((record) => normalizeRetaseRecord(record))
    .sort((left, right) => right.timestamp - left.timestamp);
}

export function buildRekapPreview(records = [], rates = DEFAULT_RETASE_RATES) {
  const groupedRows = new Map();

  records
    .map((record) => normalizeRetaseRecord(record))
    .filter((record) => record.status === 'verified')
    .sort((left, right) => left.timestamp - right.timestamp)
    .forEach((record) => {
      const key = new Date(record.timestamp).toISOString().slice(0, 10);

      if (!groupedRows.has(key)) {
        groupedRows.set(key, {
          key,
          day: record.day,
          date: record.date,
          checkerPitSet: new Set(),
          checkerGateSet: new Set(),
          fusoCount: 0,
          dynaCount: 0,
          otherCount: 0,
        });
      }

      const currentRow = groupedRows.get(key);

      if (record.truckType === 'fuso') {
        currentRow.fusoCount += 1;
      } else if (record.truckType === 'dyna') {
        currentRow.dynaCount += 1;
      } else {
        currentRow.otherCount += 1;
      }

      if (record.checkerPit && record.checkerPit !== '-') {
        currentRow.checkerPitSet.add(record.checkerPit);
      }

      if (record.checkerGate && record.checkerGate !== '-') {
        currentRow.checkerGateSet.add(record.checkerGate);
      }
    });

  let cumulativePrice = 0;

  return Array.from(groupedRows.values()).map((row) => {
    const fusoPrice = row.fusoCount * (rates?.fuso ?? DEFAULT_RETASE_RATES.fuso);
    const dynaPrice = row.dynaCount * (rates?.dyna ?? DEFAULT_RETASE_RATES.dyna);
    const totalPrice = fusoPrice + dynaPrice;

    cumulativePrice += totalPrice;

    return {
      day: row.day,
      date: row.date,
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
}

export function formatCurrency(value) {
  return new Intl.NumberFormat(DATE_LOCALE, {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatNumber(value) {
  return new Intl.NumberFormat(DATE_LOCALE, {
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}
