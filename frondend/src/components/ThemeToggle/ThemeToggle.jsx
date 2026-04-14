import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
      aria-label="Toggle Theme"
    >
      <div className="theme-icon-wrapper">
        {theme === 'dark' ? (
          <Sun size={18} className="theme-icon sun" />
        ) : (
          <Moon size={18} className="theme-icon moon" />
        )}
      </div>
      <span className="theme-toggle-label desktop-only">
        {theme === 'dark' ? 'Terang' : 'Gelap'}
      </span>
    </button>
  );
};

export default ThemeToggle;
