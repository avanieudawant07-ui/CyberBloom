import React, { useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  History,
  Info,
  ShieldCheck,
} from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';
import InfoTooltip from '../components/InfoTooltip';
import {
  CATEGORY_ORDER,
  PII_CATEGORIES,
  PROTECTION_MODES,
} from '../constants/piiConfig';

export default function IntelligenceReport({
  detection,
  mode,
  hasInput,
  fileMeta,
  coverageScore,
  historyRecords,
  auditRecords,
  onDownloadAuditReport,
  onNavigate,
}) {
  const totalDetected = detection.totalDetected;
  const maxCategoryCount = Math.max(
    1,
    ...CATEGORY_ORDER.map((cat) => detection.counts[cat] || 0)
  );

  // Historical overview aggregated dynamically from IndexedDB records
  const historicalSummary = useMemo(() => {
    const totalOps = historyRecords.length;
    const totalProtectedHistorical = auditRecords.reduce(
      (sum, rec) => sum + (rec.entitiesProtected || 0),
      0
    );
    const avgScore =
      auditRecords.length > 0
        ? Math.round(
            auditRecords.reduce((sum, rec) => sum + (rec.privacyScore || 0), 0) /
              auditRecords.length
          )
        : 100;

    const modeCounts = {};
    for (const rec of historyRecords) {
      const label = rec.modeLabel || PROTECTION_MODES[rec.mode]?.name || rec.mode;
      modeCounts[label] = (modeCounts[label] || 0) + 1;
    }
    const topMode =
      Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      PROTECTION_MODES[mode]?.name;

    const exportedCount = auditRecords.filter(
      (rec) => rec.exportStatus && rec.exportStatus !== 'Not Exported'
    ).length;

    return {
      totalOps,
      totalProtectedHistorical,
      avgScore,
      topMode,
      exportedCount,
    };
  }, [historyRecords, auditRecords, mode]);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset =
    circumference - (coverageScore.score / 100) * circumference;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-8 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[12px] font-medium text-[#8B7CC8] uppercase tracking-wider">
            Analytics &amp; Coverage Audit
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#22202B]">
            Intelligence Report
          </h1>
          <p className="text-[14px] text-[#6D6A7C]">
            Real-time entity distribution, sanitization coverage score, and
            historical metrics from IndexedDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onDownloadAuditReport}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#E6E2F0] text-[13px] font-medium text-[#22202B] hover:bg-[#F7F6FB] transition-colors"
          >
            <Download className="w-4 h-4 text-[#8B7CC8]" />
            <span>Download Audit Report</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('studio')}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#3B2E6E] text-[#FFFFFF] text-[13px] font-medium hover:bg-[#2F2459] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sanitization Lab</span>
          </button>
        </div>
      </div>

      {/* Top Grid: Privacy Protection Score + Session Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Privacy Protection Score Card */}
        <div className="lg:col-span-5 soft-card p-6 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#22202B]">
                Privacy Protection Score
              </h2>
              <InfoTooltip
                label="Privacy score explanation"
                text="Measures the percentage of detected entities successfully redacted in the current workspace session. It reflects sanitization coverage only, not overall system security or regulatory compliance."
              />
            </div>
            <span className="text-[11.5px] font-medium px-2.5 py-0.5 rounded-full bg-[#EAE6F7] text-[#3B2E6E]">
              {coverageScore.label}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#E6E2F0"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#3B2E6E"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[24px] font-semibold text-[#22202B] leading-none">
                  <AnimatedNumber value={coverageScore.score} suffix="%" />
                </span>
                <span className="text-[10px] text-[#6D6A7C] mt-1">
                  Coverage
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[#6D6A7C]">Detected entities</span>
                <span className="font-semibold text-[#22202B] tabular-nums">
                  {coverageScore.detected}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6D6A7C]">Successfully protected</span>
                <span className="font-semibold text-[#3B2E6E] tabular-nums">
                  {coverageScore.protectedCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6D6A7C]">Remaining unprotected</span>
                <span className="font-semibold text-[#22202B] tabular-nums">
                  {coverageScore.remainingUnprotected}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0] flex items-start gap-2 text-[12px] text-[#6D6A7C]">
            <Info className="w-4 h-4 text-[#8B7CC8] shrink-0 mt-0.5" />
            <span>
              This score measures sanitization coverage of detected patterns
              only. It does not guarantee complete privacy or formal regulatory
              compliance.
            </span>
          </div>
        </div>

        {/* Privacy Protection Summary */}
        <div className="lg:col-span-7 soft-card p-6 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#22202B]">
              Session Protection Summary
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#3B2E6E]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8B7CC8]" />
              {hasInput
                ? totalDetected > 0
                  ? 'Sanitized Locally'
                  : 'No Sensitive Patterns'
                : 'Awaiting Input'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0]">
              <div className="text-[12px] text-[#6D6A7C]">
                Total PII Detected
              </div>
              <div className="text-[28px] font-semibold text-[#22202B] mt-1">
                <AnimatedNumber value={totalDetected} />
              </div>
            </div>

            <div className="p-4 rounded-[10px] bg-[#EAE6F7]/45 border border-[#8B7CC8]/30">
              <div className="text-[12px] text-[#3B2E6E]">
                Entities Protected
              </div>
              <div className="text-[28px] font-semibold text-[#3B2E6E] mt-1">
                <AnimatedNumber value={coverageScore.protectedCount} />
              </div>
            </div>

            <div className="p-4 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0] col-span-2">
              <div className="text-[12px] text-[#6D6A7C]">
                Active Protection Method
              </div>
              <div className="text-[16px] font-semibold text-[#22202B] mt-1.5">
                {PROTECTION_MODES[mode]?.name}
              </div>
              <div className="text-[12px] text-[#6D6A7C] mt-0.5">
                {PROTECTION_MODES[mode]?.shortDesc} · Source:{' '}
                {fileMeta.fileType}
              </div>
            </div>
          </div>

          {/* Proportional Distribution Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[12px] text-[#6D6A7C]">
              <span>Proportional Exposure Breakdown</span>
              <span>
                Luhn check: {detection.luhnStats.validCards} valid /{' '}
                {detection.luhnStats.rejectedByLuhn} rejected
              </span>
            </div>

            <div className="w-full h-4 rounded-full bg-[#F7F6FB] border border-[#E6E2F0] flex overflow-hidden">
              {totalDetected === 0 ? (
                <div className="w-full h-full bg-[#E6E2F0]/40" />
              ) : (
                CATEGORY_ORDER.map((catKey) => {
                  const count = detection.counts[catKey] || 0;
                  if (count === 0) return null;
                  const pct = (count / totalDetected) * 100;
                  const cat = PII_CATEGORIES[catKey];
                  return (
                    <div
                      key={cat.key}
                      title={`${cat.label}: ${count} (${pct.toFixed(1)}%)`}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cat.barColor,
                      }}
                      className="h-full border-r last:border-r-0 border-[#FFFFFF]/60 transition-all duration-300"
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Grid (6 Categories) */}
      <section className="space-y-4">
        <h2 className="text-[19px] font-semibold text-[#22202B]">
          Category Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_ORDER.map((catKey) => {
            const cat = PII_CATEGORIES[catKey];
            const count = detection.counts[catKey] || 0;
            const unique = detection.uniqueCounts?.[catKey] || 0;
            const pct =
              totalDetected > 0 ? Math.round((count / totalDetected) * 100) : 0;

            return (
              <div
                key={cat.key}
                className="soft-card p-5 flex flex-col justify-between gap-3.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[12px] font-medium px-2.5 py-0.5 rounded-[7px] border ${cat.badgeClass}`}
                  >
                    {cat.pluralLabel}
                  </span>
                  <span className="text-[12px] font-medium text-[#6D6A7C] tabular-nums">
                    {pct}% share
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-[30px] font-semibold text-[#22202B] leading-none">
                    <AnimatedNumber value={count} />
                  </div>
                  <div className="text-[12px] text-[#6D6A7C]">
                    Unique values:{' '}
                    <strong className="font-medium text-[#22202B]">
                      {unique}
                    </strong>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-[#F7F6FB] border border-[#E6E2F0] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        count > 0
                          ? Math.max(6, (count / maxCategoryCount) * 100)
                          : 0
                      }%`,
                      backgroundColor: cat.barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Historical Overview from IndexedDB */}
      <section className="soft-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-[#EAE6F7] text-[#3B2E6E] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#22202B]">
                Historical Overview (IndexedDB)
              </h2>
              <p className="text-[12px] text-[#6D6A7C]">
                Aggregated from locally stored audit records across sessions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('activity')}
            className="cursor-pointer text-[13px] font-medium text-[#3B2E6E] hover:underline"
          >
            View full history →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0]">
            <div className="text-[12px] text-[#6D6A7C]">
              Recorded Operations
            </div>
            <div className="text-[24px] font-semibold text-[#22202B] mt-1 tabular-nums">
              {historicalSummary.totalOps}
            </div>
          </div>

          <div className="p-4 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0]">
            <div className="text-[12px] text-[#6D6A7C]">
              Cumulative Protected
            </div>
            <div className="text-[24px] font-semibold text-[#3B2E6E] mt-1 tabular-nums">
              {historicalSummary.totalProtectedHistorical}
            </div>
          </div>

          <div className="p-4 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0]">
            <div className="text-[12px] text-[#6D6A7C]">
              Average Coverage Score
            </div>
            <div className="text-[24px] font-semibold text-[#22202B] mt-1 tabular-nums">
              {historicalSummary.avgScore}%
            </div>
          </div>

          <div className="p-4 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0]">
            <div className="text-[12px] text-[#6D6A7C]">
              Most Used Mode / Exports
            </div>
            <div className="text-[15px] font-semibold text-[#22202B] mt-1.5 truncate">
              {historicalSummary.topMode}
            </div>
            <div className="text-[12px] text-[#6D6A7C]">
              {historicalSummary.exportedCount} exported file
              {historicalSummary.exportedCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
