import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ClipboardList,
  Filter,
  Loader2,
  RefreshCw,
  Wallet,
  FileDown,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import usePersistentState from '../../hooks/usePersistentState';
import { checkoutAPI, settingsAPI } from '../../services/api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CONTRACTOR_OPTIONS, LOCATION_OPTIONS } from '../../data/retaseOptions';
import { formatCurrency } from '../../utils/retase';
import './RekapPage.css';

const DEFAULT_REKAP_PERIOD = 'daily';
const REKAP_PERIOD_OPTIONS = [
  {
    value: 'daily',
    label: 'Harian',
    rowLabel: 'Hari',
    dateLabel: 'Tanggal',
    summaryLabel: 'Hari',
    note: 'Satu baris untuk setiap tanggal.',
  },
  {
    value: 'weekly',
    label: 'Mingguan',
    rowLabel: 'Minggu',
    dateLabel: 'Rentang Tanggal',
    summaryLabel: 'Minggu',
    note: 'Satu baris per minggu Senin-Minggu.',
  },
  {
    value: 'monthly',
    label: 'Bulanan',
    rowLabel: 'Bulan',
    dateLabel: 'Rentang Tanggal',
    summaryLabel: 'Bulan',
    note: 'Satu baris per bulan kalender.',
  },
];

function getPeriodOption(period) {
  return REKAP_PERIOD_OPTIONS.find((option) => option.value === period) || REKAP_PERIOD_OPTIONS[0];
}

function isActiveRekapFilter([key, value]) {
  if (key === 'period') {
    return Boolean(value && value !== DEFAULT_REKAP_PERIOD);
  }

  return Boolean(value);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

function formatDisplayDate(value) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString('id-ID', { timeZone: 'UTC' });
}

function formatDateFilterLabel(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDateRangeDisplay(startDate, endDate) {
  const startLabel = formatDisplayDate(startDate);
  const endLabel = formatDisplayDate(endDate);

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

function getRowDateLabel(row, period) {
  if (period === DEFAULT_REKAP_PERIOD) {
    return formatDisplayDate(row.date);
  }

  return row.periodLabel || formatDateRangeDisplay(row.startDate || row.date, row.endDate || row.date);
}

export default function RekapPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaffPos = user?.role === 'staff_pos';
  const canExportPdf = isAdmin || isStaffPos;
  const isLimitedRole = user?.role === 'staff_pos' || user?.role === 'checker';
  const initialFilters = useMemo(
    () => ({
      period: DEFAULT_REKAP_PERIOD,
      locationOwner: '',
      contractor: '',
      startDate: '',
      endDate: '',
    }),
    []
  );
  const [filters, setFilters, clearFilters] = usePersistentState(
    'sitag:v1:rekap:filters',
    initialFilters
  );
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [refreshSeed, setRefreshSeed] = useState(0);

  // States for Rates Editing
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [editRatesData, setEditRatesData] = useState({
    lahanFuso: 0,
    lahanDyna: 0,
    ptFuso: 0,
    ptDyna: 0,
  });

  const handleEditRatesToggle = () => {
    if (!isEditingRates) {
      setEditRatesData({
        lahanFuso: meta?.ratesLahan?.fuso || 0,
        lahanDyna: meta?.ratesLahan?.dyna || 0,
        ptFuso: meta?.ratesPt?.fuso || 0,
        ptDyna: meta?.ratesPt?.dyna || 0,
      });
    }
    setIsEditingRates(!isEditingRates);
  };

  const handleSaveRates = async () => {
    setIsSavingRates(true);
    try {
      const payload = {
        createdByRole: 'Admin',
        ratesLahan: { fuso: editRatesData.lahanFuso, dyna: editRatesData.lahanDyna },
        ratesPt: { fuso: editRatesData.ptFuso, dyna: editRatesData.ptDyna },
      };
      const res = await settingsAPI.updateRates(payload);
      if (res.success) {
        setIsEditingRates(false);
        setRefreshSeed((s) => s + 1);
        alert('Harga berhasil disimpan!');
      } else {
        alert(res.message || 'Gagal menyimpan harga');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setIsSavingRates(false);
    }
  };

  useEffect(() => {
    const fetchRekap = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await checkoutAPI.getRekap(filters);

        if (!result.success) {
          setError(result.message || 'Gagal memuat rekap retase');
          return;
        }

        const nextMeta = result.data?.meta || null;
        setRows(result.data?.rows || []);
        setMeta(nextMeta);
      } catch (fetchError) {
        setError(`Gagal memuat data: ${fetchError.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRekap();
  }, [filters, refreshSeed]);

  const periodOption = useMemo(() => getPeriodOption(filters.period), [filters.period]);
  const periodColumnLabel = periodOption.rowLabel;
  const dateColumnLabel = periodOption.dateLabel;

  const summary = useMemo(() => {
    const totalFuso = rows.reduce((sum, row) => sum + row.fusoCount, 0);
    const totalDyna = rows.reduce((sum, row) => sum + row.dynaCount, 0);
    const nextSummary = [
      {
        label: `${periodOption.summaryLabel} Terekap`,
        value: rows.length,
        note: `Jumlah baris rekap ${periodOption.label.toLowerCase()}`,
      },
      { label: 'Retase Fuso', value: totalFuso, note: 'Total ritase truk tipe Fuso' },
      { label: 'Retase Dyna', value: totalDyna, note: 'Total ritase truk tipe Dyna' },
    ];

    if (isAdmin) {
      const totalOther = rows.reduce((sum, row) => sum + row.otherCount, 0);
      const totalPrice = rows.reduce((sum, row) => sum + row.totalPrice, 0);

      nextSummary.push({
        label: 'Total Harga',
        value: formatCurrency(totalPrice),
        note:
          totalOther > 0
            ? `${totalOther} tipe lain tidak dihitung harga`
            : 'Semua harga terakumulasi',
      });
    }

    return nextSummary;
  }, [isAdmin, periodOption.label, periodOption.summaryLabel, rows]);

  const totals = useMemo(
    () => ({
      fusoCount: rows.reduce((sum, row) => sum + row.fusoCount, 0),
      dynaCount: rows.reduce((sum, row) => sum + row.dynaCount, 0),
      totalLahan: rows.reduce((sum, row) => sum + row.totalPriceLahan, 0),
      totalPt: rows.reduce((sum, row) => sum + row.totalPricePt, 0),
    }),
    [rows]
  );

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(isActiveRekapFilter).length,
    [filters]
  );

  const hasActiveFilters = activeFilterCount > 0;

  const dateRangeLabel = useMemo(() => {
    const startLabel = formatDateFilterLabel(filters.startDate);
    const endLabel = formatDateFilterLabel(filters.endDate);

    if (startLabel && endLabel) {
      return `${startLabel} - ${endLabel}`;
    }

    if (startLabel) {
      return `Mulai ${startLabel}`;
    }

    if (endLabel) {
      return `Sampai ${endLabel}`;
    }

    return 'Semua tanggal';
  }, [filters.endDate, filters.startDate]);

  const handleExportExcel = () => {
    if (!isAdmin || rows.length === 0) {
      return;
    }

    const selectedLocation = meta?.locationOwner || 'Semua lokasi';
    const selectedContractor = meta?.contractor || 'Semua kontraktor';
    const exportConfirmationMessage =
      `Export Excel akan menggunakan filter Rekap yang dipilih:\n` +
      `- Mode: ${periodOption.label}\n` +
      `- Periode: ${dateRangeLabel}\n` +
      `- Lokasi: ${selectedLocation}\n` +
      `- Kontraktor: ${selectedContractor}\n\n` +
      'Export akan menghasilkan 2 sheet: Pemilik Lahan dan Pemilik PT.\n\n' +
      'Lanjutkan export?';

    if (!window.confirm(exportConfirmationMessage)) {
      return;
    }

    const currentFusoRate = Number(meta?.rates?.fuso || 0);
    const currentDynaRate = Number(meta?.rates?.dyna || 0);
    const lahanFusoRate = Number(meta?.ratesLahan?.fuso || 0);
    const lahanDynaRate = Number(meta?.ratesLahan?.dyna || 0);
    const ptFusoRate = Number(meta?.ratesPt?.fuso || 0);
    const ptDynaRate = Number(meta?.ratesPt?.dyna || 0);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'SITAG System';
    wb.created = new Date();

    const buildStyledSheet = (sheetName, title, data) => {
      const ws = wb.addWorksheet(sheetName);

      // Add Title
      ws.addRow([title]);
      ws.mergeCells('A1:I1');
      const titleCell = ws.getCell('A1');
      titleCell.font = { name: 'Calibri', size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Add Meta Info
      ws.addRow([`Periode: ${dateRangeLabel} | Filter: ${periodOption.label}`]);
      ws.mergeCells('A2:I2');
      ws.getCell('A2').alignment = { horizontal: 'center' };
      ws.addRow([]); // Empty row

      // Define columns
      ws.columns = [
        { key: 'period', width: 15 },
        { key: 'date', width: 22 },
        { key: 'checkerPit', width: 20 },
        { key: 'checkerGate', width: 20 },
        { key: 'fusoCount', width: 15 },
        { key: 'dynaCount', width: 15 },
        { key: 'fusoPrice', width: 20 },
        { key: 'dynaPrice', width: 20 },
        { key: 'totalPrice', width: 20 },
      ];

      // Add Header Row (Row 4) manually
      const headerRow = ws.getRow(4);
      headerRow.values = [
        'Periode',
        'Tanggal',
        'Checker Pit',
        'Checker Gate',
        'Retase Fuso',
        'Retase Dyna',
        'Harga Fuso',
        'Harga Dyna',
        'Total Harga'
      ];

      // Style Header Row (Row 4)
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFBB324' }, // SITAG Accent Yellow
        };
        cell.font = { bold: true, color: { argb: 'FF000000' } };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Add Data Rows
      data.forEach((row, index) => {
        const isTotalRow = index === data.length - 1;
        const excelRow = ws.addRow(row);

        excelRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          // Currency formatting for price columns
          if (colNumber >= 7 && colNumber <= 9) {
            cell.numFmt = '"Rp"#,##0;[Red]\-"Rp"#,##0';
          }

          if (isTotalRow) {
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF3F4F6' },
            };
          } else {
            // Apply column-specific colors for normal rows
            if (colNumber === 5 || colNumber === 7) {
              // Fuso Columns: Light Blue
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0F2FE' },
              };
            } else if (colNumber === 6 || colNumber === 8) {
              // Dyna Columns: Light Orange/Red
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFEDD5' },
              };
            } else if (colNumber === 9) {
              // Total Column: Light Green
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD1FAE5' },
              };
            }
          }
        });
      });
    };

    const buildSheetData = (fusoRate, dynaRate, fusoPKey, dynaPKey, totalPKey) => {
      const sheetData = [];
      let totalFusoCount = 0;
      let totalDynaCount = 0;
      let totalFusoPrice = 0;
      let totalDynaPrice = 0;
      let grandTotal = 0;

      rows.forEach((row) => {
        const sheetFusoPrice = row[fusoPKey] ?? (row.fusoCount * fusoRate);
        const sheetDynaPrice = row[dynaPKey] ?? (row.dynaCount * dynaRate);
        const sheetTotalPrice = row[totalPKey] ?? ((row.fusoCount * fusoRate) + (row.dynaCount * dynaRate));

        totalFusoCount += row.fusoCount;
        totalDynaCount += row.dynaCount;
        totalFusoPrice += sheetFusoPrice;
        totalDynaPrice += sheetDynaPrice;
        grandTotal += sheetTotalPrice;

        sheetData.push({
          period: row.day,
          date: getRowDateLabel(row, filters.period),
          checkerPit: row.checkerPit,
          checkerGate: row.checkerGate,
          fusoCount: row.fusoCount,
          dynaCount: row.dynaCount,
          fusoPrice: sheetFusoPrice,
          dynaPrice: sheetDynaPrice,
          totalPrice: sheetTotalPrice,
        });
      });

      sheetData.push({
        period: 'TOTAL',
        date: '',
        checkerPit: '',
        checkerGate: '',
        fusoCount: totalFusoCount,
        dynaCount: totalDynaCount,
        fusoPrice: totalFusoPrice,
        dynaPrice: totalDynaPrice,
        totalPrice: grandTotal,
      });

      return sheetData;
    };

    const lahanData = buildSheetData(lahanFusoRate, lahanDynaRate, 'fusoPriceLahan', 'dynaPriceLahan', 'totalPriceLahan');
    const ptData = buildSheetData(ptFusoRate, ptDynaRate, 'fusoPricePt', 'dynaPricePt', 'totalPricePt');

    buildStyledSheet('Pemilik Lahan', 'Rekap Retase - Pemilik Lahan', lahanData);
    buildStyledSheet('Pemilik PT', 'Rekap Retase - Pemilik PT', ptData);

    wb.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Rekap_Retase_${filters.period}_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  };




  const handleExportPDF = async () => {
    if (!canExportPdf || isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);

    try {
      const result = await checkoutAPI.downloadRekapNotaToday({
        locationOwner: filters.locationOwner || undefined,
        contractor: filters.contractor || undefined,
        exportedBy: user?.name || 'Admin',
      });

      if (!result.success) {
        setError(result.message || 'Gagal mengekspor nota harian');
        return;
      }

      const pdfBlob = result.data?.blob;
      const fileName = result.data?.fileName || `Nota_Rekap_Retase_daily_${new Date().toISOString().slice(0, 10)}.pdf`;

      if (!pdfBlob) {
        setError('Gagal mengekspor nota harian: file PDF kosong');
        return;
      }

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(`Gagal mengekspor nota harian: ${exportError.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className={`rekap-page ${isLimitedRole ? 'rekap-page--limited' : ''}`}>
      <section className="rekap-hero surface-card surface-card--accent">
        <div className="rekap-hero-copy">
          <span className="section-kicker">Sheet Rekap</span>
          <h2>Rekap Data Retase</h2>
          <p>
            {isAdmin
              ? 'Tabel ini bisa dibaca harian, mingguan, atau bulanan dan tetap mengikuti workbook: Periode, Tanggal, Checker Pit, Checker Gate, Retase Fuso, Retase Dyna, Harga Fuso, Harga Dyna, Harga, dan Cumulative Harga.'
              : 'Tabel ini bisa dibaca harian, mingguan, atau bulanan dengan fokus pada Periode, Tanggal, Checker, dan jumlah Retase.'}
          </p>
          <div className="rekap-hero-actions">
            {isAdmin && (
              <button
                className="rekap-export-btn"
                type="button"
                onClick={handleExportExcel}
                disabled={isLoading || rows.length === 0}
                title={
                  rows.length === 0
                    ? 'Tidak ada data untuk diekspor'
                    : `Export Excel berdasarkan filter rekap aktif (${periodOption.label.toLowerCase()})`
                }
              >
                <FileDown size={18} />
                <span>Ekspor ke Excel</span>
              </button>
            )}
            {canExportPdf && (
              <button
                className="rekap-export-btn rekap-export-btn--pdf"
                type="button"
                onClick={handleExportPDF}
                disabled={isLoading || isExportingPdf}
                title="Unduh nota rekap harian (hanya data hari ini) ke PDF"
              >
                <FileText size={18} />
                <span>{isExportingPdf ? 'Mengekspor Nota...' : 'Ekspor Nota (PDF)'}</span>
              </button>
            )}
            <button
              className="rekap-secondary-btn"
              type="button"
              onClick={() => setRefreshSeed((value) => value + 1)}
            >
              {isLoading ? <Loader2 size={16} className="spinner" /> : <RefreshCw size={16} />}
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
        <div className="rekap-hero-badge">
          <strong>{rows.length}</strong>
          <span>Baris {periodOption.label.toLowerCase()}</span>
        </div>
      </section>

      <div className={`rekap-top-grid ${isLimitedRole ? 'rekap-top-grid--limited' : ''}`}>
        <div className="rekap-filter-panel surface-card">
          <div className="rekap-filter-header">
            <Filter size={16} />
            <strong>Filter Rekap</strong>
            {activeFilterCount > 0 && <span className="soft-badge">{activeFilterCount} aktif</span>}
          </div>
          <div className="rekap-filter-grid">
            <div className="rekap-field-group">
              <label htmlFor="rekap-period">Mode Rekap</label>
              <select
                id="rekap-period"
                className="rekap-field-input rekap-field-select"
                value={filters.period}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    period: event.target.value,
                  }))
                }
              >
                {REKAP_PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="rekap-rate-preview">{periodOption.note}</span>
            </div>

            <div className="rekap-field-group">
              <label htmlFor="rekap-location">Lokasi / Pemilik</label>
              <select
                id="rekap-location"
                className="rekap-field-input rekap-field-select"
                value={filters.locationOwner}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    locationOwner: event.target.value,
                  }))
                }
              >
                <option value="">Semua lokasi</option>
                {LOCATION_OPTIONS.filter((option) => option.value !== '__custom__').map(
                  (option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="rekap-field-group">
              <label htmlFor="rekap-contractor">Kontraktor</label>
              <select
                id="rekap-contractor"
                className="rekap-field-input rekap-field-select"
                value={filters.contractor}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    contractor: event.target.value,
                  }))
                }
              >
                <option value="">Nama</option>
                {CONTRACTOR_OPTIONS.filter((option) => option.value !== '__custom__').map(
                  (option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="rekap-field-group">
              <label htmlFor="rekap-start-date">Tanggal Mulai</label>
              <input
                id="rekap-start-date"
                type="date"
                className="rekap-field-input"
                value={filters.startDate}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    startDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="rekap-field-group">
              <label htmlFor="rekap-end-date">Tanggal Akhir</label>
              <input
                id="rekap-end-date"
                type="date"
                className="rekap-field-input"
                value={filters.endDate}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    endDate: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="rekap-inline-actions">
            <span className="rekap-filter-note">
              Mode: <strong>{periodOption.label}</strong> | Rentang tanggal: <strong>{dateRangeLabel}</strong>
            </span>
            {hasActiveFilters && (
              <button className="rekap-clear-btn" type="button" onClick={clearFilters}>
                Reset Filter
              </button>
            )}
          </div>

          {meta && (
            <div className="rekap-meta-line">
              <span>
                Lokasi: <strong>{meta.locationOwner}</strong>
              </span>
              <span>
                Kontraktor: <strong>{meta.contractor}</strong>
              </span>
              <span>
                Mode: <strong>{meta.periodLabel || periodOption.label}</strong>
              </span>
              {isAdmin && (
                <>
                  <span>
                    Harga Fuso: <strong>{formatCurrency(meta.rates?.fuso)}</strong>
                  </span>
                  <span>
                    Harga Dyna: <strong>{formatCurrency(meta.rates?.dyna)}</strong>
                  </span>
                </>
              )}
              <span>
                Rentang tanggal: <strong>{dateRangeLabel}</strong>
              </span>
            </div>
          )}
        </div>

        {isAdmin && (
          <section className="rekap-rates-panel surface-card">
            <div className="rekap-filter-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={16} />
                <strong>Parameter Harga</strong>
              </div>
              <button 
                type="button" 
                className="rekap-secondary-btn" 
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                onClick={handleEditRatesToggle}
              >
                {isEditingRates ? 'Batal' : 'Edit Lahan & PT'}
              </button>
            </div>

            <div className="rekap-rates-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="rekap-rate-lock-card">
                <span>Fuso (Lahan)</span>
                {isEditingRates ? (
                  <input 
                    type="number" 
                    value={editRatesData.lahanFuso} 
                    onChange={e => setEditRatesData({...editRatesData, lahanFuso: e.target.value})}
                    style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px', borderRadius: '4px', width: '100px' }}
                  />
                ) : (
                  <strong>{formatCurrency(meta?.ratesLahan?.fuso)}</strong>
                )}
              </div>
              <div className="rekap-rate-lock-card">
                <span>Dyna (Lahan)</span>
                {isEditingRates ? (
                  <input 
                    type="number" 
                    value={editRatesData.lahanDyna} 
                    onChange={e => setEditRatesData({...editRatesData, lahanDyna: e.target.value})}
                    style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px', borderRadius: '4px', width: '100px' }}
                  />
                ) : (
                  <strong>{formatCurrency(meta?.ratesLahan?.dyna)}</strong>
                )}
              </div>

              <div className="rekap-rate-lock-card">
                <span>Fuso (PT)</span>
                {isEditingRates ? (
                  <input 
                    type="number" 
                    value={editRatesData.ptFuso} 
                    onChange={e => setEditRatesData({...editRatesData, ptFuso: e.target.value})}
                    style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px', borderRadius: '4px', width: '100px' }}
                  />
                ) : (
                  <strong>{formatCurrency(meta?.ratesPt?.fuso)}</strong>
                )}
              </div>
              <div className="rekap-rate-lock-card">
                <span>Dyna (PT)</span>
                {isEditingRates ? (
                  <input 
                    type="number" 
                    value={editRatesData.ptDyna} 
                    onChange={e => setEditRatesData({...editRatesData, ptDyna: e.target.value})}
                    style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px', borderRadius: '4px', width: '100px' }}
                  />
                ) : (
                  <strong>{formatCurrency(meta?.ratesPt?.dyna)}</strong>
                )}
              </div>
            </div>

            {isEditingRates && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="rekap-export-btn"
                  onClick={handleSaveRates}
                  disabled={isSavingRates}
                >
                  {isSavingRates ? 'Menyimpan...' : 'Simpan Harga Lahan & PT'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      <section className="summary-grid">
        {summary.map((item) => (
          <article className="summary-tile" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <div className="rekap-note surface-card">
        <strong>{isAdmin ? 'Tampilan rekap mengikuti pola fitur lain:' : 'Fokus data role ini:'}</strong>
        <span>
          {isAdmin
            ? 'Pilih mode harian, mingguan, atau bulanan lalu gunakan filter untuk mempersempit data. Data sekarang ditampilkan penuh dalam bentuk tabel agar konsisten antar fitur.'
            : 'Gunakan mode harian, mingguan, atau bulanan lalu filter sesuai kebutuhan untuk memantau ritase tanpa komponen harga.'}
        </span>
      </div>

      {isAdmin && (
        <article className="rekap-grand-total surface-card surface-card--accent">
          <div className="rekap-grand-header">
            <span className="section-kicker">Ringkasan Total</span>
            <div className="rekap-grand-price">
              <span>Total Seluruh Harga</span>
              <strong>{formatCurrency(totals.totalPrice)}</strong>
            </div>
          </div>
          <div className="rekap-grand-total-grid">
            <div>
              <span>Jumlah Hari</span>
              <strong>{rows.length}</strong>
            </div>
            <div>
              <span>Total Retase Fuso</span>
              <strong>{totals.fusoCount}</strong>
            </div>
            <div>
              <span>Total Retase Dyna</span>
              <strong>{totals.dynaCount}</strong>
            </div>
            <div>
              <span>Total Harga Lahan</span>
              <strong>{formatCurrency(totals.totalLahan)}</strong>
            </div>
            <div>
              <span>Total Harga PT</span>
              <strong>{formatCurrency(totals.totalPt)}</strong>
            </div>
          </div>
        </article>
      )}

      {isLoading ? (
        <div className="empty-state-panel">
          <Loader2 size={48} className="spinner" />
          <h3>Memuat rekap...</h3>
          <p>Mengambil ringkasan retase dari server.</p>
        </div>
      ) : error ? (
        <div className="empty-state-panel">
          <AlertCircle size={48} />
          <h3>Terjadi Kesalahan</h3>
          <p>{error}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-state-panel">
          <ClipboardList size={48} />
          <h3>Belum ada data rekap</h3>
          <p>Rekap hanya menghitung data yang sudah diverifikasi gate.</p>
        </div>
      ) : (
        <>
          <div className="rekap-table-wrap data-table-wrap surface-card">
            <table className={`rekap-table data-table ${!isAdmin ? 'rekap-table--non-admin' : ''}`}>
              <thead>
                <tr>
                  <th className="rekap-head rekap-head--period">Periode</th>
                  <th className="rekap-head rekap-head--date">Tanggal</th>
                  <th className="rekap-head rekap-head--checker">Checker</th>
                  <th className="rekap-head rekap-head--trip table-head-center">Retase</th>
                  {isAdmin && (
                    <>
                      <th className="rekap-head rekap-head--rate table-head-right">Total Lahan</th>
                      <th className="rekap-head rekap-head--total table-head-right">Total PT</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.day}-${row.date}-${index}`}>
                    <td data-label="Periode" className="rekap-cell rekap-cell--period">
                      <div className="table-stack rekap-cell-stack">
                        <span className="table-primary">{row.day}</span>
                        <span className="table-muted">{periodOption.label}</span>
                      </div>
                    </td>
                    <td data-label="Tanggal" className="rekap-cell rekap-cell--date">
                      <span className="table-primary">{getRowDateLabel(row, filters.period)}</span>
                    </td>
                    <td data-label="Checker" className="rekap-cell rekap-cell--checker">
                      <div className="table-stack rekap-cell-stack">
                        <span className="rekap-checker-line">
                          <span className="rekap-checker-label">Pit</span>
                          <span className="table-primary">{row.checkerPit}</span>
                        </span>
                        <span className="rekap-checker-line">
                          <span className="rekap-checker-label">Gate</span>
                          <span className="table-muted">{row.checkerGate}</span>
                        </span>
                      </div>
                    </td>
                    <td data-label="Retase" className="rekap-cell rekap-cell--trip table-cell-center">
                      <div className="table-stack rekap-cell-stack">
                        <span className="rekap-metric-line">
                          <span className="rekap-metric-label">Fuso</span>
                          <span className="rekap-metric-value">{row.fusoCount}</span>
                        </span>
                        <span className="rekap-metric-line">
                          <span className="rekap-metric-label">Dyna</span>
                          <span className="rekap-metric-value">{row.dynaCount}</span>
                        </span>
                      </div>
                    </td>
                    {isAdmin && (
                      <>
                        <td data-label="Total Lahan" className="rekap-cell rekap-cell--total rekap-total-price table-cell-right">
                          {formatCurrency(row.totalPriceLahan)}
                        </td>
                        <td data-label="Total PT" className="rekap-cell rekap-cell--total rekap-total-price table-cell-right">
                          {formatCurrency(row.totalPricePt)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
