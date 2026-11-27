import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Database,
  FileDown,
  Lock,
  ScanSearch,
  Settings2,
  Shield,
  XCircle,
} from 'lucide-react';
import { PROTECTION_MODES } from '../constants/piiConfig';
import { explainLuhn } from '../utils/luhn';

export default function PrivacyArchitecturePage({
  preferences,
  onUpdatePreferences,
}) {
  const [luhnInput, setLuhnInput] = useState('4111 1111 1111 1111');
  const luhnReport = useMemo(() => explainLuhn(luhnInput), [luhnInput]);

  const pipeline = [
    {
      step: '01',
      title: 'Local File & Text Ingestion',
      desc: 'Browser FileReader API loads .txt or .csv buffers directly into volatile client memory without network requests.',
      icon: ScanSearch,
    },
    {
      step: '02',
      title: 'Pattern & Luhn Checksum Validation',
      desc: 'Dedicated regex engines classify Email, Indian Phone, IPv4 (0–255), PAN, Aadhaar, and Luhn-verified payment cards.',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'Deterministic In-Memory Redaction',
      desc: 'Full Mask, Partial Mask, or Consistent Pseudonymization runs locally, preserving CSV delimiters and duplicate mappings.',
      icon: Shield,
    },
    {
      step: '04',
      title: 'Blob Export & Zero-PII IndexedDB',
      desc: 'Sanitized files download via the Blob API while PrivacyWorkspaceDB stores only non-PII metadata and user preferences.',
      icon: FileDown,
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-8 animate-page-enter">
      {/* Header */}
      <div className="space-y-1">
        <div className="text-[12px] font-medium text-[#8B7CC8] uppercase tracking-wider">
          Transparency &amp; Technical Verification
        </div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#22202B]">
          Privacy Architecture
        </h1>
        <p className="text-[14px] text-[#6D6A7C] max-w-2xl">
          How CyberBloom processes sensitive payloads inside your browser,
          verifies payment card checksums with the Luhn algorithm, and stores
          metadata safely in IndexedDB.
        </p>
      </div>

      {/* Client-Side Processing Pipeline */}
      <section className="space-y-4">
        <h2 className="text-[19px] font-semibold text-[#22202B]">
          Client-Side Processing Pipeline
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipeline.map((node) => {
            const Icon = node.icon;
            return (
              <div key={node.step} className="soft-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[9px] bg-[#EAE6F7] text-[#3B2E6E] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono-tech text-[12px] text-[#6D6A7C]">
                    {node.step}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-[#22202B]">
                  {node.title}
                </h3>
                <p className="text-[13px] text-[#6D6A7C] leading-relaxed">
                  {node.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Educational Section: Luhn Algorithm */}
      <section className="soft-card p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E6E2F0] pb-4">
          <div>
            <h2 className="text-[19px] font-semibold text-[#22202B]">
              How the Luhn Algorithm Prevents False Positives
            </h2>
            <p className="text-[13.5px] text-[#6D6A7C] mt-1">
              Not every 16-digit number is a payment card. CyberBloom doubles
              every second digit from the right, subtracts 9 if over 9, and
              accepts the candidate only if the total sum is divisible by 10.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLuhnInput('4111 1111 1111 1111')}
              className="cursor-pointer px-3 py-1.5 rounded-[8px] bg-[#EAE6F7] text-[#3B2E6E] text-[12px] font-medium"
            >
              Valid Test Card
            </button>
            <button
              type="button"
              onClick={() => setLuhnInput('4111 1111 1111 1112')}
              className="cursor-pointer px-3 py-1.5 rounded-[8px] bg-[#FBEAE8] text-[#9E3D37] text-[12px] font-medium"
            >
              Invalid Checksum
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-3">
            <label
              htmlFor="luhn-tester"
              className="block text-[12.5px] font-medium text-[#22202B]"
            >
              Test a synthetic 13–19 digit number locally
            </label>
            <input
              id="luhn-tester"
              type="text"
              value={luhnInput}
              onChange={(e) => setLuhnInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E6E2F0] bg-[#F7F6FB] font-mono-tech text-[14px] text-[#22202B] focus:outline-none focus:border-[#8B7CC8]"
            />

            <div
              className={`p-3.5 rounded-[10px] border flex items-center gap-2.5 text-[13px] font-medium ${
                luhnReport.valid
                  ? 'bg-[#EAE6F7]/60 border-[#8B7CC8]/40 text-[#3B2E6E]'
                  : 'bg-[#FBEAE8]/80 border-[#D96C65]/40 text-[#9E3D37]'
              }`}
            >
              {luhnReport.valid ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>
                {!luhnReport.lengthValid
                  ? 'Length must be between 13 and 19 digits.'
                  : luhnReport.trivialSequence
                  ? 'Rejected: trivial identical-digit sequence.'
                  : luhnReport.valid
                  ? `Passes Luhn (Sum ${luhnReport.totalSum} mod 10 = 0)`
                  : `Fails Luhn (Sum ${luhnReport.totalSum} mod 10 = ${luhnReport.remainder})`}
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-2">
            <div className="text-[12px] font-medium text-[#6D6A7C]">
              Right-to-Left Digit Transformation
            </div>
            <div className="flex flex-wrap gap-1.5 p-3.5 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0]">
              {luhnReport.steps.length === 0 ? (
                <span className="text-[12px] text-[#6D6A7C]">
                  Enter digits to inspect checksum steps.
                </span>
              ) : (
                luhnReport.steps.map((s) => (
                  <div
                    key={s.index}
                    className={`px-2 py-1.5 rounded-[8px] border text-center min-w-[38px] font-mono-tech ${
                      s.doubled
                        ? 'bg-[#EAE6F7]/70 border-[#8B7CC8]/40 text-[#3B2E6E]'
                        : 'bg-[#FFFFFF] border-[#E6E2F0] text-[#22202B]'
                    }`}
                  >
                    <div className="text-[10px] text-[#6D6A7C]">
                      {s.doubled ? `${s.original}×2` : s.original}
                    </div>
                    <div className="text-[13px] font-semibold">{s.value}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Local Preferences Stored in IndexedDB */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="soft-card p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-4 h-4 text-[#8B7CC8]" />
            <h2 className="text-[16px] font-semibold text-[#22202B]">
              Workspace Preferences (IndexedDB)
            </h2>
          </div>

          <div className="space-y-4 text-[13.5px]">
            <div>
              <label
                htmlFor="pref-mode"
                className="block text-[12.5px] font-medium text-[#22202B] mb-1.5"
              >
                Preferred Default Redaction Mode
              </label>
              <select
                id="pref-mode"
                value={preferences.preferredMode}
                onChange={(e) =>
                  onUpdatePreferences({ preferredMode: e.target.value })
                }
                className="w-full px-3 py-2 rounded-[10px] border border-[#E6E2F0] bg-[#F7F6FB] text-[13px] text-[#22202B]"
              >
                {Object.values(PROTECTION_MODES).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.shortDesc}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center justify-between gap-3 p-3 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0] cursor-pointer">
              <div>
                <div className="font-medium text-[#22202B]">
                  Auto-log Prompt Metadata
                </div>
                <div className="text-[12px] text-[#6D6A7C]">
                  Save non-PII character and detection counts to Prompt Log
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.autoLogPrompts}
                onChange={(e) =>
                  onUpdatePreferences({ autoLogPrompts: e.target.checked })
                }
                className="w-4 h-4 accent-[#3B2E6E]"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0] cursor-pointer">
              <div>
                <div className="font-medium text-[#22202B]">
                  Show Inline Category Badges
                </div>
                <div className="text-[12px] text-[#6D6A7C]">
                  Display EML, PHN, PAN, ADH, CC tags inside highlighted text
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.showInlineBadges}
                onChange={(e) =>
                  onUpdatePreferences({ showInlineBadges: e.target.checked })
                }
                className="w-4 h-4 accent-[#3B2E6E]"
              />
            </label>
          </div>
        </div>

        <div className="soft-card p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#8B7CC8]" />
            <h2 className="text-[16px] font-semibold text-[#22202B]">
              Security Boundaries &amp; Limitations
            </h2>
          </div>

          <ul className="space-y-2.5 text-[13.5px] text-[#6D6A7C] leading-relaxed">
            <li className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-[#8B7CC8] shrink-0 mt-0.5" />
              <span>
                <strong className="font-medium text-[#22202B]">
                  No External Transmission:
                </strong>{' '}
                The application never issues API requests with user text or
                uploaded files.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8B7CC8] shrink-0 mt-0.5" />
              <span>
                <strong className="font-medium text-[#22202B]">
                  Format vs. Identity Verification:
                </strong>{' '}
                PAN and Aadhaar detection matches structural formats only and
                does not verify real-world ownership or government issuance.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#8B7CC8] shrink-0 mt-0.5" />
              <span>
                <strong className="font-medium text-[#22202B]">
                  Document-Scoped Pseudonyms:
                </strong>{' '}
                Pseudonymization counters reset whenever a new document or
                sample is loaded so mappings never leak across sessions.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
