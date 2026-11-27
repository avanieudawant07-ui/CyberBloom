import React from 'react';
import { FileText } from 'lucide-react';
import { PII_CATEGORIES } from '../constants/piiConfig';

/**
 * Renders original source text with subtle category-specific inline highlights.
 */
export default function HighlightedText({
  text,
  matches,
  activeCategoryFilter = 'ALL',
  showInlineBadges = true,
}) {
  if (!text) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-10 h-10 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0] flex items-center justify-center text-[#6D6A7C] mb-3">
          <FileText className="w-5 h-5" />
        </div>
        <div className="text-[14px] font-medium text-[#22202B]">
          No input data loaded yet
        </div>
        <p className="text-[12px] text-[#6D6A7C] mt-1 max-w-xs">
          Enter text above, upload a TXT/CSV file, or click Load Sample to inspect
          detected entities.
        </p>
      </div>
    );
  }

  const visibleMatches =
    activeCategoryFilter === 'ALL'
      ? matches
      : matches.filter((m) => m.category === activeCategoryFilter);

  const segments = [];
  let cursor = 0;

  for (const match of visibleMatches) {
    if (match.start > cursor) {
      segments.push({
        type: 'plain',
        text: text.slice(cursor, match.start),
        key: `p-${cursor}`,
      });
    }
    segments.push({
      type: 'match',
      match,
      key: match.id,
    });
    cursor = match.end;
  }

  if (cursor < text.length) {
    segments.push({
      type: 'plain',
      text: text.slice(cursor),
      key: `p-end-${cursor}`,
    });
  }

  return (
    <pre className="whitespace-pre-wrap break-words font-mono-tech text-[12.5px] leading-relaxed text-[#22202B]">
      {segments.map((seg) => {
        if (seg.type === 'plain') {
          return <React.Fragment key={seg.key}>{seg.text}</React.Fragment>;
        }
        const meta = PII_CATEGORIES[seg.match.category];
        return (
          <mark
            key={seg.key}
            title={`${meta.label} pattern detected locally`}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 font-medium ${meta.highlightClass}`}
          >
            {showInlineBadges && (
              <span className="text-[10px] font-semibold opacity-75">
                {meta.shortCode}
              </span>
            )}
            <span>{seg.match.value}</span>
          </mark>
        );
      })}
    </pre>
  );
}
