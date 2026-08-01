'use client';

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Apagar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(8, 10, 24, 0.6)' }}
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="adx-fade-in elev-lg w-full max-w-sm p-6 flex flex-col gap-4"
        style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-none"
            style={{
              background: danger ? 'var(--color-danger-bg)' : 'color-mix(in srgb, var(--color-accent) 16%, transparent)',
            }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: danger ? 'var(--color-danger)' : 'var(--color-accent)' }} />
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <h3 id="confirm-modal-title" className="text-base">
              {title}
            </h3>
            {description && (
              <p className="text-sm" style={{ color: 'var(--color-neutral-400)' }}>
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn btn-secondary text-sm">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? 'btn btn-danger text-sm' : 'btn btn-primary-solid text-sm'}
            style={danger ? { background: 'color-mix(in srgb, var(--color-danger) 14%, transparent)' } : undefined}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
