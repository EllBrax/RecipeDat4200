// src/components/ThemeToggle/ThemeToggle.tsx
import { useEffect, useState } from 'react';
import { applyTheme, getInitialTheme, type Theme } from '../../theme';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());

  useEffect(() => { applyTheme(theme); }, [theme]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      aria-label="Toggle color theme"
    >
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
