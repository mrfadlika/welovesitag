import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  Truck,
  MapPin,
  Pickaxe,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { truckAPI, equipmentAPI, locationAPI, contractorAPI } from '../../services/api';
import './RegistrasiPage.css';

const TRUCK_TYPE_OPTIONS = [
  { value: 'dyna', label: 'Dyna' },
  { value: 'fuso', label: 'Fuso' },
];

export default function RegistrasiPage() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('trucks');
  
  // Data States
  const [trucks, setTrucks] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [contractors, setContractors] = useState([]);
  
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setSearchQuery('');
    try {
      if (activeTab === 'trucks') {
        const result = await truckAPI.getAll();
        if (result.success) setTrucks(result.data || []);
      } else if (activeTab === 'equipments') {
        const result = await equipmentAPI.getAll();
        if (result.success) setEquipments(result.data || []);
      } else if (activeTab === 'locations') {
        const result = await locationAPI.getAll();
        if (result.success) setLocations(result.data || []);
      } else if (activeTab === 'contractors') {
        const result = await contractorAPI.getAll();
        if (result.success) setContractors(result.data || []);
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
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (activeTab === 'trucks') {
      if (!formData.equipmentId?.trim()) nextErrors.equipmentId = 'Id Alat wajib diisi';
      if (!formData.truckNumber?.trim()) nextErrors.truckNumber = 'No. polisi wajib diisi';
      if (!formData.truckType) nextErrors.truckType = 'Pilih tipe truk';
    } else if (activeTab === 'equipments') {
      if (!formData.equipmentId?.trim()) nextErrors.equipmentId = 'Id Alat wajib diisi';
    } else if (activeTab === 'locations') {
      if (!formData.name?.trim()) nextErrors.name = 'Nama lokasi wajib diisi';
    } else if (activeTab === 'contractors') {
      if (!formData.name?.trim()) nextErrors.name = 'Nama kontraktor wajib diisi';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let payload = { ...formData, registeredBy: user?.name || 'Admin', registeredByRole: 'Admin' };
      if (activeTab === 'trucks') {
        payload.truckNumber = payload.truckNumber.toUpperCase();
      }

      let result;
      const api = activeTab === 'trucks' ? truckAPI : activeTab === 'equipments' ? equipmentAPI : activeTab === 'locations' ? locationAPI : contractorAPI;
      
      if (editingId) {
        result = await api.update(editingId, payload);
      } else {
        result = await api.create(payload);
      }

      if (!result.success) {
        showToast('error', result.message || 'Gagal menyimpan data');
        return;
      }

      showToast('success', editingId ? 'Data berhasil diperbarui' : 'Data berhasil didaftarkan');
      handleCloseModal();
      fetchData();
    } catch (error) {
      showToast('error', `Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setFormData({ ...item });
      setEditingId(item.id);
    } else {
      setFormData({});
      setEditingId(null);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingId(null);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;

    setDeletingId(id);
    try {
      const api = activeTab === 'trucks' ? truckAPI : activeTab === 'equipments' ? equipmentAPI : activeTab === 'locations' ? locationAPI : contractorAPI;
      const result = await api.remove(id);
      if (!result.success) {
        showToast('error', result.message || 'Gagal menghapus');
        return;
      }
      showToast('success', 'Data berhasil dihapus');
      fetchData();
    } catch (error) {
      showToast('error', `Gagal menghapus: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    const keyword = searchQuery.toLowerCase();
    const list = activeTab === 'trucks' ? trucks : activeTab === 'equipments' ? equipments : activeTab === 'locations' ? locations : contractors;
    return list.filter((item) => {
      if (!keyword) return true;
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(keyword)
      );
    });
  }, [trucks, equipments, locations, contractors, searchQuery, activeTab]);

  const getTypeChipClass = (type) => {
    if (type === 'dyna') return 'type-chip dyna';
    if (type === 'fuso') return 'type-chip fuso';
    return 'type-chip other';
  };

  const renderTrucksTable = () => (
    <>
      {filteredData.length === 0 ? (
        <div className="empty-state-panel">
          <Truck size={48} />
          <h3>Belum ada data</h3>
          <p>Belum ada data dump truck.</p>
        </div>
      ) : (
        <div className="table-wrap data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Id Alat</th>
                <th>No. Polisi</th>
                <th>Merek</th>
                <th>Tipe</th>
                <th>Pemilik Alat</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td data-label="Id Alat"><strong>{item.equipmentId || '-'}</strong></td>
                  <td data-label="No. Polisi"><strong>{item.truckNumber}</strong></td>
                  <td data-label="Merek">{item.brand || '-'}</td>
                  <td data-label="Tipe"><span className={getTypeChipClass(item.truckType)}>{item.truckTypeLabel || item.truckType}</span></td>
                  <td data-label="Pemilik Alat"><span className="text-muted">{item.ownerName || '-'}</span></td>
                  <td data-label="Keterangan"><span className="text-muted">{item.notes || '-'}</span></td>
                  <td data-label="Aksi">{renderActions(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  const renderEquipmentsTable = () => (
    <>
      {filteredData.length === 0 ? (
        <div className="empty-state-panel">
          <Pickaxe size={48} />
          <h3>Belum ada data</h3>
          <p>Belum ada data alat gali.</p>
        </div>
      ) : (
        <div className="table-wrap data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Id Alat</th>
                <th>Merek</th>
                <th>Tipe</th>
                <th>Pemilik Alat</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td data-label="Id Alat"><strong>{item.equipmentId}</strong></td>
                  <td data-label="Merek">{item.brand || '-'}</td>
                  <td data-label="Tipe">{item.type || '-'}</td>
                  <td data-label="Pemilik Alat"><span className="text-muted">{item.ownerName || '-'}</span></td>
                  <td data-label="Keterangan"><span className="text-muted">{item.notes || '-'}</span></td>
                  <td data-label="Aksi">{renderActions(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  const renderLocationsTable = () => (
    <>
      {filteredData.length === 0 ? (
        <div className="empty-state-panel">
          <MapPin size={48} />
          <h3>Belum ada data</h3>
          <p>Belum ada data lokasi.</p>
        </div>
      ) : (
        <div className="table-wrap data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Lokasi</th>
                <th>Pemilik Lokasi</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td data-label="Nama Lokasi"><strong>{item.name}</strong></td>
                  <td data-label="Pemilik Lokasi"><span className="text-muted">{item.ownerName || '-'}</span></td>
                  <td data-label="Keterangan"><span className="text-muted">{item.notes || '-'}</span></td>
                  <td data-label="Aksi">{renderActions(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  const renderContractorsTable = () => (
    <>
      {filteredData.length === 0 ? (
        <div className="empty-state-panel">
          <User size={48} />
          <h3>Belum ada data</h3>
          <p>Belum ada data kontraktor.</p>
        </div>
      ) : (
        <div className="table-wrap data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Kontraktor</th>
                <th>Kontak Person</th>
                <th>No Kontak</th>
                <th>Alamat</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td data-label="Nama Kontraktor"><strong>{item.name}</strong></td>
                  <td data-label="Kontak Person"><span className="text-muted">{item.contactPerson || '-'}</span></td>
                  <td data-label="No Kontak"><span className="text-muted">{item.contactNumber || '-'}</span></td>
                  <td data-label="Alamat"><span className="text-muted">{item.address || '-'}</span></td>
                  <td data-label="Keterangan"><span className="text-muted">{item.notes || '-'}</span></td>
                  <td data-label="Aksi">{renderActions(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  const renderActions = (item) => (
    <div className="table-actions">
      <button type="button" className="btn-edit-icon" onClick={() => handleOpenModal(item)} title="Edit">
        <Edit3 size={16} />
      </button>
      <button
        type="button"
        className="btn-delete"
        onClick={() => handleDelete(item.id)}
        disabled={deletingId === item.id}
        title="Hapus"
      >
        {deletingId === item.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  );

  const renderModalContent = () => {
    if (activeTab === 'trucks') {
      return (
        <>
          <div className="form-group">
            <label htmlFor="equipmentId">Id Alat <span style={{ color: 'var(--color-accent-danger)' }}>*</span></label>
            <input id="equipmentId" value={formData.equipmentId || ''} onChange={(e) => setField('equipmentId', e.target.value)} placeholder="Contoh: DT-001" />
            {errors.equipmentId && <span className="field-error-text">{errors.equipmentId}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="truckNumber">No. Polisi <span style={{ color: 'var(--color-accent-danger)' }}>*</span></label>
            <input id="truckNumber" value={formData.truckNumber || ''} onChange={(e) => setField('truckNumber', e.target.value.toUpperCase())} placeholder="Contoh: DD 1234 AB" />
            {errors.truckNumber && <span className="field-error-text">{errors.truckNumber}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="brand">Merek</label>
            <input id="brand" value={formData.brand || ''} onChange={(e) => setField('brand', e.target.value)} placeholder="Merek truk" />
          </div>
          <div className="form-group">
            <label htmlFor="truckType">Tipe <span style={{ color: 'var(--color-accent-danger)' }}>*</span></label>
            <select id="truckType" value={formData.truckType || ''} onChange={(e) => setField('truckType', e.target.value)}>
              <option value="">Pilih Tipe</option>
              {TRUCK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.truckType && <span className="field-error-text">{errors.truckType}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="ownerName">Pemilik Alat</label>
            <input id="ownerName" value={formData.ownerName || ''} onChange={(e) => setField('ownerName', e.target.value)} placeholder="Nama pemilik" />
          </div>
          <div className="form-group">
            <label htmlFor="notes">Keterangan</label>
            <input id="notes" value={formData.notes || ''} onChange={(e) => setField('notes', e.target.value)} placeholder="Keterangan tambahan" />
          </div>
        </>
      );
    } else if (activeTab === 'equipments') {
      return (
        <>
          <div className="form-group">
            <label htmlFor="equipmentId">Id Alat <span style={{ color: 'var(--color-accent-danger)' }}>*</span></label>
            <input id="equipmentId" value={formData.equipmentId || ''} onChange={(e) => setField('equipmentId', e.target.value)} placeholder="Contoh: EXC-01" />
            {errors.equipmentId && <span className="field-error-text">{errors.equipmentId}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="brand">Merek</label>
            <input id="brand" value={formData.brand || ''} onChange={(e) => setField('brand', e.target.value)} placeholder="Contoh: Komatsu" />
          </div>
          <div className="form-group">
            <label htmlFor="type">Tipe</label>
            <input id="type" value={formData.type || ''} onChange={(e) => setField('type', e.target.value)} placeholder="Contoh: PC200" />
          </div>
          <div className="form-group">
            <label htmlFor="ownerName">Pemilik Alat</label>
            <input id="ownerName" value={formData.ownerName || ''} onChange={(e) => setField('ownerName', e.target.value)} placeholder="Nama pemilik" />
          </div>
          <div className="form-group">
            <label htmlFor="notes">Keterangan</label>
            <input id="notes" value={formData.notes || ''} onChange={(e) => setField('notes', e.target.value)} placeholder="Keterangan tambahan" />
          </div>
        </>
      );
    } else if (activeTab === 'locations') {
      return (
        <>
          <div className="form-group">
            <label htmlFor="name">Nama Lokasi <span style={{ color: 'var(--color-accent-danger)' }}>*</span></label>
            <input id="name" value={formData.name || ''} onChange={(e) => setField('name', e.target.value)} placeholder="Contoh: Pit A" />
            {errors.name && <span className="field-error-text">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="ownerName">Pemilik Lokasi</label>
            <input id="ownerName" value={formData.ownerName || ''} onChange={(e) => setField('ownerName', e.target.value)} placeholder="Nama pemilik lokasi" />
          </div>
          <div className="form-group full-width">
            <label htmlFor="notes">Keterangan</label>
            <input id="notes" value={formData.notes || ''} onChange={(e) => setField('notes', e.target.value)} placeholder="Keterangan tambahan" />
          </div>
        </>
      );
    } else if (activeTab === 'contractors') {
      return (
        <>
          <div className="form-group">
            <label htmlFor="name">Nama Kontraktor <span style={{ color: 'var(--color-accent-danger)' }}>*</span></label>
            <input id="name" value={formData.name || ''} onChange={(e) => setField('name', e.target.value)} placeholder="Contoh: PT Kaltim Prima" />
            {errors.name && <span className="field-error-text">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="contactPerson">Kontak Person</label>
            <input id="contactPerson" value={formData.contactPerson || ''} onChange={(e) => setField('contactPerson', e.target.value)} placeholder="Nama PIC" />
          </div>
          <div className="form-group">
            <label htmlFor="contactNumber">No Kontak</label>
            <input id="contactNumber" value={formData.contactNumber || ''} onChange={(e) => setField('contactNumber', e.target.value)} placeholder="0812xxxxxx" />
          </div>
          <div className="form-group">
            <label htmlFor="address">Alamat</label>
            <input id="address" value={formData.address || ''} onChange={(e) => setField('address', e.target.value)} placeholder="Alamat lengkap" />
          </div>
          <div className="form-group full-width">
            <label htmlFor="notes">Keterangan</label>
            <input id="notes" value={formData.notes || ''} onChange={(e) => setField('notes', e.target.value)} placeholder="Keterangan tambahan" />
          </div>
        </>
      );
    }
  };

  const currentTabLabel = activeTab === 'trucks' ? 'Dump Truck' : activeTab === 'equipments' ? 'Alat Gali' : activeTab === 'locations' ? 'Lokasi' : 'Kontraktor';

  return (
    <div className="registrasi-page" id="registrasi-page">
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

      <div className="manage-toolbar">
        <div className="registrasi-tabs">
          <button className={`tab-btn ${activeTab === 'trucks' ? 'active' : ''}`} onClick={() => setActiveTab('trucks')}>
            <Truck size={18} /> Dump Truck
          </button>
          <button className={`tab-btn ${activeTab === 'equipments' ? 'active' : ''}`} onClick={() => setActiveTab('equipments')}>
            <Pickaxe size={18} /> Alat Gali
          </button>
          <button className={`tab-btn ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => setActiveTab('locations')}>
            <MapPin size={18} /> Lokasi
          </button>
          <button className={`tab-btn ${activeTab === 'contractors' ? 'active' : ''}`} onClick={() => setActiveTab('contractors')}>
            <User size={18} /> Kontraktor
          </button>
        </div>

        <div className="toolbar-actions">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={`Cari ${currentTabLabel.toLowerCase()}...`}
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
          <button className="btn-add-item" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            <span>Tambah {currentTabLabel}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={48} className="spin text-muted" />
          <p>Memuat data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'trucks' && renderTrucksTable()}
          {activeTab === 'equipments' && renderEquipmentsTable()}
          {activeTab === 'locations' && renderLocationsTable()}
          {activeTab === 'contractors' && renderContractorsTable()}
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? `Edit ${currentTabLabel}` : `Tambah ${currentTabLabel}`}</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                {renderModalContent()}
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
