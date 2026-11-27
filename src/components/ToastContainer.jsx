import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const TONE_STYLES = {
  success: {
    icon: CheckCircle2,
    wrap: 'bg-[#FFFFFF] border-[#8B7CC8]/40 text-[#22202B]',
    iconColor: 'text-[#3B2E6E]',
    pill: 'bg-[#EAE6F7]',
  },
  error: {
    icon: AlertCircle,
    wrap: 'bg-[#FFFFFF] border-[#D96C65]/50 text-[#22202B]',
    iconColor: 'text-[#D96C65]',
    pill: 'bg-[#D96C65]/15',
  },
  warning: {
    icon: AlertTriangle,
    wrap: 'bg-[#FFFFFF] border-[#E8A34A]/50 text-[#22202B]',
    iconColor: 'text-[#B8741E]',
    pill: 'bg-[#E8A34A]/15',
  },
  info: {
    icon: Info,
    wrap: 'bg-[#FFFFFF] border-[#E6E2F0] text-[#22202B]',
    iconColor: 'text-[#8B7CC8]',
    pill: 'bg-[#F7F6FB]',
  },
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        const style = TONE_STYLES[toast.type] || TONE_STYLES.info;
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-[12px] border shadow-md animate-page-enter ${style.wrap}`}
          >
            <div
              className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 ${style.pill}`}
            >
              <Icon className={`w-4 h-4 ${style.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="text-[13px] font-semibold leading-snug">
                  {toast.title}
                </div>
              )}
              <div className="text-[12px] text-[#6D6A7C] leading-snug mt-0.5">
                {toast.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-[#6D6A7C] hover:text-[#22202B] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
