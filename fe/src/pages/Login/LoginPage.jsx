import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Mountain, Truck, HardHat, ChevronRight } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.25 + 0.05;
        this.hue = 240 + Math.random() * 40;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 60%, 55%, ${this.opacity})`;
        ctx.fill();
      }
    }

    resize();
    for (let i = 0; i < 60; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(91, 95, 199, ${0.04 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Harap isi username dan password');
      return;
    }

    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="login-page" id="login-page">
      <canvas ref={canvasRef} className="login-particles" />
      
      {/* Ambient orbs */}
      <div className="login-ambient">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
      </div>

      <div className="login-container">
        {/* Left Panel - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-icon-wrapper">
              <div className="brand-icon-glow" />
              <div className="brand-icon">
                <Mountain size={40} strokeWidth={1.5} />
              </div>
            </div>
            
            <h1 className="brand-title">
              <span className="brand-si">SI</span>
              <span className="brand-tag">TAG</span>
            </h1>
            <p className="brand-subtitle">Sistem Informasi Tambang</p>
            <p className="brand-description">
              Platform pencatatan retase digital untuk monitoring operasional tambang yang efisien dan akurat.
            </p>

            <div className="brand-features">
              <div className="brand-feature">
                <div className="feature-icon">
                  <Truck size={20} />
                </div>
                <div>
                  <h4>Pencatatan Retase</h4>
                  <p>Real-time tracking truk & muatan</p>
                </div>
              </div>
              <div className="brand-feature">
                <div className="feature-icon">
                  <HardHat size={20} />
                </div>
                <div>
                  <h4>Multi Role</h4>
                  <p>Staff Pos & Checker terintegrasi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative grid */}
          <div className="branding-grid" />
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <div className="mobile-brand">
                <Mountain size={28} strokeWidth={1.5} />
                <span className="brand-si">SI</span>
                <span className="brand-tag">TAG</span>
              </div>
              <h2>Selamat Datang</h2>
              <p>Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit} id="login-form">
              <div className={`form-group ${focusedField === 'username' ? 'focused' : ''} ${username ? 'has-value' : ''}`}>
                <label htmlFor="login-username">Username</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Masukkan username"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${password ? 'has-value' : ''}`}>
                <label htmlFor="login-password">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={`login-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
                id="login-submit-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="login-demo-info">
              <p className="demo-title">Akun Demo</p>
              <div className="demo-accounts">
                <button className="demo-account" onClick={() => { setUsername('admin'); setPassword('admin123'); }}>
                  <span className="demo-role admin-badge">Admin</span>
                  <span className="demo-cred">admin / admin123</span>
                </button>
                <button className="demo-account" onClick={() => { setUsername('staffpos'); setPassword('staff123'); }}>
                  <span className="demo-role staff-badge">Staff Pos</span>
                  <span className="demo-cred">staffpos / staff123</span>
                </button>
                <button className="demo-account" onClick={() => { setUsername('checker'); setPassword('checker123'); }}>
                  <span className="demo-role checker-badge">Checker</span>
                  <span className="demo-cred">checker / checker123</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
