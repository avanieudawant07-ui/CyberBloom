import React from 'react';
import { Check, FileInput, ScanSearch, ShieldCheck } from 'lucide-react';
import { PROTECTION_MODES } from '../constants/piiConfig';

export default function ProcessStages({
  hasInput,
  totalDetected,
  mode,
  hasOutput,
}) {
  const modeLabel = PROTECTION_MODES[mode]?.name || mode;

  const steps = [
    {
      num: '01',
      title: 'Input',
      subtitle: hasInput ? 'Payload loaded' : 'Paste text or upload file',
      done: hasInput,
      icon: FileInput,
    },
    {
      num: '02',
      title: 'Detect',
      subtitle: hasInput
        ? `${totalDetected} ${totalDetected === 1 ? 'entity' : 'entities'} identified`
        : 'Awaiting local scan',
      done: totalDetected > 0,
      icon: ScanSearch,
    },
    {
      num: '03',
      title: 'Protect',
      subtitle: hasOutput ? `${modeLabel} applied` : 'Ready to sanitize',
      done: hasOutput,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <div
            key={step.num}
            className={`soft-card px-4 py-3.5 flex items-center justify-between gap-3 transition-colors ${
              step.done ? 'bg-[#FFFFFF]' : 'bg-[#FFFFFF]/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${
                  step.done
                    ? 'bg-[#EAE6F7] text-[#3B2E6E]'
                    : 'bg-[#F7F6FB] text-[#6D6A7C]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#22202B] flex items-center gap-1.5">
                  <span className="text-[#6D6A7C] font-normal">{step.num}.</span>
                  <span>{step.title}</span>
                </div>
                <div className="text-[12px] text-[#6D6A7C]">{step.subtitle}</div>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                step.done
                  ? 'bg-[#8B7CC8] border-[#8B7CC8] text-[#FFFFFF]'
                  : 'border-[#E6E2F0] text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
