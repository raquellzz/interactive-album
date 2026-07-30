'use client';

import React from 'react';
import { Download, User } from 'lucide-react';

export interface Photo {
  id: string;
  image_url: string;
  author_name: string;
  created_at: string;
}

interface PhotoGridProps {
  photos: Photo[];
  loading: boolean;
  onPhotoClick: (index: number) => void;
}

export default function PhotoGrid({ photos, loading, onPhotoClick }: PhotoGridProps) {
  const getOptimizedUrl = (url: string) => {
    if (!url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_600/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 font-medium">Nenhuma foto enviada ainda.</p>
        <p className="text-sm text-gray-400 mt-1">Seja o primeiro a compartilhar um momento!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          onClick={() => onPhotoClick(index)} // AQUI: Clicar no card abre o Lightbox
          className="group relative bg-gray-100 rounded-xl overflow-hidden shadow-sm aspect-square flex flex-col justify-between cursor-pointer"
        >
          {/* Imagem otimizada */}
          <img
            src={getOptimizedUrl(photo.image_url)}
            alt={`Foto por ${photo.author_name}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Sobreposição */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-1.5 truncate pr-2">
                <User className="w-3.5 h-3.5 flex-shrink-0 text-purple-300" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  {photo.author_name}
                </span>
              </div>

              {/* Botão de Download */}
              <a
                href={photo.image_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors"
                title="Baixar foto original"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}