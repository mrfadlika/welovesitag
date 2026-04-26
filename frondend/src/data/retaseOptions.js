export const MATERIAL_OPTIONS = [
  { value: 'Tanah timbunan', label: 'Tanah timbunan' },
  { value: 'Batu gajah', label: 'Batu gajah' },
  { value: '__custom__', label: 'Lainnya' },
];

export const LOCATION_OPTIONS = [
  { value: 'Pit Geostone Family', label: 'Pit Geostone Family' },
  { value: 'Pit Anugrah', label: 'Pit Anugrah' },
  { value: 'Pit H Naja', label: 'Pit H Naja' },
  { value: 'Pit Propam', label: 'Pit Propam' },
  { value: '__custom__', label: 'Pit Lainnya' },
];

export const HEAVY_EQUIPMENT_OPTIONS = [
  { value: 'Hitachi-01', label: 'Hitachi-01' },
  { value: 'Hitachi-02', label: 'Hitachi-02' },
  { value: 'Komatsu-01', label: 'Komatsu-01' },
  { value: 'Komatsu-02', label: 'Komatsu-02' },
  { value: '__custom__', label: 'Lainnya' },
];

export const TRUCK_TYPE_OPTIONS = [
  { value: 'dyna', label: 'Dyna' },
  { value: 'fuso', label: 'Fuso' },
  { value: 'lainnya', label: 'Lainnya' },
];

export const CONTRACTOR_OPTIONS = [
  { value: 'H Beddu', label: 'H Beddu' },
  { value: 'Sapri', label: 'Sapri' },
  { value: 'H Abbas', label: 'H Abbas' },
  { value: '__custom__', label: 'Lainnya' },
];

export const LOG_STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'ready_for_exit', label: 'Menunggu Gate' },
  { value: 'verified', label: 'Sudah Verified' },
  { value: 'rejected', label: 'Ditolak' },
];

export const DEFAULT_RETASE_RATES = {
  fuso: 30000,
  dyna: 15000,
};

export function isCustomOption(value) {
  return value === '__custom__' || value === 'lainnya';
}

export function getOptionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value || '-';
}
