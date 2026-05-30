const fs = require('fs');
const path = require('path');

const {
  DEFAULT_REKAP_EXPORT_DIR,
  DEFAULT_REKAP_EXPORT_TIMEZONE,
  generateDailyNota,
  getDateKeyInTimeZone,
  normalizeDateKey,
  saveDailyNotaToDisk,
} = require('./rekap-nota');

const AUTO_EXPORT_ENABLED =
  String(process.env.REKAP_AUTO_EXPORT_ENABLED || 'true').trim().toLowerCase() !== 'false';
const AUTO_EXPORT_HOUR = Number.parseInt(process.env.REKAP_AUTO_EXPORT_HOUR || '17', 10);
const AUTO_EXPORT_MINUTE = Number.parseInt(process.env.REKAP_AUTO_EXPORT_MINUTE || '0', 10);
const AUTO_EXPORT_STARTUP_LOOKBACK_DAYS = Number.parseInt(
  process.env.REKAP_AUTO_EXPORT_STARTUP_LOOKBACK_DAYS || '1',
  10,
);
const AUTO_EXPORT_RUN_ON_STARTUP =
  String(process.env.REKAP_AUTO_EXPORT_RUN_ON_STARTUP || 'true').trim().toLowerCase() !== 'false';

function normalizeHour(value) {
  if (Number.isFinite(value) && value >= 0 && value <= 23) {
    return value;
  }

  return 17;
}

function normalizeMinute(value) {
  if (Number.isFinite(value) && value >= 0 && value <= 59) {
    return value;
  }

  return 0;
}

function normalizeLookbackDays(value) {
  if (Number.isFinite(value) && value >= 0 && value <= 31) {
    return value;
  }

  return 1;
}

function shiftDateKey(dateKey, dayOffset) {
  const safeDateKey = normalizeDateKey(dateKey);

  if (!safeDateKey || !Number.isFinite(dayOffset) || dayOffset === 0) {
    return safeDateKey;
  }

  const date = new Date(`${safeDateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);

  return date.toISOString().slice(0, 10);
}

function getExportFilePath(dateKey) {
  return path.resolve(DEFAULT_REKAP_EXPORT_DIR, `Nota_Rekap_Retase_daily_${dateKey}.pdf`);
}

function getCurrentHourMinuteInTimeZone(timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date());
  const mapped = {};

  parts.forEach((part) => {
    if (part.type === 'literal') {
      return;
    }

    mapped[part.type] = Number.parseInt(part.value, 10);
  });

  return {
    hour: mapped.hour || 0,
    minute: mapped.minute || 0,
  };
}

async function runDailyAutoExport(reason = 'cron', forcedDateKey) {
  const timeZone = DEFAULT_REKAP_EXPORT_TIMEZONE;
  const dateKey = normalizeDateKey(forcedDateKey) || getDateKeyInTimeZone(new Date(), timeZone);

  const result = await generateDailyNota({
    dateKey,
    exportedBy: 'Sistem Otomatis',
    timeZone,
  });

  const filePath = await saveDailyNotaToDisk(result);

  console.log(
    `[AUTO-EXPORT] ${reason} berhasil: ${filePath} | ` +
      `tanggal=${result.dateKey} | total_retase=${result.count}`
  );

  return {
    filePath,
    dateKey: result.dateKey,
    count: result.count,
  };
}

async function runStartupCatchUp({ hour, minute, lookbackDays }) {
  const timeZone = DEFAULT_REKAP_EXPORT_TIMEZONE;
  const now = new Date();
  const todayDateKey = getDateKeyInTimeZone(now, timeZone);
  const nowParts = getCurrentHourMinuteInTimeZone(timeZone);
  const isPastSchedule =
    nowParts.hour > hour || (nowParts.hour === hour && nowParts.minute >= minute);

  const targets = [];
  for (let offset = lookbackDays; offset >= 1; offset -= 1) {
    const targetDateKey = shiftDateKey(todayDateKey, -offset);
    if (targetDateKey) {
      targets.push(targetDateKey);
    }
  }

  if (isPastSchedule) {
    targets.push(todayDateKey);
  }

  let exportedToday = false;

  for (const targetDateKey of targets) {
    const exportFilePath = getExportFilePath(targetDateKey);

    if (fs.existsSync(exportFilePath)) {
      if (targetDateKey === todayDateKey) {
        exportedToday = true;
      }
      continue;
    }

    try {
      await runDailyAutoExport('startup-catchup', targetDateKey);
      if (targetDateKey === todayDateKey) {
        exportedToday = true;
      }
    } catch (error) {
      console.error(`[AUTO-EXPORT] Gagal startup catch-up tanggal ${targetDateKey}:`, error.message);
    }
  }

  return exportedToday ? todayDateKey : null;
}

function startRekapAutoExportScheduler() {
  if (!AUTO_EXPORT_ENABLED) {
    console.log('[AUTO-EXPORT] Dinonaktifkan (REKAP_AUTO_EXPORT_ENABLED=false).');
    return null;
  }

  const hour = normalizeHour(AUTO_EXPORT_HOUR);
  const minute = normalizeMinute(AUTO_EXPORT_MINUTE);
  const lookbackDays = normalizeLookbackDays(AUTO_EXPORT_STARTUP_LOOKBACK_DAYS);
  let lastRunDateKey = null;
  const checkAndRun = async () => {
    const nowParts = getCurrentHourMinuteInTimeZone(DEFAULT_REKAP_EXPORT_TIMEZONE);
    const dateKey = getDateKeyInTimeZone(new Date(), DEFAULT_REKAP_EXPORT_TIMEZONE);

    if (nowParts.hour !== hour || nowParts.minute !== minute || dateKey === lastRunDateKey) {
      return;
    }

    try {
      await runDailyAutoExport('timer');
      lastRunDateKey = dateKey;
    } catch (error) {
      console.error('[AUTO-EXPORT] Gagal menjalankan timer export:', error.message);
    }
  };

  if (AUTO_EXPORT_RUN_ON_STARTUP) {
    runStartupCatchUp({ hour, minute, lookbackDays })
      .then((exportedDateKey) => {
        if (exportedDateKey) {
          lastRunDateKey = exportedDateKey;
        }
      })
      .catch((error) => {
        console.error('[AUTO-EXPORT] Gagal menjalankan startup catch-up export:', error.message);
      });
  }

  setInterval(checkAndRun, 30 * 1000);
  checkAndRun().catch((error) => {
    console.error('[AUTO-EXPORT] Gagal menjalankan pengecekan awal:', error.message);
  });

  console.log(
    `[AUTO-EXPORT] Aktif tiap hari ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ` +
      `${DEFAULT_REKAP_EXPORT_TIMEZONE} (startup lookback ${lookbackDays} hari)`
  );

  return true;
}

module.exports = {
  runDailyAutoExport,
  startRekapAutoExportScheduler,
};
