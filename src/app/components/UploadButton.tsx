'use client';

import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

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
      <label className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-purple-300 rounded-2xl cursor-pointer bg-purple-50/50 hover:bg-purple-50 transition-colors">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm font-medium text-purple-700">{progressText}</p>
            </>
          ) : (
            <>
              <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-700">
                  Adicionar Fotos da Formatura
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tire na hora ou escolha da galeria (múltiplas fotos permitidas)
                </p>
              </div>
            </>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Alerta de Sucesso */}
      {success && (
        <div className="mt-3 flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Fotos enviadas com sucesso e adicionadas ao mural!</span>
        </div>
      )}

      {/* Alerta de Erro */}
      {error && (
        <div className="mt-3 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}