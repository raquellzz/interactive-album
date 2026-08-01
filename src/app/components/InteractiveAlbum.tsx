'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, User, MessageSquare, BookImage, Maximize2, Minimize2, FileDown, Loader2 } from 'lucide-react';
import { Photo } from './PhotoGrid';
import { Message } from './MessageBoard';

interface InteractiveAlbumProps {
  eventName: string;
  photos: Photo[];
  messages: Message[];
}

type PageType =
  | { type: 'cover' }
  | { type: 'photos'; leftRows: Photo[][]; rightRows: Photo[][] }
  | { type: 'messages'; items: Message[]; pageNum: number };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Subcomponente para Mensagem com "Ver mais..." para não estourar a página do livro
function MessageCard({ msg }: { msg: Message }) {
  const [expanded, setExpanded] = useState(false);
  const CHAR_LIMIT = 140; // Limite de caracteres para resumo visual

  const isLong = msg.content.length > CHAR_LIMIT;
  const displayContent = !expanded && isLong
    ? msg.content.substring(0, CHAR_LIMIT) + '...'
    : msg.content;

  return (
    <div className="onbook-card elev-sm gap-1.5 h-full min-h-[140px] justify-between">
      <div>
        <p className="text-xs sm:text-sm italic mb-2 leading-relaxed whitespace-pre-wrap opacity-90" style={{ color: 'var(--color-onbook-text)' }}>
          &ldquo;{displayContent}&rdquo;
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-semibold underline underline-offset-2 mb-3"
            style={{ color: 'var(--color-onbook-accent)' }}
          >
            {expanded ? 'Ver menos' : 'Ver mais...'}
          </button>
        )}
      </div>

      <div
        className="flex items-center justify-between pt-2.5 text-xs mt-auto"
        style={{ borderTop: '1px solid var(--color-onbook-divider)', color: 'var(--color-onbook-muted)' }}
      >
        <span className="font-semibold truncate pr-2 text-xs sm:text-sm" style={{ color: 'var(--color-onbook-text)' }}>
          {msg.author_name}
        </span>
        <span className="font-mono text-[10px] sm:text-[11px] flex-shrink-0">
          {new Date(msg.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          })}
        </span>
      </div>
    </div>
  );
}

type PhotoOrientation = 'portrait' | 'landscape';

// Agrupa fotos em linhas: verticais (mesmo que não estejam lado a lado no
// pedido original) são pareadas duas a duas; horizontais sempre ficam
// sozinhas ocupando a linha inteira.
function buildPhotoRows(items: Photo[], orientations: Record<string, PhotoOrientation>): Photo[][] {
  const portraits: Photo[] = [];
  const landscapes: Photo[] = [];

  for (const photo of items) {
    const orientation = orientations[photo.id] ?? 'portrait';
    (orientation === 'landscape' ? landscapes : portraits).push(photo);
  }

  const rows: Photo[][] = [];
  for (let i = 0; i < portraits.length; i += 2) {
    rows.push(portraits.slice(i, i + 2));
  }
  for (const photo of landscapes) {
    rows.push([photo]);
  }

  return rows;
}

function PhotoLeafCard({
  photo,
  getOptimizedUrl,
  isFullscreen,
  onOrientation,
}: {
  photo: Photo;
  getOptimizedUrl: (url: string, w?: number) => string;
  isFullscreen: boolean;
  onOrientation: (id: string, orientation: PhotoOrientation) => void;
}) {
  return (
    <div className={`onbook-card elev-sm p-3 sm:p-4 h-full ${isFullscreen ? 'flex flex-col min-h-0' : ''}`}>
      <div
        className={`flex items-center justify-center rounded-lg overflow-hidden ${
          isFullscreen ? 'flex-1 min-h-0' : 'min-h-[110px] max-h-[240px] md:max-h-[300px]'
        }`}
        style={{ background: 'var(--color-navy)' }}
      >
        <img
          src={getOptimizedUrl(photo.image_url, 1400)}
          alt={`Registro de ${photo.author_name}`}
          className={
            isFullscreen
              ? 'w-full h-full object-contain rounded select-none'
              : 'w-auto h-auto max-w-full max-h-[240px] md:max-h-[300px] object-contain rounded select-none'
          }
          loading="lazy"
          onLoad={(e) => {
            const img = e.currentTarget;
            onOrientation(photo.id, img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape');
          }}
        />
      </div>

      <div
        className="flex items-center justify-between pt-2 px-1"
        style={{ borderTop: '1px solid var(--color-onbook-divider)', color: 'var(--color-onbook-muted)' }}
      >
        <div className="flex items-center gap-1.5 truncate pr-2">
          <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-onbook-accent)' }} />
          <span className="text-xs sm:text-sm font-semibold truncate" style={{ color: 'var(--color-onbook-text)' }}>
            {photo.author_name}
          </span>
        </div>
        <span className="text-[11px]">
          {new Date(photo.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

export default function InteractiveAlbum({ eventName, photos, messages }: InteractiveAlbumProps) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientations, setOrientations] = useState<Record<string, PhotoOrientation>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOrientation = useCallback((id: string, orientation: PhotoOrientation) => {
    setOrientations((prev) => (prev[id] === orientation ? prev : { ...prev, [id]: orientation }));
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  const waitForImages = async (el: HTMLElement) => {
    const imgs = Array.from(el.querySelectorAll('img'));
    await Promise.all(
      imgs.map(async (img) => {
        if (!img.complete) {
          await new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        }
        // decode() garante que os pixels já estão prontos para desenhar, não só "carregados"
        try {
          await img.decode();
        } catch {
          // ignora falha de decode (ex.: imagem quebrada) e segue com o que tem
        }
      })
    );
  };

  const getOptimizedUrl = (url: string, width: number = 1000) => {
    if (!url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  };

  // DIAGRAMAÇÃO: verticais são pareadas lado a lado, horizontais ficam sozinhas
  // ocupando a largura da folha. No máximo 2 linhas por folha — o que não
  // couber "vira a página" e segue para a próxima folha, como num álbum real.
  const ROWS_PER_LEAF = 2;

  const pages = useMemo<PageType[]>(() => {
    const list: PageType[] = [{ type: 'cover' }];

    const photoRows = buildPhotoRows(photos, orientations);
    const leaves = chunk(photoRows, ROWS_PER_LEAF);
    for (let i = 0; i < leaves.length; i += 2) {
      list.push({
        type: 'photos',
        leftRows: leaves[i] ?? [],
        rightRows: leaves[i + 1] ?? [],
      });
    }

    const MESSAGES_PER_PAGE = 4;
    for (let i = 0; i < messages.length; i += MESSAGES_PER_PAGE) {
      list.push({
        type: 'messages',
        items: messages.slice(i, i + MESSAGES_PER_PAGE),
        pageNum: list.length,
      });
    }

    return list;
  }, [photos, messages, orientations]);

  const exportPdf = useCallback(
    async (orientation: 'landscape' | 'portrait') => {
      if (exporting || !containerRef.current) return;
      setPdfMenuOpen(false);
      setExporting(true);
      const originalPage = currentPage;

      try {
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
          import('html2canvas-pro'),
          import('jspdf'),
        ]);

        const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;

        for (let i = 0; i < pages.length; i++) {
          setExportProgress({ current: i + 1, total: pages.length });
          setCurrentPage(i);

          // espera o React re-renderizar a folha e as imagens carregarem
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          if (containerRef.current) await waitForImages(containerRef.current);
          await new Promise((resolve) => setTimeout(resolve, 120));

          const canvas = await html2canvas(containerRef.current!, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            ignoreElements: (el) => el.getAttribute('data-pdf-ignore') === 'true',
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.92);
          const availW = pageWidth - margin * 2;
          const availH = pageHeight - margin * 2;
          const ratio = Math.min(availW / canvas.width, availH / canvas.height);
          const w = canvas.width * ratio;
          const h = canvas.height * ratio;
          const x = (pageWidth - w) / 2;
          const y = (pageHeight - h) / 2;

          if (i > 0) pdf.addPage();
          pdf.setFillColor(13, 17, 40);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          pdf.addImage(imgData, 'JPEG', x, y, w, h);
        }

        const fileSlug = eventName.trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'album';
        pdf.save(`${fileSlug}.pdf`);
      } catch (err) {
        console.error('Erro ao exportar PDF:', err);
        alert('Não foi possível gerar o PDF. Tente novamente.');
      } finally {
        setCurrentPage(originalPage);
        setExporting(false);
        setExportProgress(null);
      }
    },
    [exporting, currentPage, pages, eventName]
  );

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, pages.length - 1));
  }, [pages.length]);

  const handlePrev = useCallback(() => {
    if (exporting) return;
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, [exporting]);

  const handleNext = useCallback(() => {
    if (exporting) return;
    setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
  }, [pages.length, exporting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  const currentPageData = pages[currentPage];
  const isOpenBook = currentPageData.type !== 'cover';

  const photosLeftRows = currentPageData.type === 'photos' ? currentPageData.leftRows : [];
  const photosRightRows = currentPageData.type === 'photos' ? currentPageData.rightRows : [];
  const photosInSpread = [...photosLeftRows, ...photosRightRows].reduce((sum, row) => sum + row.length, 0);
  const messagesLeft = currentPageData.type === 'messages' ? currentPageData.items.slice(0, 2) : [];
  const messagesRight = currentPageData.type === 'messages' ? currentPageData.items.slice(2, 4) : [];

  return (
    <div className="flex flex-col items-center justify-center w-full my-2 sm:my-6">
      <div
        ref={containerRef}
        className={`elev-lg relative w-full max-w-6xl overflow-hidden flex flex-col justify-between ${
          isFullscreen ? 'h-screen p-6 sm:p-10 md:p-16' : 'min-h-[580px] md:min-h-[700px] p-4 sm:p-8 md:p-12'
        }`}
        style={{
          borderRadius: isFullscreen ? 0 : 'var(--radius-lg)',
          background:
            'radial-gradient(900px 420px at 50% -12%, color-mix(in srgb, var(--color-accent) 22%, transparent) 0%, transparent 62%),' +
            'linear-gradient(160deg, var(--color-navy-2) 0%, var(--color-royal) 55%, var(--color-navy) 100%)',
        }}
      >
        {/* TEXTURA SUTIL DE PAPEL/ESTRELAS */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(color-mix(in srgb, var(--color-accent-200) 80%, white) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />

        {/* AÇÕES DO ÁLBUM: EXPORTAR PDF + TELA CHEIA (fora da captura do PDF) */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2" data-pdf-ignore="true">
          <div className="relative">
            <button
              onClick={() => setPdfMenuOpen((prev) => !prev)}
              className="btn btn-onbook btn-icon"
              style={{ backdropFilter: 'blur(4px)' }}
              title="Exportar álbum em PDF"
              disabled={exporting}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            </button>

            {pdfMenuOpen && (
              <div
                className="absolute right-0 mt-2 flex flex-col gap-1 p-1.5 rounded-lg"
                style={{ background: 'var(--color-onbook-chip-bg)', border: '1px solid var(--color-onbook-divider)', backdropFilter: 'blur(6px)' }}
              >
                <button
                  onClick={() => exportPdf('portrait')}
                  className="btn btn-onbook text-xs justify-start"
                  style={{ background: 'transparent', border: 'none' }}
                >
                  PDF Retrato
                </button>
                <button
                  onClick={() => exportPdf('landscape')}
                  className="btn btn-onbook text-xs justify-start"
                  style={{ background: 'transparent', border: 'none' }}
                >
                  PDF Paisagem
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="btn btn-onbook btn-icon"
            style={{ backdropFilter: 'blur(4px)' }}
            title={isFullscreen ? 'Sair da tela cheia' : 'Expandir álbum em tela cheia'}
            disabled={exporting}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* PROGRESSO DA EXPORTAÇÃO (fora da captura do PDF) */}
        {exporting && exportProgress && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: 'rgba(8, 10, 24, 0.75)', backdropFilter: 'blur(2px)' }}
            data-pdf-ignore="true"
          >
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-onbook-text)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-onbook-text)' }}>
                Gerando PDF... folha {exportProgress.current} de {exportProgress.total}
              </p>
            </div>
          </div>
        )}

        {/* LOMBADA / DOBRA */}
        {currentPageData.type === 'cover' ? (
          <div className="absolute top-0 bottom-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-black/65 via-black/25 to-transparent pointer-events-none z-10" />
        ) : (
          <div className="hidden md:block book-spine" />
        )}

        {/* CONTEÚDO DINÂMICO DA FOLHA */}
        <div
          key={currentPage}
          className={`relative z-10 flex-1 flex flex-col min-h-0 ${exporting ? '' : 'adx-page-turn'}`}
        >

          {/* == PÁGINA 1: CAPA == */}
          {currentPageData.type === 'cover' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 my-auto py-12 px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--color-accent-800), var(--color-royal-2))', boxShadow: 'var(--shadow-glow)' }}
              >
                <BookImage className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: 'var(--color-accent-100)' }} />
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent-300)' }}>
                  Lembrança comemorativa oficial
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl" style={{ color: 'var(--color-onbook-text)' }}>
                  {eventName}
                </h2>
              </div>

              <div
                className="hr"
                style={{
                  width: 120,
                  margin: '4px 0',
                  background: 'linear-gradient(to right, transparent, var(--color-onbook-divider) 20%, var(--color-onbook-divider) 80%, transparent)',
                }}
              />

              <div className="flex gap-2">
                <span className="tag" style={{ border: '1px solid var(--color-onbook-accent)', color: 'var(--color-onbook-accent)' }}>
                  {photos.length} fotos
                </span>
                <span className="tag" style={{ border: '1px solid var(--color-onbook-accent)', color: 'var(--color-onbook-accent)' }}>
                  {messages.length} dedicatórias
                </span>
              </div>

              <p className="text-xs pt-4" style={{ color: 'var(--color-onbook-muted)' }}>
                Toque em &ldquo;Abrir álbum&rdquo; ou use as setas para folhear
              </p>
            </div>
          )}

          {/* == PÁGINAS DE FOTOS (LIVRO ABERTO: FOLHA ESQUERDA + DIREITA) == */}
          {currentPageData.type === 'photos' && (
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between pb-3 mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm uppercase tracking-wider" style={{ color: 'var(--color-accent-300)' }}>
                  Galeria do evento — Folha {currentPage}
                </h3>
                <span className="tag tag-accent">{photosInSpread} fotos nesta folha</span>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14 flex-1 my-auto relative min-h-0 ${
                  isFullscreen ? 'items-stretch' : 'items-start'
                }`}
              >
                <div
                  className={`page-leaf p-4 sm:p-5 w-full flex flex-col gap-4 min-h-0 ${isFullscreen ? 'h-full' : ''}`}
                >
                  {photosLeftRows.map((row) => (
                    <div
                      key={row.map((p) => p.id).join('-')}
                      className={`${row.length === 2 ? 'grid grid-cols-2 gap-4' : ''} ${
                        isFullscreen ? 'flex-1 min-h-0' : ''
                      }`}
                    >
                      {row.map((photo) => (
                        <PhotoLeafCard
                          key={photo.id}
                          photo={photo}
                          getOptimizedUrl={getOptimizedUrl}
                          isFullscreen={isFullscreen}
                          onOrientation={handleOrientation}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div
                  className={`page-leaf p-4 sm:p-5 w-full flex flex-col gap-4 min-h-0 ${isFullscreen ? 'h-full' : ''}`}
                >
                  {photosRightRows.map((row) => (
                    <div
                      key={row.map((p) => p.id).join('-')}
                      className={`${row.length === 2 ? 'grid grid-cols-2 gap-4' : ''} ${
                        isFullscreen ? 'flex-1 min-h-0' : ''
                      }`}
                    >
                      {row.map((photo) => (
                        <PhotoLeafCard
                          key={photo.id}
                          photo={photo}
                          getOptimizedUrl={getOptimizedUrl}
                          isFullscreen={isFullscreen}
                          onOrientation={handleOrientation}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* == PÁGINAS DE MENSAGENS (ESQUERDA + DIREITA) == */}
          {currentPageData.type === 'messages' && (
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between pb-3 mb-6">
                <h3 className="text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-accent-300)' }}>
                  <MessageSquare className="w-4 h-4" />
                  Dedicatórias &amp; recados — Folha {currentPage}
                </h3>
                <span className="tag tag-accent">Dedicatórias</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14 flex-1 my-auto items-start relative min-h-0">
                <div
                  className="page-leaf p-4 sm:p-5 flex flex-col gap-4 w-full min-h-0"
                >
                  {messagesLeft.map((msg) => (
                    <MessageCard key={msg.id} msg={msg} />
                  ))}
                </div>
                <div
                  className="page-leaf p-4 sm:p-5 flex flex-col gap-4 w-full min-h-0"
                >
                  {messagesRight.map((msg) => (
                    <MessageCard key={msg.id} msg={msg} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ DE NAVEGAÇÃO */}
        <div
          className="relative z-10 flex items-center justify-between pt-4 mt-6 text-xs sm:text-sm"
          style={{
            borderTop: isOpenBook ? '1px solid var(--color-onbook-divider)' : '1px solid color-mix(in srgb, var(--color-accent-300) 25%, transparent)',
            color: 'var(--color-onbook-muted)',
          }}
        >
          <div className="font-medium">
            Folha {currentPage + 1} de {pages.length}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrev}
              disabled={currentPage === 0 || exporting}
              className="btn btn-onbook"
              title="Folha anterior (Seta Esquerda)"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <button
              onClick={handleNext}
              disabled={currentPage === pages.length - 1 || exporting}
              className="btn btn-primary-solid"
              title="Próxima folha (Seta Direita)"
            >
              {currentPage === 0 ? 'Abrir Álbum' : 'Próxima'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
