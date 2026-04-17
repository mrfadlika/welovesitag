import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Filter,
  Loader2,
  RefreshCw,
  Save,
  Wallet,
  FileDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { checkoutAPI, settingsAPI } from '../../services/api';
import { CONTRACTOR_OPTIONS, DEFAULT_RETASE_RATES, LOCATION_OPTIONS } from '../../data/retaseOptions';
import { formatCurrency, formatNumber } from '../../utils/retase';
import './RekapPage.css';

function createRateForm(rates = DEFAULT_RETASE_RATES) {
  return {
    fuso: String(rates?.fuso ?? DEFAULT_RETASE_RATES.fuso),
    dyna: String(rates?.dyna ?? DEFAULT_RETASE_RATES.dyna),
  };
}

function sanitizeRateInput(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatDisplayDate(value) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString('id-ID');
}

function formatDateFilterLabel(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function RekapPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({
    locationOwner: '',
    contractor: '',
    startDate: '',
    endDate: '',
  });
  const [rateForm, setRateForm] = useState(() => createRateForm(DEFAULT_RETASE_RATES));
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
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
        setRateForm(createRateForm(nextMeta?.rates || DEFAULT_RETASE_RATES));
      } catch (fetchError) {
        setError(`Gagal memuat data: ${fetchError.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRekap();
  }, [filters, refreshSeed]);

  const summary = useMemo(() => {
    const totalFuso = rows.reduce((sum, row) => sum + row.fusoCount, 0);
    const totalDyna = rows.reduce((sum, row) => sum + row.dynaCount, 0);
    const totalOther = rows.reduce((sum, row) => sum + row.otherCount, 0);
    const totalPrice = rows.reduce((sum, row) => sum + row.totalPrice, 0);

    return [
      { label: 'Hari Terekap', value: rows.length, note: 'Jumlah baris rekap harian' },
      { label: 'Retase Fuso', value: totalFuso, note: 'Mengikuti tarif aktif' },
      { label: 'Retase Dyna', value: totalDyna, note: 'Mengikuti tarif aktif' },
      {
        label: 'Total Harga',
        value: formatCurrency(totalPrice),
        note:
          totalOther > 0
            ? `${totalOther} tipe lain tidak dihitung harga`
            : 'Semua harga terakumulasi',
      },
    ];
  }, [rows]);

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
    () => Object.values(filters).filter((value) => Boolean(value)).length,
    [filters]
  );

  const hasActiveFilters = activeFilterCount > 0;

  const periodLabel = useMemo(() => {
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
      locationOwner: '',
      contractor: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleSaveRates = async (event) => {
    event.preventDefault();
    setIsSavingRates(true);
    setSaveMessage(null);

    try {
      const payload = {
        fuso: Number.parseInt(rateForm.fuso || '0', 10),
        dyna: Number.parseInt(rateForm.dyna || '0', 10),
      };

      const result = await settingsAPI.updateRates({
        fuso: payload.fuso,
        dyna: payload.dyna,
      });

      if (!result.success) {
        setSaveMessage({
          tone: 'error',
          text: result.message || 'Gagal menyimpan tarif',
        });
        return;
      }

      setMeta((previous) => ({
        ...(previous || {}),
        rates: result.data || DEFAULT_RETASE_RATES,
      }));
      setRateForm(createRateForm(result.data || DEFAULT_RETASE_RATES));

      const refreshedRekap = await checkoutAPI.getRekap(filters);
      if (refreshedRekap.success) {
        setRows(refreshedRekap.data?.rows || []);
        setMeta(refreshedRekap.data?.meta || null);
      }

      setSaveMessage({
        tone: 'success',
        text: 'Tarif retase berhasil diperbarui.',
      });
    } catch (saveError) {
      setSaveMessage({
        tone: 'error',
        text: `Terjadi kesalahan: ${saveError.message}`,
      });
    } finally {
      setIsSavingRates(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleExportExcel = () => {
    // Creating manual HTML table for Excel compatibility
    const header = [
      'Hari',
      'Tanggal',
      'Checker Pit',
      'Checker Gate',
      'Retase Fuso',
      'Retase Dyna',
      'Harga Fuso',
      'Harga Dyna',
      'Harga',
      'Cumulative Harga',
    ];

    const totals = {
      fusoCount: rows.reduce((sum, r) => sum + r.fusoCount, 0),
      dynaCount: rows.reduce((sum, r) => sum + r.dynaCount, 0),
      fusoPrice: rows.reduce((sum, r) => sum + r.fusoPrice, 0),
      dynaPrice: rows.reduce((sum, r) => sum + r.dynaPrice, 0),
      totalPrice: rows.reduce((sum, r) => sum + r.totalPrice, 0),
    };

    let tableHtml = `
      <table border="1">
        <thead>
          <tr style="background-color: #fbb324; color: #000; font-weight: bold;">
            ${header.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <td>${row.day}</td>
              <td>${formatDisplayDate(row.date)}</td>
              <td>${row.checkerPit}</td>
              <td>${row.checkerGate}</td>
              <td>${row.fusoCount}</td>
              <td>${row.dynaCount}</td>
              <td>${formatCurrency(row.fusoPrice)}</td>
              <td>${formatCurrency(row.dynaPrice)}</td>
              <td>${formatCurrency(row.totalPrice)}</td>
              <td>${formatCurrency(row.cumulativePrice)}</td>
            </tr>
          `
            )
            .join('')}
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="4" style="text-align: right;">TOTAL:</td>
            <td>${totals.fusoCount}</td>
            <td>${totals.dynaCount}</td>
            <td>${formatCurrency(totals.fusoPrice)}</td>
            <td>${formatCurrency(totals.dynaPrice)}</td>
            <td>${formatCurrency(totals.totalPrice)}</td>
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

    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Retase_${new Date().toISOString().split('T')[0]}.xls`;
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
            Tabel ini mengikuti workbook: Hari, Tanggal, Checker Pit, Checker Gate,
            Retase Fuso, Retase Dyna, Harga Fuso, Harga Dyna, Harga, dan Cumulative Harga.
          </p>
          <div className="rekap-hero-actions">
            {isAdmin && (
              <button
                className="rekap-export-btn"
                onClick={handleExportExcel}
                title="Unduh Laporan ke Excel"
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
          <span>Baris rekap</span>
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
              Periode: <strong>{periodLabel}</strong>
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
                Tarif Fuso: <strong>{formatCurrency(meta.rates?.fuso)}</strong>
              </span>
              <span>
                Tarif Dyna: <strong>{formatCurrency(meta.rates?.dyna)}</strong>
              </span>
              <span>
                Periode: <strong>{periodLabel}</strong>
              </span>
            </div>
          )}
        </div>

        {isAdmin && (
          <form className="rekap-rates-panel surface-card" onSubmit={handleSaveRates}>
            <div className="rekap-filter-header">
              <Wallet size={16} />
              <strong>Tarif Retase</strong>
            </div>

            <div className="rekap-rates-grid">
              <div className="rekap-field-group">
                <label htmlFor="rate-fuso">Tarif Fuso</label>
                <input
                  id="rate-fuso"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="rekap-field-input"
                  value={rateForm.fuso ? formatNumber(rateForm.fuso) : ''}
                  onChange={(event) =>
                    setRateForm((previous) => ({
                      ...previous,
                      fuso: sanitizeRateInput(event.target.value),
                    }))
                  }
                  placeholder="0"
                />
                <span className="rekap-rate-preview">
                  {formatCurrency(rateForm.fuso)}
                </span>
              </div>

              <div className="rekap-field-group">
                <label htmlFor="rate-dyna">Tarif Dyna</label>
                <input
                  id="rate-dyna"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="rekap-field-input"
                  value={rateForm.dyna ? formatNumber(rateForm.dyna) : ''}
                  onChange={(event) =>
                    setRateForm((previous) => ({
                      ...previous,
                      dyna: sanitizeRateInput(event.target.value),
                    }))
                  }
                  placeholder="0"
                />
                <span className="rekap-rate-preview">
                  {formatCurrency(rateForm.dyna)}
                </span>
              </div>
            </div>

            <div className="rekap-rates-footer">
              <span className="rekap-rates-note">
                Perubahan tarif langsung memengaruhi dashboard dan perhitungan rekap.
              </span>
              <button className="rekap-save-btn" type="submit" disabled={isSavingRates}>
                {isSavingRates ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Simpan Tarif
                  </>
                )}
              </button>
            </div>

            {saveMessage && (
              <div className={`rekap-save-message ${saveMessage.tone}`}>
                {saveMessage.tone === 'success' && <CheckCircle2 size={16} />}
                {saveMessage.tone === 'error' && <AlertCircle size={16} />}
                <span>{saveMessage.text}</span>
              </div>
            )}
          </form>
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
        <strong>Tampilan rekap mengikuti pola fitur lain:</strong>
        <span>
          Gunakan filter untuk mempersempit data. Data ditampilkan dalam bentuk kartu
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
                  <th>Hari</th>
                  <th>Tanggal</th>
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
                    <td>{formatDisplayDate(row.date)}</td>
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
                    <div className="rekap-day-badge">{row.day}</div>
                    <div className="rekap-card-title">
                      <strong>{formatDisplayDate(row.date)}</strong>
                      <p>Checker: {row.checkerPit} → {row.checkerGate}</p>
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
