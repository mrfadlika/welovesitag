import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats, DUMMY_RETASE } from '../../data/dummyData';
import {
  Truck, Activity, CheckCircle2, Clock, Hash,
  TrendingUp, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const stats = useMemo(() => getDashboardStats(), []);

  const statCards = [
    {
      id: 'total-today',
      label: 'Retase Hari Ini',
      value: stats.totalRetaseToday,
      icon: <Activity size={22} />,
      trend: '+12%',
      trendUp: true,
      gradient: 'card-blue',
    },
    {
      id: 'total-week',
      label: 'Retase Minggu Ini',
      value: stats.totalRetaseWeek,
      icon: <TrendingUp size={22} />,
      trend: '+8%',
      trendUp: true,
      gradient: 'card-purple',
    },
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

  const recentData = DUMMY_RETASE.slice(0, 8);

  return (
    <div className="dashboard-page" id="dashboard-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <span className="welcome-greeting">Selamat Datang,</span>
          <h2 className="welcome-name">{user?.name} 👋</h2>
          <p className="welcome-desc">
            Pantau semua aktivitas retase tambang secara real-time dari dashboard ini.
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

      {/* Recent Activity Table */}
      <div className="activity-section">
        <div className="section-header">
          <h3 className="section-title">Aktivitas Terbaru</h3>
          <span className="section-badge">{recentData.length} entri terakhir</span>
        </div>
        
        <div className="table-container">
          <table className="data-table" id="recent-activity-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>No. Polisi</th>
                <th>Jenis</th>
                <th>Input Oleh</th>
                <th>Waktu</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="cell-id">{item.id}</span>
                  </td>
                  <td>
                    <span className="cell-truck-number">{item.truckNumber}</span>
                  </td>
                  <td>
                    <span className={`type-badge ${item.truckType}`}>
                      {item.truckTypeLabel}
                    </span>
                  </td>
                  <td>
                    <div className="cell-inputby">
                      <span className="inputby-name">{item.inputBy}</span>
                      <span className="inputby-role">{item.inputRole}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-time">
                      <span className="time-date">{item.date}</span>
                      <span className="time-hour">{item.time}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${item.status}`}>
                      {item.status === 'verified' ? (
                        <><CheckCircle2 size={12} /> Verified</>
                      ) : (
                        <><Clock size={12} /> Pending</>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
