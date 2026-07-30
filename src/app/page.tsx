'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Camera, MessageSquare, LogOut, GraduationCap } from 'lucide-react';
import LoginModal from './components/LoginModal';
import PhotoGrid, { Photo } from './components/PhotoGrid';
import UploadButton from './components/UploadButton';
import MessageBoard, { Message } from './components/MessageBoard';
import LightboxModal from './components/LightBoxModal';

export default function Home() {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('Álbum de Formatura');

  const [activeTab, setActiveTab] = useState<'photos' | 'messages'>('photos');
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
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Cabeçalho Comemorativo */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm sm:text-base leading-tight">
                {eventName}
              </h1>
              <p className="text-xs text-gray-500">
                Olá, <span className="font-medium text-purple-600">{guestName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sair / Trocar nome"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Container Principal */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Botão de Upload Sempre em Destaque */}
        <UploadButton
          eventId={eventId}
          accessKey={accessKey}
          authorName={guestName}
          onUploadSuccess={() => fetchPhotos(eventId)}
        />

        {/* Abas (Galeria de Fotos vs Recados) */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            Galeria de Fotos ({photos.length})
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'messages'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Recados ({messages.length})
          </button>
        </div>

        {/* Conteúdo da Aba Ativa */}
        {activeTab === 'photos' ? (
          <PhotoGrid 
            photos={photos} 
            loading={loading} 
            onPhotoClick={(index) => setSelectedPhotoIndex(index)} 
          />
        ) : (
          <MessageBoard
            eventId={eventId}
            authorName={guestName}
            messages={messages}
            loading={loading}
            onMessageSent={() => fetchMessages(eventId)}
          />
        )}

        {/* Modal de Lightbox - Só é montado quando uma foto é clicada */}
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