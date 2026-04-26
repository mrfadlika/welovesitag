const RETASE_RATE_ENV_KEYS = {
  fuso: 'RETASE_RATE_FUSO',
  dyna: 'RETASE_RATE_DYNA',
};

const PIT_LOCATION_SETTING_KEY = 'pit_location_options';

const DEFAULT_RETASE_RATES = {
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

async function getRetaseRates() {
  return getConfiguredRetaseRates();
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

module.exports = {
  DEFAULT_RETASE_RATES,
  DEFAULT_PIT_LOCATION_OPTIONS,
  RETASE_RATE_ENV_KEYS,
  PIT_LOCATION_SETTING_KEY,
  addPitLocationOption,
  getConfiguredRetaseRates,
  getPitLocationOptions,
  getRetaseRates,
  savePitLocationOptions,
};
