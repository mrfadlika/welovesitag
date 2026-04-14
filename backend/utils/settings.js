const RETASE_RATE_KEYS = {
  fuso: 'retase_rate_fuso',
  dyna: 'retase_rate_dyna',
};

const DEFAULT_RETASE_RATES = {
  fuso: 30000,
  dyna: 15000,
};

function parseRateValue(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
}

async function getRetaseRates(prismaClient) {
  const settings = await prismaClient.appSetting.findMany({
    where: {
      key: {
        in: Object.values(RETASE_RATE_KEYS),
      },
    },
  });

  const settingsMap = settings.reduce((accumulator, item) => {
    accumulator[item.key] = item.value;
    return accumulator;
  }, {});

  return {
    fuso: parseRateValue(settingsMap[RETASE_RATE_KEYS.fuso], DEFAULT_RETASE_RATES.fuso),
    dyna: parseRateValue(settingsMap[RETASE_RATE_KEYS.dyna], DEFAULT_RETASE_RATES.dyna),
  };
}

async function upsertRetaseRates(prismaClient, nextRates) {
  const safeRates = {
    fuso: parseRateValue(nextRates.fuso, DEFAULT_RETASE_RATES.fuso),
    dyna: parseRateValue(nextRates.dyna, DEFAULT_RETASE_RATES.dyna),
  };

  await prismaClient.$transaction([
    prismaClient.appSetting.upsert({
      where: { key: RETASE_RATE_KEYS.fuso },
      update: { value: String(safeRates.fuso) },
      create: { key: RETASE_RATE_KEYS.fuso, value: String(safeRates.fuso) },
    }),
    prismaClient.appSetting.upsert({
      where: { key: RETASE_RATE_KEYS.dyna },
      update: { value: String(safeRates.dyna) },
      create: { key: RETASE_RATE_KEYS.dyna, value: String(safeRates.dyna) },
    }),
  ]);

  return safeRates;
}

module.exports = {
  DEFAULT_RETASE_RATES,
  RETASE_RATE_KEYS,
  getRetaseRates,
  upsertRetaseRates,
};
