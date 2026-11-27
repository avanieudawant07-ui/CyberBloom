import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookmarkPlus,
  Check,
  Copy,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  Hash,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';
import HighlightedText from '../components/HighlightedText';
import InfoTooltip from '../components/InfoTooltip';
import ProcessStages from '../components/ProcessStages';
import {
  CATEGORY_ORDER,
  PII_CATEGORIES,
  PROTECTION_MODES,
  SYNTHETIC_SAMPLE_CSV,
  SYNTHETIC_SAMPLE_TEXT,
} from '../constants/piiConfig';
import { formatFileSize, readLocalFile } from '../utils/fileProcessor';

const CATEGORY_ICONS = {
  EMAIL: Mail,
  PHONE: Phone,
  IP_ADDRESS: Globe,
  PAN: IdCard,
  AADHAAR: Hash,
  CREDIT_CARD: CreditCard,
};

export default function SanitizationStudio({
  inputText,
  fileMeta,
  mode,
  detection,
  sanitizedText,
  csvPreview,
  coverageScore,
  showInlineBadges,
  onInputChange,
  onModeChange,
  onLoadSample,
  onFileLoaded,
  onFileError,
  onRequestClear,
  onExport,
  onSaveSnapshot,
  onCopySuccess,
}) {
  const fileInputRef = useRef(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [copied, setCopied] = useState(false);
  const [downloadedSuccess, setDownloadedSuccess] = useState(false);
  const [viewCSVTable, setViewCSVTable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const metrics = useMemo(() => {
    const trimmed = inputText.trim();
    const chars = inputText.length;
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lines = inputText ? inputText.split(/\r?\n/).length : 0;
    return { chars, words, lines };
  }, [inputText]);

  const processSelectedFile = async (file) => {
    if (!file) return;
    setUploadError('');
    setUploadProgress(15);

    try {
      const result = await readLocalFile(file, (pct) => {
        setUploadProgress(Math.max(25, pct));
      });
      setTimeout(() => {
        setUploadProgress(null);
        setViewCSVTable(result.fileType === 'CSV');
        onFileLoaded(result);
      }, 180);
    } catch (err) {
      setUploadProgress(null);
      const msg = err?.message || 'Unsupported file format.';
      setUploadError(msg);
      if (onFileError) onFileError(msg);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleCopyOutput = async () => {
    if (!sanitizedText) return;
    try {
      await navigator.clipboard.writeText(sanitizedText);
      setCopied(true);
      if (onCopySuccess) onCopySuccess();
      setTimeout(() => setCopied(false), 1800);
    } catch {
      if (onFileError) onFileError('Clipboard access was denied by the browser.');
    }
  };

  const handleDownloadClick = () => {
    if (!sanitizedText) return;
    onExport();
    setDownloadedSuccess(true);
    setTimeout(() => setDownloadedSuccess(false), 2200);
  };

  const activeModeMeta = PROTECTION_MODES[mode];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6 animate-page-enter">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[12px] font-medium text-[#8B7CC8] uppercase tracking-wider">
            Workspace · Client-Side Processing
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#22202B]">
            Sanitization Lab
          </h1>
          <p className="text-[14px] text-[#6D6A7C]">
            Paste text or upload TXT/CSV files to detect exposed entities and
            generate protected output locally.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#FFFFFF] border border-[#E6E2F0] text-[#22202B]">
            {fileMeta.fileType === 'CSV' ? (
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#8B7CC8]" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-[#8B7CC8]" />
            )}
            <span className="font-medium">{fileMeta.fileType}</span>
            {fileMeta.fileSizeBytes > 0 && (
              <span className="text-[#6D6A7C]">
                ({formatFileSize(fileMeta.fileSizeBytes)})
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#EAE6F7]/70 text-[#3B2E6E] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Coverage: {coverageScore.score}%</span>
          </span>
        </div>
      </div>

      {/* Three-Step Process Bar */}
      <ProcessStages
        hasInput={Boolean(inputText.trim())}
        totalDetected={detection.totalDetected}
        mode={mode}
        hasOutput={Boolean(sanitizedText)}
      />

      {/* INPUT PANEL */}
      <section className="soft-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2F0] flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#8B7CC8]" />
            <h2 className="text-[15px] font-semibold text-[#22202B]">
              Input Panel
            </h2>
            {fileMeta.fileName && (
              <span className="text-[12px] text-[#6D6A7C] bg-[#F7F6FB] border border-[#E6E2F0] px-2.5 py-0.5 rounded-full truncate max-w-[220px]">
                {fileMeta.fileName}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#6D6A7C]">
            <span>
              <strong className="font-medium text-[#22202B] tabular-nums">
                {metrics.chars}
              </strong>{' '}
              characters
            </span>
            <span>·</span>
            <span>
              <strong className="font-medium text-[#22202B] tabular-nums">
                {metrics.words}
              </strong>{' '}
              words
            </span>
            <span>·</span>
            <span>
              <strong className="font-medium text-[#22202B] tabular-nums">
                {metrics.lines}
              </strong>{' '}
              lines
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 border-b border-[#E6E2F0] bg-[#F7F6FB]/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              className="hidden"
              onChange={(e) => {
                processSelectedFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-[#3B2E6E] text-[#FFFFFF] text-[13px] font-medium hover:bg-[#2F2459] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload TXT / CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadError('');
                setViewCSVTable(false);
                onLoadSample(
                  SYNTHETIC_SAMPLE_TEXT,
                  'TXT',
                  'synthetic-audit-log.txt'
                );
              }}
              className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-[#EAE6F7] text-[#3B2E6E] text-[13px] font-medium hover:bg-[#DED7F3] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadError('');
                setViewCSVTable(true);
                onLoadSample(
                  SYNTHETIC_SAMPLE_CSV,
                  'CSV',
                  'synthetic-records.csv'
                );
              }}
              className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#E6E2F0] text-[#22202B] text-[13px] font-medium hover:bg-[#F7F6FB] transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#8B7CC8]" />
              <span>Load CSV Sample</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveCategoryFilter('ALL');
              setUploadError('');
              onRequestClear();
            }}
            disabled={!inputText}
            className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#E6E2F0] text-[#D96C65] text-[13px] font-medium hover:bg-[#D96C65]/8 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Upload Progress Bar or Error Banner */}
        {uploadProgress !== null && (
          <div className="px-5 py-2.5 bg-[#EAE6F7]/40 border-b border-[#E6E2F0] space-y-1.5">
            <div className="flex items-center justify-between text-[12px] text-[#3B2E6E] font-medium">
              <span>Reading file locally inside browser...</span>
              <span className="tabular-nums">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E6E2F0] overflow-hidden">
              <div
                className="h-full bg-[#3B2E6E] transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadError && (
          <div className="px-5 py-2.5 bg-[#D96C65]/10 border-b border-[#D96C65]/25 flex items-center gap-2 text-[13px] text-[#9E3D37]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Text Editor */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative transition-colors ${
            isDragging ? 'bg-[#EAE6F7]/35' : 'bg-[#FFFFFF]'
          }`}
        >
          <textarea
            aria-label="Sensitive data input editor"
            value={inputText}
            onChange={(e) => {
              setUploadError('');
              onInputChange(e.target.value);
            }}
            rows={8}
            spellCheck={false}
            placeholder="Paste text, logs, or CSV records here — or drag and drop a .txt / .csv file. Every check executes locally inside your browser."
            className="w-full p-5 bg-transparent font-mono-tech text-[13px] leading-relaxed text-[#22202B] placeholder:text-[#6D6A7C]/70 focus:outline-none resize-y min-h-[200px]"
          />
          {isDragging && (
            <div className="pointer-events-none absolute inset-3 rounded-[10px] border-2 border-dashed border-[#8B7CC8] bg-[#FFFFFF]/90 flex items-center justify-center">
              <span className="text-[14px] font-medium text-[#3B2E6E]">
                Drop .TXT or .CSV file to process locally
              </span>
            </div>
          )}
        </div>
      </section>

      {/* CATEGORY COUNTERS & LUHN SUMMARY */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-[#22202B]">
              Detected Entities
            </h2>
            <span className="text-[12px] text-[#6D6A7C] bg-[#FFFFFF] border border-[#E6E2F0] px-2.5 py-0.5 rounded-full">
              <AnimatedNumber value={detection.totalDetected} /> total
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#6D6A7C]">
            <span className="inline-flex items-center gap-1.5">
              <span>
                Luhn valid:{' '}
                <strong className="font-medium text-[#3B2E6E]">
                  {detection.luhnStats.validCards}
                </strong>{' '}
                · Rejected:{' '}
                <strong className="font-medium text-[#22202B]">
                  {detection.luhnStats.rejectedByLuhn}
                </strong>
              </span>
              <InfoTooltip
                label="Luhn validation info"
                text="13–19 digit sequences are verified with the mod-10 Luhn checksum. Non-Luhn numbers are ignored so random IDs are not falsely flagged as payment cards."
              />
            </span>

            {activeCategoryFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('ALL')}
                className="cursor-pointer text-[#3B2E6E] font-medium hover:underline"
              >
                Show all categories
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORY_ORDER.map((catKey) => {
            const cat = PII_CATEGORIES[catKey];
            const count = detection.counts[catKey] || 0;
            const Icon = CATEGORY_ICONS[catKey] || Hash;
            const isSelected = activeCategoryFilter === catKey;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() =>
                  setActiveCategoryFilter((prev) =>
                    prev === catKey ? 'ALL' : catKey
                  )
                }
                className={`cursor-pointer soft-card soft-card-hover p-3.5 text-left transition-all ${
                  isSelected
                    ? 'ring-2 ring-[#8B7CC8] bg-[#EAE6F7]/35'
                    : 'bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`w-7 h-7 rounded-[8px] border flex items-center justify-center ${cat.badgeClass}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[22px] font-semibold text-[#22202B] leading-none">
                    <AnimatedNumber value={count} />
                  </span>
                </div>
                <div className="text-[12.5px] font-medium text-[#22202B] mt-2.5 truncate">
                  {cat.label}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SIDE-BY-SIDE DETECTION & PROTECTION PANELS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT: DETECTION PANEL */}
        <div className="soft-card flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6E2F0] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-[#22202B]">
                Detection Panel
              </h2>
              <p className="text-[12px] text-[#6D6A7C]">
                Inline category highlights on original text
              </p>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F7F6FB] border border-[#E6E2F0] text-[#6D6A7C]">
              {activeCategoryFilter === 'ALL'
                ? 'All 6 categories'
                : PII_CATEGORIES[activeCategoryFilter]?.label}
            </span>
          </div>

          <div className="p-5 flex-1 overflow-auto max-h-[440px]">
            <HighlightedText
              text={inputText}
              matches={detection.matches}
              activeCategoryFilter={activeCategoryFilter}
              showInlineBadges={showInlineBadges}
            />
          </div>

          <div className="px-5 py-2.5 border-t border-[#E6E2F0] bg-[#F7F6FB]/60 text-[11.5px] text-[#6D6A7C] flex items-center justify-between gap-2">
            <span>
              Pattern matching identifies format only (does not verify PAN/Aadhaar
              ownership).
            </span>
          </div>
        </div>

        {/* RIGHT: PROTECTION PANEL */}
        <div className="soft-card flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6E2F0] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-[#22202B]">
                Protection Panel
              </h2>
              <p className="text-[12px] text-[#6D6A7C]">
                Instant sanitized output with live comparison
              </p>
            </div>

            <div className="flex items-center gap-2">
              {fileMeta.fileType === 'CSV' && csvPreview && (
                <button
                  type="button"
                  onClick={() => setViewCSVTable((v) => !v)}
                  className="cursor-pointer px-2.5 py-1 rounded-[8px] border border-[#E6E2F0] bg-[#F7F6FB] text-[11.5px] font-medium text-[#3B2E6E] hover:bg-[#EAE6F7]/60 transition-colors"
                >
                  {viewCSVTable ? 'Raw CSV' : 'Table View'}
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyOutput}
                disabled={!sanitizedText}
                className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E6E2F0] bg-[#FFFFFF] text-[12px] font-medium text-[#22202B] hover:bg-[#F7F6FB] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3B2E6E]" />
                    <span className="text-[#3B2E6E]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#6D6A7C]" />
                    <span>Copy Sanitized Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Three Protection Modes */}
          <div className="p-4 border-b border-[#E6E2F0] bg-[#F7F6FB]/60 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.values(PROTECTION_MODES).map((m) => {
                const selected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onModeChange(m.id)}
                    className={`cursor-pointer p-2.5 rounded-[10px] border text-left transition-all ${
                      selected
                        ? 'bg-[#EAE6F7] border-[#8B7CC8] text-[#3B2E6E] shadow-xs'
                        : 'bg-[#FFFFFF] border-[#E6E2F0] text-[#22202B] hover:border-[#CFC8E4]'
                    }`}
                  >
                    <div className="text-[12.5px] font-semibold leading-tight">
                      {m.name}
                    </div>
                    <div className="text-[11px] text-[#6D6A7C] mt-0.5">
                      {m.shortDesc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2 text-[12px] text-[#6D6A7C] px-1">
              <span className="font-medium text-[#3B2E6E] shrink-0">
                {activeModeMeta?.name}:
              </span>
              <span>{activeModeMeta?.detail}</span>
            </div>
          </div>

          {/* Sanitized Output Area */}
          <div
            key={mode}
            className="p-5 flex-1 overflow-auto max-h-[340px] bg-[#FFFFFF] animate-mode-switch"
          >
            {!sanitizedText ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0] flex items-center justify-center text-[#6D6A7C] mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-[14px] font-medium text-[#22202B]">
                  Sanitized output appears here
                </div>
                <p className="text-[12px] text-[#6D6A7C] mt-1 max-w-xs">
                  Add text or load a sample dataset to preview protected results
                  side by side.
                </p>
              </div>
            ) : fileMeta.fileType === 'CSV' && viewCSVTable && csvPreview ? (
              <div className="overflow-x-auto rounded-[10px] border border-[#E6E2F0]">
                <table className="w-full text-left border-collapse font-mono-tech text-[11.5px]">
                  <tbody>
                    {csvPreview.sanitizedRows.map((row, rIdx) => (
                      <tr
                        key={`r-${rIdx}`}
                        className={
                          rIdx === 0
                            ? 'bg-[#EAE6F7]/60 text-[#3B2E6E] font-semibold'
                            : 'border-t border-[#E6E2F0]'
                        }
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={`c-${rIdx}-${cIdx}`}
                            className="px-3 py-2 border-r last:border-r-0 border-[#E6E2F0] whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words font-mono-tech text-[12.5px] leading-relaxed text-[#3B2E6E]">
                {sanitizedText}
              </pre>
            )}
          </div>

          {/* Before-and-After Summary + Download & Snapshot Footer */}
          <div className="px-5 py-3.5 border-t border-[#E6E2F0] bg-[#F7F6FB]/70 space-y-3">
            {inputText.trim() && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#6D6A7C]">
                <span>
                  Summary:{' '}
                  <strong className="font-medium text-[#22202B]">
                    {detection.totalDetected} detected
                  </strong>{' '}
                  →{' '}
                  <strong className="font-medium text-[#3B2E6E]">
                    {detection.totalDetected} protected
                  </strong>
                  {fileMeta.fileType === 'CSV' && csvPreview
                    ? ` · CSV preserved (${csvPreview.rowsCount}×${csvPreview.colsCount})`
                    : ''}
                </span>
                <span className="font-medium text-[#3B2E6E]">
                  {coverageScore.score}% coverage
                </span>
              </div>
            )}

            {activeModeMeta?.warningNote && sanitizedText && (
              <div className="flex items-center gap-2 text-[11.5px] text-[#9A5B13] bg-[#FDF1DF]/80 border border-[#E8A34A]/35 px-3 py-1.5 rounded-[8px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#E8A34A]" />
                <span>
                  {activeModeMeta.warningNote} Use Full Mask if saving or
                  sharing irreversible output.
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={onSaveSnapshot}
                disabled={!sanitizedText}
                className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#E6E2F0] text-[12.5px] font-medium text-[#22202B] hover:bg-[#F7F6FB] transition-colors"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#8B7CC8]" />
                <span>Save Snapshot Locally</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadClick}
                disabled={!sanitizedText}
                className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#3B2E6E] text-[#FFFFFF] text-[13px] font-medium hover:bg-[#2F2459] transition-colors"
              >
                {downloadedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-[#EAE6F7]" />
                    <span>Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Protected File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
