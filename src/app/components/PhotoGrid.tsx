'use client';

import React, { useState } from 'react';
import { Download, User, CheckSquare, Square, X, Loader2, Check } from 'lucide-react';

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

function slugify(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'foto'
  );
}

export default function PhotoGrid({ photos, loading, onPhotoClick }: PhotoGridProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const getOptimizedUrl = (url: string) => {
    if (!url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_600/');
  };

  const allSelected = photos.length > 0 && selectedIds.size === photos.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(photos.map((p) => p.id)));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const downloadSelected = async () => {
    const selectedPhotos = photos.filter((p) => selectedIds.has(p.id));
    if (selectedPhotos.length === 0 || downloading) return;

    setDownloading(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const usedNames = new Set<string>();

      await Promise.all(
        selectedPhotos.map(async (photo, index) => {
          const res = await fetch(photo.image_url);
          if (!res.ok) throw new Error(`Falha ao baixar foto de ${photo.author_name}`);
          const blob = await res.blob();
          const ext = blob.type.split('/')[1]?.split('+')[0] || 'jpg';
          let fileName = `${String(index + 1).padStart(2, '0')}-${slugify(photo.author_name)}.${ext}`;
          while (usedNames.has(fileName)) {
            fileName = `${fileName.replace(`.${ext}`, '')}-${Math.random().toString(36).slice(2, 5)}.${ext}`;
          }
          usedNames.add(fileName);
          zip.file(fileName, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fotos-do-evento.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar fotos selecionadas:', err);
      alert('Erro ao baixar as fotos selecionadas. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid var(--color-accent)' }} />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div
        className="text-center py-12 rounded-xl"
        style={{ border: '1.5px dashed var(--color-divider)', background: 'var(--color-surface)' }}
      >
        <p className="font-medium" style={{ color: 'var(--color-neutral-400)' }}>Nenhuma foto enviada ainda.</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-neutral-600)' }}>Seja o primeiro a compartilhar um momento!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de seleção */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {!selectionMode ? (
          <button type="button" onClick={() => setSelectionMode(true)} className="btn btn-secondary text-xs">
            <CheckSquare className="w-3.5 h-3.5" />
            Selecionar fotos
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" onClick={toggleSelectAll} className="btn btn-secondary text-xs">
                {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                {allSelected ? 'Desselecionar todas' : 'Selecionar todas'}
              </button>
              <span className="text-xs" style={{ color: 'var(--color-neutral-400)' }}>
                {selectedIds.size} selecionada{selectedIds.size === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadSelected}
                disabled={selectedIds.size === 0 || downloading}
                className="btn btn-primary-solid text-xs"
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {downloading ? 'Baixando...' : `Baixar (${selectedIds.size})`}
              </button>
              <button type="button" onClick={exitSelectionMode} className="btn btn-secondary btn-icon" title="Cancelar seleção">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {photos.map((photo, index) => {
          const isSelected = selectedIds.has(photo.id);
          return (
            <div
              key={photo.id}
              onClick={() => (selectionMode ? toggleSelect(photo.id) : onPhotoClick(index))}
              className="group relative rounded-xl overflow-hidden aspect-square flex flex-col justify-between cursor-pointer elev-sm"
              style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                boxShadow: isSelected ? '0 0 0 3px var(--color-accent)' : undefined,
              }}
            >
              {/* Imagem otimizada */}
              <img
                src={getOptimizedUrl(photo.image_url)}
                alt={`Foto por ${photo.author_name}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {selectionMode && (
                <div
                  className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white transition-colors"
                  style={{ background: isSelected ? 'var(--color-accent)' : 'rgba(0,0,0,0.45)' }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              )}

              {/* Sobreposição */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-1.5 truncate pr-2">
                    <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-accent-300)' }} />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {photo.author_name}
                    </span>
                  </div>

                  {/* Botão de Download individual */}
                  {!selectionMode && (
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
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
