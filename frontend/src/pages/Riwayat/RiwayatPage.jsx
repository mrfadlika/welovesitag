import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import usePersistentState from '../../hooks/usePersistentState';
import { checkoutAPI } from '../../services/api';
import { LOG_STATUS_OPTIONS, TRUCK_TYPE_OPTIONS } from '../../data/retaseOptions';
import { buildRetaseHistory } from '../../utils/retase';
import './RiwayatPage.css';

function StatusBadge({ status }) {
  if (status === 'verified') {
    return (
      <span className="status-badge verified">
        <CheckCircle2 size={12} /> Verified
      </span>
    );
  }

  if (status === 'rejected') {
    return <span className="status-badge rejected">Ditolak</span>;
  }

  return (
    <span className="status-badge pending">
      <Clock size={12} /> Menunggu Gate
    </span>
  );
}

function getStatusLabel(status) {
  if (status === 'verified') {
    return 'Verified';
  }

  if (status === 'rejected') {
    return 'Ditolak';
  }

  return 'Menunggu Gate';
}

export default function RiwayatPage() {
  const { user } = useAuth();
  const initialViewState = useMemo(
    () => ({
      searchQuery: '',
      filterType: 'all',
      filterStatus: 'all',
      dateRange: {
        startDate: '',
        endDate: '',
      },
      showFilters: false,
    }),
    []
  );
  const [viewState, setViewState] = usePersistentState(
    'sitag:v1:riwayat:filters',
    initialViewState
  );
  const { searchQuery, filterType, filterStatus, dateRange, showFilters } = viewState;
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await checkoutAPI.getAll();

        if (!result.success) {
          setError(result.message || 'Gagal memuat data log retase');
          return;
        }

        setRecords(buildRetaseHistory(result.data || []));
      } catch (fetchError) {
        setError(`Gagal memuat data: ${fetchError.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [refreshSeed]);

  const filteredData = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const startTimestamp = dateRange.startDate
      ? new Date(`${dateRange.startDate}T00:00:00`).getTime()
      : null;
    const endTimestamp = dateRange.endDate
      ? new Date(`${dateRange.endDate}T23:59:59.999`).getTime()
      : null;

    return records.filter((item) => {
      const matchDate =
        (!startTimestamp || item.timestamp >= startTimestamp) &&
        (!endTimestamp || item.timestamp <= endTimestamp);

      const matchSearch =
        !keyword ||
        item.id.toLowerCase().includes(keyword) ||
        item.date.toLowerCase().includes(keyword) ||
        item.time.toLowerCase().includes(keyword) ||
        item.day.toLowerCase().includes(keyword) ||
        item.truckNumber.toLowerCase().includes(keyword) ||
        item.truckTypeLabel.toLowerCase().includes(keyword) ||
        item.materialType.toLowerCase().includes(keyword) ||
        item.locationOwner.toLowerCase().includes(keyword) ||
        item.heavyEquipment.toLowerCase().includes(keyword) ||
        item.contractor.toLowerCase().includes(keyword) ||
        item.checkerPit.toLowerCase().includes(keyword) ||
        item.checkerGate.toLowerCase().includes(keyword) ||
        getStatusLabel(item.status).toLowerCase().includes(keyword);

      const matchType = filterType === 'all' || item.truckType === filterType;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchDate && matchSearch && matchType && matchStatus;
    });
  }, [dateRange.endDate, dateRange.startDate, filterStatus, filterType, records, searchQuery]);

  const activeFilterCount = useMemo(
    () =>
      [
        filterType !== 'all',
        filterStatus !== 'all',
        Boolean(dateRange.startDate),
        Boolean(dateRange.endDate),
      ].filter(Boolean).length,
    [dateRange.endDate, dateRange.startDate, filterStatus, filterType]
  );

  const hasActiveFilters = activeFilterCount > 0;

  const handleClearFilters = () => {
    setViewState((previous) => ({
      ...previous,
      filterType: 'all',
      filterStatus: 'all',
      dateRange: {
        startDate: '',
        endDate: '',
      },
    }));
  };

  const updateRecordStatus = (recordId) => {
    setRecords((previous) => previous.filter((item) => item.id !== recordId));
  };

  const handleVerification = async (recordId, approved) => {
    setVerifyingId(recordId);

    try {
      const result = await checkoutAPI.verify(recordId, user?.name || user?.username, approved);

      if (!result.success) {
        setVerifyResult({
          tone: 'error',
          message: result.message || 'Gagal memproses verifikasi gate',
        });
        return;
      }

      setVerifyResult({
        tone: approved ? 'success' : 'warning',
        message: approved
          ? 'Data retase berhasil diverifikasi gate.'
          : 'Data retase ditolak dan dikeluarkan dari antrean.',
      });
      updateRecordStatus(recordId);
    } catch (verifyError) {
      setVerifyResult({
        tone: 'error',
        message: `Terjadi kesalahan: ${verifyError.message}`,
      });
    } finally {
      setVerifyingId(null);
      setTimeout(() => setVerifyResult(null), 3000);
    }
  };

  const summary = useMemo(() => {
    const verified = filteredData.filter((item) => item.status === 'verified').length;
    const pending = filteredData.filter((item) => item.status === 'ready_for_exit').length;
    const rejected = filteredData.filter((item) => item.status === 'rejected').length;

    return [
      { label: 'Data Tampil', value: filteredData.length, note: 'Hasil pencarian dan filter' },
      { label: 'Verified', value: verified, note: 'Sudah masuk checker gate' },
      { label: 'Menunggu Gate', value: pending, note: 'Belum diverifikasi gate' },
      { label: 'Ditolak', value: rejected, note: 'Perlu input ulang atau koreksi' },
    ];
  }, [filteredData]);

  return (
    <div className="riwayat-page" id="riwayat-page">
      {verifyResult && (
        <div className={`result-toast ${verifyResult.tone}`} role="alert">
          <div className="toast-icon">
            {verifyResult.tone === 'success' && <CheckCircle2 size={22} />}
            {verifyResult.tone === 'warning' && <AlertCircle size={22} />}
            {verifyResult.tone === 'error' && <AlertCircle size={22} />}
          </div>
          <div className="toast-content">
            <span className="toast-message">{verifyResult.message}</span>
          </div>
        </div>
      )}

      <section className="riwayat-hero surface-card surface-card--accent">
        <div>
          <span className="section-kicker">Log Real-Time</span>
          <h2>Data Log Retase</h2>
          <p>Kolom utama disusun mengikuti workbook Excel: No Reg, Tanggal, Waktu, Material, Lokasi, Alat Berat, Checker Pit, Jenis Truk, No Polisi, Kontraktor, dan Checker Gate.</p>
        </div>
        <div className="riwayat-hero-badge">
          <strong>{filteredData.length}</strong>
          <span>Baris log</span>
        </div>
      </section>

      <div className="riwayat-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari no reg, no polisi, material, lokasi, kontraktor, atau checker..."
            value={searchQuery}
            onChange={(event) =>
              setViewState((previous) => ({
                ...previous,
                searchQuery: event.target.value,
              }))
            }
            className="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear"
              onClick={() =>
                setViewState((previous) => ({
                  ...previous,
                  searchQuery: '',
                }))
              }
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="riwayat-toolbar-actions">
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            type="button"
            onClick={() =>
              setViewState((previous) => ({
                ...previous,
                showFilters: !previous.showFilters,
              }))
            }
          >
            <Filter size={16} />
            Filter
            {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
            <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none' }} />
          </button>

          <button
            className="filter-toggle"
            type="button"
            onClick={() => setRefreshSeed((value) => value + 1)}
          >
            {isLoading ? <Loader2 size={16} className="spinner" /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Jenis Truk</label>
            <div className="filter-chips">
              <button
                className={`chip ${filterType === 'all' ? 'active' : ''}`}
                type="button"
                onClick={() =>
                  setViewState((previous) => ({
                    ...previous,
                    filterType: 'all',
                  }))
                }
              >
                Semua
              </button>
              {TRUCK_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.value}
                  className={`chip ${filterType === type.value ? 'active' : ''}`}
                  type="button"
                  onClick={() =>
                    setViewState((previous) => ({
                      ...previous,
                      filterType: type.value,
                    }))
                  }
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-chips">
              {LOG_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`chip ${filterStatus === option.value ? 'active' : ''}`}
                  type="button"
                  onClick={() =>
                    setViewState((previous) => ({
                      ...previous,
                      filterStatus: option.value,
                    }))
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group filter-group-date">
            <label>Rentang Tanggal</label>
            <div className="filter-date-grid">
              <input
                type="date"
                className="filter-date-input"
                value={dateRange.startDate}
                onChange={(event) =>
                  setViewState((previous) => ({
                    ...previous,
                    dateRange: {
                      ...previous.dateRange,
                      startDate: event.target.value,
                    },
                  }))
                }
              />
              <input
                type="date"
                className="filter-date-input"
                value={dateRange.endDate}
                onChange={(event) =>
                  setViewState((previous) => ({
                    ...previous,
                    dateRange: {
                      ...previous.dateRange,
                      endDate: event.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters" type="button" onClick={handleClearFilters}>
              Reset Filter
            </button>
          )}
        </div>
      )}

      <section className="summary-grid">
        {summary.map((item) => (
          <article className="summary-tile" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <div className="riwayat-note surface-card">
        <strong>Tampilan riwayat disamakan dengan fitur lain:</strong>
        <span>
          Gunakan pencarian, filter, dan rentang tanggal untuk mempersempit log. Data
          sekarang ditampilkan penuh dalam bentuk tabel agar konsisten antar fitur.
        </span>
      </div>

      <div className="riwayat-data">
        {isLoading ? (
          <div className="empty-state-panel">
            <Loader2 size={48} className="spinner" />
            <h3>Memuat data...</h3>
            <p>Mengambil data log retase dari server.</p>
          </div>
        ) : error ? (
          <div className="empty-state-panel">
            <AlertCircle size={48} />
            <h3>Terjadi Kesalahan</h3>
            <p>{error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state-panel">
            <Search size={48} />
            <h3>Tidak ada data ditemukan</h3>
            <p>Coba ubah kata kunci atau hapus filter yang aktif.</p>
          </div>
        ) : (
          <div className="riwayat-table-wrap workbook-log-wrap data-table-wrap">
            <table className="riwayat-table workbook-log-table data-table">
              <thead>
                <tr>
                  <th>No Reg</th>
                  <th>Tanggal</th>
                  <th className="table-head-center">Waktu</th>
                  <th>Jenis Material</th>
                  <th>Lokasi / Pemilik</th>
                  <th>Alat Berat</th>
                  <th>Checker Pit</th>
                  <th className="table-head-center">Jenis Truk</th>
                  <th>No Polisi</th>
                  <th>Kontraktor</th>
                  <th>Checker Gate</th>
                  <th className="table-head-center">Status</th>
                  <th className="table-head-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id}>
                    <td data-label="No Reg"><span className="cell-id">{item.id}</span></td>
                    <td data-label="Tanggal">{item.date}</td>
                    <td data-label="Waktu" className="table-cell-center"><span className="time-hour">{item.time}</span></td>
                    <td data-label="Jenis Material">{item.materialType}</td>
                    <td data-label="Lokasi / Pemilik">{item.locationOwner}</td>
                    <td data-label="Alat Berat">{item.heavyEquipment}</td>
                    <td data-label="Checker Pit">{item.checkerPit}</td>
                    <td data-label="Jenis Truk" className="table-cell-center"><span className={`type-badge ${item.truckType}`}>{item.truckTypeLabel}</span></td>
                    <td data-label="No Polisi"><span className="cell-truck-number">{item.truckNumber}</span></td>
                    <td data-label="Kontraktor">{item.contractor}</td>
                    <td data-label="Checker Gate">{item.checkerGate}</td>
                    <td data-label="Status" className="table-cell-center"><StatusBadge status={item.status} /></td>
                    <td data-label="Aksi" className="table-cell-center">
                      {item.status === 'ready_for_exit' ? (
                        <div className="verify-buttons-group">
                          <button
                            type="button"
                            className="verify-btn approve"
                            onClick={() => handleVerification(item.id, true)}
                            disabled={verifyingId === item.id}
                            title="Setujui dan verifikasi"
                          >
                            {verifyingId === item.id ? (
                              <Loader2 size={16} className="spinner" />
                            ) : (
                              <ShieldCheck size={16} />
                            )}
                          </button>
                          <button
                            type="button"
                            className="verify-btn reject"
                            onClick={() => handleVerification(item.id, false)}
                            disabled={verifyingId === item.id}
                            title="Tolak"
                          >
                            {verifyingId === item.id ? (
                              <Loader2 size={16} className="spinner" />
                            ) : (
                              <XCircle size={16} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <button type="button" className="view-btn" onClick={() => setSelectedRecord(item)}>
                          <Eye size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Log Retase</h3>
              <button className="modal-close" onClick={() => setSelectedRecord(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">No Reg</span><span className="detail-value mono">{selectedRecord.id}</span></div>
                <div className="detail-item"><span className="detail-label">Tanggal / Waktu</span><span className="detail-value">{selectedRecord.date} {selectedRecord.time}</span></div>
                <div className="detail-item"><span className="detail-label">Jenis Material</span><span className="detail-value">{selectedRecord.materialType}</span></div>
                <div className="detail-item"><span className="detail-label">Lokasi / Pemilik</span><span className="detail-value">{selectedRecord.locationOwner}</span></div>
                <div className="detail-item"><span className="detail-label">Alat Berat</span><span className="detail-value">{selectedRecord.heavyEquipment}</span></div>
                <div className="detail-item"><span className="detail-label">Jenis Truk</span><span className="detail-value">{selectedRecord.truckTypeLabel}</span></div>
                <div className="detail-item"><span className="detail-label">No Polisi</span><span className="detail-value mono">{selectedRecord.truckNumber}</span></div>
                <div className="detail-item"><span className="detail-label">Kontraktor</span><span className="detail-value">{selectedRecord.contractor}</span></div>
                <div className="detail-item"><span className="detail-label">Checker Pit</span><span className="detail-value">{selectedRecord.checkerPit}</span></div>
                <div className="detail-item"><span className="detail-label">Checker Gate</span><span className="detail-value">{selectedRecord.checkerGate}</span></div>
                <div className="detail-item full"><span className="detail-label">Status</span><span className="detail-value"><StatusBadge status={selectedRecord.status} /></span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
