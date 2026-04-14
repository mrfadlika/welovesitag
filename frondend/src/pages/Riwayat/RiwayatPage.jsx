import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  Loader2,
  Search,
  X,
} from 'lucide-react';
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

export default function RiwayatPage() {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, []);

  const filteredData = useMemo(() => {
    const keyword = searchQuery.toLowerCase();

    return records.filter((item) => {
      const matchSearch =
        !keyword ||
        item.id.toLowerCase().includes(keyword) ||
        item.truckNumber.toLowerCase().includes(keyword) ||
        item.materialType.toLowerCase().includes(keyword) ||
        item.locationOwner.toLowerCase().includes(keyword) ||
        item.heavyEquipment.toLowerCase().includes(keyword) ||
        item.contractor.toLowerCase().includes(keyword) ||
        item.checkerPit.toLowerCase().includes(keyword) ||
        item.checkerGate.toLowerCase().includes(keyword);

      const matchType = filterType === 'all' || item.truckType === filterType;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [filterStatus, filterType, records, searchQuery]);

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
            onChange={(event) => setSearchQuery(event.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <button className={`filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters((value) => !value)}>
          <Filter size={16} />
          Filter
          <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Jenis Truk</label>
            <div className="filter-chips">
              <button className={`chip ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>Semua</button>
              {TRUCK_TYPE_OPTIONS.map((type) => (
                <button key={type.value} className={`chip ${filterType === type.value ? 'active' : ''}`} onClick={() => setFilterType(type.value)}>
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-chips">
              {LOG_STATUS_OPTIONS.map((option) => (
                <button key={option.value} className={`chip ${filterStatus === option.value ? 'active' : ''}`} onClick={() => setFilterStatus(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
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
          <>
            <div className="riwayat-table-wrap workbook-log-wrap">
              <table className="riwayat-table workbook-log-table">
                <thead>
                  <tr>
                    <th>No Reg</th>
                    <th>Tanggal</th>
                    <th>Waktu</th>
                    <th>Jenis Material</th>
                    <th>Lokasi / Pemilik</th>
                    <th>Alat Berat</th>
                    <th>Checker Pit</th>
                    <th>Jenis Truk</th>
                    <th>No Polisi</th>
                    <th>Kontraktor</th>
                    <th>Checker Gate</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      <td><span className="cell-id">{item.id}</span></td>
                      <td>{item.date}</td>
                      <td><span className="time-hour">{item.time}</span></td>
                      <td>{item.materialType}</td>
                      <td>{item.locationOwner}</td>
                      <td>{item.heavyEquipment}</td>
                      <td>{item.checkerPit}</td>
                      <td><span className={`type-badge ${item.truckType}`}>{item.truckTypeLabel}</span></td>
                      <td><span className="cell-truck-number">{item.truckNumber}</span></td>
                      <td>{item.contractor}</td>
                      <td>{item.checkerGate}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>
                        <button className="view-btn" onClick={() => setSelectedRecord(item)}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="riwayat-cards">
              {filteredData.map((item) => (
                <div className="riwayat-card workbook-log-card" key={item.id} onClick={() => setSelectedRecord(item)}>
                  <div className="card-top">
                    <span className="cell-id">{item.id}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="card-main">
                    <strong className="cell-truck-number">{item.truckNumber}</strong>
                    <span className={`type-badge ${item.truckType}`}>{item.truckTypeLabel}</span>
                    <p>{item.materialType} • {item.locationOwner}</p>
                  </div>
                  <div className="card-meta">
                    <span>{item.date} {item.time}</span>
                    <span>{item.checkerPit}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
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
