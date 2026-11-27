import React, { useState } from 'react';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';

const ILLUSTRATION_ROWS = [
  {
    category: 'Email',
    raw: 'ananya.rao@vault.in',
    full: '[REDACTED]',
    partial: 'an****@vault.in',
    pseudo: 'EMAIL_01',
    badgeClass: 'bg-[#EAE6F7] text-[#3B2E6E]',
  },
  {
    category: 'Phone',
    raw: '+91 98201 44210',
    full: '[REDACTED]',
    partial: '+91 ******4210',
    pseudo: 'PHONE_01',
    badgeClass: 'bg-[#FDF1DF] text-[#9A5B13]',
  },
  {
    category: 'PAN',
    raw: 'ABCDE1234F',
    full: '[REDACTED]',
    partial: '******234F',
    pseudo: 'PAN_01',
    badgeClass: 'bg-[#EBF1FA] text-[#3B2E6E]',
  },
  {
    category: 'Credit Card',
    raw: '4111 1111 1111 1111',
    full: '[REDACTED]',
    partial: '****-****-****-1111',
    pseudo: 'CARD_01',
    badgeClass: 'bg-[#3B2E6E]/10 text-[#3B2E6E]',
  },
  {
    category: 'Aadhaar',
    raw: '4821 9034 1182',
    full: '[REDACTED]',
    partial: 'XXXX XXXX 1182',
    pseudo: 'AADHAAR_01',
    badgeClass: 'bg-[#FBEAE8] text-[#9E3D37]',
  },
  {
    category: 'IP Address',
    raw: '192.168.14.22',
    full: '[REDACTED]',
    partial: '***.***.***.22',
    pseudo: 'IP_01',
    badgeClass: 'bg-[#F7F6FB] text-[#22202B]',
  },
];

export default function PrivacyIllustration() {
  const [previewMode, setPreviewMode] = useState('PSEUDONYMIZATION');

  const getProtected = (row) => {
    if (previewMode === 'FULL_MASK') return row.full;
    if (previewMode === 'PARTIAL_MASK') return row.partial;
    return row.pseudo;
  };

  return (
    <div className="soft-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E6E2F0]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[#EAE6F7] text-[#3B2E6E] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#22202B]">
              Live Sanitization Preview
            </div>
            <div className="text-[11px] text-[#6D6A7C]">
              Interactive local transformation flow
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0]">
          {[
            { id: 'FULL_MASK', label: 'Full' },
            { id: 'PARTIAL_MASK', label: 'Partial' },
            { id: 'PSEUDONYMIZATION', label: 'Pseudonym' },
          ].map((item) => {
            const active = previewMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreviewMode(item.id)}
                className={`cursor-pointer px-2.5 py-1 rounded-[7px] text-[11px] font-medium transition-colors ${
                  active
                    ? 'bg-[#FFFFFF] text-[#3B2E6E] shadow-xs border border-[#E6E2F0]'
                    : 'text-[#6D6A7C] hover:text-[#22202B]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 animate-mode-switch" key={previewMode}>
        <div className="grid grid-cols-12 gap-2 px-2 text-[11px] font-medium text-[#6D6A7C]">
          <span className="col-span-3">Entity</span>
          <span className="col-span-4">Exposed Input</span>
          <span className="col-span-1" />
          <span className="col-span-4 text-right">Protected Output</span>
        </div>

        {ILLUSTRATION_ROWS.map((row) => (
          <div
            key={row.category}
            className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-[10px] bg-[#F7F6FB]/80 border border-[#E6E2F0]"
          >
            <div className="col-span-3">
              <span
                className={`inline-block px-2 py-0.5 rounded-[6px] text-[11px] font-medium ${row.badgeClass}`}
              >
                {row.category}
              </span>
            </div>
            <div className="col-span-4 font-mono-tech text-[12px] text-[#6D6A7C] truncate">
              {row.raw}
            </div>
            <div className="col-span-1 flex justify-center">
              <ArrowRight className="w-3.5 h-3.5 text-[#8B7CC8]" />
            </div>
            <div className="col-span-4 text-right">
              <span className="inline-block font-mono-tech text-[12px] font-medium text-[#3B2E6E] bg-[#EAE6F7] px-2 py-0.5 rounded-[6px]">
                {getProtected(row)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[#E6E2F0] flex items-center justify-between text-[12px] text-[#6D6A7C]">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#8B7CC8]" />
          Browser-only processing
        </span>
        <span className="text-[#3B2E6E] font-medium">0 bytes sent</span>
      </div>
    </div>
  );
}
