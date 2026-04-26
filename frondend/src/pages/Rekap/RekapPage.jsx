import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ClipboardList,
  Filter,
  Loader2,
  RefreshCw,
  Wallet,
  FileDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { checkoutAPI } from '../../services/api';
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
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({
    period: DEFAULT_REKAP_PERIOD,
    locationOwner: '',
    contractor: '',
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshSeed, setRefreshSeed] = useState(0);

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
    const totalOther = rows.reduce((sum, row) => sum + row.otherCount, 0);
    const totalPrice = rows.reduce((sum, row) => sum + row.totalPrice, 0);

    return [
      {
        label: `${periodOption.summaryLabel} Terekap`,
        value: rows.length,
        note: `Jumlah baris rekap ${periodOption.label.toLowerCase()}`,
      },
      { label: 'Retase Fuso', value: totalFuso, note: 'Mengikuti parameter harga tetap' },
      { label: 'Retase Dyna', value: totalDyna, note: 'Mengikuti parameter harga tetap' },
      {
        label: 'Total Harga',
        value: formatCurrency(totalPrice),
        note:
          totalOther > 0
            ? `${totalOther} tipe lain tidak dihitung harga`
            : 'Semua harga terakumulasi',
      },
    ];
  }, [periodOption.label, periodOption.summaryLabel, rows]);

  const totals = useMemo(
    () => ({
      fusoCount: rows.reduce((sum, row) => sum + row.fusoCount, 0),
      dynaCount: rows.reduce((sum, row) => sum + row.dynaCount, 0),
      fusoPrice: rows.reduce((sum, row) => sum + row.fusoPrice, 0),
      dynaPrice: rows.reduce((sum, row) => sum + row.dynaPrice, 0),
      totalPrice: rows.reduce((sum, row) => sum + row.totalPrice, 0),
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

  const handleClearFilters = () => {
    setFilters({
      period: DEFAULT_REKAP_PERIOD,
      locationOwner: '',
      contractor: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleExportExcel = () => {
    if (!isAdmin || rows.length === 0) {
      return;
    }

    // Creating manual HTML table for Excel compatibility.
    const header = [
      periodColumnLabel,
      dateColumnLabel,
      'Checker Pit',
      'Checker Gate',
      'Retase Fuso',
      'Retase Dyna',
      'Harga Fuso',
      'Harga Dyna',
      'Harga',
      'Cumulative Harga',
    ];

    const exportTotals = {
      fusoCount: rows.reduce((sum, r) => sum + r.fusoCount, 0),
      dynaCount: rows.reduce((sum, r) => sum + r.dynaCount, 0),
      fusoPrice: rows.reduce((sum, r) => sum + r.fusoPrice, 0),
      dynaPrice: rows.reduce((sum, r) => sum + r.dynaPrice, 0),
      totalPrice: rows.reduce((sum, r) => sum + r.totalPrice, 0),
    };

    const tableHtml = `
      <h2>Rekap Retase ${escapeHtml(periodOption.label)}</h2>
      <p>
        Mode: ${escapeHtml(periodOption.label)} |
        Periode: ${escapeHtml(dateRangeLabel)} |
        Lokasi: ${escapeHtml(meta?.locationOwner || 'Semua lokasi')} |
        Kontraktor: ${escapeHtml(meta?.contractor || 'Semua kontraktor')}
      </p>
      <table border="1">
        <thead>
          <tr style="background-color: #fbb324; color: #000; font-weight: bold;">
            ${header.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <td>${escapeHtml(row.day)}</td>
              <td>${escapeHtml(getRowDateLabel(row, filters.period))}</td>
              <td>${escapeHtml(row.checkerPit)}</td>
              <td>${escapeHtml(row.checkerGate)}</td>
              <td>${row.fusoCount}</td>
              <td>${row.dynaCount}</td>
              <td>${escapeHtml(formatCurrency(row.fusoPrice))}</td>
              <td>${escapeHtml(formatCurrency(row.dynaPrice))}</td>
              <td>${escapeHtml(formatCurrency(row.totalPrice))}</td>
              <td>${escapeHtml(formatCurrency(row.cumulativePrice))}</td>
            </tr>
          `
            )
            .join('')}
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="4" style="text-align: right;">TOTAL:</td>
            <td>${exportTotals.fusoCount}</td>
            <td>${exportTotals.dynaCount}</td>
            <td>${escapeHtml(formatCurrency(exportTotals.fusoPrice))}</td>
            <td>${escapeHtml(formatCurrency(exportTotals.dynaPrice))}</td>
            <td>${escapeHtml(formatCurrency(exportTotals.totalPrice))}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    `;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Rekap Retase</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body>${tableHtml}</body>
      </html>
    `;

    const blob = new Blob(['\ufeff', template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Retase_${filters.period}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rekap-page">
      <section className="rekap-hero surface-card surface-card--accent">
        <div className="rekap-hero-copy">
          <span className="section-kicker">Sheet Rekap</span>
          <h2>Rekap Data Retase</h2>
          <p>
            Tabel ini bisa dibaca harian, mingguan, atau bulanan dan tetap mengikuti workbook: Periode, Tanggal, Checker Pit, Checker Gate,
            Retase Fuso, Retase Dyna, Harga Fuso, Harga Dyna, Harga, dan Cumulative Harga.
          </p>
          <div className="rekap-hero-actions">
            {isAdmin && (
              <button
                className="rekap-export-btn"
                type="button"
                onClick={handleExportExcel}
                disabled={isLoading || rows.length === 0}
                title={rows.length === 0 ? 'Tidak ada data untuk diekspor' : `Unduh rekap ${periodOption.label.toLowerCase()} ke Excel`}
              >
                <FileDown size={18} />
                <span>Ekspor ke Excel</span>
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

      <div className="rekap-top-grid">
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
                <option value="">Semua kontraktor</option>
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
              <button className="rekap-clear-btn" type="button" onClick={handleClearFilters}>
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
              <span>
                Harga Fuso: <strong>{formatCurrency(meta.rates?.fuso)}</strong>
              </span>
              <span>
                Harga Dyna: <strong>{formatCurrency(meta.rates?.dyna)}</strong>
              </span>
              <span>
                Rentang tanggal: <strong>{dateRangeLabel}</strong>
              </span>
            </div>
          )}
        </div>

        <section className="rekap-rates-panel surface-card">
          <div className="rekap-filter-header">
            <Wallet size={16} />
            <strong>Parameter Harga</strong>
            <span className="soft-badge">Terkunci</span>
          </div>

          <div className="rekap-rates-grid">
            <div className="rekap-rate-lock-card">
              <span>Harga Fuso</span>
              <strong>{formatCurrency(meta?.rates?.fuso)}</strong>
              <small>Parameter tetap sistem</small>
            </div>

            <div className="rekap-rate-lock-card">
              <span>Harga Dyna</span>
              <strong>{formatCurrency(meta?.rates?.dyna)}</strong>
              <small>Parameter tetap sistem</small>
            </div>
          </div>

          <div className="rekap-rates-footer">
            <span className="rekap-rates-note">
              Harga retase dikunci dari aplikasi dan dipakai otomatis untuk dashboard, rekap, dan ekspor.
            </span>
          </div>
        </section>
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
        <strong>Tampilan rekap mengikuti pola fitur lain:</strong>
        <span>
          Pilih mode harian, mingguan, atau bulanan lalu gunakan filter untuk mempersempit data. Data ditampilkan dalam bentuk kartu
          agar nyaman di semua ukuran layar tanpa perlu geser ke samping.
        </span>
      </div>

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
          <div className="rekap-table-wrap surface-card">
            <table className="rekap-table">
              <thead>
                <tr>
                  <th>{periodColumnLabel}</th>
                  <th>{dateColumnLabel}</th>
                  <th>Checker Pit</th>
                  <th>Checker Gate</th>
                  <th>Retase Fuso</th>
                  <th>Retase Dyna</th>
                  <th>Harga Fuso</th>
                  <th>Harga Dyna</th>
                  <th>Harga</th>
                  <th>Cumulative Harga</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.day}-${row.date}-${index}`}>
                    <td>{row.day}</td>
                    <td>{getRowDateLabel(row, filters.period)}</td>
                    <td>{row.checkerPit}</td>
                    <td>{row.checkerGate}</td>
                    <td>{row.fusoCount}</td>
                    <td>{row.dynaCount}</td>
                    <td>{formatCurrency(row.fusoPrice)}</td>
                    <td>{formatCurrency(row.dynaPrice)}</td>
                    <td>{formatCurrency(row.totalPrice)}</td>
                    <td>{formatCurrency(row.cumulativePrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="rekap-table-total">
                  <td colSpan="4">TOTAL</td>
                  <td>{totals.fusoCount}</td>
                  <td>{totals.dynaCount}</td>
                  <td>{formatCurrency(totals.fusoPrice)}</td>
                  <td>{formatCurrency(totals.dynaPrice)}</td>
                  <td>{formatCurrency(totals.totalPrice)}</td>
                  <td>-</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="rekap-cards">
            {rows.map((row, index) => (
              <article className="rekap-card surface-card" key={`${row.day}-${row.date}-${index}`}>
                <div className="rekap-card-header">
                  <div className="rekap-card-identity">
                    <div className={`rekap-day-badge ${filters.period !== DEFAULT_REKAP_PERIOD ? 'rekap-day-badge--wide' : ''}`}>
                      {row.day}
                    </div>
                    <div className="rekap-card-title">
                      <strong>{getRowDateLabel(row, filters.period)}</strong>
                      <p>Checker: {row.checkerPit} -&gt; {row.checkerGate}</p>
                    </div>
                  </div>
                  <div className="rekap-price-badge">
                    <span>Total Harga</span>
                    <strong>{formatCurrency(row.totalPrice)}</strong>
                  </div>
                </div>

                <div className="rekap-card-body">
                  <div className="rekap-card-row">
                    <div className="rekap-card-item">
                      <span>Retase Fuso</span>
                      <strong>{row.fusoCount}<small> trip</small></strong>
                    </div>
                    <div className="rekap-card-item">
                      <span>Retase Dyna</span>
                      <strong>{row.dynaCount}<small> trip</small></strong>
                    </div>
                    <div className="rekap-card-item">
                      <span>Harga Fuso</span>
                      <strong>{formatCurrency(row.fusoPrice)}</strong>
                    </div>
                    <div className="rekap-card-item">
                      <span>Harga Dyna</span>
                      <strong>{formatCurrency(row.dynaPrice)}</strong>
                    </div>
                  </div>
                </div>

                <div className="rekap-card-footer">
                  <div className="rekap-card-foot-item">
                    <span>Cumulative Harga</span>
                    <strong>{formatCurrency(row.cumulativePrice)}</strong>
                  </div>
                  {(row.otherCount > 0) && (
                    <div className="rekap-card-foot-item">
                      <span>Tipe Lain</span>
                      <strong>{row.otherCount}</strong>
                    </div>
                  )}
                </div>
              </article>
            ))}
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
                  <span>Harga Fuso</span>
                  <strong>{formatCurrency(totals.fusoPrice)}</strong>
                </div>
                <div>
                  <span>Harga Dyna</span>
                  <strong>{formatCurrency(totals.dynaPrice)}</strong>
                </div>
              </div>
            </article>
          </div>
        </>
      )}
    </div>
  );
}
