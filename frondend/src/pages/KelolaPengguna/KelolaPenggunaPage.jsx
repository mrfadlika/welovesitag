import { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
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

function getUserArea(user) {
  return user.role === 'checker' ? user.pitArea || '-' : 'Semua Area';
}

export default function KelolaPenggunaPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'staff_pos',
    pitArea: ''
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const result = await userAPI.create(formData);
    if (result.success) {
      setSuccessToast(`Pengguna "${formData.name}" berhasil dibuat`);
      setShowModal(false);
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'staff_pos',
        pitArea: ''
      });
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
      case 'admin': return <ShieldCheck size={14} />;
      case 'staff_pos': return <Truck size={14} />;
      case 'checker': return <HardHat size={14} />;
      default: return null;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'staff_pos': return 'Staff Pos';
      case 'checker': return 'Checker';
      default: return role;
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
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
        <>
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nama & Username</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Area Kerja</th>
                  <th>Terdaftar Pada</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell-info">
                        <strong>{u.name}</strong>
                        <span>@{u.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {getRoleIcon(u.role)}
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td>{u.email || '-'}</td>
                    <td>
                      {u.role === 'checker' ? (
                        <div className="area-info">
                          <span className="area-label">Pit:</span>
                          <span className="area-value">{u.pitArea || '-'}</span>
                        </div>
                      ) : (
                        <span className="text-muted">Semua Area</span>
                      )}
                    </td>
                    <td>
                      <div className="date-info">
                        <span>{formatRegisteredDate(u.createdAt)}</span>
                        <small>{formatRegisteredTime(u.createdAt)}</small>
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={u.username === 'admin'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="users-cards">
            {filteredUsers.map((u) => {
              const isProtectedUser = u.username === 'admin';

              return (
                <article className="user-card surface-card" key={u.id}>
                  <div className="user-card-top">
                    <div className="user-cell-info">
                      <strong>{u.name}</strong>
                      <span>@{u.username}</span>
                    </div>
                    <span className={`role-badge ${u.role}`}>
                      {getRoleIcon(u.role)}
                      {getRoleLabel(u.role)}
                    </span>
                  </div>

                  <div className="user-card-grid">
                    <div className="user-card-item">
                      <span>Email</span>
                      <strong>{u.email || '-'}</strong>
                    </div>
                    <div className="user-card-item">
                      <span>Area Kerja</span>
                      <strong>{getUserArea(u)}</strong>
                    </div>
                    <div className="user-card-item">
                      <span>Terdaftar</span>
                      <strong>{formatRegisteredDate(u.createdAt)}</strong>
                      <small>{formatRegisteredTime(u.createdAt)}</small>
                    </div>
                  </div>

                  <div className="user-card-footer">
                    <button 
                      className="btn-delete user-card-delete" 
                      onClick={() => handleDelete(u.id, u.name)}
                      disabled={isProtectedUser}
                      title={isProtectedUser ? 'Akun admin utama tidak dapat dihapus' : 'Hapus pengguna'}
                    >
                      <Trash2 size={18} />
                      <span>{isProtectedUser ? 'Dilindungi' : 'Hapus'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
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
                    value={formData.name} 
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
                    value={formData.email} 
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
                    value={formData.username} 
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
                    value={formData.password} 
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-group">
                  <label>Role / Jabatan</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="admin">Administrator</option>
                    <option value="staff_pos">Staff Pos (Timbangan)</option>
                    <option value="checker">Checker (Pit Area)</option>
                  </select>
                </div>

                {formData.role === 'checker' && (
                  <div className="form-group">
                    <label>Nama Pit / Area</label>
                    <input 
                      type="text" 
                      name="pitArea" 
                      value={formData.pitArea} 
                      onChange={handleInputChange}
                      placeholder="Contoh: Pit 1"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="form-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
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
