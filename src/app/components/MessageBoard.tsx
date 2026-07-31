'use client';

import React, { useState } from 'react';
import { Send, Lock, Globe, MessageSquare } from 'lucide-react';

export interface Message {
  id: string;
  author_name: string;
  content: string;
  is_public: boolean;
  created_at: string;
}

interface MessageBoardProps {
  eventId: string;
  authorName: string;
  messages: Message[];
  loading: boolean;
  onMessageSent: () => void;
}

export default function MessageBoard({
  eventId,
  authorName,
  messages,
  loading,
  onMessageSent,
}: MessageBoardProps) {
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          authorName,
          content,
          isPublic,
        }),
      });

      if (res.ok) {
        setContent('');
        onMessageSent();
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Formulário para Envio de Mensagem */}
      <form onSubmit={handleSubmit} className="card elev-sm p-4 sm:p-6 gap-4">
        <h3 className="card-title flex items-center gap-2">
          <MessageSquare className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          Deixe um recado para a Formanda
        </h3>

        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva seus parabéns ou uma lembrança especial..."
          className="input"
          required
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          {/* Toggle Privado / Público */}
          <label className="radio">
            <input type="checkbox" checked={isPublic} onChange={() => setIsPublic((prev) => !prev)} />
            <span className="dot" />
            {isPublic ? (
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                Público (todos podem ver)
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" style={{ color: 'var(--color-neutral-400)' }} />
                Privado (visível apenas para a Raquel)
              </span>
            )}
          </label>

          <button type="submit" disabled={submitting || !content.trim()} className="btn btn-primary-solid">
            {submitting ? 'Enviando...' : 'Enviar Recado'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Lista de Recados */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-neutral-500)' }}>
          Mural de Carinho ({messages.length})
        </h4>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6" style={{ borderBottom: '2px solid var(--color-accent)' }} />
          </div>
        ) : messages.length === 0 ? (
          <p
            className="text-center py-8 text-sm rounded-xl"
            style={{ color: 'var(--color-neutral-500)', background: 'var(--color-surface)', border: '1.5px dashed var(--color-divider)' }}
          >
            Nenhum recado público ainda. Seja o primeiro a escrever!
          </p>
        ) : (
          <div className="grid gap-3">
            {messages.map((msg) => (
              <div key={msg.id} className="card elev-sm">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold">{msg.author_name}</span>
                  <span className="text-[11px]" style={{ color: 'var(--color-neutral-500)' }}>
                    {new Date(msg.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap opacity-90">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
