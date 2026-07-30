'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, LogOut, Trash2, ShieldCheck, MessageSquare, Camera, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Photo } from '../components/PhotoGrid';
import { Message } from '../components/MessageBoard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'photos' | 'messages'>('photos');

  const [eventId, setEventId] = useState<string | null>(null);

  const fetchAdminData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const resPhotos = await fetch(`/api/photos?eventId=${id}`);
      if (resPhotos.ok) setPhotos(await resPhotos.json());

      const resMessages = await fetch(`/api/messages?eventId=${id}`, {
        headers: { 'x-admin-password': password },
      });
      if (resMessages.ok) setMessages(await resMessages.json());
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: 'RAQUEL2026' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.eventId) {
            setEventId(data.eventId);
            fetchAdminData(data.eventId);
          }
        });
    }
  }, [isAuthenticated, fetchAdminData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setLoginError('Senha de admin incorreta.');
      }
    } catch (err) {
      setLoginError('Erro ao autenticar.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setPassword('');
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Excluir esta foto permanentemente do evento?')) return;
    try {
      const res = await fetch(`/api/admin/photos?id=${photoId}`, { method: 'DELETE' });
      if (res.ok && eventId) {
        fetchAdminData(eventId);
      } else {
        alert('Erro ao apagar foto.');
      }
    } catch (err) {
      alert('Erro ao conectar.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="max-w-sm w-full bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-purple-500/20 text-purple-400 rounded-2xl mb-1">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white">Acesso Restrito - Formanda</h1>
            <p className="text-xs text-gray-400">Digite a senha de ADMIN configurada no ambiente</p>
          </div>

          <div>
            <input
              type="password"
              placeholder="Senha de Admin..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>

          {loginError && (
            <p className="text-xs text-red-400 text-center font-medium bg-red-950/40 p-2.5 rounded-lg border border-red-900/50">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-purple-600/20"
          >
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <header className="bg-gray-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h1 className="font-bold text-sm sm:text-base">Painel de Moderação — Raquel</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Abas */}
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            Todas as Fotos ({photos.length})
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'messages'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Recados (Públicos e Privados) ({messages.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : activeTab === 'photos' ? (
          /* MURAL ADMIN DE FOTOS */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <img
                    src={photo.image_url}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg mb-2"
                  />
                  <p className="text-xs font-semibold text-gray-800 truncate px-1">
                    Por: {photo.author_name}
                  </p>
                  <p className="text-[10px] text-gray-400 px-1 mb-2">
                    {new Date(photo.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Apagar
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* MURAL ADMIN DE MENSAGENS */
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl border ${
                  !msg.is_public
                    ? 'bg-purple-50/70 border-purple-200 shadow-sm'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">
                      {msg.author_name}
                    </span>
                    {!msg.is_public ? (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                        <Lock className="w-3 h-3" />
                        Privada para você
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px]">
                        <Eye className="w-3 h-3" />
                        Pública
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}