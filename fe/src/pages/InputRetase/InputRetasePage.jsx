import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { truckAPI, checkoutAPI } from '../../services/api';
import { TRUCK_TYPES, PIT_OWNERS } from '../../data/dummyData';
import {
  Truck, Camera, Upload, X, CheckCircle, AlertCircle,
  Loader2, Image as ImageIcon, Hash, User as UserIcon,
  MapPin, Pickaxe,
} from 'lucide-react';
import './InputRetasePage.css';

export default function InputRetasePage({ mode = null }) {
  const { user } = useAuth();
  
  // Determine role: use mode parameter if provided (admin), otherwise use user role
  const effectiveRole = mode ? mode : user?.role;
  const isStaff = effectiveRole === 'staff_pos' || mode === 'staff';
  const isChecker = effectiveRole === 'checker' || mode === 'checker';
  const isAdmin = user?.role === 'admin';
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [formData, setFormData] = useState({
    truckNumber: '',
    truckType: '',
    pitOwner: '',
    excaId: '',
    excaOperator: '',
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'Ukuran foto maksimal 5MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
      setErrors(prev => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const validate = () => {
    const errs = {};
    if (!formData.truckNumber.trim()) errs.truckNumber = 'No. polisi wajib diisi';
    if (!formData.truckType) errs.truckType = 'Pilih jenis truk';
    
    // Checker and Admin require additional fields
    if (isChecker || (isAdmin && mode === 'checker')) {
      if (!formData.pitOwner) errs.pitOwner = 'Pilih pemilik pit';
      if (!formData.excaId.trim()) errs.excaId = 'No. identitas excavator wajib diisi';
      if (!formData.excaOperator.trim()) errs.excaOperator = 'Nama operator wajib diisi';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      let result;

      if (isChecker || mode === 'checker') {
        // Checker input: Create checkout entry
        result = await checkoutAPI.create({
          truckNumber: formData.truckNumber,
          pitOwner: formData.pitOwner,
          excaId: formData.excaId,
          excaOperator: formData.excaOperator,
          createdBy: user?.id || user?.username,
        });
      } else {
        // Staff POS input: Register truck
        result = await truckAPI.create({
          truckNumber: formData.truckNumber,
          truckType: formData.truckType,
          createdBy: user?.id || user?.username,
        });
      }

      setIsSubmitting(false);

      if (result.success) {
        setSubmitResult({
          success: true,
          id: result.data?.id || `RET-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
          message: isChecker ? 'Data checkout berhasil dicatat!' : 'Data registrasi masuk berhasil dicatat!',
        });

        setFormData({
          truckNumber: '',
          truckType: '',
          pitOwner: '',
          excaId: '',
          excaOperator: '',
          photo: null,
        });
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        setTimeout(() => setSubmitResult(null), 4000);
      } else {
        setSubmitResult({
          success: false,
          message: result.message || 'Gagal menyimpan data',
        });
        setTimeout(() => setSubmitResult(null), 4000);
      }
    } catch (error) {
      setIsSubmitting(false);
      setSubmitResult({
        success: false,
        message: 'Terjadi kesalahan: ' + (error.message || 'Network error'),
      });
      setTimeout(() => setSubmitResult(null), 4000);
    }
  };

  const getRoleTitle = () => {
    if (isChecker && isAdmin) return 'Input Retase (Mode Checker)';
    if (isStaff && isAdmin) return 'Input Retase (Mode Staff POS)';
    if (isChecker) return 'Input Checkout Truck';
    if (isAdmin) return 'Input Retase Admin';
    return 'Registrasi Truck Masuk';
  };

  const getRoleDescription = () => {
    if (isChecker && isAdmin) return 'Mode checkout - Catat data excavator yang akan checkout dengan truck ini.';
    if (isStaff && isAdmin) return 'Mode registrasi - Catat data truck yang masuk di checkpoint.';
    if (isChecker) return 'Pilih excavator mana yang loading ke truck ini. Data akan di-verify untuk keluar dari pit.';
    if (isAdmin) return 'Catat data retase lengkap dengan semua informasi untuk admin dashboard.';
    return 'Catat data truck yang melewati checkpoint POS untuk registrasi masuk.';
  };

  const getModeIndicator = () => {
    if (isAdmin && mode === 'checker') return { label: 'Mode Checkout', icon: <Pickaxe size={18} /> };
    if (isAdmin && mode === 'staff') return { label: 'Mode Registrasi', icon: <Truck size={18} /> };
    if (isChecker) return { label: 'Checkout', icon: <Pickaxe size={18} /> };
    if (isAdmin) return { label: 'Admin Panel', icon: <Truck size={18} /> };
    return { label: 'Registrasi Masuk', icon: <Truck size={18} /> };
  };

  const buttonText = isChecker ? 'Simpan Checkout' : 'Simpan Registrasi';

  return (
    <div className="input-retase-page" id="input-retase-page">
      {submitResult?.success && (
        <div className="success-toast" role="alert">
          <div className="toast-icon">
            <CheckCircle size={22} />
          </div>
          <div className="toast-content">
            <span className="toast-title">Berhasil!</span>
            <span className="toast-message">{submitResult.message}</span>
            <span className="toast-id">ID: {submitResult.id}</span>
          </div>
        </div>
      )}

      <div className="input-page-header">
        <div className="input-header-info">
          <h2>{getRoleTitle()}</h2>
          <p>{getRoleDescription()}</p>
        </div>
        <div className="input-header-badge">
          <div className={`role-indicator ${isChecker ? 'checker' : 'staff'}`}>
            {getModeIndicator().icon}
            <span>{getModeIndicator().label}</span>
          </div>
        </div>
      </div>

      <form className="input-form" onSubmit={handleSubmit} id="retase-form">
        <div className="form-sections">
          {/* ============ TRUCK INFORMATION SECTION ============ */}
          <div className="form-section">
            <div className="section-label">
              <Truck size={18} />
              <span>{isChecker ? 'Informasi Truck yang Akan Checkout' : 'Informasi Truck Masuk'}</span>
            </div>

            <div className="form-grid">
              <div className={`field-group ${errors.truckNumber ? 'error' : ''}`}>
                <label htmlFor="truck-number">
                  No. Polisi Truck <span className="required">*</span>
                </label>
                <div className="field-input-wrap">
                  <Hash size={18} className="field-icon" />
                  <input
                    id="truck-number"
                    type="text"
                    placeholder="Contoh: DD 1234 AB"
                    value={formData.truckNumber}
                    onChange={(e) => handleChange('truckNumber', e.target.value.toUpperCase())}
                    className="field-input"
                    maxLength={15}
                  />
                </div>
                {errors.truckNumber && (
                  <span className="field-error">
                    <AlertCircle size={12} /> {errors.truckNumber}
                  </span>
                )}
              </div>

              <div className={`field-group ${errors.truckType ? 'error' : ''}`}>
                <label htmlFor="truck-type">
                  Jenis Truck <span className="required">*</span>
                </label>
                <div className="truck-type-selector">
                  {TRUCK_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`type-option ${formData.truckType === type.value ? 'selected' : ''}`}
                      onClick={() => handleChange('truckType', type.value)}
                      id={`truck-type-${type.value}`}
                    >
                      <Truck size={24} />
                      <span className="type-name">{type.label}</span>
                      <span className="type-capacity">{type.capacity}</span>
                      {formData.truckType === type.value && (
                        <span className="type-check">
                          <CheckCircle size={16} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {errors.truckType && (
                  <span className="field-error">
                    <AlertCircle size={12} /> {errors.truckType}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ============ EXCAVATOR INFORMATION SECTION (Checker & Admin Mode Only) ============ */}
          {(isChecker || (isAdmin && mode === 'checker')) && (
            <div className="form-section checker-section">
              <div className="section-label">
                <Pickaxe size={18} />
                <span>Informasi Excavator & Pit</span>
              </div>

              <div className="form-grid">
                <div className={`field-group ${errors.pitOwner ? 'error' : ''}`}>
                  <label htmlFor="pit-owner">
                    Pit Owner <span className="required">*</span>
                  </label>
                  <div className="field-input-wrap">
                    <MapPin size={18} className="field-icon" />
                    <select
                      id="pit-owner"
                      value={formData.pitOwner}
                      onChange={(e) => handleChange('pitOwner', e.target.value)}
                      className="field-input field-select"
                    >
                      <option value="">Pilih pit owner...</option>
                      {PIT_OWNERS.map((owner) => (
                        <option key={owner.value} value={owner.value}>{owner.label}</option>
                      ))}
                    </select>
                  </div>
                  {errors.pitOwner && (
                    <span className="field-error">
                      <AlertCircle size={12} /> {errors.pitOwner}
                    </span>
                  )}
                </div>

                <div className={`field-group ${errors.excaId ? 'error' : ''}`}>
                  <label htmlFor="exca-id">
                    No. Excavator <span className="required">*</span>
                  </label>
                  <div className="field-input-wrap">
                    <Hash size={18} className="field-icon" />
                    <input
                      id="exca-id"
                      type="text"
                      placeholder="Contoh: EXC-001"
                      value={formData.excaId}
                      onChange={(e) => handleChange('excaId', e.target.value.toUpperCase())}
                      className="field-input"
                      maxLength={20}
                    />
                  </div>
                  {errors.excaId && (
                    <span className="field-error">
                      <AlertCircle size={12} /> {errors.excaId}
                    </span>
                  )}
                </div>

                <div className={`field-group full-width ${errors.excaOperator ? 'error' : ''}`}>
                  <label htmlFor="exca-operator">
                    Nama Operator Excavator <span className="required">*</span>
                  </label>
                  <div className="field-input-wrap">
                    <UserIcon size={18} className="field-icon" />
                    <input
                      id="exca-operator"
                      type="text"
                      placeholder="Nama lengkap operator"
                      value={formData.excaOperator}
                      onChange={(e) => handleChange('excaOperator', e.target.value)}
                      className="field-input"
                      maxLength={50}
                    />
                  </div>
                  {errors.excaOperator && (
                    <span className="field-error">
                      <AlertCircle size={12} /> {errors.excaOperator}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============ PHOTO SECTION ============ */}
          <div className="form-section">
            <div className="section-label">
              <Camera size={18} />
              <span>Foto Dokumentasi</span>
              <span className="optional-badge">Opsional</span>
            </div>

            {!photoPreview ? (
              <div className="photo-upload-area">
                <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon-wrap">
                    <ImageIcon size={32} />
                  </div>
                  <p className="upload-text">Klik untuk upload foto</p>
                  <p className="upload-hint">JPG, PNG - Maks 5MB</p>
                </div>
                
                <button
                  type="button"
                  className="camera-btn"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={20} />
                  <span>Buka Kamera</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  hidden
                  id="photo-upload"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  hidden
                  id="camera-capture"
                />
              </div>
            ) : (
              <div className="photo-preview-area">
                <div className="preview-image-wrap">
                  <img src={photoPreview} alt="Preview" className="preview-image" />
                  <button type="button" className="remove-photo-btn" onClick={removePhoto}>
                    <X size={16} />
                  </button>
                </div>
                <div className="preview-info">
                  <CheckCircle size={14} className="preview-check" />
                  <span>Foto berhasil dimuat</span>
                </div>
              </div>
            )}
            {errors.photo && (
              <span className="field-error">
                <AlertCircle size={12} /> {errors.photo}
              </span>
            )}
          </div>
        </div>

        {/* ============ FORM ACTIONS ============ */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setFormData({ truckNumber: '', truckType: '', pitOwner: '', excaId: '', excaOperator: '', photo: null });
              setPhotoPreview(null);
              setErrors({});
            }}
          >
            Reset Form
          </button>
          <button
            type="submit"
            className={`btn-primary ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
            id="submit-retase-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Upload size={18} />
                {buttonText}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
