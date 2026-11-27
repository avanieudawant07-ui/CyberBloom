import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'warning',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDanger = tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#22202B]/35 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E6E2F0] rounded-[14px] shadow-xl p-6 space-y-4 animate-page-enter">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
                isDanger
                  ? 'bg-[#D96C65]/15 text-[#D96C65]'
                  : 'bg-[#E8A34A]/15 text-[#B47420]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3
              id="confirm-dialog-title"
              className="text-[16px] font-semibold text-[#22202B]"
            >
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-[#6D6A7C] hover:text-[#22202B] cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[14px] text-[#6D6A7C] leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer px-4 py-2 rounded-[10px] border border-[#E6E2F0] bg-[#FFFFFF] text-[13px] font-medium text-[#22202B] hover:bg-[#F7F6FB] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`cursor-pointer px-4 py-2 rounded-[10px] text-[13px] font-medium text-[#FFFFFF] transition-colors ${
              isDanger
                ? 'bg-[#D96C65] hover:bg-[#c55b54]'
                : 'bg-[#3B2E6E] hover:bg-[#2F2459]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
