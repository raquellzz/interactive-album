'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, BookImage, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

interface LoginModalProps {
  onLogin: (name: string, accessKey: string, eventId: string, eventName: string, iconUrl?: string) => void;
}

export default function LoginModal({ onLogin }: LoginModalProps) {
  const [name, setName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const keyFromUrl = params.get('key');
    if (keyFromUrl) {
      setAccessKey(keyFromUrl.toUpperCase());
    }

    const savedName = localStorage.getItem('guest_name');
    const savedKey = localStorage.getItem('guest_key') || keyFromUrl;
    if (savedName && savedKey) {
      setName(savedName);
      setAccessKey(savedKey.toUpperCase());
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accessKey.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: accessKey.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Chave do evento inválida');
      }

      localStorage.setItem('guest_name', name.trim());
      localStorage.setItem('guest_key', accessKey.trim().toUpperCase());

      onLogin(name.trim(), accessKey.trim().toUpperCase(), data.eventId, data.eventName, data.iconUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(8, 10, 24, 0.55)' }}
    >
      <div
        className="adx-fade-in elev-lg w-full max-w-md rounded-2xl p-7 sm:p-8 flex flex-col gap-5 relative"
        style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}
      >
        <ThemeToggle className="absolute top-4 right-4" />

        <div className="flex flex-col items-center gap-3.5 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--color-accent-900), var(--color-royal))', boxShadow: '0 0 0 1px var(--color-accent-800)' }}
          >
            <BookImage className="w-6.5 h-6.5" style={{ color: 'var(--color-accent-200)' }} />
          </div>
          <div>
            <h3 className="text-lg mb-1">Álbum Compartilhado</h3>
            <p className="text-sm" style={{ color: 'var(--color-neutral-400)' }}>
              Identifique-se e digite a chave do evento
            </p>
          </div>
        </div>

        <p className="text-sm text-center leading-relaxed" style={{ color: 'var(--color-neutral-400)' }}>
          Envie fotos e veja a galeria e os recados da turma.
        </p>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div className="field">
            <label htmlFor="guest-name">Seu nome</label>
            <input
              id="guest-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marina Alves"
              className="input"
            />
          </div>

          <div className="field">
            <label htmlFor="guest-key">Chave de acesso</label>
            <input
              id="guest-key"
              type="text"
              required
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
              placeholder="Ex: TURMA2026"
              className="input uppercase font-mono"
            />
          </div>

          {error && (
            <p
              className="text-xs text-center font-medium p-2.5 rounded-lg"
              style={{ color: 'var(--color-danger)', background: 'var(--color-danger-bg)' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !accessKey.trim()}
            className="btn btn-primary-solid btn-block"
          >
            {loading ? 'Acessando...' : 'Entrar na Galeria'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="hr" style={{ margin: '4px 0' }} />

        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="btn btn-ghost justify-center text-xs"
          style={{ color: 'var(--color-neutral-400)' }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Área dos Anfitriões
        </button>
      </div>
    </div>
  );
}
