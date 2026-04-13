import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { truckAPI, checkoutAPI } from '../../services/api';
import {
  Truck,
  Activity,
  CheckCircle2,
  Clock,
  Hash,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import './DashboardPage.css';

function getDayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function hasDateOnOrAfter(value, threshold) {
  if (!value) {
    return false;
  }

  const parsedDate = new Date(value);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.getTime() >= threshold;
}

function formatPercent(value, total) {
  if (!total) {
    return '0%';
  }

  return `${Math.round((value / total) * 100)}%`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRegisteredToday: 0,
    totalRegistered: 0,
    totalCheckoutsToday: 0,
    totalCheckouts: 0,
    verifiedCount: 0,
    pendingCount: 0,
    uniqueTrucks: 0,
    dynaCount: 0,
    fusoCount: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [truckResult, checkoutResult] = await Promise.all([
          truckAPI.getAll(),
          checkoutAPI.getAll(),
        ]);

        if (!truckResult.success || !checkoutResult.success) {
          return;
        }

        const trucks = truckResult.data || [];
        const checkouts = checkoutResult.data || [];
        const dayStart = getDayStart();

        setStats({
          totalRegisteredToday: trucks.filter((truck) =>
            hasDateOnOrAfter(truck.registeredAt, dayStart)
          ).length,
          totalRegistered: trucks.length,
          totalCheckoutsToday: checkouts.filter((checkout) =>
            hasDateOnOrAfter(checkout.createdAt || checkout.checkedOutAt, dayStart)
          ).length,
          totalCheckouts: checkouts.length,
          verifiedCount: checkouts.filter((checkout) => checkout.status === 'verified').length,
          pendingCount: checkouts.filter(
            (checkout) => checkout.status === 'ready_for_exit'
          ).length,
          uniqueTrucks: new Set(trucks.map((truck) => truck.truckNumber)).size,
          dynaCount: trucks.filter((truck) => truck.truckType === 'dyna').length,
          fusoCount: trucks.filter((truck) => truck.truckType === 'fuso').length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const totalActivityToday =
    user?.role === 'checker' ? stats.totalCheckoutsToday : stats.totalRegisteredToday;
  const totalActivity =
    user?.role === 'checker' ? stats.totalCheckouts : stats.totalRegistered;
  const completionRate =
    stats.totalCheckouts > 0 ? Math.round((stats.verifiedCount / stats.totalCheckouts) * 100) : 0;
  const dynaRatio = formatPercent(stats.dynaCount, stats.totalRegistered);
  const fusoRatio = formatPercent(stats.fusoCount, stats.totalRegistered);

  const statCards = (() => {
    const baseCards = [
      {
        id: 'today',
        label: user?.role === 'checker' ? 'Checkout Hari Ini' : 'Aktivitas Hari Ini',
        value: totalActivityToday,
        icon: <Activity size={22} />,
        tone: 'amber',
        hint: formatPercent(totalActivityToday, totalActivity),
        direction: 'up',
      },
      {
        id: 'total',
        label: user?.role === 'checker' ? 'Total Checkout' : 'Total Registrasi',
        value: totalActivity,
        icon: <TrendingUp size={22} />,
        tone: 'blue',
        hint: 'Total seluruh data',
        direction: 'steady',
      },
    ];

    if (user?.role === 'checker') {
      return [
        ...baseCards,
        {
          id: 'verified',
          label: 'Sudah Diverifikasi',
          value: stats.verifiedCount,
          icon: <CheckCircle2 size={22} />,
          tone: 'green',
          hint: formatPercent(stats.verifiedCount, stats.totalCheckouts),
          direction: 'up',
        },
        {
          id: 'pending',
          label: 'Menunggu Staff Pos',
          value: stats.pendingCount,
          icon: <Clock size={22} />,
          tone: 'sand',
          hint: formatPercent(stats.pendingCount, stats.totalCheckouts),
          direction: 'down',
        },
      ];
    }

    if (user?.role === 'staff_pos') {
      return [
        ...baseCards,
        {
          id: 'verified',
          label: 'Terverifikasi Keluar',
          value: stats.verifiedCount,
          icon: <CheckCircle2 size={22} />,
          tone: 'green',
          hint: formatPercent(stats.verifiedCount, stats.totalCheckouts),
          direction: 'up',
        },
        {
          id: 'pending',
          label: 'Antrian Verifikasi',
          value: stats.pendingCount,
          icon: <Clock size={22} />,
          tone: 'sand',
          hint: formatPercent(stats.pendingCount, stats.totalCheckouts),
          direction: 'down',
        },
      ];
    }

    return [
      ...baseCards,
      {
        id: 'verified',
        label: 'Terverifikasi',
        value: stats.verifiedCount,
        icon: <CheckCircle2 size={22} />,
        tone: 'green',
        hint: formatPercent(stats.verifiedCount, stats.totalCheckouts),
        direction: 'up',
      },
      {
        id: 'pending',
        label: 'Pending Verifikasi',
        value: stats.pendingCount,
        icon: <Clock size={22} />,
        tone: 'sand',
        hint: formatPercent(stats.pendingCount, stats.totalCheckouts),
        direction: 'down',
      },
      {
        id: 'trucks',
        label: 'Truk Unik',
        value: stats.uniqueTrucks,
        icon: <Truck size={22} />,
        tone: 'slate',
        hint: 'Armada berbeda yang tercatat',
        direction: 'steady',
      },
      {
        id: 'composition',
        label: 'Dyna / Fuso',
        value: `${stats.dynaCount} / ${stats.fusoCount}`,
        icon: <Hash size={22} />,
        tone: 'gold',
        hint: 'Komposisi jenis armada',
        direction: 'steady',
      },
    ];
  })();

  const focusGuide = (() => {
    if (user?.role === 'checker') {
      return [
        {
          title: 'Pastikan nomor polisi jelas',
          detail: 'Input truck dengan huruf kapital agar mudah dicari di halaman riwayat.',
        },
        {
          title: 'Cocokkan operator dan excavator',
          detail: 'Data checker menjadi acuan utama saat staff pos memverifikasi keluarnya truck.',
        },
        {
          title: 'Pantau antrean staff pos',
          detail: 'Semakin kecil angka menunggu verifikasi, semakin lancar alur keluarnya truck.',
        },
      ];
    }

    if (user?.role === 'staff_pos') {
      return [
        {
          title: 'Cek truck yang baru masuk',
          detail: 'Registrasi hari ini menjadi dasar riwayat retase dan monitoring armada di pit.',
        },
        {
          title: 'Utamakan antrean keluar',
          detail: 'Buka halaman verifikasi saat antrian menunggu mulai bertambah supaya tidak menumpuk.',
        },
        {
          title: 'Gunakan riwayat untuk pencarian cepat',
          detail: 'Saat operator bertanya status truck, cari nomor polisi dari halaman riwayat.',
        },
      ];
    }

    return [
      {
        title: 'Pantau dua jalur kerja',
        detail: 'Admin bisa melihat registrasi masuk, checkout checker, dan hasil verifikasi dari satu dashboard.',
      },
      {
        title: 'Cek armada aktif harian',
        detail: 'Jumlah truk unik membantu menilai apakah armada harian sudah tercatat lengkap.',
      },
      {
        title: 'Gunakan mode input sesuai petugas',
        detail: 'Mode staff dan checker dipisah agar data tetap konsisten walau diinput oleh admin.',
      },
    ];
  })();

  const welcomeCopy =
    user?.role === 'checker'
      ? 'Pantau checkout truck dan pastikan data pit terbaca jelas sebelum diteruskan ke staff pos.'
      : user?.role === 'staff_pos'
        ? 'Ringkasan dibuat lebih sederhana agar registrasi masuk dan verifikasi keluar bisa dipantau cepat.'
        : 'Semua pergerakan retase tambang diringkas dalam satu tampilan yang lebih rapi dan mudah dipahami.';

  return (
    <div className="dashboard-page" id="dashboard-content">
      <section className="dashboard-hero surface-card surface-card--accent">
        <div className="hero-copy">
          <span className="section-kicker">Ringkasan Hari Ini</span>
          <h2>{user?.name || 'Pengguna'}</h2>
          <p>{welcomeCopy}</p>
          <div className="hero-chips">
            <span className="soft-badge">Aktivitas hari ini: {totalActivityToday}</span>
            <span className="soft-badge alt">Antrian verifikasi: {stats.pendingCount}</span>
            <span className="soft-badge success">Selesai: {completionRate}%</span>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <span>Progres verifikasi</span>
            <strong>{completionRate}%</strong>
            <small>
              {stats.verifiedCount} dari {stats.totalCheckouts || 0} data checkout selesai
            </small>
          </div>
          <div className="hero-metric">
            <span>Armada tercatat</span>
            <strong>{stats.uniqueTrucks}</strong>
            <small>Truk unik aktif dalam sistem retase</small>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {statCards.map((card) => (
          <article className={`stat-card ${card.tone}`} key={card.id} id={`stat-${card.id}`}>
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
              <span className="section-kicker">Komposisi Armada</span>
              <h3 className="panel-title">Rasio jenis truck</h3>
            </div>
            <span className="panel-note">Data dihitung dari seluruh registrasi</span>
          </div>

          <div className="ratio-bar">
            <div className="ratio-fill dyna-fill" style={{ width: dynaRatio }}>
              <span>Dyna {dynaRatio}</span>
            </div>
            <div className="ratio-fill fuso-fill" style={{ width: fusoRatio }}>
              <span>Fuso {fusoRatio}</span>
            </div>
          </div>

          <div className="ratio-legend">
            <div className="legend-card">
              <span className="legend-dot dyna-dot" />
              <div>
                <strong>{stats.dynaCount}</strong>
                <span>Truck Dyna tercatat</span>
              </div>
            </div>
            <div className="legend-card">
              <span className="legend-dot fuso-dot" />
              <div>
                <strong>{stats.fusoCount}</strong>
                <span>Truck Fuso tercatat</span>
              </div>
            </div>
          </div>
        </article>

        <article className="surface-card guide-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">Fokus Kerja</span>
              <h3 className="panel-title">Panduan singkat operasional</h3>
            </div>
            <span className="panel-note">Disesuaikan dengan peran Anda</span>
          </div>

          <div className="guide-list">
            {focusGuide.map((item, index) => (
              <div className="guide-item" key={item.title}>
                <span className="guide-step">{index + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
