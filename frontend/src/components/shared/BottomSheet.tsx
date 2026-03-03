'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/shared/Button';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 p-4" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 shadow-2xl md:left-1/2 md:top-1/2 md:h-auto md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
