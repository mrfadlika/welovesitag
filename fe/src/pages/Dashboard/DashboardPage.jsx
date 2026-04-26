import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { truckAPI, checkoutAPI } from '../../services/api';
import {
  Truck, Activity, CheckCircle2, Clock, Hash, Pickaxe,
  TrendingUp, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRetaseToday: 0,
    totalRetaseWeek: 0,
    verifiedCount: 0,
    pendingCount: 0,
    uniqueTrucks: 0,
    dynaCount: 0,
    fusoCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const truckResult = await truckAPI.getAll();
        const checkoutResult = await checkoutAPI.getAll();

        if (truckResult.success && checkoutResult.success) {
          const trucks = truckResult.data || [];
          const checkouts = checkoutResult.data || [];

          // Calculate stats
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const todayCheckouts = checkouts.filter(c => {
            const cDate = new Date(c.createdAt || c.createdAt);
            return cDate >= today;
          });

          const verifiedCount = checkouts.filter(c => c.status === 'verified').length;
          const pendingCount = checkouts.filter(c => c.status !== 'verified').length;

          const dynaCount = trucks.filter(t => t.truckType === 'dyna').length;
          const fusoCount = trucks.filter(t => t.truckType === 'fuso').length;

          setStats({
            totalRetaseToday: todayCheckouts.length,
            totalRetaseWeek: trucks.length,
            verifiedCount,
            pendingCount,
            uniqueTrucks: new Set(trucks.map(t => t.truckNumber)).size,
            dynaCount,
            fusoCount,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getStatCards = () => {
    const baseCards = [
      {
        id: 'total-today',
        label: user?.role === 'checker' ? 'Checkout Hari Ini' : 'Registrasi Hari Ini',
        value: stats.totalRetaseToday,
        icon: <Activity size={22} />,
        trend: '+12%',
        trendUp: true,
        gradient: 'card-blue',
      },
      {
        id: 'total-week',
        label: user?.role === 'checker' ? 'Checkout Minggu Ini' : 'Registrasi Minggu Ini',
        value: stats.totalRetaseWeek,
        icon: <TrendingUp size={22} />,
        trend: '+8%',
        trendUp: true,
        gradient: 'card-purple',
      },
    ];

    if (user?.role === 'checker') {
      // Checker specific cards
      return [
        ...baseCards,
        {
          id: 'verified',
          label: 'Sudah Checkout',
          value: stats.verifiedCount,
          icon: <CheckCircle2 size={22} />,
          trend: `${Math.round(stats.verifiedCount / stats.totalRetaseWeek * 100)}%`,
          trendUp: true,
          gradient: 'card-green',
        },
        {
          id: 'pending',
          label: 'Menunggu',
          value: stats.pendingCount,
          icon: <Clock size={22} />,
          trend: `${Math.round(stats.pendingCount / stats.totalRetaseWeek * 100)}%`,
          trendUp: false,
          gradient: 'card-orange',
        },
      ];
    } else if (user?.role === 'staff_pos') {
      // Staff POS specific cards
      return [
        ...baseCards,
        {
          id: 'verified',
          label: 'Terverifikasi Keluar',
          value: stats.verifiedCount,
          icon: <CheckCircle2 size={22} />,
          trend: `${Math.round(stats.verifiedCount / stats.totalRetaseWeek * 100)}%`,
          trendUp: true,
          gradient: 'card-green',
        },
        {
          id: 'pending',
          label: 'Menunggu Verifikasi',
          value: stats.pendingCount,
          icon: <Clock size={22} />,
          trend: `${Math.round(stats.pendingCount / stats.totalRetaseWeek * 100)}%`,
          trendUp: false,
          gradient: 'card-orange',
        },
      ];
    } else {
      // Admin - All cards
      return [
        ...baseCards,
        {
          id: 'verified',
          label: 'Terverifikasi',
          value: stats.verifiedCount,
          icon: <CheckCircle2 size={22} />,
          trend: '95%',
          trendUp: true,
          gradient: 'card-green',
        },
        {
          id: 'pending',
          label: 'Pending',
          value: stats.pendingCount,
          icon: <Clock size={22} />,
          trend: '5%',
          trendUp: false,
          gradient: 'card-orange',
        },
        {
          id: 'trucks',
          label: 'Total Truk Unik',
          value: stats.uniqueTrucks,
          icon: <Truck size={22} />,
          trend: null,
          gradient: 'card-cyan',
        },
        {
          id: 'truck-types',
          label: 'Dyna / Fuso',
          value: `${stats.dynaCount} / ${stats.fusoCount}`,
          icon: <Hash size={22} />,
          trend: null,
          gradient: 'card-pink',
        },
      ];
    }
  };

  const statCards = getStatCards();

  const getWelcomeMessage = () => {
    if (user?.role === 'checker') {
      return 'Monitor checkout truck dan excavator dari pit di dashboard ini.';
    } else if (user?.role === 'staff_pos') {
      return 'Monitor registrasi truck masuk dan status verifikasi di checkpoint.';
    }
    return 'Pantau semua aktivitas retase tambang secara real-time dari dashboard ini.';
  };

  return (
    <div className="dashboard-page" id="dashboard-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <span className="welcome-greeting">Selamat Datang,</span>
          <h2 className="welcome-name">{user?.name} 👋</h2>
          <p className="welcome-desc">
            {getWelcomeMessage()}
          </p>
        </div>
        <div className="welcome-decoration">
          <div className="welcome-orb orb-a" />
          <div className="welcome-orb orb-b" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div
            className={`stat-card ${card.gradient}`}
            key={card.id}
            id={`stat-${card.id}`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="stat-header">
              <div className="stat-icon-wrap">
                {card.icon}
              </div>
              {card.trend && (
                <span className={`stat-trend ${card.trendUp ? 'up' : 'down'}`}>
                  {card.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {card.trend}
                </span>
              )}
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-glow" />
          </div>
        ))}
      </div>

      {/* Quick Ratio */}
      <div className="ratio-section">
        <h3 className="section-title">Rasio Jenis Truk</h3>
        <div className="ratio-bar-container">
          <div className="ratio-bar">
            <div 
              className="ratio-fill dyna-fill" 
              style={{ width: `${(stats.dynaCount / stats.totalRetaseWeek * 100).toFixed(1)}%` }}
            >
              <span>Dyna</span>
            </div>
            <div 
              className="ratio-fill fuso-fill"
              style={{ width: `${(stats.fusoCount / stats.totalRetaseWeek * 100).toFixed(1)}%` }}
            >
              <span>Fuso</span>
            </div>
          </div>
          <div className="ratio-legend">
            <div className="legend-item">
              <span className="legend-dot dyna-dot" />
              <span>Dyna: {stats.dynaCount} ({(stats.dynaCount / stats.totalRetaseWeek * 100).toFixed(0)}%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot fuso-dot" />
              <span>Fuso: {stats.fusoCount} ({(stats.fusoCount / stats.totalRetaseWeek * 100).toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
