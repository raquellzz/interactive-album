'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, User, Calendar, Trash2 } from 'lucide-react';
import { Photo } from './PhotoGrid';

interface LightboxModalProps {
  photos: Photo[];
  currentIndex: number;
  currentUser: string;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onDeleteSuccess: () => void;
}

export default function LightboxModal({
  photos,
  currentIndex,
  currentUser,
  onClose,
  onNavigate,
  onDeleteSuccess,
}: LightboxModalProps) {
  const [deleting, setDeleting] = useState(false);
  const currentPhoto = photos[currentIndex];

  const isOwner = currentPhoto?.author_name.trim().toLowerCase() === currentUser.trim().toLowerCase();

  const handleDelete = async () => {
    if (!currentPhoto || deleting) return;
    
    const confirmar = window.confirm('Tem certeza que deseja apagar esta foto do álbum?');
    if (!confirmar) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/photos?id=${currentPhoto.id}&author=${encodeURIComponent(currentPhoto.author_name)}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        onDeleteSuccess();
        if (photos.length <= 1) {
          onClose();
        } else if (currentIndex >= photos.length - 1) {
          onNavigate(0);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao apagar a foto.');
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePrev = useCallback(() => {
    const newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    onNavigate(newIndex);
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
    onNavigate(newIndex);
  }, [currentIndex, photos.length, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  if (!currentPhoto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
        title="Fechar (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-6 z-50 p-3 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all hover:scale-110"
            title="Foto Anterior (Seta Esquerda)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-6 z-50 p-3 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all hover:scale-110"
            title="Próxima Foto (Seta Direita)"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </>
      )}

      <div 
        className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.image_url}
          alt={`Foto por ${currentPhoto.author_name}`}
          className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
        />

        {/* Barra de Informações Flutuante / Rodapé */}
        <div className="w-full mt-4 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl text-white border border-white/10 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 truncate pr-4">
            <div className="flex items-center space-x-1.5 text-sm sm:text-base font-semibold">
              <User className="w-4 h-4 text-purple-300 flex-shrink-0" />
              <span className="truncate">{currentPhoto.author_name}</span>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-gray-300">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
              <span>
                {new Date(currentPhoto.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <span className="text-xs font-mono bg-black/30 px-2.5 py-1 rounded-full text-gray-300">
              {currentIndex + 1} / {photos.length}
            </span>

            {/* BOTÃO APAGAR (Só aparece para quem enviou a foto!) */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                title="Apagar minha foto"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {deleting ? 'Apagando...' : 'Apagar'}
                </span>
              </button>
            )}

            <a
              href={currentPhoto.image_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-sm"
              title="Baixar foto original"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}