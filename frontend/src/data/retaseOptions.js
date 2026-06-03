export const MATERIAL_OPTIONS = [
  { value: 'Tanah timbunan', label: 'Tanah timbunan' },
  { value: 'Batu gajah', label: 'Batu gajah' },
  { value: '__custom__', label: 'Lainnya' },
];

export const LOCATION_OPTIONS = [
  { value: '__custom__', label: 'Pit Lainnya' },
];

export const HEAVY_EQUIPMENT_OPTIONS = [
  { value: '__custom__', label: 'Lainnya' },
];

// Alias: label changed from "Alat Berat" to "Alat Gali (Excavator)" for checker role
export const DIGGING_EQUIPMENT_OPTIONS = HEAVY_EQUIPMENT_OPTIONS;

export const TRUCK_TYPE_OPTIONS = [
  { value: 'dyna', label: 'Dyna' },
  { value: 'fuso', label: 'Fuso' },
  { value: 'lainnya', label: 'Lainnya' },
];

export const CONTRACTOR_OPTIONS = [
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
