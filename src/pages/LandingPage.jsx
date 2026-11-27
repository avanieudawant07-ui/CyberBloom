import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  EyeOff,
  Lock,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import PrivacyIllustration from '../components/PrivacyIllustration';
import { CATEGORY_ORDER, PII_CATEGORIES, PROTECTION_MODES } from '../constants/piiConfig';

export default function LandingPage({ onNavigate }) {
  const scrollToFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const highlights = [
    {
      num: '01',
      title: 'Intelligent Detection',
      desc: 'Automatically identify six categories of sensitive information.',
      detail:
        'Detects emails, Indian mobile numbers, IPv4 addresses with strict octet checks, PAN and Aadhaar patterns, and Luhn-verified card numbers.',
      icon: ScanSearch,
    },
    {
      num: '02',
      title: 'Flexible Protection',
      desc: 'Choose between full masking, partial masking and consistent pseudonymization.',
      detail:
        'Switch redaction strategies instantly while preserving CSV delimiters, quoted columns, and cross-document duplicate consistency.',
      icon: SlidersHorizontal,
    },
    {
      num: '03',
      title: 'Private by Design',
      desc: 'Your original data stays inside your browser.',
      detail:
        'Zero servers, zero cloud APIs, and zero telemetry. Local audit history persists inside IndexedDB without ever storing raw sensitive values.',
      icon: Lock,
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-16 animate-page-enter">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE6F7]/80 text-[#3B2E6E] text-[12px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Client-Side Privacy Workspace</span>
          </div>

          <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-tight text-[#22202B] leading-[1.2]">
            Privacy isn&apos;t optional. Protection should be effortless.
          </h1>

          <p className="text-[15px] sm:text-[16px] text-[#6D6A7C] leading-relaxed max-w-xl">
            An intelligent privacy workspace that identifies sensitive
            information and transforms exposed data into protected information —
            entirely within your browser.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#3B2E6E] text-[#FFFFFF] text-[14px] font-medium hover:bg-[#2F2459] transition-all shadow-sm hover:-translate-y-0.5"
            >
              <span>Start Sanitizing</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={scrollToFeatures}
              className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#FFFFFF] border border-[#E6E2F0] text-[#22202B] text-[14px] font-medium hover:bg-[#F7F6FB] transition-all"
            >
              <span>Explore Features</span>
            </button>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-[#6D6A7C]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8B7CC8]" />
              Zero external transmission
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8B7CC8]" />
              TXT &amp; CSV structure preserved
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8B7CC8]" />
              Local IndexedDB audit log
            </span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <PrivacyIllustration />
        </div>
      </section>

      {/* Three Feature Highlights */}
      <section id="features-section" className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-[12px] font-medium text-[#8B7CC8] uppercase tracking-wider">
            Core Capabilities
          </div>
          <h2 className="text-[21px] sm:text-[23px] font-semibold text-[#22202B]">
            Engineered for clarity, accuracy, and local control
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="soft-card soft-card-hover p-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-[10px] bg-[#EAE6F7] text-[#3B2E6E] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono-tech text-[12px] text-[#6D6A7C]">
                    {item.num}
                  </span>
                </div>

                <h3 className="text-[16px] font-semibold text-[#22202B]">
                  {item.num}. {item.title}
                </h3>
                <p className="text-[14px] text-[#22202B]/85 font-medium leading-snug">
                  {item.desc}
                </p>
                <p className="text-[13px] text-[#6D6A7C] leading-relaxed">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Three Redaction Strategies Overview */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="text-[12px] font-medium text-[#8B7CC8] uppercase tracking-wider">
              Protection Methods
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#22202B] mt-0.5">
              Adapt redaction strength to your workflow
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('studio')}
            className="cursor-pointer text-[13px] font-medium text-[#3B2E6E] hover:underline inline-flex items-center gap-1 w-fit"
          >
            <span>Open Sanitization Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.values(PROTECTION_MODES).map((m) => (
            <div key={m.id} className="soft-card p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-[#6D6A7C] uppercase tracking-wider">
                  {m.code}
                </div>
                <h3 className="text-[16px] font-semibold text-[#22202B]">
                  {m.name}
                </h3>
                <p className="text-[13.5px] text-[#6D6A7C] leading-relaxed">
                  {m.detail}
                </p>
              </div>

              <div className="p-3 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0] font-mono-tech text-[12px] space-y-1">
                <div className="text-[#6D6A7C] truncate">
                  Input: {m.exampleInput}
                </div>
                <div className="text-[#3B2E6E] font-medium truncate">
                  Output: {m.exampleOutput}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Categories + Privacy Assurance Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 soft-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-[#22202B]">
              Six Detection Categories
            </h3>
            <span className="text-[12px] text-[#6D6A7C]">
              Regex + Luhn Mod-10
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORY_ORDER.map((catKey) => {
              const cat = PII_CATEGORIES[catKey];
              return (
                <div
                  key={cat.key}
                  className="p-3.5 rounded-[10px] bg-[#F7F6FB]/70 border border-[#E6E2F0] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-[6px] border ${cat.badgeClass}`}
                    >
                      {cat.label}
                    </span>
                    <span className="font-mono-tech text-[11px] text-[#6D6A7C]">
                      {cat.shortCode}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#6D6A7C] leading-snug pt-1">
                    {cat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 soft-card p-6 bg-[#3B2E6E] text-[#FFFFFF] border-[#3B2E6E] flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#FFFFFF]/12 flex items-center justify-center">
              <EyeOff className="w-4 h-4 text-[#EAE6F7]" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#FFFFFF]">
              Privacy Assurance
            </h3>
            <p className="text-[13.5px] text-[#EAE6F7] leading-relaxed">
              CyberBloom executes 100% locally inside your browser runtime. No
              backend service, analytics tracker, or external API ever receives
              your text or uploaded files.
            </p>
            <div className="p-3.5 rounded-[10px] bg-[#FFFFFF]/8 border border-[#FFFFFF]/15 text-[12.5px] text-[#EAE6F7] space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-[#FFFFFF]">
                <Database className="w-3.5 h-3.5 text-[#EAE6F7]" />
                <span>Zero-PII IndexedDB Logging</span>
              </div>
              <p className="text-[12px] text-[#EAE6F7]/85 leading-relaxed">
                Audit records store only entity counts, timestamps, and mode
                metadata—never raw email addresses, phones, PAN, Aadhaar, or
                card numbers. Format matching does not verify real-world ID
                ownership.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('architecture')}
            className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#FFFFFF] text-[#3B2E6E] text-[13px] font-medium hover:bg-[#EAE6F7] transition-colors"
          >
            <span>Explore Privacy Architecture &amp; Luhn Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}
