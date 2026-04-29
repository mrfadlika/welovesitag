import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { checkoutAPI, settingsAPI } from '../../services/api';
import { DEFAULT_RETASE_RATES } from '../../data/retaseOptions';
import { buildRekapPreview, buildRetaseHistory, formatCurrency } from '../../utils/retase';
import './DashboardPage.css';

function isToday(timestamp) {
  if (!timestamp) {
    return false;
  }

  const now = new Date();
  const date = new Date(timestamp);

  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [rates, setRates] = useState(DEFAULT_RETASE_RATES);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const [recordResult, rateResult] = await Promise.all([
        checkoutAPI.getAll(),
        settingsAPI.getRates(),
      ]);

      if (recordResult.success) {
        setRecords(buildRetaseHistory(recordResult.data || []));
      }

      if (rateResult.success) {
        setRates(rateResult.data || DEFAULT_RETASE_RATES);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const todayRecords = records.filter((record) => isToday(record.timestamp));
    const verified = records.filter((record) => record.status === 'verified');
    const pending = records.filter((record) => record.status === 'ready_for_exit');
    const rejected = records.filter((record) => record.status === 'rejected');
    const uniqueLocations = new Set(records.map((record) => record.locationOwner)).size;
    const dynaCount = verified.filter((record) => record.truckType === 'dyna').length;
    const fusoCount = verified.filter((record) => record.truckType === 'fuso').length;
    const totalIncome = buildRekapPreview(records, rates).reduce(
      (sum, row) => sum + row.totalPrice,
      0
    );

    return {
      totalToday: todayRecords.length,
      verifiedToday: todayRecords.filter((record) => record.status === 'verified').length,
      pendingCount: pending.length,
      verifiedCount: verified.length,
      rejectedCount: rejected.length,
      uniqueLocations,
      dynaCount,
      fusoCount,
      totalIncome,
    };
  }, [rates, records]);

  const rekapPreview = useMemo(
    () => buildRekapPreview(records, rates).slice(-4).reverse(),
    [rates, records]
  );

  const statCards = [
    {
      id: 'today',
      label: 'Retase Hari Ini',
      value: stats.totalToday,
      icon: <Activity size={22} />,
      tone: 'amber',
      hint: `${stats.verifiedToday} verified hari ini`,
      direction: 'up',
    },
    {
      id: 'pending',
      label: 'Menunggu Gate',
      value: stats.pendingCount,
      icon: <Clock size={22} />,
      tone: 'sand',
      hint: 'Perlu keputusan staff pos',
      direction: 'down',
    },
    {
      id: 'verified',
      label: 'Sudah Verified',
      value: stats.verifiedCount,
      icon: <CheckCircle2 size={22} />,
      tone: 'green',
      hint: `${stats.rejectedCount} ditolak`,
      direction: 'up',
    },
    {
      id: 'income',
      label: 'Total Rekap',
      value: formatCurrency(stats.totalIncome),
      icon: <ClipboardList size={22} />,
      tone: 'blue',
      hint: `${stats.fusoCount} Fuso / ${stats.dynaCount} Dyna`,
      direction: 'steady',
    },
  ];

  const focusGuide = [
    {
      title: 'Input checker pit mengikuti workbook',
      detail:
        'Material, lokasi, alat berat, jenis truk, no polisi, dan kontraktor sekarang memakai struktur sheet Excel.',
    },
    {
      title: 'Verifikasi gate menutup satu baris log',
      detail:
        'Saat staff pos menyetujui, checker gate akan terisi otomatis dan baris itu masuk ke rekap.',
    },
    {
      title: 'Harga rekap dikunci sebagai parameter',
      detail: `Fuso dihitung ${formatCurrency(rates.fuso)} dan Dyna ${formatCurrency(rates.dyna)}. Harga ini tidak bisa diubah dari aplikasi.`,
    },
  ];

  const welcomeCopy =
    user?.role === 'staff_pos'
      ? 'Pantau antrean verifikasi gate dan pastikan checker gate menutup retase yang benar.'
      : user?.role === 'checker'
        ? 'Input retase checker pit sekarang mengikuti struktur workbook agar log dan rekap konsisten.'
        : 'Admin dapat memantau input checker pit, verifikasi gate, dan rekap harian dari satu dashboard.';

  return (
    <div className="dashboard-page" id="dashboard-content">
      <section className="dashboard-hero surface-card surface-card--accent">
        <div className="hero-copy">
          <span className="section-kicker">Ringkasan Workbook</span>
          <h2>{user?.name || 'Pengguna'}</h2>
          <p>{welcomeCopy}</p>
          <div className="hero-chips">
            <span className="soft-badge">Retase hari ini: {stats.totalToday}</span>
            <span className="soft-badge alt">Lokasi aktif: {stats.uniqueLocations}</span>
            <span className="soft-badge success">Verified: {stats.verifiedCount}</span>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <span>Antrean gate</span>
            <strong>{stats.pendingCount}</strong>
            <small>Data yang masih menunggu checker gate</small>
          </div>
          <div className="hero-metric">
            <span>Total rekap</span>
            <strong>{formatCurrency(stats.totalIncome)}</strong>
            <small>Akumulasi harga dari data verified</small>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {statCards.map((card) => (
          <article className={`stat-card ${card.tone}`} key={card.id}>
            <div className="stat-header">
              <div className="stat-icon-wrap">{card.icon}</div>
              <div className={`stat-direction ${card.direction}`}>
                {card.direction === 'up' && <ArrowUpRight size={15} />}
                {card.direction === 'down' && <ArrowDownRight size={15} />}
                <span>{card.hint}</span>
              </div>
            </div>
            <strong className="stat-value">{card.value}</strong>
            <span className="stat-label">{card.label}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-panels">
        <article className="surface-card ratio-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">Preview Rekap</span>
              <h3 className="panel-title">Baris rekap terbaru</h3>
            </div>
            <span className="panel-note">Harga mengikuti parameter tetap sistem</span>
          </div>

          {rekapPreview.length > 0 ? (
            <div className="data-table-wrap dashboard-table-wrap">
              <table className="data-table dashboard-table">
                <thead>
                  <tr>
                    <th>Hari</th>
                    <th>Tanggal</th>
                    <th className="table-head-center">Retase Fuso</th>
                    <th className="table-head-center">Retase Dyna</th>
                    <th className="table-head-right">Total Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {rekapPreview.map((row) => (
                    <tr key={`${row.date}-${row.day}`}>
                      <td data-label="Hari">
                        <span className="dashboard-table-day">
                          <MapPin size={14} />
                          {row.day}
                        </span>
                      </td>
                      <td data-label="Tanggal">{row.date}</td>
                      <td data-label="Retase Fuso" className="table-cell-center">{row.fusoCount}</td>
                      <td data-label="Retase Dyna" className="table-cell-center">{row.dynaCount}</td>
                      <td data-label="Total Harga" className="table-primary table-cell-right">{formatCurrency(row.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-panel">
              <ClipboardList size={40} />
              <h3>Belum ada rekap</h3>
              <p>Rekap akan muncul setelah ada data yang diverifikasi gate.</p>
            </div>
          )}
        </article>

        <article className="surface-card guide-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">Fokus Kerja</span>
              <h3 className="panel-title">Panduan operasional</h3>
            </div>
            <span className="panel-note">Diselaraskan dengan workbook</span>
          </div>

          <div className="data-table-wrap dashboard-table-wrap">
            <table className="data-table dashboard-table">
                <thead>
                  <tr>
                    <th className="table-head-center">Tahap</th>
                    <th>Fokus</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                {focusGuide.map((item, index) => (
                  <tr key={item.title}>
                    <td data-label="Tahap" className="table-code table-cell-center">{String(index + 1).padStart(2, '0')}</td>
                    <td data-label="Fokus" className="table-primary">{item.title}</td>
                    <td data-label="Keterangan">{item.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
