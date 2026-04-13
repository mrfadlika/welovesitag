import { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, CheckCircle2, XCircle, Clock, Truck,
  Calendar, ChevronDown, Eye, X, AlertCircle, Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { checkoutAPI } from '../../services/api';
import './ExitVerificationPage.css';

export default function ExitVerificationPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ready');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [checkouts, setCheckouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ready for exit checkouts on mount
  useEffect(() => {
    const fetchReadyForExit = async () => {
      setIsLoading(true);
      try {
        const result = await checkoutAPI.getAll('ready_for_exit');
        if (result.success) {
          setCheckouts(result.data || []);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Gagal memuat data: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadyForExit();
  }, []);

  // Get data that's ready for exit verification
  const readyForExit = useMemo(() => {
    return checkouts;
  }, [checkouts]);

  const filteredData = useMemo(() => {
    return readyForExit.filter((item) => {
      const matchSearch = !searchQuery || 
        item.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excaOperator?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchSearch;
    });
  }, [searchQuery]);

  const handleApproveExit = async (recordId) => {
    setVerifyingId(recordId);
    try {
      const result = await checkoutAPI.verify(recordId, user?.id || user?.username, true);
      
      if (result.success) {
        setVerifyResult({
          success: true,
          id: recordId,
          message: 'Truck berhasil diverifikasi keluar',
        });
        
        // Remove from list
        setCheckouts(prev => prev.filter(c => c.id !== recordId));
      } else {
        setVerifyResult({
          success: false,
          id: recordId,
          message: result.message || 'Gagal verifikasi truck',
        });
      }
    } catch (err) {
      setVerifyResult({
        success: false,
        id: recordId,
        message: 'Error: ' + err.message,
      });
    } finally {
      setVerifyingId(null);
      setTimeout(() => {
        setVerifyResult(null);
        setSelectedRecord(null);
      }, 2000);
    }
  };

  const handleRejectExit = async (recordId) => {
    setVerifyingId(recordId);
    try {
      const result = await checkoutAPI.verify(recordId, user?.id || user?.username, false);
      
      if (result.success) {
        setVerifyResult({
          success: false,
          id: recordId,
          message: 'Truck ditolak untuk keluar',
        });
        
        // Remove from list
        setCheckouts(prev => prev.filter(c => c.id !== recordId));
      } else {
        setVerifyResult({
          success: false,
          id: recordId,
          message: result.message || 'Gagal tolak truck',
        });
      }
    } catch (err) {
      setVerifyResult({
        success: false,
        id: recordId,
        message: 'Error: ' + err.message,
      });
    } finally {
      setVerifyingId(null);
      setTimeout(() => {
        setVerifyResult(null);
        setSelectedRecord(null);
      }, 2000);
    }
  };

  return (
    <div className="exit-verification-page" id="exit-verification-page">
      {/* Result Toast */}
      {verifyResult && (
        <div className={`result-toast ${verifyResult.success ? 'success' : 'error'}`} role="alert">
          <div className="toast-icon">
            {verifyResult.success ? (
              <CheckCircle2 size={22} />
            ) : (
              <AlertCircle size={22} />
            )}
          </div>
          <div className="toast-content">
            <span className="toast-message">{verifyResult.message}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="verify-header">
        <div>
          <h2>Verifikasi Keluar Truck</h2>
          <p>Verifikasi truck yang telah di-checkout oleh checker untuk dikeluarkan.</p>
        </div>
        <div className="verify-summary">
          <span className="summary-count">{filteredData.length}</span>
          <span className="summary-label">Siap Verifikasi</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="verify-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari no. polisi, ID, operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Verification List */}
      {isLoading ? (
        <div className="empty-state">
          <Loader2 size={48} className="spinner" />
          <h3>Memuat data...</h3>
          <p>Mengambil data checkouts dari server.</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Terjadi Kesalahan</h3>
          <p>{error}</p>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="verify-list">
          {filteredData.map((record) => (
            <div
              key={record.id}
              className="verify-card"
              onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
            >
              <div className="verify-card-header">
                <div className="verify-truck-info">
                  <div className="truck-icon-wrapper">
                    <Truck size={24} />
                  </div>
                  <div className="truck-details">
                    <h3>{record.truckNumber}</h3>
                    <p className="truck-id">{record.id} • {record.truckTypeLabel}</p>
                  </div>
                </div>
                <div className="truck-badge verified">
                  <CheckCircle2 size={16} />
                  <span>Verified</span>
                </div>
              </div>

              <div className="verify-card-body">
                <div className="info-row">
                  <div className="info-item">
                    <span className="info-label">Input oleh</span>
                    <span className="info-value">{record.inputBy}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Waktu Input</span>
                    <span className="info-value">{record.time}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Excavator</span>
                    <span className="info-value">{record.excaOperator}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedRecord?.id === record.id && (
                  <div className="verify-card-expanded">
                    <div className="expanded-section">
                      <h4>Detail Retase</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Pemilik Pit</span>
                          <span className="detail-value">{record.pitOwner}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">No. Excavator</span>
                          <span className="detail-value">{record.excaId}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Operator</span>
                          <span className="detail-value">{record.excaOperator}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Tanggal</span>
                          <span className="detail-value">{record.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="verify-actions">
                      <button
                        className="btn-approve btn-primary"
                        onClick={() => handleApproveExit(record.id)}
                        disabled={verifyingId === record.id}
                      >
                        {verifyingId === record.id ? (
                          <>
                            <Loader2 size={18} className="spinner" />
                            Verifikasi...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            Setujui Keluar
                          </>
                        )}
                      </button>
                      <button
                        className="btn-reject btn-secondary"
                        onClick={() => handleRejectExit(record.id)}
                        disabled={verifyingId === record.id}
                      >
                        {verifyingId === record.id ? (
                          <>
                            <Loader2 size={18} className="spinner" />
                            Proses...
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
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Clock size={48} />
          <h3>Tidak Ada Data Menunggu Verifikasi</h3>
          <p>Semua truck telah diverifikasi atau belum ada yang ready.</p>
        </div>
      )}
    </div>
  );
}
