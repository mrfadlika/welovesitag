import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TRUCK_TYPES, PIT_OWNERS } from '../../data/dummyData';
import {
  Truck, Camera, Upload, X, CheckCircle, AlertCircle,
  Loader2, Image as ImageIcon, Hash, User as UserIcon,
  MapPin, Pickaxe,
} from 'lucide-react';
import './InputRetasePage.css';

export default function InputRetasePage() {
  const { user } = useAuth();
  const isChecker = user?.role === 'checker';
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
    // Clear error for this field
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
    
    if (isChecker || isAdmin) {
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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitResult({
      success: true,
      id: `RET-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      message: 'Data retase berhasil dicatat!',
    });

    // Reset form
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

    // Auto dismiss after 4s
    setTimeout(() => setSubmitResult(null), 4000);
  };

  const getRoleTitle = () => {
    if (isChecker) return 'Input Retase Checker';
    if (isAdmin) return 'Input Retase Admin';
    return 'Input Retase Staff Pos';
  };

  const getRoleDescription = () => {
    if (isChecker) return 'Catat data retase termasuk informasi pit dan excavator di lokasi.';
    if (isAdmin) return 'Catat data retase lengkap dengan semua informasi yang diperlukan.';
    return 'Catat data truk yang melewati pos checkpoint.';
  };

  return (
    <div className="input-retase-page" id="input-retase-page">
      {/* Success toast */}
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

      {/* Page Header */}
      <div className="input-page-header">
        <div className="input-header-info">
          <h2>{getRoleTitle()}</h2>
          <p>{getRoleDescription()}</p>
        </div>
        <div className="input-header-badge">
          <div className={`role-indicator ${user?.role}`}>
            {isChecker ? <Pickaxe size={18} /> : <Truck size={18} />}
            <span>{isChecker ? 'Mode Checker' : isAdmin ? 'Mode Admin' : 'Mode Staff Pos'}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form className="input-form" onSubmit={handleSubmit} id="retase-form">
        <div className="form-sections">
          {/* Truck Information */}
          <div className="form-section">
            <div className="section-label">
              <Truck size={18} />
              <span>Informasi Truk</span>
            </div>

            <div className="form-grid">
              {/* Truck Number */}
              <div className={`field-group ${errors.truckNumber ? 'error' : ''}`}>
                <label htmlFor="truck-number">
                  No. Polisi Truk <span className="required">*</span>
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

              {/* Truck Type */}
              <div className={`field-group ${errors.truckType ? 'error' : ''}`}>
                <label htmlFor="truck-type">
                  Jenis Truk <span className="required">*</span>
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

          {/* Checker / Admin specific fields */}
          {(isChecker || isAdmin) && (
            <div className="form-section checker-section">
              <div className="section-label">
                <Pickaxe size={18} />
                <span>Informasi Pit & Excavator</span>
              </div>

              <div className="form-grid">
                {/* Pit Owner */}
                <div className={`field-group ${errors.pitOwner ? 'error' : ''}`}>
                  <label htmlFor="pit-owner">
                    Pemilik Pit <span className="required">*</span>
                  </label>
                  <div className="field-input-wrap">
                    <MapPin size={18} className="field-icon" />
                    <select
                      id="pit-owner"
                      value={formData.pitOwner}
                      onChange={(e) => handleChange('pitOwner', e.target.value)}
                      className="field-input field-select"
                    >
                      <option value="">Pilih pemilik pit...</option>
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

                {/* Excavator ID */}
                <div className={`field-group ${errors.excaId ? 'error' : ''}`}>
                  <label htmlFor="exca-id">
                    No. Identitas Excavator <span className="required">*</span>
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

                {/* Operator Name */}
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

          {/* Photo Section */}
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

        {/* Submit */}
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
                Simpan Retase
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
