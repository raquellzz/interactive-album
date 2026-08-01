'use client';

import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, Images, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadButtonProps {
  eventId: string;
  accessKey: string;
  authorName: string;
  onUploadSuccess: () => void;
}

export default function UploadButton({
  eventId,
  accessKey,
  authorName,
  onUploadSuccess,
}: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      setProgressText('Autorizando envio...');
      const signRes = await fetch('/api/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey }),
      });

      if (!signRes.ok) {
        throw new Error('Chave de acesso inválida ou expirada.');
      }

      const signData = await signRes.json();

      const compressionOptions = {
        maxSizeMB: 1,           // Máximo de 1MB
        maxWidthOrHeight: 1920, // Resolução Full HD (excelente para telas)
        useWebWorker: true,
      };

      // Processar cada arquivo selecionado
      for (let i = 0; i < files.length; i++) {
        const originalFile = files[i];
        setProgressText(`Comprimindo foto ${i + 1} de ${files.length}...`);

        // Comprimir no celular
        const compressedFile = await imageCompression(originalFile, compressionOptions);

        // 2. Enviar direto para o Cloudinary usando os dados da assinatura
        setProgressText(`Enviando foto ${i + 1} de ${files.length}...`);
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('api_key', signData.apiKey);
        formData.append('timestamp', signData.timestamp.toString());
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!cloudinaryRes.ok) {
          throw new Error(`Erro ao enviar a imagem ${i + 1}`);
        }

        const cloudinaryData = await cloudinaryRes.json();

        await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            imageUrl: cloudinaryData.secure_url,
            authorName,
          }),
        });
      }

      setSuccess(true);
      onUploadSuccess();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload. Tente novamente.');
    } finally {
      setUploading(false);
      setProgressText(null);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        className="relative flex flex-col items-center justify-center w-full p-6 rounded-2xl transition-colors gap-2.5 text-center"
        style={{
          border: '1.5px dashed color-mix(in srgb, var(--color-accent) 45%, transparent)',
          borderRadius: 'var(--radius-lg)',
          background: 'color-mix(in srgb, var(--color-accent) 6%, var(--color-surface))',
        }}
      >
        {uploading ? (
          <>
            <div
              className="animate-spin rounded-full h-8 w-8"
              style={{ borderBottom: '2px solid var(--color-accent)' }}
            />
            <p className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
              {progressText}
            </p>
          </>
        ) : (
          <>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--color-accent) 18%, var(--color-surface))' }}
            >
              <Camera className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <p className="text-sm font-medium">Adicionar Fotos da Formatura</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-neutral-400)' }}>
                Tire na hora ou escolha da galeria (múltiplas fotos permitidas)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <label className="btn btn-primary-solid" style={{ cursor: 'pointer' }}>
                <Camera className="w-3.5 h-3.5" />
                Tirar Foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={uploading}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Images className="w-3.5 h-3.5" />
                Escolher da Galeria
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </>
        )}
      </div>

      {success && (
        <div
          className="mt-3 flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Fotos enviadas com sucesso e adicionadas ao mural!</span>
        </div>
      )}

      {error && (
        <div
          className="mt-3 flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}