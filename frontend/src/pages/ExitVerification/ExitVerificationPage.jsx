import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  PauseCircle,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import usePersistentState from '../../hooks/usePersistentState';
import { checkoutAPI } from '../../services/api';
import { buildRetaseHistory } from '../../utils/retase';
import './ExitVerificationPage.css';

export default function ExitVerificationPage() {
  const { user } = useAuth();
  const searchStorageKey = useMemo(() => {
    const role = user?.role || 'guest';
    const identity = user?.username || user?.name || 'anonymous';

    return `sitag:v1:verifikasi:${role}:${identity}`;
  }, [user?.name, user?.role, user?.username]);
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = usePersistentState(searchStorageKey, '');
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingRecords = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await checkoutAPI.getAll('ready_for_exit');

        if (!result.success) {
          setError(result.message || 'Gagal memuat antrean verifikasi');
          return;
        }

        setRecords(buildRetaseHistory(result.data || []));
      } catch (fetchError) {
        setError(`Gagal memuat data: ${fetchError.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingRecords();
  }, []);

  const filteredData = useMemo(() => {
    const keyword = searchQuery.toLowerCase();

    return records.filter((item) => {
      return (
        !keyword ||
        item.id.toLowerCase().includes(keyword) ||
        item.truckNumber.toLowerCase().includes(keyword) ||
        item.materialType.toLowerCase().includes(keyword) ||
        item.locationOwner.toLowerCase().includes(keyword) ||
        item.heavyEquipment.toLowerCase().includes(keyword) ||
        item.contractor.toLowerCase().includes(keyword) ||
        item.checkerPit.toLowerCase().includes(keyword)
      );
    });
  }, [records, searchQuery]);

  const queueStats = useMemo(() => {
    const uniqueLocations = new Set(filteredData.map((item) => item.locationOwner)).size;
    const uniqueContractors = new Set(filteredData.map((item) => item.contractor)).size;
    const oldestRecord = filteredData[filteredData.length - 1];

    return [
      { label: 'Menunggu Gate', value: filteredData.length, note: 'Retase siap diputuskan' },
      { label: 'Lokasi Aktif', value: uniqueLocations, note: 'Lokasi / pemilik dalam antrean' },
      { label: 'Kontraktor Aktif', value: uniqueContractors, note: 'Kontraktor yang sedang berjalan' },
      {
        label: 'Data Terlama',
        value: oldestRecord ? oldestRecord.time : '-',
        note: oldestRecord ? oldestRecord.date : 'Belum ada antrean',
      },
    ];
  }, [filteredData]);

  const updateRecordStatus = (recordId, newStatus) => {
    if (newStatus === 'postponed') {
      setRecords((previous) =>
        previous.map((item) => (item.id === recordId ? { ...item, status: 'postponed' } : item))
      );
    } else {
      setRecords((previous) => previous.filter((item) => item.id !== recordId));
    }
  };

  const handleVerification = async (recordId, action) => {
    setVerifyingId(recordId);

    try {
      let result;
      if (action === 'postpone') {
        result = await checkoutAPI.verify(recordId, user?.name || user?.username, false, 'postpone');
      } else {
        result = await checkoutAPI.verify(recordId, user?.name || user?.username, true);
      }

      if (!result.success) {
        setVerifyResult({
          tone: 'error',
          message: result.message || 'Gagal memproses verifikasi gate',
        });
        return;
      }

      setVerifyResult({
        tone: action === 'postpone' ? 'warning' : 'success',
        message: action === 'postpone'
          ? 'Data retase ditunda dan tetap berada di antrean.'
          : 'Data retase berhasil diverifikasi gate.',
      });
      updateRecordStatus(recordId, action === 'postpone' ? 'postponed' : 'approved');
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

  return (
    <div className="exit-verification-page" id="exit-verification-page">
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

      <section className="verify-hero surface-card surface-card--accent">
        <div>
          <span className="section-kicker">Verifikasi Gate</span>
          <h2>Antrean Retase Siap Diverifikasi</h2>
          <p>Periksa data workbook: material, lokasi, alat berat, kontraktor, checker pit, dan no polisi sebelum checker gate menyetujui.</p>
        </div>
        <div className="verify-hero-badge">
          <strong>{filteredData.length}</strong>
          <span>Antrean aktif</span>
        </div>
      </section>

      <section className="summary-grid">
        {queueStats.map((item) => (
          <article className="summary-tile" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <div className="verify-note surface-card">
        <strong>Urutan aman verifikasi gate:</strong>
        <span>Pilih baris tabel, cocokkan material dan lokasi, periksa alat gali serta kontraktor, lalu setuju/terima atau tunda.</span>
      </div>

      <div className="verify-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari no reg, no polisi, material, lokasi, kontraktor, atau checker pit..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state-panel">
          <Loader2 size={48} className="spinner" />
          <h3>Memuat data...</h3>
          <p>Mengambil antrean verifikasi dari server.</p>
        </div>
      ) : error ? (
        <div className="empty-state-panel">
          <AlertCircle size={48} />
          <h3>Terjadi Kesalahan</h3>
          <p>{error}</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="empty-state-panel">
          <Clock size={48} />
          <h3>Tidak Ada Antrean Verifikasi</h3>
          <p>Semua data retase sudah diproses atau belum ada input baru dari checker pit.</p>
        </div>
      ) : (
        <>
          <div className="data-table-wrap verify-table-wrap">
            <table className="data-table verify-table">
              <thead>
                <tr>
                  <th className="verify-head verify-head--registration">Registrasi</th>
                  <th className="verify-head verify-head--truck">NOPOL & Truk</th>
                  <th className="verify-head verify-head--material">Material & Lokasi</th>
                  <th className="verify-head verify-head--ops">Operasional</th>
                  <th className="verify-head verify-head--checker">Checker</th>
                  <th className="verify-head verify-head--status table-head-center">Status</th>
                  <th className="verify-head verify-head--action table-head-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((record) => {
                  return (
                    <tr key={record.id}>
                      <td data-label="Registrasi" className="verify-cell verify-cell--registration">
                        <div className="table-stack verify-cell-stack">
                          <span className="table-code">{record.id}</span>
                          <span className="table-primary">{record.date}</span>
                          <span className="table-muted">{record.time}</span>
                        </div>
                      </td>
                      <td data-label="Truk" className="verify-cell verify-cell--truck">
                        <div className="table-stack verify-cell-stack">
                          <span className="table-code">{record.truckNumber}</span>
                          <span className="verify-type-chip">{record.truckTypeLabel}</span>
                        </div>
                      </td>
                      <td data-label="Material & Lokasi" className="verify-cell verify-cell--material">
                        <div className="table-stack verify-cell-stack">
                          <span className="table-primary">{record.materialType}</span>
                          <span className="table-muted">{record.locationOwner}</span>
                        </div>
                      </td>
                      <td data-label="Operasional" className="verify-cell verify-cell--ops">
                        <div className="table-stack verify-cell-stack">
                          <span className="table-primary">{record.heavyEquipment}</span>
                          <span className="table-muted">{record.contractor}</span>
                        </div>
                      </td>
                      <td data-label="Checker" className="verify-cell verify-cell--checker">
                        <div className="table-stack verify-cell-stack">
                          <span className="table-primary">{record.checkerPit}</span>
                          <span className="table-muted">Checker Pit</span>
                        </div>
                      </td>
                      <td data-label="Status" className="verify-cell verify-cell--status table-cell-center">
                        <div className="table-stack verify-cell-stack verify-status-stack">
                          {record.status === 'postponed' ? (
                            <>
                              <span className="truck-badge verify-status-badge" style={{ background: 'var(--color-accent-warning-soft)', color: 'var(--color-accent-warning)', borderColor: 'var(--color-accent-warning-border)' }}>
                                <PauseCircle size={14} />
                                <span>Tertunda</span>
                              </span>
                              <span className="table-muted verify-status-note">Menunggu tindakan lanjutan</span>
                            </>
                          ) : (
                            <>
                              <span className="truck-badge verify-status-badge">
                                <ShieldCheck size={14} />
                                <span>Menunggu Persetujuan</span>
                              </span>
                              <span className="table-muted verify-status-note">Belum ada tindakan</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td data-label="Aksi" className="verify-cell verify-cell--action table-cell-center">
                        <div className="table-actions verify-table-actions verify-action-stack">
                          <button
                            type="button"
                            className="btn-approve"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleVerification(record.id, 'approve');
                            }}
                            disabled={verifyingId === record.id}
                          >
                            {verifyingId === record.id ? (
                              <>
                                <Loader2 size={18} className="spinner" /> Memproses...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={18} /> Setuju/Terima
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-postpone"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleVerification(record.id, 'postpone');
                            }}
                            disabled={verifyingId === record.id}
                          >
                            {verifyingId === record.id ? (
                              <>
                                <Loader2 size={18} className="spinner" /> Memproses...
                              </>
                            ) : (
                              <>
                                <PauseCircle size={18} /> Tunda
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
