import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Mountain, LayoutDashboard, ClipboardPlus, History,
  LogOut, Menu, X, ChevronLeft, User, ShieldCheck,
  Truck, HardHat,
} from 'lucide-react';
import './DashboardLayout.css';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'staff_pos': return 'Staff Pos';
      case 'checker': return 'Checker';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'staff_pos': return 'role-staff';
      case 'checker': return 'role-checker';
      default: return '';
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

  const getNavItems = () => {
    const base = '/dashboard';
    const items = [
      { to: base, icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
      { to: `${base}/input`, icon: <ClipboardPlus size={20} />, label: 'Input Retase' },
      { to: `${base}/riwayat`, icon: <History size={20} />, label: 'Riwayat' },
    ];

    if (user?.role === 'admin') {
      items[0].to = '/admin';
      items[1].to = '/admin/input';
      items[2].to = '/admin/riwayat';
    }

    return items;
  };

  const navItems = getNavItems();

  // Get page title from current path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/input')) return 'Input Retase';
    if (path.includes('/riwayat')) return 'Riwayat Retase';
    return 'Dashboard';
  };

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="dashboard-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <NavLink to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Mountain size={22} strokeWidth={2} />
            </div>
            {!sidebarCollapsed && (
              <span className="sidebar-brand-text">
                <span className="brand-si">SI</span>
                <span className="brand-tag">TAG</span>
              </span>
            )}
          </NavLink>
          
          <button 
            className="sidebar-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft size={18} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
          
          <button
            className="sidebar-close-btn mobile-only"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!sidebarCollapsed && <span className="nav-section-label">Menu</span>}
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                {!sidebarCollapsed && (
                  <span className="nav-active-indicator" />
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

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="top-header" id="top-header">
          <div className="header-left">
            <button
              className="menu-toggle mobile-only"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              id="menu-toggle-btn"
            >
              <Menu size={22} />
            </button>
            <div className="header-title-group">
              <h1 className="header-title">{getPageTitle()}</h1>
              <span className="header-date">
                {new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
          <div className="header-right">
            <div className="header-user-pill">
              <div className="header-avatar">
                <User size={16} />
              </div>
              <span className="header-username">{user?.name}</span>
              <span className={`header-role-badge ${getRoleBadgeClass(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
