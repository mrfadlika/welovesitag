import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle,
  ClipboardList,
  Hash,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pickaxe,
  Truck,
  Upload,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { checkoutAPI } from '../../services/api';
import {
  CONTRACTOR_OPTIONS,
  HEAVY_EQUIPMENT_OPTIONS,
  LOCATION_OPTIONS,
  MATERIAL_OPTIONS,
  TRUCK_TYPE_OPTIONS,
  getOptionLabel,
  isCustomOption,
} from '../../data/retaseOptions';
import './InputRetasePage.css';

const EMPTY_FORM = {
  materialType: '',
  materialCustom: '',
  locationOwner: '',
  locationCustom: '',
  heavyEquipment: '',
  heavyEquipmentCustom: '',
  truckType: '',
  truckTypeCustom: '',
  contractor: '',
  contractorCustom: '',
  truckNumber: '',
  checkerPit: '',
  photo: null,
};

function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className="field-error">
      <AlertCircle size={12} /> {message}
    </span>
  );
}

function InputGroup({ id, label, icon, error, ...props }) {
  return (
    <div className={`field-group ${error ? 'error' : ''}`}>
      <label htmlFor={id}>
        {label} <span className="required">*</span>
      </label>
      <div className="field-input-wrap">
        {icon}
        <input id={id} className="field-input" {...props} />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function SelectGroup({ id, label, icon, options, error, ...props }) {
  return (
    <div className={`field-group ${error ? 'error' : ''}`}>
      <label htmlFor={id}>
        {label} <span className="required">*</span>
      </label>
      <div className="field-input-wrap">
        {icon}
        <select id={id} className="field-input field-select" {...props}>
          <option value="">Pilih {label.toLowerCase()}...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <FieldError message={error} />
    </div>
  );
}

function resolveValue(selectedValue, customValue) {
  if (selectedValue === '__custom__' || selectedValue === 'lainnya') {
    return customValue.trim();
  }

  return selectedValue.trim();
}

export default function InputRetasePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [formData, setFormData] = useState({
    ...EMPTY_FORM,
    checkerPit: user?.name || user?.username || '',
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errors, setErrors] = useState({});

  const resolvedSubmission = useMemo(
    () => ({
      materialType: resolveValue(formData.materialType, formData.materialCustom),
      locationOwner: resolveValue(formData.locationOwner, formData.locationCustom),
      heavyEquipment: resolveValue(formData.heavyEquipment, formData.heavyEquipmentCustom),
      truckType: formData.truckType || 'lainnya',
      truckTypeLabel:
        formData.truckType === 'dyna'
          ? 'Dyna'
          : formData.truckType === 'fuso'
            ? 'Fuso'
            : formData.truckTypeCustom.trim(),
      contractor: resolveValue(formData.contractor, formData.contractorCustom),
      checkerPit: formData.checkerPit.trim(),
    }),
    [formData]
  );

  const setField = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: '' }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((previous) => ({ ...previous, photo: 'Ukuran foto maksimal 5MB' }));
      return;
    }

    setFormData((previous) => ({ ...previous, photo: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData((previous) => ({ ...previous, photo: null }));
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const validate = () => {
    const nextErrors = {};
    const requiredFields = [
      ['materialType', !formData.materialType, 'Pilih jenis material'],
      ['locationOwner', !formData.locationOwner, 'Pilih lokasi / pemilik'],
      ['heavyEquipment', !formData.heavyEquipment, 'Pilih alat berat'],
      ['truckType', !formData.truckType, 'Pilih jenis truk'],
      ['contractor', !formData.contractor, 'Pilih kontraktor'],
      ['truckNumber', !formData.truckNumber.trim(), 'No. polisi wajib diisi'],
      ['checkerPit', !resolvedSubmission.checkerPit, 'Checker pit wajib diisi'],
    ];

    requiredFields.forEach(([field, invalid, message]) => {
      if (invalid) nextErrors[field] = message;
    });

    if (isCustomOption(formData.materialType) && !formData.materialCustom.trim()) {
      nextErrors.materialCustom = 'Isi jenis material lainnya';
    }
    if (isCustomOption(formData.locationOwner) && !formData.locationCustom.trim()) {
      nextErrors.locationCustom = 'Isi lokasi / pemilik lainnya';
    }
    if (isCustomOption(formData.heavyEquipment) && !formData.heavyEquipmentCustom.trim()) {
      nextErrors.heavyEquipmentCustom = 'Isi alat berat lainnya';
    }
    if (isCustomOption(formData.truckType) && !formData.truckTypeCustom.trim()) {
      nextErrors.truckTypeCustom = 'Isi jenis truk lainnya';
    }
    if (isCustomOption(formData.contractor) && !formData.contractorCustom.trim()) {
      nextErrors.contractorCustom = 'Isi kontraktor lainnya';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await checkoutAPI.create({
        truckNumber: formData.truckNumber.trim(),
        truckType: formData.truckType,
        truckTypeLabel: resolvedSubmission.truckTypeLabel,
        materialType: resolvedSubmission.materialType,
        locationOwner: resolvedSubmission.locationOwner,
        heavyEquipment: resolvedSubmission.heavyEquipment,
        contractor: resolvedSubmission.contractor,
        checkerPit: resolvedSubmission.checkerPit,
        createdByRole: isAdmin ? 'Admin' : 'Checker Pit',
        photo: photoPreview,
      });

      if (!result.success) {
        setSubmitResult({ success: false, message: result.message || 'Gagal menyimpan data' });
        return;
      }

      setSubmitResult({
        success: true,
        id: result.data?.id || '-',
        message: 'Data retase berhasil masuk ke log real-time.',
      });
      setFormData({
        ...EMPTY_FORM,
        checkerPit: user?.name || user?.username || '',
      });
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (error) {
      setSubmitResult({
        success: false,
        message: `Terjadi kesalahan: ${error.message || 'Network error'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const summaryItems = [
    ['Jenis Material', resolvedSubmission.materialType || getOptionLabel(MATERIAL_OPTIONS, formData.materialType)],
    ['Lokasi / Pemilik', resolvedSubmission.locationOwner || getOptionLabel(LOCATION_OPTIONS, formData.locationOwner)],
    ['Alat Berat', resolvedSubmission.heavyEquipment || getOptionLabel(HEAVY_EQUIPMENT_OPTIONS, formData.heavyEquipment)],
    ['Jenis Truk', resolvedSubmission.truckTypeLabel || getOptionLabel(TRUCK_TYPE_OPTIONS, formData.truckType)],
    ['No Polisi', formData.truckNumber || '-'],
    ['Kontraktor', resolvedSubmission.contractor || getOptionLabel(CONTRACTOR_OPTIONS, formData.contractor)],
    ['Checker Pit', resolvedSubmission.checkerPit || '-'],
    ['Checker Gate', 'Otomatis saat verifikasi'],
  ];

  const completionPercent = Math.round(
    (summaryItems.filter(([, value]) => value && value !== '-').length / summaryItems.length) * 100
  );

  const now = new Date();

  return (
    <div className="input-retase-page" id="input-retase-page">
      {submitResult?.success && (
        <div className="success-toast" role="alert">
          <div className="toast-icon"><CheckCircle size={22} /></div>
          <div className="toast-content">
            <span className="toast-title">Berhasil disimpan</span>
            <span className="toast-message">{submitResult.message}</span>
            <span className="toast-id">No Reg: {submitResult.id}</span>
          </div>
        </div>
      )}

      <div className="input-page-header">
        <div className="input-header-info">
          <span className="section-kicker">Workbook Sync</span>
          <h2>Form Input Data Retase</h2>
          <p>Field sekarang disusun mengikuti sheet Excel: material, lokasi, alat berat, jenis truk, no polisi, kontraktor, checker pit, dan checker gate.</p>
        </div>
        <div className="role-indicator checker">
          <Pickaxe size={18} />
          <span>{isAdmin ? 'Admin Input' : 'Checker Pit'}</span>
        </div>
      </div>

      <div className="input-layout">
        <form className="input-form" onSubmit={handleSubmit}>
          <div className="form-section workbook-sheet-card">
            <div className="section-label">
              <ClipboardList size={18} />
              <div>
                <span>Header Workbook</span>
                <small>No reg, tanggal, waktu, dan checker pit mengikuti format Excel.</small>
              </div>
            </div>
            <div className="readonly-strip">
              <div className="readonly-tile"><span className="readonly-label">No Reg</span><strong>Otomatis saat simpan</strong></div>
              <div className="readonly-tile"><span className="readonly-label">Tanggal</span><strong>{now.toLocaleDateString('id-ID')}</strong></div>
              <div className="readonly-tile"><span className="readonly-label">Waktu</span><strong>{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong></div>
              <div className="readonly-tile"><span className="readonly-label">Checker Pit</span><strong>{resolvedSubmission.checkerPit || '-'}</strong></div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-label">
              <Pickaxe size={18} />
              <div>
                <span>Data Retase Utama</span>
                <small>Semua isian ini akan langsung membentuk kolom pada data log retase real-time.</small>
              </div>
            </div>
            <div className="form-grid">
              <SelectGroup id="materialType" label="Jenis Material" icon={<ClipboardList size={18} className="field-icon" />} value={formData.materialType} onChange={(event) => setField('materialType', event.target.value)} options={MATERIAL_OPTIONS} error={errors.materialType} />
              <SelectGroup id="locationOwner" label="Lokasi / Pemilik" icon={<MapPin size={18} className="field-icon" />} value={formData.locationOwner} onChange={(event) => setField('locationOwner', event.target.value)} options={LOCATION_OPTIONS} error={errors.locationOwner} />
              {isCustomOption(formData.materialType) && <InputGroup id="materialCustom" label="Jenis Material Lainnya" icon={<ClipboardList size={18} className="field-icon" />} value={formData.materialCustom} onChange={(event) => setField('materialCustom', event.target.value)} placeholder="Tulis material lain" error={errors.materialCustom} />}
              {isCustomOption(formData.locationOwner) && <InputGroup id="locationCustom" label="Lokasi / Pemilik Lainnya" icon={<MapPin size={18} className="field-icon" />} value={formData.locationCustom} onChange={(event) => setField('locationCustom', event.target.value)} placeholder="Tulis lokasi lain" error={errors.locationCustom} />}
              <SelectGroup id="heavyEquipment" label="Alat Berat" icon={<Pickaxe size={18} className="field-icon" />} value={formData.heavyEquipment} onChange={(event) => setField('heavyEquipment', event.target.value)} options={HEAVY_EQUIPMENT_OPTIONS} error={errors.heavyEquipment} />
              <SelectGroup id="contractor" label="Kontraktor" icon={<UserIcon size={18} className="field-icon" />} value={formData.contractor} onChange={(event) => setField('contractor', event.target.value)} options={CONTRACTOR_OPTIONS} error={errors.contractor} />
              {isCustomOption(formData.heavyEquipment) && <InputGroup id="heavyEquipmentCustom" label="Alat Berat Lainnya" icon={<Pickaxe size={18} className="field-icon" />} value={formData.heavyEquipmentCustom} onChange={(event) => setField('heavyEquipmentCustom', event.target.value)} placeholder="Tulis alat berat lain" error={errors.heavyEquipmentCustom} />}
              {isCustomOption(formData.contractor) && <InputGroup id="contractorCustom" label="Kontraktor Lainnya" icon={<UserIcon size={18} className="field-icon" />} value={formData.contractorCustom} onChange={(event) => setField('contractorCustom', event.target.value)} placeholder="Tulis kontraktor lain" error={errors.contractorCustom} />}
              <SelectGroup id="truckType" label="Jenis Truk" icon={<Truck size={18} className="field-icon" />} value={formData.truckType} onChange={(event) => setField('truckType', event.target.value)} options={TRUCK_TYPE_OPTIONS} error={errors.truckType} />
              <InputGroup id="truckNumber" label="No Polisi" icon={<Hash size={18} className="field-icon" />} value={formData.truckNumber} onChange={(event) => setField('truckNumber', event.target.value.toUpperCase())} placeholder="Contoh: DD 1234 AB" error={errors.truckNumber} />
              {isCustomOption(formData.truckType) && <InputGroup id="truckTypeCustom" label="Jenis Truk Lainnya" icon={<Truck size={18} className="field-icon" />} value={formData.truckTypeCustom} onChange={(event) => setField('truckTypeCustom', event.target.value)} placeholder="Tulis jenis truk lain" error={errors.truckTypeCustom} />}
              <div className={`field-group full-width ${errors.checkerPit ? 'error' : ''}`}>
                <label htmlFor="checkerPit">Checker Pit <span className="required">*</span></label>
                <div className="field-input-wrap">
                  <UserIcon size={18} className="field-icon" />
                  <input id="checkerPit" className="field-input" value={formData.checkerPit} onChange={(event) => setField('checkerPit', event.target.value)} readOnly={!isAdmin} />
                </div>
                <span className="inline-note">{isAdmin ? 'Admin dapat menyesuaikan nama checker pit saat input pengganti.' : 'Terisi dari akun login checker.'}</span>
                <FieldError message={errors.checkerPit} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-label">
              <Camera size={18} />
              <div>
                <span>Foto Dokumentasi</span>
                <small>Opsional, tetap tersedia bila perlu bukti lapangan.</small>
              </div>
              <span className="optional-badge">Opsional</span>
            </div>
            {!photoPreview ? (
              <div className="photo-upload-area">
                <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon-wrap"><ImageIcon size={30} /></div>
                  <p className="upload-text">Klik untuk upload foto</p>
                  <p className="upload-hint">JPG atau PNG, maksimal 5MB</p>
                </div>
                <button type="button" className="camera-btn" onClick={() => cameraInputRef.current?.click()}>
                  <Camera size={20} />
                  <span>Buka Kamera</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} hidden />
              </div>
            ) : (
              <div className="photo-preview-area">
                <div className="preview-image-wrap">
                  <img src={photoPreview} alt="Preview dokumentasi" className="preview-image" />
                  <button type="button" className="remove-photo-btn" onClick={removePhoto}><X size={16} /></button>
                </div>
              </div>
            )}
            <FieldError message={errors.photo} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => {
              setFormData({ ...EMPTY_FORM, checkerPit: user?.name || user?.username || '' });
              setPhotoPreview(null);
              setErrors({});
              if (fileInputRef.current) fileInputRef.current.value = '';
              if (cameraInputRef.current) cameraInputRef.current.value = '';
            }}>Reset Form</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 size={18} className="spin" /> Menyimpan...</> : <><Upload size={18} /> Simpan ke Log Retase</>}
            </button>
          </div>
        </form>

        <aside className="input-aside">
          <div className="helper-card surface-card">
            <div className="helper-card-header">
              <span className="section-kicker">Ringkasan Workbook</span>
              <h3>Siap disimpan</h3>
            </div>
            <div className="progress-track"><div className="progress-value" style={{ width: `${completionPercent}%` }} /></div>
            <div className="summary-status">
              <strong>{completionPercent}% lengkap</strong>
              <span>Form ini mengikuti urutan kolom utama pada file Excel.</span>
            </div>
            <div className="summary-list">
              {summaryItems.map(([label, value]) => (
                <div className={`summary-item ${value && value !== '-' ? 'done' : 'pending'}`} key={label}>
                  <div>
                    <span className="summary-label">{label}</span>
                    <strong className="summary-value">{value || '-'}</strong>
                  </div>
                  <span className="summary-flag">{value && value !== '-' ? 'Siap' : 'Belum'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="helper-card surface-card">
            <div className="helper-card-header">
              <span className="section-kicker">Checklist Kerja</span>
              <h3>Alur yang dipakai</h3>
            </div>
            <div className="helper-list">
              <div className="helper-item"><span className="helper-marker">1</span><div><strong>Input retase dari checker pit</strong><span>Field utama mengikuti workbook Excel agar data log rapi.</span></div></div>
              <div className="helper-item"><span className="helper-marker">2</span><div><strong>Verifikasi gate dilakukan terpisah</strong><span>Checker gate akan terisi otomatis setelah data disetujui.</span></div></div>
              <div className="helper-item"><span className="helper-marker">3</span><div><strong>Data langsung masuk log dan rekap</strong><span>Riwayat dan rekap harian mengambil data dari struktur yang sama.</span></div></div>
            </div>
          </div>

          {submitResult && !submitResult.success && (
            <div className="helper-card surface-card">
              <div className="helper-card-header">
                <span className="section-kicker">Gagal Simpan</span>
                <h3>Periksa input</h3>
              </div>
              <p className="helper-card-copy">{submitResult.message}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
