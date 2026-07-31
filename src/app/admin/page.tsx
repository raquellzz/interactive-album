'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, LogOut, Trash2, ShieldCheck, MessageSquare, Camera, Eye, ChevronLeft } from 'lucide-react';
import { Photo } from '../components/PhotoGrid';
import { Message } from '../components/MessageBoard';
import ThemeToggle from '../components/ThemeToggle';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'photos' | 'messages'>('photos');

  const [eventId, setEventId] = useState<string | null>(null);

  const router = useRouter();
  const [eventIcon, setEventIcon] = useState<string>('/icon.png');
  const [uploadingIcon, setUploadingIcon] = useState<boolean>(false);
  const [accessKey, setAccessKey] = useState('');

  // Função para fazer o upload do PNG do ícone e salvar na tabela events
  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;

    setUploadingIcon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('eventId', eventId);

      const res = await fetch('/api/admin/events/icon', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar o ícone');
      }

      setEventIcon(data.iconUrl);
      alert('Ícone do evento atualizado com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message || 'Falha ao enviar ícone'}`);
      console.error(err);
    } finally {
      setUploadingIcon(false);
      e.target.value = '';
    }
  };

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
        body: JSON.stringify({ accessKey, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setEventId(data.eventId);
        setIsAuthenticated(true);
        fetchAdminData(data.eventId);
      } else {
        const errData = await res.json();
        setLoginError(errData.error || 'Erro nas credenciais.');
      }
    } catch (err) {
      setLoginError('Erro ao conectar com o servidor.');
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="adx-fade-in elev-lg max-w-sm w-full p-7 sm:p-8 flex flex-col gap-5 relative"
          style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}
        >
          <ThemeToggle className="absolute top-4 right-4" />

          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className="w-13 h-13 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-900), var(--color-royal))' }}
            >
              <Lock className="w-5.5 h-5.5" style={{ color: 'var(--color-accent-200)' }} />
            </div>
            <div>
              <h1 className="text-lg mb-1">Acesso restrito — anfitrião</h1>
              <p className="text-xs" style={{ color: 'var(--color-neutral-400)' }}>
                Digite a chave do evento e a senha de moderação
              </p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="admin-key">Chave do evento</label>
            <input
              id="admin-key"
              type="text"
              placeholder="Ex: RAQUEL2026"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
              className="input uppercase font-mono"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="admin-pass">Senha do anfitrião</label>
            <input
              id="admin-pass"
              type="password"
              placeholder="Senha de moderação..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          {loginError && (
            <p
              className="text-xs text-center font-medium p-2.5 rounded-lg"
              style={{ color: 'var(--color-danger)', background: 'var(--color-danger-bg)' }}
            >
              {loginError}
            </p>
          )}

          <button type="submit" className="btn btn-primary-solid btn-block">
            Acessar painel
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn btn-ghost justify-center text-xs"
            style={{ color: 'var(--color-neutral-400)' }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Voltar para a galeria de convidados
          </button>
        </form>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <nav
        className="nav sticky top-0 z-30"
        style={{
          background: 'color-mix(in srgb, var(--color-surface) 75%, transparent)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div className="max-w-5xl mx-auto w-full px-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5" style={{ color: 'var(--color-accent)' }} />
            <span className="nav-brand">Painel de moderação — Raquel</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleLogout} className="btn btn-secondary">
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* CARD DE CONTROLE DO EVENTO ATUAL */}
        <div className="card elev-sm flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-none"
              style={{ background: 'var(--color-accent-900)', borderRadius: 'var(--radius-md)' }}
            >
              {uploadingIcon ? (
                <div className="animate-spin rounded-full h-5 w-5" style={{ borderBottom: '2px solid var(--color-accent)' }} />
              ) : (
                <img src={eventIcon} alt="Ícone Atual" className="w-6 h-6 object-contain" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium">Ícone do navegador</div>
              <div className="text-xs" style={{ color: 'var(--color-neutral-500)' }}>
                Personalize o favicon exibido para os convidados
              </div>
            </div>
          </div>

          <label className="btn btn-primary-solid" style={{ cursor: uploadingIcon ? 'not-allowed' : 'pointer' }}>
            <span>{uploadingIcon ? 'Enviando...' : 'Trocar ícone (PNG)'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploadingIcon}
              onChange={handleIconChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Abas */}
        <div className="seg w-fit max-w-full overflow-x-auto">
          <label className={`seg-opt whitespace-nowrap ${activeTab === 'photos' ? 'is-active' : ''}`}>
            <input type="radio" name="admin-tab" checked={activeTab === 'photos'} onChange={() => setActiveTab('photos')} />
            <Camera className="w-3.5 h-3.5" />
            Todas as fotos ({photos.length})
          </label>
          <label className={`seg-opt whitespace-nowrap ${activeTab === 'messages' ? 'is-active' : ''}`}>
            <input type="radio" name="admin-tab" checked={activeTab === 'messages'} onChange={() => setActiveTab('messages')} />
            <MessageSquare className="w-3.5 h-3.5" />
            Recados públicos e privados ({messages.length})
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid var(--color-accent)' }} />
          </div>
        ) : (
          <div key={activeTab} className="adx-fade-in">
            {activeTab === 'photos' ? (
              /* MURAL ADMIN DE FOTOS */
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                {photos.map((photo) => (
                  <div key={photo.id} className="card elev-sm p-0 overflow-hidden gap-0" style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                    <img
                      src={photo.image_url}
                      alt=""
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-2.5 flex flex-col gap-2">
                      <div>
                        <p className="text-xs font-semibold truncate">Por: {photo.author_name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--color-neutral-500)' }}>
                          {new Date(photo.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <button onClick={() => handleDeletePhoto(photo.id)} className="btn btn-danger btn-block text-xs">
                        <Trash2 className="w-3.5 h-3.5" />
                        Apagar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* MURAL ADMIN DE MENSAGENS */
              <div className="flex flex-col gap-2.5">
                {messages.map((msg) => (
                  <div key={msg.id} className="card elev-sm">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{msg.author_name}</span>
                        {!msg.is_public ? (
                          <span className="tag" style={{ background: 'var(--color-accent-800)', color: 'var(--color-accent-100)' }}>
                            <Lock className="w-3 h-3 mr-1" />
                            Privada para você
                          </span>
                        ) : (
                          <span className="tag tag-neutral">
                            <Eye className="w-3 h-3 mr-1" />
                            Pública
                          </span>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--color-neutral-500)' }}>
                        {new Date(msg.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap opacity-90">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
