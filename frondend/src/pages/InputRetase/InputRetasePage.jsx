import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { truckAPI, checkoutAPI } from '../../services/api';
import { TRUCK_TYPES, PIT_OWNERS } from '../../data/dummyData';
import {
  Truck,
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Hash,
  User as UserIcon,
  MapPin,
  Pickaxe,
} from 'lucide-react';
import './InputRetasePage.css';

const EMPTY_FORM = {
  truckNumber: '',
  truckType: '',
  pitOwner: '',
  excaId: '',
  excaOperator: '',
  photo: null,
};

const MAX_RECENT_TRUCKS = 6;

function hasDraftValue(data) {
  return Object.values(data).some((value) =>
    typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
  );
}

function readStoredJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in browsers with blocked localStorage.
  }
}

export default function InputRetasePage({ mode = null }) {
  const { user } = useAuth();
  const effectiveRole = mode || user?.role;
  const isStaff = effectiveRole === 'staff_pos' || mode === 'staff';
  const isChecker = effectiveRole === 'checker' || mode === 'checker';
  const isAdmin = user?.role === 'admin';
  const shouldShowTruckType = isStaff;
  const storageRoleKey = isChecker ? 'checker' : isStaff ? 'staff' : user?.role || 'general';
  const draftStorageKey = `sitag:draft:${storageRoleKey}`;
  const recentStorageKey = `sitag:recent-trucks:${storageRoleKey}`;
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [draftRecovered, setDraftRecovered] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);

  useEffect(() => {
    const savedDraft = readStoredJson(draftStorageKey, null);
    const savedRecent = readStoredJson(recentStorageKey, []);

    if (savedDraft && hasDraftValue(savedDraft)) {
      setFormData((previous) => ({
        ...previous,
        ...savedDraft,
        photo: null,
      }));
      setDraftRecovered(true);
    }

    setRecentEntries(Array.isArray(savedRecent) ? savedRecent : []);
  }, [draftStorageKey, recentStorageKey]);

  useEffect(() => {
    const { photo, ...draftData } = formData;

    if (hasDraftValue(draftData)) {
      writeStoredJson(draftStorageKey, draftData);
      return;
    }

    try {
      window.localStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore storage failures.
    }
  }, [draftStorageKey, formData]);

  const resetForm = ({ clearDraft = true } = {}) => {
    setFormData(EMPTY_FORM);
    setPhotoPreview(null);
    setErrors({});

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }

    if (clearDraft) {
      try {
        window.localStorage.removeItem(draftStorageKey);
      } catch {
        // Ignore storage failures.
      }

      setDraftRecovered(false);
    }
  };

  const rememberRecentTruck = (currentFormData) => {
    const nextEntry = {
      truckNumber: currentFormData.truckNumber.trim(),
      truckType: currentFormData.truckType || '',
      updatedAt: new Date().toISOString(),
    };

    if (!nextEntry.truckNumber) {
      return;
    }

    const nextRecent = [
      nextEntry,
      ...recentEntries.filter((entry) => entry.truckNumber !== nextEntry.truckNumber),
    ].slice(0, MAX_RECENT_TRUCKS);

    setRecentEntries(nextRecent);
    writeStoredJson(recentStorageKey, nextRecent);
  };

  const handleChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));

    if (errors[field]) {
      setErrors((previous) => {
        const nextErrors = { ...previous };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const applyRecentEntry = (entry) => {
    setFormData((previous) => ({
      ...previous,
      truckNumber: entry.truckNumber,
      truckType: shouldShowTruckType ? entry.truckType || previous.truckType : previous.truckType,
    }));

    setErrors((previous) => {
      const nextErrors = { ...previous };
      delete nextErrors.truckNumber;
      delete nextErrors.truckType;
      return nextErrors;
    });
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((previous) => ({
        ...previous,
        photo: 'Ukuran foto maksimal 5MB',
      }));
      return;
    }

    setFormData((previous) => ({ ...previous, photo: file }));

    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);

    setErrors((previous) => {
      const nextErrors = { ...previous };
      delete nextErrors.photo;
      return nextErrors;
    });
  };

  const removePhoto = () => {
    setFormData((previous) => ({ ...previous, photo: null }));
    setPhotoPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.truckNumber.trim()) {
      nextErrors.truckNumber = 'No. polisi wajib diisi';
    }

    if (shouldShowTruckType && !formData.truckType) {
      nextErrors.truckType = 'Pilih jenis truk';
    }

    if (isChecker) {
      if (!formData.pitOwner) {
        nextErrors.pitOwner = 'Pilih pemilik pit';
      }

      if (!formData.excaId.trim()) {
        nextErrors.excaId = 'No. identitas excavator wajib diisi';
      }

      if (!formData.excaOperator.trim()) {
        nextErrors.excaOperator = 'Nama operator wajib diisi';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    const actorName = user?.name || user?.username || 'Unknown';
    const currentFormData = { ...formData };

    try {
      const result = isChecker
        ? await checkoutAPI.create({
            truckNumber: currentFormData.truckNumber,
            pitOwner: currentFormData.pitOwner,
            excaId: currentFormData.excaId,
            excaOperator: currentFormData.excaOperator,
            createdBy: actorName,
            createdByRole: user?.role === 'admin' ? 'Admin' : 'Checker',
            photo: photoPreview,
          })
        : await truckAPI.create({
            truckNumber: currentFormData.truckNumber,
            truckType: currentFormData.truckType,
            registeredBy: actorName,
            registeredByRole: user?.role === 'admin' ? 'Admin' : 'Staff Pos',
            photo: photoPreview,
          });

      if (result.success) {
        rememberRecentTruck(currentFormData);
        setSubmitResult({
          success: true,
          id:
            result.data?.id ||
            `RET-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
          message: isChecker
            ? 'Data checkout berhasil dicatat.'
            : 'Data registrasi masuk berhasil dicatat.',
        });
        resetForm();
      } else {
        setSubmitResult({
          success: false,
          message: result.message || 'Gagal menyimpan data',
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: `Terjadi kesalahan: ${error.message || 'Network error'}`,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitResult(null), 4000);
    }
  };

  const getRoleTitle = () => {
    if (isChecker && isAdmin) return 'Input Retase Mode Checker';
    if (isStaff && isAdmin) return 'Input Retase Mode Staff POS';
    if (isChecker) return 'Input Checkout Truck';
    if (isAdmin) return 'Input Retase Admin';
    return 'Registrasi Truck Masuk';
  };

  const getRoleDescription = () => {
    if (isChecker && isAdmin) {
      return 'Mode checkout untuk admin. Masukkan data pit, excavator, dan operator sebelum truck keluar dari area tambang.';
    }

    if (isStaff && isAdmin) {
      return 'Mode registrasi untuk admin. Gunakan saat membantu staff pos mencatat truck yang baru masuk.';
    }

    if (isChecker) {
      return 'Isi data checkout dengan urutan sederhana: nomor polisi, pit owner, excavator, lalu operator.';
    }

    if (isAdmin) {
      return 'Gunakan form ini untuk membantu pencatatan retase lintas peran dari dashboard admin.';
    }

    return 'Catat truck masuk dengan huruf besar yang jelas agar mudah dicari di riwayat dan verifikasi.';
  };

  const getModeIndicator = () => {
    if (isAdmin && mode === 'checker') {
      return { label: 'Mode Checkout', icon: <Pickaxe size={18} /> };
    }

    if (isAdmin && mode === 'staff') {
      return { label: 'Mode Registrasi', icon: <Truck size={18} /> };
    }

    if (isChecker) {
      return { label: 'Checker', icon: <Pickaxe size={18} /> };
    }

    if (isAdmin) {
      return { label: 'Admin Panel', icon: <Truck size={18} /> };
    }

    return { label: 'Staff POS', icon: <Truck size={18} /> };
  };

  const requiredItems = useMemo(() => {
    const items = [
      {
        label: 'No. polisi',
        value: formData.truckNumber || '-',
        done: Boolean(formData.truckNumber.trim()),
      },
    ];

    if (shouldShowTruckType) {
      const truckTypeLabel =
        TRUCK_TYPES.find((type) => type.value === formData.truckType)?.label || '-';
      items.push({
        label: 'Jenis truck',
        value: truckTypeLabel,
        done: Boolean(formData.truckType),
      });
    }

    if (isChecker) {
      items.push(
        {
          label: 'Pit owner',
          value: PIT_OWNERS.find((owner) => owner.value === formData.pitOwner)?.label || '-',
          done: Boolean(formData.pitOwner),
        },
        {
          label: 'No. excavator',
          value: formData.excaId || '-',
          done: Boolean(formData.excaId.trim()),
        },
        {
          label: 'Operator excavator',
          value: formData.excaOperator || '-',
          done: Boolean(formData.excaOperator.trim()),
        }
      );
    }

    items.push({
      label: 'Foto',
      value: photoPreview ? 'Sudah ditambahkan' : 'Belum ada foto',
      done: Boolean(photoPreview),
      optional: true,
    });

    return items;
  }, [
    formData.excaId,
    formData.excaOperator,
    formData.pitOwner,
    formData.truckNumber,
    formData.truckType,
    isChecker,
    photoPreview,
    shouldShowTruckType,
  ]);

  const requiredOnly = requiredItems.filter((item) => !item.optional);
  const completedRequiredCount = requiredOnly.filter((item) => item.done).length;
  const completionPercent = requiredOnly.length
    ? Math.round((completedRequiredCount / requiredOnly.length) * 100)
    : 0;

  const helperSteps = isChecker
    ? [
        {
          title: 'Isi truck lebih dulu',
          detail: 'Nomor polisi yang rapi memudahkan pencarian saat verifikasi.',
        },
        {
          title: 'Pastikan pit dan excavator cocok',
          detail: 'Data checker akan dipakai staff pos untuk memutuskan truck boleh keluar.',
        },
        {
          title: 'Tambahkan foto bila kondisi lapangan perlu bukti',
          detail: 'Foto tidak wajib, tetapi membantu saat ada pemeriksaan ulang.',
        },
      ]
    : [
        {
          title: 'Isi nomor polisi dengan huruf besar',
          detail: 'Format seragam membuat pencarian di riwayat jauh lebih cepat.',
        },
        {
          title: 'Pilih tipe truck sebelum simpan',
          detail: 'Jenis truck dipakai untuk ringkasan armada pada dashboard.',
        },
        {
          title: 'Gunakan saran nomor polisi terakhir',
          detail: 'Cocok untuk armada yang bolak-balik melewati pos masuk.',
        },
      ];

  const buttonText = isChecker ? 'Simpan Checkout' : 'Simpan Registrasi';

  return (
    <div className="input-retase-page" id="input-retase-page">
      {submitResult?.success && (
        <div className="success-toast" role="alert">
          <div className="toast-icon">
            <CheckCircle size={22} />
          </div>
          <div className="toast-content">
            <span className="toast-title">Berhasil disimpan</span>
            <span className="toast-message">{submitResult.message}</span>
            <span className="toast-id">ID: {submitResult.id}</span>
          </div>
        </div>
      )}

      <div className="input-page-header">
        <div className="input-header-info">
          <span className="section-kicker">Form Operasional</span>
          <h2>{getRoleTitle()}</h2>
          <p>{getRoleDescription()}</p>
        </div>
        <div className={`role-indicator ${isChecker ? 'checker' : 'staff'}`}>
          {getModeIndicator().icon}
          <span>{getModeIndicator().label}</span>
        </div>
      </div>

      {draftRecovered && (
        <div className="draft-banner surface-card" role="status">
          <div>
            <strong>Draft terakhir dipulihkan.</strong>
            <span>Lanjutkan pengisian atau kosongkan form bila ingin mulai dari awal.</span>
          </div>
          <button type="button" className="draft-clear-btn" onClick={() => resetForm()}>
            Kosongkan
          </button>
        </div>
      )}

      <div className="input-layout">
        <form className="input-form" onSubmit={handleSubmit} id="retase-form">
          <div className="form-sections">
            <div className="form-section">
              <div className="section-label">
                <Truck size={18} />
                <div>
                  <span>{isChecker ? 'Informasi Truck Checkout' : 'Informasi Truck Masuk'}</span>
                  <small>Mulai dari nomor polisi agar pencarian data tetap konsisten.</small>
                </div>
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
                      onChange={(event) =>
                        handleChange('truckNumber', event.target.value.toUpperCase())
                      }
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

                {shouldShowTruckType && (
                  <div className={`field-group ${errors.truckType ? 'error' : ''}`}>
                    <label htmlFor="truck-type">
                      Jenis Truck <span className="required">*</span>
                    </label>
                    <div className="truck-type-selector">
                      {TRUCK_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          className={`type-option ${
                            formData.truckType === type.value ? 'selected' : ''
                          }`}
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
                )}
              </div>
            </div>

            {isChecker && (
              <div className="form-section checker-section">
                <div className="section-label">
                  <Pickaxe size={18} />
                  <div>
                    <span>Informasi Excavator dan Pit</span>
                    <small>Bagian ini wajib jelas karena dipakai saat verifikasi keluar.</small>
                  </div>
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
                        onChange={(event) => handleChange('pitOwner', event.target.value)}
                        className="field-input field-select"
                      >
                        <option value="">Pilih pit owner...</option>
                        {PIT_OWNERS.map((owner) => (
                          <option key={owner.value} value={owner.value}>
                            {owner.label}
                          </option>
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
                        onChange={(event) =>
                          handleChange('excaId', event.target.value.toUpperCase())
                        }
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
                        onChange={(event) => handleChange('excaOperator', event.target.value)}
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

            <div className="form-section">
              <div className="section-label">
                <Camera size={18} />
                <div>
                  <span>Foto Dokumentasi</span>
                  <small>Opsional. Tambahkan bila perlu bukti visual kondisi truck.</small>
                </div>
                <span className="optional-badge">Opsional</span>
              </div>

              {!photoPreview ? (
                <div className="photo-upload-area">
                  <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                    <div className="upload-icon-wrap">
                      <ImageIcon size={30} />
                    </div>
                    <p className="upload-text">Klik untuk upload foto</p>
                    <p className="upload-hint">JPG atau PNG, maksimal 5MB</p>
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
                    <img src={photoPreview} alt="Preview dokumentasi" className="preview-image" />
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

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => resetForm()}>
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

        <aside className="input-aside">
          <div className="helper-card surface-card">
            <div className="helper-card-header">
              <span className="section-kicker">Ringkasan</span>
              <h3>Siap disimpan</h3>
            </div>
            <div className="progress-track">
              <div className="progress-value" style={{ width: `${completionPercent}%` }} />
            </div>
            <div className="summary-status">
              <strong>{completionPercent}% lengkap</strong>
              <span>
                {completedRequiredCount} dari {requiredOnly.length} isian wajib sudah terisi
              </span>
            </div>

            <div className="summary-list">
              {requiredItems.map((item) => (
                <div
                  className={`summary-item ${item.done ? 'done' : 'pending'} ${
                    item.optional ? 'optional' : ''
                  }`}
                  key={item.label}
                >
                  <div>
                    <span className="summary-label">{item.label}</span>
                    <strong className="summary-value">{item.value}</strong>
                  </div>
                  <span className="summary-flag">
                    {item.done ? 'Siap' : item.optional ? 'Opsional' : 'Belum'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="helper-card surface-card">
            <div className="helper-card-header">
              <span className="section-kicker">Bantuan Cepat</span>
              <h3>Draft otomatis aktif</h3>
            </div>
            <p className="helper-card-copy">
              Data teks disimpan sementara di perangkat ini sampai form berhasil disimpan atau Anda
              melakukan reset.
            </p>
            <div className={`draft-state ${draftRecovered ? 'recovered' : ''}`}>
              {draftRecovered ? 'Draft lama dipulihkan' : 'Autosave sedang aktif'}
            </div>
          </div>

          {recentEntries.length > 0 && (
            <div className="helper-card surface-card">
              <div className="helper-card-header">
                <span className="section-kicker">Saran Cepat</span>
                <h3>Nomor polisi terakhir</h3>
              </div>
              <div className="recent-list">
                {recentEntries.map((entry) => (
                  <button
                    key={entry.truckNumber}
                    type="button"
                    className="recent-chip"
                    onClick={() => applyRecentEntry(entry)}
                  >
                    <strong>{entry.truckNumber}</strong>
                    {entry.truckType && shouldShowTruckType && (
                      <span>
                        {TRUCK_TYPES.find((type) => type.value === entry.truckType)?.label || '-'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="helper-card surface-card">
            <div className="helper-card-header">
              <span className="section-kicker">Checklist Kerja</span>
              <h3>Urutan yang disarankan</h3>
            </div>
            <div className="helper-list">
              {helperSteps.map((item, index) => (
                <div className="helper-item" key={item.title}>
                  <span className="helper-marker">{index + 1}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
