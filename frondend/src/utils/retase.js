const DATE_LOCALE = 'id-ID';

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
    timestamp,
  };
}

export function buildTruckMap(trucks = []) {
  return trucks.reduce((accumulator, truck) => {
    accumulator[truck.id] = truck;
    return accumulator;
  }, {});
}

export function normalizeCheckout(checkout, truckMap = {}) {
  const matchedTruck = truckMap[checkout.truckId];
  const createdAt = checkout.createdAt || checkout.checkedOutAt || null;
  const { date, time, timestamp } = formatDateParts(createdAt);

  return {
    ...checkout,
    createdAt,
    date,
    time,
    timestamp,
    truckType: checkout.truckType || matchedTruck?.truckType || '',
    truckTypeLabel: checkout.truckTypeLabel || matchedTruck?.truckTypeLabel || '-',
    inputBy: checkout.createdBy || checkout.checkedOutBy || '-',
    inputRole: checkout.createdByRole || checkout.checkedOutByRole || 'Checker',
    displayStatus:
      checkout.status === 'verified' || checkout.status === 'exited'
        ? 'verified'
        : 'pending',
  };
}

export function buildRetaseHistory(trucks = [], checkouts = []) {
  const truckMap = buildTruckMap(trucks);
  const normalizedCheckouts = checkouts
    .map((checkout) => normalizeCheckout(checkout, truckMap))
    .sort((left, right) => right.timestamp - left.timestamp);
  const latestCheckoutByTruckId = new Map();

  normalizedCheckouts.forEach((checkout) => {
    if (!latestCheckoutByTruckId.has(checkout.truckId)) {
      latestCheckoutByTruckId.set(checkout.truckId, checkout);
    }
  });

  return trucks
    .map((truck) => {
      const checkout = latestCheckoutByTruckId.get(truck.id);
      const fallbackDate = formatDateParts(truck.registeredAt);
      const activeDate = checkout || fallbackDate;

      return {
        id: checkout?.id || truck.id,
        truckId: truck.id,
        truckNumber: truck.truckNumber,
        truckType: truck.truckType,
        truckTypeLabel: truck.truckTypeLabel,
        pitOwner: checkout?.pitOwner || '',
        excaId: checkout?.excaId || '',
        excaOperator: checkout?.excaOperator || '',
        inputBy: checkout?.inputBy || truck.registeredBy || '-',
        inputRole: checkout?.inputRole || truck.registeredByRole || 'Staff Pos',
        date: activeDate.date,
        time: activeDate.time,
        timestamp: activeDate.timestamp,
        status:
          checkout?.displayStatus || (truck.status === 'exited' ? 'verified' : 'pending'),
      };
    })
    .sort((left, right) => right.timestamp - left.timestamp);
}
