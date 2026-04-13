import { useState, useMemo } from 'react';
import { DUMMY_RETASE, TRUCK_TYPES } from '../../data/dummyData';
import {
  Search, Filter, CheckCircle2, Clock, Truck,
  Calendar, ChevronDown, Eye, Download, X,
} from 'lucide-react';
import './RiwayatPage.css';

export default function RiwayatPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filteredData = useMemo(() => {
    return DUMMY_RETASE.filter((item) => {
      const matchSearch = !searchQuery || 
        item.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.inputBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excaOperator?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchType = filterType === 'all' || item.truckType === filterType;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      
      return matchSearch && matchType && matchStatus;
    });
  }, [searchQuery, filterType, filterStatus]);

  const activeFilters = (filterType !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);

  return (
    <div className="riwayat-page" id="riwayat-page">
      {/* Page Header */}
      <div className="riwayat-header">
        <div>
          <h2>Riwayat Retase</h2>
          <p>Lihat semua catatan retase yang telah diinput.</p>
        </div>
        <div className="riwayat-summary">
          <span className="summary-count">{filteredData.length}</span>
          <span className="summary-label">Total Data</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="riwayat-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari no. polisi, ID, nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            id="search-retase"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          id="filter-toggle-btn"
        >
          <Filter size={16} />
          Filter
          {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
          <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel" id="filter-panel">
          <div className="filter-group">
            <label>Jenis Truk</label>
            <div className="filter-chips">
              <button 
                className={`chip ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                Semua
              </button>
              {TRUCK_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`chip ${filterType === t.value ? 'active' : ''}`}
                  onClick={() => setFilterType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-chips">
              <button 
                className={`chip ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Semua
              </button>
              <button 
                className={`chip ${filterStatus === 'verified' ? 'active' : ''}`}
                onClick={() => setFilterStatus('verified')}
              >
                Verified
              </button>
              <button 
                className={`chip ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </button>
            </div>
          </div>
          {activeFilters > 0 && (
            <button 
              className="clear-filters" 
              onClick={() => { setFilterType('all'); setFilterStatus('all'); }}
            >
              Hapus semua filter
            </button>
          )}
        </div>
      )}

      {/* Data Cards (mobile) & Table (desktop) */}
      <div className="riwayat-data">
        {filteredData.length === 0 ? (
          <div className="empty-state">
            <Search size={48} strokeWidth={1} />
            <h3>Tidak ada data ditemukan</h3>
            <p>Coba ubah kata kunci pencarian atau filter yang digunakan.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="riwayat-table-wrap">
              <table className="riwayat-table" id="riwayat-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>No. Polisi</th>
                    <th>Jenis</th>
                    <th>Pemilik Pit</th>
                    <th>Excavator</th>
                    <th>Input Oleh</th>
                    <th>Waktu</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      <td><span className="cell-id">{item.id}</span></td>
                      <td><span className="cell-truck-number">{item.truckNumber}</span></td>
                      <td>
                        <span className={`type-badge ${item.truckType}`}>
                          {item.truckTypeLabel}
                        </span>
                      </td>
                      <td><span className="cell-pit">{item.pitOwner || '-'}</span></td>
                      <td>
                        <div className="cell-exca">
                          <span>{item.excaId || '-'}</span>
                          {item.excaOperator && <span className="exca-operator">{item.excaOperator}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="cell-inputby">
                          <span className="inputby-name">{item.inputBy}</span>
                          <span className="inputby-role">{item.inputRole}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-time">
                          <span className="time-date">{item.date}</span>
                          <span className="time-hour">{item.time}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'verified' ? (
                            <><CheckCircle2 size={12} /> Verified</>
                          ) : (
                            <><Clock size={12} /> Pending</>
                          )}
                        </span>
                      </td>
                      <td>
                        <button className="view-btn" onClick={() => setSelectedRecord(item)} title="Lihat detail">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="riwayat-cards">
              {filteredData.map((item) => (
                <div className="riwayat-card" key={item.id} onClick={() => setSelectedRecord(item)}>
                  <div className="card-top">
                    <span className="cell-id">{item.id}</span>
                    <span className={`status-badge ${item.status}`}>
                      {item.status === 'verified' ? (
                        <><CheckCircle2 size={11} /> Verified</>
                      ) : (
                        <><Clock size={11} /> Pending</>
                      )}
                    </span>
                  </div>
                  <div className="card-main">
                    <div className="card-truck">
                      <Truck size={16} />
                      <span className="cell-truck-number">{item.truckNumber}</span>
                      <span className={`type-badge ${item.truckType}`}>{item.truckTypeLabel}</span>
                    </div>
                  </div>
                  <div className="card-meta">
                    <span><Calendar size={12} /> {item.date} {item.time}</span>
                    <span>{item.inputBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} id="detail-modal">
            <div className="modal-header">
              <h3>Detail Retase</h3>
              <button className="modal-close" onClick={() => setSelectedRecord(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">ID Retase</span>
                  <span className="detail-value mono">{selectedRecord.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">No. Polisi</span>
                  <span className="detail-value mono">{selectedRecord.truckNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Jenis Truk</span>
                  <span className="detail-value">
                    <span className={`type-badge ${selectedRecord.truckType}`}>{selectedRecord.truckTypeLabel}</span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <span className={`status-badge ${selectedRecord.status}`}>
                      {selectedRecord.status === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pemilik Pit</span>
                  <span className="detail-value">{selectedRecord.pitOwner || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">ID Excavator</span>
                  <span className="detail-value mono">{selectedRecord.excaId || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Operator Excavator</span>
                  <span className="detail-value">{selectedRecord.excaOperator || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Input Oleh</span>
                  <span className="detail-value">{selectedRecord.inputBy} ({selectedRecord.inputRole})</span>
                </div>
                <div className="detail-item full">
                  <span className="detail-label">Waktu Input</span>
                  <span className="detail-value">{selectedRecord.date} pukul {selectedRecord.time}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
