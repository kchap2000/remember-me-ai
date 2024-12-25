import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { components } from '../../styles/components';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-secondary rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-tertiary hover:text-text-primary"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="text-accent-error" size={24} />
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        </div>

        <p className="text-text-secondary mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={cn(
              components.button.base,
              components.button.variants.secondary,
              components.button.sizes.md,
              "flex-1"
            )}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              components.button.base,
              "flex-1 bg-accent-error hover:bg-accent-error/90 text-white",
              components.button.sizes.md
            )}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}