import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  ShieldCheck,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { checkoutAPI } from '../../services/api';
import { buildRetaseHistory } from '../../utils/retase';
import './ExitVerificationPage.css';

export default function ExitVerificationPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      { label: 'Data Terlama', value: oldestRecord ? oldestRecord.time : '-', note: oldestRecord ? oldestRecord.date : 'Belum ada antrean' },
    ];
  }, [filteredData]);

  const updateRecordStatus = (recordId) => {
    setRecords((previous) => previous.filter((item) => item.id !== recordId));
    setSelectedRecord((previous) => (previous?.id === recordId ? null : previous));
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
        <span>Buka kartu, cocokkan material dan lokasi, periksa alat berat serta kontraktor, lalu setujui atau tolak.</span>
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
        <div className="verify-list">
          {filteredData.map((record) => {
            const isOpen = selectedRecord?.id === record.id;

            return (
              <div key={record.id} className={`verify-card ${isOpen ? 'expanded' : ''}`} onClick={() => setSelectedRecord(isOpen ? null : record)}>
                <div className="verify-card-header">
                  <div className="verify-truck-info">
                    <div className="truck-icon-wrapper">
                      <Truck size={24} />
                    </div>
                    <div className="truck-details">
                      <h3>{record.truckNumber}</h3>
                      <p>{record.id} • {record.truckTypeLabel} • {record.materialType}</p>
                    </div>
                  </div>
                  <div className="truck-badge">
                    <ShieldCheck size={15} />
                    <span>Menunggu Gate</span>
                  </div>
                </div>

                <div className="verify-card-body">
                  <div className="info-row workbook-info-row">
                    <div className="info-item"><span className="info-label">Lokasi</span><span className="info-value">{record.locationOwner}</span></div>
                    <div className="info-item"><span className="info-label">Alat Berat</span><span className="info-value">{record.heavyEquipment}</span></div>
                    <div className="info-item"><span className="info-label">Kontraktor</span><span className="info-value">{record.contractor}</span></div>
                    <div className="info-item"><span className="info-label">Checker Pit</span><span className="info-value">{record.checkerPit}</span></div>
                  </div>

                  {!isOpen && <span className="expand-hint">Klik untuk buka detail dan aksi verifikasi gate</span>}

                  {isOpen && (
                    <div className="verify-card-expanded">
                      <div className="detail-grid">
                        <div className="detail-item"><span className="detail-label">No Reg</span><span className="detail-value">{record.id}</span></div>
                        <div className="detail-item"><span className="detail-label">Tanggal / Waktu</span><span className="detail-value">{record.date} {record.time}</span></div>
                        <div className="detail-item"><span className="detail-label">Jenis Material</span><span className="detail-value">{record.materialType}</span></div>
                        <div className="detail-item"><span className="detail-label">Lokasi / Pemilik</span><span className="detail-value">{record.locationOwner}</span></div>
                        <div className="detail-item"><span className="detail-label">Alat Berat</span><span className="detail-value">{record.heavyEquipment}</span></div>
                        <div className="detail-item"><span className="detail-label">Kontraktor</span><span className="detail-value">{record.contractor}</span></div>
                        <div className="detail-item"><span className="detail-label">Checker Pit</span><span className="detail-value">{record.checkerPit}</span></div>
                        <div className="detail-item"><span className="detail-label">No Polisi</span><span className="detail-value">{record.truckNumber}</span></div>
                      </div>

                      <div className="verify-actions">
                        <button className="btn-approve" onClick={(event) => {
                          event.stopPropagation();
                          handleVerification(record.id, true);
                        }} disabled={verifyingId === record.id}>
                          {verifyingId === record.id ? <><Loader2 size={18} className="spinner" /> Memproses...</> : <><CheckCircle2 size={18} /> Setujui Gate</>}
                        </button>
                        <button className="btn-reject" onClick={(event) => {
                          event.stopPropagation();
                          handleVerification(record.id, false);
                        }} disabled={verifyingId === record.id}>
                          {verifyingId === record.id ? <><Loader2 size={18} className="spinner" /> Memproses...</> : <><XCircle size={18} /> Tolak</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
