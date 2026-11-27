import { CATEGORY_ORDER } from '../constants/piiConfig';
import { detectPII } from './piiDetector';
import { createPseudonymContext, redactText } from './piiRedactor';

/**
 * Parse RFC-4180 CSV text into a 2D array of strings while preserving original line ending style.
 * @param {string} csvText
 * @returns {{ rows: string[][], lineEnding: string }}
 */
export function parseCSV(csvText) {
  const source = String(csvText || '');
  const lineEnding = source.includes('\r\n') ? '\r\n' : '\n';
  if (!source) {
    return { rows: [], lineEnding };
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentField);
      currentField = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return { rows, lineEnding };
}

function escapeCSVCell(value) {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serialize a 2D array of cells back into valid CSV preserving structure and quoting.
 * @param {string[][]} rows
 * @param {string} [lineEnding='\n']
 * @returns {string}
 */
export function serializeCSV(rows, lineEnding = '\n') {
  return rows.map((row) => row.map(escapeCSVCell).join(',')).join(lineEnding);
}

/**
 * Detect and sanitize a CSV payload cell-by-cell so delimiters and quoted columns
 * remain intact while maintaining a shared pseudonymization table across the entire file.
 *
 * @param {string} csvText
 * @param {'FULL_MASK' | 'PARTIAL_MASK' | 'PSEUDONYMIZATION'} mode
 */
export function sanitizeCSV(csvText, mode) {
  const { rows, lineEnding } = parseCSV(csvText);
  const pseudonymContext = createPseudonymContext();

  const counts = Object.fromEntries(CATEGORY_ORDER.map((cat) => [cat, 0]));
  const uniqueSets = Object.fromEntries(CATEGORY_ORDER.map((cat) => [cat, new Set()]));
  let totalDetected = 0;
  let candidatesChecked = 0;
  let rejectedByLuhn = 0;

  const sanitizedRows = rows.map((row) =>
    row.map((cell) => {
      const detection = detectPII(cell);
      totalDetected += detection.totalDetected;
      candidatesChecked += detection.luhnStats.candidatesChecked;
      rejectedByLuhn += detection.luhnStats.rejectedByLuhn;

      for (const cat of CATEGORY_ORDER) {
        counts[cat] += detection.counts[cat];
      }
      for (const match of detection.matches) {
        uniqueSets[match.category].add(match.normalized);
      }

      if (detection.totalDetected === 0) {
        return cell;
      }

      const { sanitizedText } = redactText(cell, detection.matches, mode, pseudonymContext);
      return sanitizedText;
    })
  );

  // Also compute flat-text match spans for inline visual inspection
  const flatDetection = detectPII(csvText);

  const uniqueCounts = Object.fromEntries(
    CATEGORY_ORDER.map((cat) => [cat, uniqueSets[cat].size])
  );

  return {
    sanitizedText: serializeCSV(sanitizedRows, lineEnding),
    rowsCount: rows.length,
    colsCount: rows[0]?.length || 0,
    sanitizedRows,
    originalRows: rows,
    detection: {
      matches: flatDetection.matches,
      counts,
      uniqueCounts,
      totalDetected,
      luhnStats: {
        candidatesChecked,
        validCards: counts.CREDIT_CARD,
        rejectedByLuhn,
      },
    },
    pseudonymCount: pseudonymContext.map.size,
  };
}
