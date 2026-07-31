'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'adx-theme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: light)');
    setTheme(mq.matches ? 'light' : 'dark');

    // Sem preferência salva: continua acompanhando o tema do sistema ao vivo
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };
    mq.addEventListener('change', handleSystemChange);
    return () => mq.removeEventListener('change', handleSystemChange);
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  // Evita mismatch de hidratação: só renderiza depois de saber o tema real
  if (!theme) return <div className={`btn-icon ${className}`} aria-hidden />;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-secondary btn-icon ${className}`}
      title={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      aria-label="Alternar tema claro/escuro"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
