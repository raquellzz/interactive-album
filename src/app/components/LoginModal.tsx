'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, KeyRound, User } from 'lucide-react';

interface LoginModalProps {
  onLogin: (name: string, accessKey: string, eventId: string, eventName: string) => void;
}

export default function LoginModal({ onLogin }: LoginModalProps) {
  const [name, setName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      onLogin(name.trim(), accessKey.trim().toUpperCase(), data.eventId, data.eventName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-purple-100 text-purple-600 rounded-2xl mb-1">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Álbum de Formatura</h2>
          <p className="text-sm text-gray-500">
            Identifique-se para acessar a galeria e compartilhar suas fotos do jantar!
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          {/* Campo Nome */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Seu Nome
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none text-sm text-gray-800 transition-all"
              />
            </div>
          </div>

          {/* Campo Chave do Evento */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Chave de Acesso
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                placeholder="Ex: TESTE123"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none text-sm uppercase font-mono text-gray-800 transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !accessKey.trim()}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-purple-600/25 text-sm"
          >
            {loading ? 'Acessando...' : 'Entrar na Galeria'}
          </button>
        </form>
      </div>
    </div>
  );
}