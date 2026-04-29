import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Truck,
  HardHat,
  Search,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import usePersistentState from '../../hooks/usePersistentState';
import { userAPI } from '../../services/api';
import './KelolaPenggunaPage.css';

function formatRegisteredDate(value) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return parsedDate.toLocaleDateString('id-ID');
}

function formatRegisteredTime(value) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return parsedDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function KelolaPenggunaPage() {
  const initialFormDraft = useMemo(
    () => ({
      username: '',
      name: '',
      email: '',
      role: 'staff_pos',
      pitArea: '',
    }),
    []
  );
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = usePersistentState(
    'sitag:v1:kelola-pengguna:search',
    ''
  );
  const [formDraft, setFormDraft] = usePersistentState(
    'sitag:v1:kelola-pengguna:draft',
    initialFormDraft
  );
  const [password, setPassword] = useState('');
  const [successToast, setSuccessToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    const result = await userAPI.getAll();
    if (result.success) {
      setUsers(result.data);
      setError(null);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    const loadUsersOnMount = async () => {
      const result = await userAPI.getAll();

      if (!isMounted) {
        return;
      }

      if (result.success) {
        setUsers(result.data);
        setError(null);
      } else {
        setError(result.message);
      }

      setLoading(false);
    };

    loadUsersOnMount();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === 'password') {
      setPassword(value);
      return;
    }

    setFormDraft((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'role' && value !== 'checker' ? { pitArea: '' } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formDraft,
      password,
    };

    const result = await userAPI.create(payload);
    if (result.success) {
      setSuccessToast(`Pengguna "${formDraft.name}" berhasil dibuat`);
      setShowModal(false);
      setPassword('');
      setFormDraft((previous) => ({
        ...initialFormDraft,
        role: previous.role,
        pitArea: previous.role === 'checker' ? previous.pitArea : '',
      }));
      fetchUsers();

      setTimeout(() => setSuccessToast(null), 3000);
    } else {
      setError(result.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Hapus pengguna "${name}"?`)) {
      const result = await userAPI.remove(id);
      if (result.success) {
        setSuccessToast(`Pengguna "${name}" berhasil dihapus`);
        fetchUsers();
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        alert(result.message);
      }
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck size={14} />;
      case 'staff_pos':
        return <Truck size={14} />;
      case 'checker':
        return <HardHat size={14} />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'staff_pos':
        return 'Staff Pos';
      case 'checker':
        return 'Checker';
      default:
        return role;
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    [user.name, user.username, user.email, user.role === 'checker' ? user.pitArea : '']
      .some((value) => String(value || '').toLowerCase().includes(normalizedSearchQuery))
  );

  return (
    <div className="manage-users-page">
      {successToast && (
        <div className="success-toast">
          <CheckCircle2 className="toast-icon" />
          <div className="toast-content">
            <span className="toast-title">Berhasil</span>
            <span className="toast-message">{successToast}</span>
          </div>
        </div>
      )}

      <div className="manage-header">
        <div className="header-info">
          <h2>Kelola Pengguna</h2>
          <p>Daftar seluruh akun yang memiliki akses ke sistem SITAG.</p>
        </div>
        <button className="btn-add-user" onClick={() => setShowModal(true)}>
          <UserPlus size={20} />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="manage-toolbar">
        <div className="search-bar">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Cari nama, username, atau email..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="user-count-badge">
          <strong>{filteredUsers.length}</strong>
          <span>Pengguna</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spin" size={40} />
          <p>Memuat data pengguna...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={40} />
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchUsers}>Coba Lagi</button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state-panel">
          <Users size={48} />
          <h3>Tidak ada pengguna ditemukan</h3>
          <p>Coba ubah kata kunci pencarian atau tambahkan akun baru.</p>
        </div>
      ) : (
        <div className="users-table-wrap data-table-wrap">
          <table className="users-table data-table">
            <thead>
              <tr>
                <th>Nama & Username</th>
                <th className="table-head-center">Role</th>
                <th>Email</th>
                <th>Area Kerja</th>
                <th>Terdaftar Pada</th>
                <th className="table-head-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((userItem) => (
                <tr key={userItem.id}>
                  <td data-label="Nama & Username">
                    <div className="user-cell-info">
                      <strong>{userItem.name}</strong>
                      <span>@{userItem.username}</span>
                    </div>
                  </td>
                  <td data-label="Role" className="table-cell-center">
                    <span className={`role-badge ${userItem.role}`}>
                      {getRoleIcon(userItem.role)}
                      {getRoleLabel(userItem.role)}
                    </span>
                  </td>
                  <td data-label="Email">{userItem.email || '-'}</td>
                  <td data-label="Area Kerja">
                    {userItem.role === 'checker' ? (
                      <div className="area-info">
                        <span className="area-label">Pit:</span>
                        <span className="area-value">{userItem.pitArea || '-'}</span>
                      </div>
                    ) : (
                      <span className="text-muted">Semua Area</span>
                      )}
                  </td>
                  <td data-label="Terdaftar Pada">
                    <div className="date-info">
                      <span>{formatRegisteredDate(userItem.createdAt)}</span>
                      <small>{formatRegisteredTime(userItem.createdAt)}</small>
                    </div>
                  </td>
                  <td data-label="Aksi" className="table-cell-center">
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDelete(userItem.id, userItem.name)}
                      disabled={userItem.username === 'admin'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tambah Pengguna Baru</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formDraft.name}
                    onChange={handleInputChange}
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formDraft.email}
                    onChange={handleInputChange}
                    placeholder="budi@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formDraft.username}
                    onChange={handleInputChange}
                    placeholder="budisantoso123"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={password}
                    onChange={handleInputChange}
                    placeholder="Password pengguna"
                  />
                </div>
                <div className="form-group">
                  <label>Role / Jabatan</label>
                  <select name="role" value={formDraft.role} onChange={handleInputChange}>
                    <option value="admin">Administrator</option>
                    <option value="staff_pos">Staff Pos (Timbangan)</option>
                    <option value="checker">Checker (Pit Area)</option>
                  </select>
                </div>

                {formDraft.role === 'checker' && (
                  <div className="form-group">
                    <label>Nama Pit / Area</label>
                    <input
                      type="text"
                      name="pitArea"
                      value={formDraft.pitArea}
                      onChange={handleInputChange}
                      placeholder="Contoh: Pit 1"
                    />
                  </div>
                )}
              </div>

              <div className="form-draft-note">
                Draft form tersimpan selama sesi browser. Password hanya disimpan sementara di tab aktif.
              </div>

              {error && (
                <div className="form-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? <Loader2 className="spin" size={18} /> : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
