'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Camera, MessageSquare, LogOut, GraduationCap, BookOpen } from 'lucide-react';
import LoginModal from './components/LoginModal';
import PhotoGrid, { Photo } from './components/PhotoGrid';
import UploadButton from './components/UploadButton';
import MessageBoard, { Message } from './components/MessageBoard';
import LightboxModal from './components/LightBoxModal';
import InteractiveAlbum from './components/InteractiveAlbum';
import ThemeToggle from './components/ThemeToggle';

export default function Home() {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('Álbum de Formatura');

  const [activeTab, setActiveTab] = useState<'photos' | 'messages' | 'album'>('photos');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [eventIconUrl, setEventIconUrl] = useState<string>('/icon.png');

  useEffect(() => {
    if (eventId && eventIconUrl) {
      let favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.type = 'image/png';
      favicon.href = eventIconUrl;
    }
  }, [eventId, eventIconUrl]);

  const fetchPhotos = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/photos?eventId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch (err) {
      console.error('Erro ao buscar fotos:', err);
    }
  }, []);

  const fetchMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/messages?eventId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  }, []);

  useEffect(() => {
    if (eventId) {
      setLoading(true);
      Promise.all([fetchPhotos(eventId), fetchMessages(eventId)]).finally(() => {
        setLoading(false);
      });
    }
  }, [eventId, fetchPhotos, fetchMessages]);

  const handleLogin = (name: string, key: string, id: string, eventTitle: string, iconUrl?: string) => {
    setGuestName(name);
    setAccessKey(key);
    setEventId(id);
    setEventName(eventTitle);
    if (iconUrl) setEventIconUrl(iconUrl);
  };

  const handleLogout = () => {
    localStorage.removeItem('guest_name');
    localStorage.removeItem('guest_key');
    setGuestName(null);
    setAccessKey(null);
    setEventId(null);
  };

  if (!guestName || !accessKey || !eventId) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <main className="min-h-screen pb-16">
      {/* Cabeçalho */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          borderBottom: '1px solid var(--color-divider)',
          background: 'color-mix(in srgb, var(--color-surface) 72%, transparent)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-none"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-900), var(--color-royal))' }}
            >
              <GraduationCap className="w-4.5 h-4.5" style={{ color: 'var(--color-accent-200)' }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base leading-tight truncate">{eventName}</h1>
              <p className="text-xs truncate" style={{ color: 'var(--color-neutral-400)' }}>
                Olá, <span className="font-medium" style={{ color: 'var(--color-accent)' }}>{guestName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              title="Sair / Trocar nome"
              className="btn btn-secondary btn-icon"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Container Principal */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        <UploadButton
          eventId={eventId}
          accessKey={accessKey}
          authorName={guestName}
          onUploadSuccess={() => fetchPhotos(eventId)}
        />

        {/* Tabs segmentadas */}
        <div className="seg w-fit max-w-full overflow-x-auto">
          <label className={`seg-opt whitespace-nowrap ${activeTab === 'photos' ? 'is-active' : ''}`}>
            <input type="radio" name="adx-tab" checked={activeTab === 'photos'} onChange={() => setActiveTab('photos')} />
            <Camera className="w-3.5 h-3.5" />
            Galeria de Fotos ({photos.length})
          </label>
          <label className={`seg-opt whitespace-nowrap ${activeTab === 'messages' ? 'is-active' : ''}`}>
            <input type="radio" name="adx-tab" checked={activeTab === 'messages'} onChange={() => setActiveTab('messages')} />
            <MessageSquare className="w-3.5 h-3.5" />
            Recados ({messages.length})
          </label>
          <label className={`seg-opt whitespace-nowrap ${activeTab === 'album' ? 'is-active' : ''}`}>
            <input type="radio" name="adx-tab" checked={activeTab === 'album'} onChange={() => setActiveTab('album')} />
            <BookOpen className="w-3.5 h-3.5" />
            Álbum Digital
          </label>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div key={activeTab} className="adx-fade-in">
          {activeTab === 'photos' ? (
            <PhotoGrid
              photos={photos}
              loading={loading}
              onPhotoClick={(index) => setSelectedPhotoIndex(index)}
            />
          ) : activeTab === 'messages' ? (
            <MessageBoard
              eventId={eventId}
              authorName={guestName}
              messages={messages}
              loading={loading}
              onMessageSent={() => fetchMessages(eventId)}
            />
          ) : (
            <InteractiveAlbum
              eventName={eventName}
              photos={photos}
              messages={messages}
            />
          )}
        </div>

        {selectedPhotoIndex !== null && guestName && (
          <LightboxModal
            photos={photos}
            currentIndex={selectedPhotoIndex}
            currentUser={guestName}
            onClose={() => setSelectedPhotoIndex(null)}
            onNavigate={(newIndex) => setSelectedPhotoIndex(newIndex)}
            onDeleteSuccess={() => {
              if (eventId) fetchPhotos(eventId);
            }}
          />
        )}
      </div>
    </main>
  );
}
