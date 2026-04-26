import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import {
  LayoutDashboard,
  ClipboardPlus,
  History,
  CheckCircle2,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  User,
  ShieldCheck,
  Truck,
  HardHat,
  Users,
} from 'lucide-react';
import './DashboardLayout.css';
import logo from '../../assets/logo.png';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clockTime, setClockTime] = useState('');
  const clockIntervalRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setClockTime(time);
    };
    updateClock();
    clockIntervalRef.current = setInterval(updateClock, 1000);
    return () => clearInterval(clockIntervalRef.current);
  }, []);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    closeSidebar();
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'staff_pos':
        return 'Staff Pos';
      case 'checker':
        return 'Checker';
      default:
        return role;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'role-admin';
      case 'staff_pos':
        return 'role-staff';
      case 'checker':
        return 'role-checker';
      default:
        return '';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck size={12} />;
      case 'staff_pos':
        return <Truck size={12} />;
      case 'checker':
        return <HardHat size={12} />;
      default:
        return null;
    }
  };

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
        { to: '/admin/input', icon: <ClipboardPlus size={20} />, label: 'Input Retase' },
        {
          to: '/admin/verifikasi',
          icon: <CheckCircle2 size={20} />,
          label: 'Verifikasi Keluar',
        },
        { to: '/admin/riwayat', icon: <History size={20} />, label: 'Riwayat Retase' },
        { to: '/admin/rekap', icon: <History size={20} />, label: 'Rekap Retase' },
        { to: '/admin/pengguna', icon: <Users size={20} />, label: 'Kelola Pengguna' },
      ];
    }

    if (user?.role === 'checker') {
      return [
        { to: '/checker', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
        { to: '/checker/input', icon: <ClipboardPlus size={20} />, label: 'Input Retase' },
        { to: '/checker/riwayat', icon: <History size={20} />, label: 'Riwayat Retase' },
        { to: '/checker/rekap', icon: <History size={20} />, label: 'Rekap Retase' },
      ];
    }

    return [
      { to: '/staff', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
      { to: '/staff/verifikasi', icon: <CheckCircle2 size={20} />, label: 'Verifikasi Keluar' },
      { to: '/staff/riwayat', icon: <History size={20} />, label: 'Riwayat Retase' },
      { to: '/staff/rekap', icon: <History size={20} />, label: 'Rekap Retase' },
    ];
  };

  const navItems = getNavItems();

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.includes('/pengguna')) {
      return 'Kelola Pengguna';
    }

    if (path.includes('/input')) {
      return 'Input Data Retase';
    }

    if (path.includes('/verifikasi')) {
      return 'Verifikasi Gate';
    }

    if (path.includes('/riwayat')) {
      return 'Data Log Retase';
    }

    if (path.includes('/rekap')) {
      return 'Rekap Retase';
    }

    return 'Dashboard Operasional';
  };

  const getPageDescription = () => {
    const path = location.pathname;

    if (path.includes('/pengguna')) {
      return 'Tambah, lihat, dan kelola akun pengguna sistem retase tambang.';
    }

    if (path.includes('/input')) {
      return 'Form utama diselaraskan dengan workbook Excel agar log dan rekap memakai struktur yang sama.';
    }

    if (path.includes('/verifikasi')) {
      return 'Periksa data workbook lalu isi checker gate dengan menyetujui atau menolak antrean.';
    }

    if (path.includes('/riwayat')) {
      return 'Lihat log real-time dengan kolom yang mengikuti sheet Excel.';
    }

    if (path.includes('/rekap')) {
      return 'Pantau rekap harian Fuso, Dyna, harga, dan cumulative harga dari data verified.';
    }

    return 'Pantau ringkasan aktivitas retase harian dari satu tampilan yang mudah dibaca.';
  };

  const homePath =
    user?.role === 'admin' ? '/admin' : user?.role === 'checker' ? '/checker' : '/staff';
  const todayLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      id="dashboard-layout"
    >
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <NavLink to={homePath} className="sidebar-brand" onClick={closeSidebar}>
            <div className="sidebar-brand-icon">
              <img src={logo} alt="Logo" className="sidebar-logo-img" />
            </div>
            {!sidebarCollapsed && (
              <span className="sidebar-brand-text">
                <span className="brand-line">
                  <span className="brand-si">SI</span>
                  <span className="brand-tag">TAG</span>
                </span>
                <span className="sidebar-brand-meta">Retase tambang digital</span>
              </span>
            )}
          </NavLink>

          <button
            className="sidebar-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Perbesar atau perkecil menu"
          >
            <ChevronLeft
              size={18}
              style={{
                transform: sidebarCollapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.3s ease',
              }}
            />
          </button>

          <button
            className="sidebar-close-btn mobile-only"
            onClick={closeSidebar}
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!sidebarCollapsed && <span className="nav-section-label">Navigasi Utama</span>}
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={closeSidebar}
              >
                <span className="nav-icon">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="nav-copy">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-hint">Buka halaman</span>
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className={`sidebar-user ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="user-avatar">
              <User size={18} />
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className={`user-role ${getRoleBadgeClass(user?.role)}`}>
                  {getRoleIcon(user?.role)}
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout} title="Keluar" id="logout-btn">
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header" id="top-header">
          <div className="header-left">
            <button
              className="menu-toggle mobile-only"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
              id="menu-toggle-btn"
            >
              <Menu size={22} />
            </button>
            <div className="header-title-group">
              <span className="page-kicker">{getRoleLabel(user?.role)}</span>
              <h1 className="header-title">{getPageTitle()}</h1>
              <p className="header-subtitle">{getPageDescription()}</p>
            </div>
          </div>

          <div className="header-right">
            <ThemeToggle />
            
            <div className="header-clock desktop-only">
              <span className="header-clock-time">{clockTime}</span>
              <span className="header-clock-label">Waktu</span>
            </div>

            <div className="header-meta-card">
              <span className="header-meta-label">Tanggal</span>
              <span className="header-date">{todayLabel}</span>
            </div>

            <div className="header-user-pill">
              <div className="header-avatar">
                <User size={16} />
              </div>
              <div className="header-user-copy">
                <span className="header-username">{user?.name}</span>
                <span className={`header-role-badge ${getRoleBadgeClass(user?.role)}`}>
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
