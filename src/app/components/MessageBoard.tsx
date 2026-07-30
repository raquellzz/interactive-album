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
    <div className="space-y-6">
      {/* Formulário para Envio de Mensagem */}
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          Deixe um recado para a Formanda
        </h3>

        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva seus parabéns ou uma lembrança especial..."
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm resize-none text-gray-700"
          required
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          {/* Toggle Privado / Público */}
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isPublic
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            {isPublic ? (
              <>
                <Globe className="w-3.5 h-3.5" />
                Público (Todos poderão ver)
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Privado (Visível apenas para a Raquel)
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="w-full sm:w-auto px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {submitting ? 'Enviando...' : 'Enviar Recado'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Lista de Recados Públicos */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Mural de Carinho ({messages.length})
        </h4>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Nenhum recado público ainda. Seja o primeiro a escrever!
          </p>
        ) : (
          <div className="grid gap-3">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-gray-800 text-sm">
                    {msg.author_name}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(msg.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}