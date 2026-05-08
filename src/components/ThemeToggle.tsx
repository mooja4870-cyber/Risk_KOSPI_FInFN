import React from 'react';
import { useTheme } from '../ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={toggleTheme}
        className={`
          group relative flex items-center gap-2 px-3 py-1.5 rounded-lg 
          border border-[var(--panel-border)] 
          bg-[var(--panel)] hover:bg-[var(--bg-elev)]
          transition-all duration-300 active:scale-95
          shadow-sm hover:shadow-md
        `}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-90 transition-transform duration-500" />
          )}
        </div>
        
        <div className="flex flex-col items-start leading-none gap-0.5">
          <span className="text-[9px] font-black uppercase tracking-tighter opacity-50 group-hover:opacity-80 transition-opacity">
            {theme === 'dark' ? 'DARK' : 'LIGHT'}
          </span>
          <span className="text-[11px] font-bold whitespace-nowrap">
            {theme === 'dark' ? 'to Light' : 'to Dark'}
          </span>
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;
