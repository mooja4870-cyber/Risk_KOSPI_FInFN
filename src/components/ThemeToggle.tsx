import React from 'react';
import { useTheme } from '../ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="theme-toggle-wrap">
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle-btn"
        aria-pressed={theme === 'light'}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className="theme-toggle-icon">
          {theme === 'dark' ? 'DARK' : 'LIGHT'}
        </span>
        <span className="theme-toggle-text">
          {theme === 'dark' ? 'to Light' : 'to Dark'}
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;
