import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Edit3,
  Hash,
  Loader2,
  Plus,
  Search,
  Trash2,
  Truck,
  User as UserIcon,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { truckAPI } from '../../services/api';
import './RegistrasiMobilPage.css';

const EMPTY_FORM = {
  hullNumber: '',
  equipmentId: '',
  truckNumber: '',
  truckType: 'dyna',
  ownerName: '',
  notes: '',
};

const TRUCK_TYPE_OPTIONS = [
  { value: 'dyna', label: 'Dyna' },
  { value: 'fuso', label: 'Fuso' },
];

export default function RegistrasiMobilPage() {
  const { user } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    setIsLoading(true);
    try {
      const result = await truckAPI.getAll();
      if (result.success) {
        setTrucks(result.data || []);
      }
    } catch (error) {
      showToast('error', `Gagal memuat data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (tone, message) => {
    setToast({ tone, message });
    setTimeout(() => setToast(null), 3500);
  };

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.hullNumber.trim()) nextErrors.hullNumber = 'Nomor lambung wajib diisi';
    if (!formData.truckNumber.trim()) nextErrors.truckNumber = 'No. polisi wajib diisi';
    if (!formData.truckType) nextErrors.truckType = 'Pilih tipe truk';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        hullNumber: formData.hullNumber.trim(),
        equipmentId: formData.equipmentId.trim(),
        truckNumber: formData.truckNumber.trim().toUpperCase(),
        truckType: formData.truckType,
        ownerName: formData.ownerName.trim(),
        notes: formData.notes.trim(),
        registeredBy: user?.name || 'Admin',
        registeredByRole: 'Admin',
      };

      let result;
      if (editingId) {
        result = await truckAPI.update(editingId, payload);
      } else {
        result = await truckAPI.create(payload);
      }

      if (!result.success) {
        showToast('error', result.message || 'Gagal menyimpan data');
        return;
      }

      showToast('success', editingId ? 'Data truck berhasil diperbarui' : 'Dump truck berhasil didaftarkan');
      handleCloseModal();
      fetchTrucks();
    } catch (error) {
      showToast('error', `Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = (truck = null) => {
    if (truck) {
      setFormData({
        hullNumber: truck.hullNumber || '',
        equipmentId: truck.equipmentId || '',
        truckNumber: truck.truckNumber || '',
        truckType: truck.truckType || 'dyna',
        ownerName: truck.ownerName || '',
        notes: truck.notes || '',
      });
      setEditingId(truck.id);
    } else {
      setFormData(EMPTY_FORM);
      setEditingId(null);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setErrors({});
  };

  const handleDelete = async (truckId) => {
    if (!window.confirm('Yakin ingin menghapus data truck ini?')) return;

    setDeletingId(truckId);
    try {
      const result = await truckAPI.remove(truckId);
      if (!result.success) {
        showToast('error', result.message || 'Gagal menghapus');
        return;
      }
      showToast('success', 'Truck berhasil dihapus');
      fetchTrucks();
    } catch (error) {
      showToast('error', `Gagal menghapus: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTrucks = useMemo(() => {
    const keyword = searchQuery.toLowerCase();
    return trucks.filter((truck) =>
      !keyword ||
      (truck.hullNumber || '').toLowerCase().includes(keyword) ||
      (truck.equipmentId || '').toLowerCase().includes(keyword) ||
      (truck.truckNumber || '').toLowerCase().includes(keyword) ||
      (truck.truckTypeLabel || '').toLowerCase().includes(keyword) ||
      (truck.ownerName || '').toLowerCase().includes(keyword) ||
      (truck.notes || '').toLowerCase().includes(keyword)
    );
  }, [trucks, searchQuery]);

  const getTypeChipClass = (type) => {
    if (type === 'dyna') return 'type-chip dyna';
    if (type === 'fuso') return 'type-chip fuso';
    return 'type-chip other';
  };

  return (
    <div className="registrasi-mobil-page" id="registrasi-mobil-page">
      {toast && (
        <div className={`registrasi-toast ${toast.tone}`} role="alert">
          <div className="toast-icon">
            {toast.tone === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
          </div>
          <div className="toast-content">
            <span className="toast-title">{toast.tone === 'success' ? 'Berhasil' : 'Gagal'}</span>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      <section className="manage-header">
        <div className="header-info">
          <h2>Registrasi Mobil</h2>
          <p>Kelola data dump truck yang terdaftar di sistem SITAG.</p>
        </div>
        <button className="btn-add-truck" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          <span>Tambah Dump Truck</span>
        </button>
      </section>

      <div className="manage-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari no lambung, no polisi, pemilik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="truck-count-badge">
          <strong>{trucks.length}</strong>
          <span>Terdaftar</span>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={48} className="spin text-muted" />
          <p>Memuat daftar truck...</p>
        </div>
      ) : (
        <div className="trucks-table-wrap">
          <table className="trucks-table">
            <thead>
              <tr>
                <th>No. Lambung</th>
                <th>Id Alat</th>
                <th>No. Polisi</th>
                <th>Tipe</th>
                <th>Pemilik Alat</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrucks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table">
                    Belum ada truck yang terdaftar atau cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredTrucks.map((truck) => (
                  <tr key={truck.id}>
                    <td>
                      <div className="truck-cell-info">
                        <strong>{truck.hullNumber || '-'}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted">{truck.equipmentId || '-'}</span>
                    </td>
                    <td>
                      <div className="truck-cell-info">
                        <strong>{truck.truckNumber}</strong>
                      </div>
                    </td>
                    <td>
                      <span className={getTypeChipClass(truck.truckType)}>
                        {truck.truckTypeLabel || truck.truckType}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted">{truck.ownerName || '-'}</span>
                    </td>
                    <td>
                      <span className="text-muted">{truck.notes || '-'}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn-edit-icon" onClick={() => handleOpenModal(truck)} title="Edit">
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDelete(truck.id)}
                          disabled={deletingId === truck.id}
                          title="Hapus"
                        >
                          {deletingId === truck.id ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Dump Truck' : 'Tambah Dump Truck'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="hullNumber">No. Lambung <span style={{ color: 'var(--color-accent-danger)' }}>*</span></label>
                  <input 
                    id="hullNumber" 
                    value={formData.hullNumber} 
                    onChange={(e) => setField('hullNumber', e.target.value)} 
                    placeholder="Contoh: DT-001" 
                  />
                  {errors.hullNumber && <span className="field-error-text">{errors.hullNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="equipmentId">Id Alat</label>
                  <input 
                    id="equipmentId" 
                    value={formData.equipmentId} 
                    onChange={(e) => setField('equipmentId', e.target.value)} 
                    placeholder="Contoh: EXC-01" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="truckNumber">No. Polisi <span style={{ color: 'var(--color-accent-danger)' }}>*</span></label>
                  <input 
                    id="truckNumber" 
                    value={formData.truckNumber} 
                    onChange={(e) => setField('truckNumber', e.target.value.toUpperCase())} 
                    placeholder="Contoh: DD 1234 AB" 
                  />
                  {errors.truckNumber && <span className="field-error-text">{errors.truckNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="truckType">Tipe <span style={{ color: 'var(--color-accent-danger)' }}>*</span></label>
                  <select 
                    id="truckType" 
                    value={formData.truckType} 
                    onChange={(e) => setField('truckType', e.target.value)}
                  >
                    {TRUCK_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="ownerName">Pemilik Alat</label>
                  <input 
                    id="ownerName" 
                    value={formData.ownerName} 
                    onChange={(e) => setField('ownerName', e.target.value)} 
                    placeholder="Nama pemilik alat" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Keterangan</label>
                  <input 
                    id="notes" 
                    value={formData.notes} 
                    onChange={(e) => setField('notes', e.target.value)} 
                    placeholder="Keterangan tambahan" 
                  />
                </div>
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="form-error">
                  <AlertCircle size={16} />
                  <span>Harap lengkapi semua field yang wajib diisi.</span>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Batal
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 size={18} className="spin" /> Menyimpan...</>
                  ) : (
                    <>{editingId ? 'Simpan Perubahan' : 'Tambahkan'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
