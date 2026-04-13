import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { checkoutAPI, truckAPI } from '../../services/api';
import { buildTruckMap, normalizeCheckout } from '../../utils/retase';
import './ExitVerificationPage.css';

export default function ExitVerificationPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [checkouts, setCheckouts] = useState([]);
  const [truckMap, setTruckMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReadyForExit = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [checkoutResult, truckResult] = await Promise.all([
          checkoutAPI.getAll('ready_for_exit'),
          truckAPI.getAll(),
        ]);

        if (!checkoutResult.success || !truckResult.success) {
          setError(checkoutResult.message || truckResult.message || 'Gagal memuat data');
          return;
        }

        setCheckouts(checkoutResult.data || []);
        setTruckMap(buildTruckMap(truckResult.data || []));
      } catch (fetchError) {
        setError(`Gagal memuat data: ${fetchError.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadyForExit();
  }, []);

  const filteredData = useMemo(() => {
    return checkouts
      .map((checkout) => normalizeCheckout(checkout, truckMap))
      .filter((item) => {
        const keyword = searchQuery.toLowerCase();

        return (
          !keyword ||
          item.truckNumber.toLowerCase().includes(keyword) ||
          item.id.toLowerCase().includes(keyword) ||
          item.excaOperator?.toLowerCase().includes(keyword) ||
          item.inputBy.toLowerCase().includes(keyword)
        );
      })
      .sort((left, right) => left.timestamp - right.timestamp);
  }, [checkouts, truckMap, searchQuery]);

  const queueStats = useMemo(() => {
    const activePits = new Set(filteredData.map((item) => item.pitOwner).filter(Boolean)).size;
    const activeOperators = new Set(
      filteredData.map((item) => item.excaOperator).filter(Boolean)
    ).size;
    const oldestRecord = filteredData[0];

    return [
      {
        label: 'Menunggu Verifikasi',
        value: filteredData.length,
        note: 'Truck yang siap diputuskan keluar',
      },
      {
        label: 'Pit Aktif',
        value: activePits,
        note: 'Jumlah pit owner dalam antrian',
      },
      {
        label: 'Operator Aktif',
        value: activeOperators,
        note: 'Operator excavator yang sedang berjalan',
      },
      {
        label: 'Data Paling Lama',
        value: oldestRecord ? oldestRecord.time : '-',
        note: oldestRecord ? oldestRecord.date : 'Belum ada data menunggu',
      },
    ];
  }, [filteredData]);

  const clearSelectionSoon = () => {
    setTimeout(() => {
      setVerifyResult(null);
      setSelectedRecord(null);
    }, 2000);
  };

  const handleApproveExit = async (recordId) => {
    setVerifyingId(recordId);

    try {
      const result = await checkoutAPI.verify(recordId, user?.name || user?.username, true);

      if (result.success) {
        setVerifyResult({
          tone: 'success',
          id: recordId,
          message: 'Truck berhasil diverifikasi keluar.',
        });
        setCheckouts((previous) => previous.filter((checkout) => checkout.id !== recordId));
        clearSelectionSoon();
      } else {
        setVerifyResult({
          tone: 'error',
          id: recordId,
          message: result.message || 'Gagal verifikasi truck',
        });
      }
    } catch (verifyError) {
      setVerifyResult({
        tone: 'error',
        id: recordId,
        message: `Error: ${verifyError.message}`,
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRejectExit = async (recordId) => {
    setVerifyingId(recordId);

    try {
      const result = await checkoutAPI.verify(recordId, user?.name || user?.username, false);

      if (result.success) {
        setVerifyResult({
          tone: 'warning',
          id: recordId,
          message: 'Truck ditolak untuk keluar.',
        });
        setCheckouts((previous) => previous.filter((checkout) => checkout.id !== recordId));
        clearSelectionSoon();
      } else {
        setVerifyResult({
          tone: 'error',
          id: recordId,
          message: result.message || 'Gagal menolak truck',
        });
      }
    } catch (verifyError) {
      setVerifyResult({
        tone: 'error',
        id: recordId,
        message: `Error: ${verifyError.message}`,
      });
    } finally {
      setVerifyingId(null);
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
          <span className="section-kicker">Antrian Verifikasi</span>
          <h2>Verifikasi Keluar Truck</h2>
          <p>Periksa nomor polisi, pit owner, dan excavator sebelum memutuskan truck boleh keluar.</p>
        </div>
        <div className="verify-hero-badge">
          <strong>{filteredData.length}</strong>
          <span>Siap diverifikasi</span>
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
        <strong>Urutan aman verifikasi:</strong>
        <span>Buka kartu, cocokkan nomor polisi, cek pit dan operator, lalu pilih setujui atau tolak.</span>
      </div>

      <div className="verify-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari no. polisi, ID, operator, atau petugas..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="search-input"
            id="search-verify"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state-panel">
          <Loader2 size={48} className="spinner" />
          <h3>Memuat data...</h3>
          <p>Mengambil data checkout dari server.</p>
        </div>
      ) : error ? (
        <div className="empty-state-panel">
          <AlertCircle size={48} />
          <h3>Terjadi Kesalahan</h3>
          <p>{error}</p>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="verify-list">
          {filteredData.map((record) => {
            const isOpen = selectedRecord?.id === record.id;

            return (
              <div
                key={record.id}
                className={`verify-card ${isOpen ? 'expanded' : ''}`}
                onClick={() => setSelectedRecord(isOpen ? null : record)}
              >
                <div className="verify-card-header">
                  <div className="verify-truck-info">
                    <div className="truck-icon-wrapper">
                      <Truck size={24} />
                    </div>
                    <div className="truck-details">
                      <h3>{record.truckNumber}</h3>
                      <p>
                        {record.id} · {record.truckTypeLabel}
                      </p>
                    </div>
                  </div>
                  <div className="truck-badge">
                    <Clock size={15} />
                    <span>Siap verifikasi</span>
                  </div>
                </div>

                <div className="verify-card-body">
                  <div className="info-row">
                    <div className="info-item">
                      <span className="info-label">Input oleh</span>
                      <span className="info-value">{record.inputBy}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Waktu input</span>
                      <span className="info-value">
                        {record.date} {record.time}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Pit owner</span>
                      <span className="info-value">{record.pitOwner || '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Operator</span>
                      <span className="info-value">{record.excaOperator || '-'}</span>
                    </div>
                  </div>

                  {!isOpen && <span className="expand-hint">Klik untuk buka detail dan aksi</span>}

                  {isOpen && (
                    <div className="verify-card-expanded">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">ID Retase</span>
                          <span className="detail-value">{record.id}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">No. Excavator</span>
                          <span className="detail-value">{record.excaId || '-'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Operator Excavator</span>
                          <span className="detail-value">{record.excaOperator || '-'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Petugas Input</span>
                          <span className="detail-value">
                            {record.inputBy} ({record.inputRole})
                          </span>
                        </div>
                      </div>

                      <div className="verify-actions">
                        <button
                          className="btn-approve"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleApproveExit(record.id);
                          }}
                          disabled={verifyingId === record.id}
                        >
                          {verifyingId === record.id ? (
                            <>
                              <Loader2 size={18} className="spinner" />
                              Memproses...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={18} />
                              Setujui Keluar
                            </>
                          )}
                        </button>
                        <button
                          className="btn-reject"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRejectExit(record.id);
                          }}
                          disabled={verifyingId === record.id}
                        >
                          {verifyingId === record.id ? (
                            <>
                              <Loader2 size={18} className="spinner" />
                              Memproses...
                            </>
                          ) : (
                            <>
                              <XCircle size={18} />
                              Tolak
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-panel">
          <Clock size={48} />
          <h3>Tidak Ada Data Menunggu Verifikasi</h3>
          <p>Semua truck sudah diproses atau belum ada checkout baru yang siap diverifikasi.</p>
        </div>
      )}
    </div>
  );
}
