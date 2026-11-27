import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function InfoTooltip({ label, text }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label || 'More information'}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center text-[#6D6A7C] hover:text-[#3B2E6E] transition-colors cursor-pointer focus:outline-none"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-[10px] bg-[#22202B] text-[#FFFFFF] text-[12px] leading-relaxed font-normal shadow-lg pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  );
}
