const RETASE_RATE_ENV_KEYS = {
  fuso: 'RETASE_RATE_FUSO',
  dyna: 'RETASE_RATE_DYNA',
  fusoLahan: 'RETASE_RATE_FUSO_LAHAN',
  dynaLahan: 'RETASE_RATE_DYNA_LAHAN',
  fusoPt: 'RETASE_RATE_FUSO_PT',
  dynaPt: 'RETASE_RATE_DYNA_PT',
};

const PIT_LOCATION_SETTING_KEY = 'pit_location_options';
const MATERIAL_SETTING_KEY = 'material_options';
const HEAVY_EQUIPMENT_SETTING_KEY = 'heavy_equipment_options';
const CONTRACTOR_SETTING_KEY = 'contractor_options';

const RATES_LAHAN_SETTING_KEY = 'rates_lahan';
const RATES_PT_SETTING_KEY = 'rates_pt';

const DEFAULT_RETASE_RATES = {
  fuso: 30000,
  dyna: 15000,
};

const DEFAULT_RETASE_RATES_LAHAN = {
  fuso: 30000,
  dyna: 15000,
};

const DEFAULT_RETASE_RATES_PT = {
  fuso: 30000,
  dyna: 15000,
};

const DEFAULT_PIT_LOCATION_OPTIONS = [
  { value: 'Pit Geostone Family', label: 'Pit Geostone Family' },
  { value: 'Pit Anugrah', label: 'Pit Anugrah' },
  { value: 'Pit H Naja', label: 'Pit H Naja' },
  { value: 'Pit Propam', label: 'Pit Propam' },
];

function parseRateValue(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePitLocationOptions(options = []) {
  return normalizeOptions(options);
}

function normalizeOptions(options = []) {
  const seen = new Set();

  return options.reduce((accumulator, option) => {
    const label = normalizeText(typeof option === 'string' ? option : option?.label || option?.value);
    const normalizedKey = label.toLowerCase();

    if (!label || seen.has(normalizedKey)) {
      return accumulator;
    }

    seen.add(normalizedKey);
    accumulator.push({ value: label, label });
    return accumulator;
  }, []);
}

function getConfiguredRetaseRates(env = process.env) {
  return {
    fuso: parseRateValue(env[RETASE_RATE_ENV_KEYS.fuso], DEFAULT_RETASE_RATES.fuso),
    dyna: parseRateValue(env[RETASE_RATE_ENV_KEYS.dyna], DEFAULT_RETASE_RATES.dyna),
  };
}

function getConfiguredRetaseRatesLahan(env = process.env) {
  return {
    fuso: parseRateValue(env[RETASE_RATE_ENV_KEYS.fusoLahan], DEFAULT_RETASE_RATES_LAHAN.fuso),
    dyna: parseRateValue(env[RETASE_RATE_ENV_KEYS.dynaLahan], DEFAULT_RETASE_RATES_LAHAN.dyna),
  };
}

function getConfiguredRetaseRatesPt(env = process.env) {
  return {
    fuso: parseRateValue(env[RETASE_RATE_ENV_KEYS.fusoPt], DEFAULT_RETASE_RATES_PT.fuso),
    dyna: parseRateValue(env[RETASE_RATE_ENV_KEYS.dynaPt], DEFAULT_RETASE_RATES_PT.dyna),
  };
}

async function getConfiguredRetaseRatesLahanDb(prismaClient) {
  try {
    const setting = await prismaClient.appSetting.findUnique({
      where: { key: RATES_LAHAN_SETTING_KEY },
    });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      return {
        fuso: parseRateValue(parsed.fuso, DEFAULT_RETASE_RATES_LAHAN.fuso),
        dyna: parseRateValue(parsed.dyna, DEFAULT_RETASE_RATES_LAHAN.dyna),
      };
    }
  } catch (e) {
    // fallback
  }
  return getConfiguredRetaseRatesLahan(); // fallback to env
}

async function getConfiguredRetaseRatesPtDb(prismaClient) {
  try {
    const setting = await prismaClient.appSetting.findUnique({
      where: { key: RATES_PT_SETTING_KEY },
    });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      return {
        fuso: parseRateValue(parsed.fuso, DEFAULT_RETASE_RATES_PT.fuso),
        dyna: parseRateValue(parsed.dyna, DEFAULT_RETASE_RATES_PT.dyna),
      };
    }
  } catch (e) {
    // fallback
  }
  return getConfiguredRetaseRatesPt(); // fallback to env
}

async function saveRatesLahan(prismaClient, rates) {
  const safeRates = {
    fuso: parseRateValue(rates.fuso, DEFAULT_RETASE_RATES_LAHAN.fuso),
    dyna: parseRateValue(rates.dyna, DEFAULT_RETASE_RATES_LAHAN.dyna),
  };
  await prismaClient.appSetting.upsert({
    where: { key: RATES_LAHAN_SETTING_KEY },
    update: { value: JSON.stringify(safeRates) },
    create: { key: RATES_LAHAN_SETTING_KEY, value: JSON.stringify(safeRates) },
  });
  return safeRates;
}

async function saveRatesPt(prismaClient, rates) {
  const safeRates = {
    fuso: parseRateValue(rates.fuso, DEFAULT_RETASE_RATES_PT.fuso),
    dyna: parseRateValue(rates.dyna, DEFAULT_RETASE_RATES_PT.dyna),
  };
  await prismaClient.appSetting.upsert({
    where: { key: RATES_PT_SETTING_KEY },
    update: { value: JSON.stringify(safeRates) },
    create: { key: RATES_PT_SETTING_KEY, value: JSON.stringify(safeRates) },
  });
  return safeRates;
}

async function getRetaseRates() {
  return getConfiguredRetaseRates();
}

async function getAllRetaseRates(prismaClient) {
  return {
    rates: getConfiguredRetaseRates(),
    ratesLahan: await getConfiguredRetaseRatesLahanDb(prismaClient),
    ratesPt: await getConfiguredRetaseRatesPtDb(prismaClient),
  };
}

async function getPitLocationOptions(prismaClient) {
  const setting = await prismaClient.appSetting.findUnique({
    where: { key: PIT_LOCATION_SETTING_KEY },
  });

  if (!setting?.value) {
    return DEFAULT_PIT_LOCATION_OPTIONS;
  }

  try {
    const options = normalizePitLocationOptions(JSON.parse(setting.value));
    return options.length > 0 ? options : DEFAULT_PIT_LOCATION_OPTIONS;
  } catch {
    return DEFAULT_PIT_LOCATION_OPTIONS;
  }
}

async function savePitLocationOptions(prismaClient, nextOptions) {
  const options = normalizePitLocationOptions(nextOptions);
  const safeOptions = options.length > 0 ? options : DEFAULT_PIT_LOCATION_OPTIONS;

  await prismaClient.appSetting.upsert({
    where: { key: PIT_LOCATION_SETTING_KEY },
    update: { value: JSON.stringify(safeOptions) },
    create: {
      key: PIT_LOCATION_SETTING_KEY,
      value: JSON.stringify(safeOptions),
    },
  });

  return safeOptions;
}

async function addPitLocationOption(prismaClient, label) {
  const normalizedLabel = normalizeText(label);

  if (!normalizedLabel) {
    throw new Error('Lokasi / pemilik pit wajib diisi');
  }

  const currentOptions = await getPitLocationOptions(prismaClient);
  return savePitLocationOptions(prismaClient, [...currentOptions, normalizedLabel]);
}

async function getDynamicOptionsByKey(prismaClient, key) {
  const setting = await prismaClient.appSetting.findUnique({
    where: { key },
  });

  if (!setting?.value) {
    return [];
  }

  try {
    return normalizeOptions(JSON.parse(setting.value));
  } catch {
    return [];
  }
}

async function addDynamicOption(prismaClient, key, label) {
  const normalizedLabel = normalizeText(label);
  if (!normalizedLabel) return;

  const currentOptions = await getDynamicOptionsByKey(prismaClient, key);
  
  // Check if it already exists
  const exists = currentOptions.some(
    (opt) => opt.value.toLowerCase() === normalizedLabel.toLowerCase()
  );
  if (exists) return currentOptions;

  const nextOptions = normalizeOptions([...currentOptions, normalizedLabel]);

  await prismaClient.appSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(nextOptions) },
    create: { key, value: JSON.stringify(nextOptions) },
  });

  return nextOptions;
}

module.exports = {
  DEFAULT_RETASE_RATES,
  DEFAULT_RETASE_RATES_LAHAN,
  DEFAULT_RETASE_RATES_PT,
  DEFAULT_PIT_LOCATION_OPTIONS,
  RETASE_RATE_ENV_KEYS,
  PIT_LOCATION_SETTING_KEY,
  addPitLocationOption,
  getAllRetaseRates,
  getConfiguredRetaseRates,
  getConfiguredRetaseRatesLahan,
  getConfiguredRetaseRatesPt,
  getPitLocationOptions,
  getRetaseRates,
  savePitLocationOptions,
  saveRatesLahan,
  saveRatesPt,
  RATES_LAHAN_SETTING_KEY,
  RATES_PT_SETTING_KEY,
  MATERIAL_SETTING_KEY,
  HEAVY_EQUIPMENT_SETTING_KEY,
  CONTRACTOR_SETTING_KEY,
  getDynamicOptionsByKey,
  addDynamicOption,
};
