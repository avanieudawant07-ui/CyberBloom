import { CATEGORY_ORDER } from '../constants/piiConfig';
import { passesLuhn, stripNonDigits } from './luhn';

const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

// Credit card candidates: 13-19 digits continuous or grouped (4-4-4-4+, 4-6-5 Amex)
const CARD_CANDIDATE_REGEX =
  /(?<!\d)(?<!\d[\s-])(?:\d{4}(?:[\s-]\d{4}){2,3}(?:[\s-]\d{1,3})?|\d{4}[\s-]\d{6}[\s-]\d{5}|\d{13,19})(?![\s-]?\d)/g;

// Aadhaar: 12 digits starting with 2-9, uniform space/hyphen separator or continuous
const AADHAAR_REGEX =
  /(?<!\d)(?<!\d[\s-])[2-9]\d{3}(?:([\s-])\d{4}\1\d{4}|\d{8})(?![\s-]?\d)/g;

// Indian PAN: 5 uppercase letters, 4 digits, 1 uppercase letter
const PAN_REGEX = /(?<![A-Z0-9])[A-Z]{5}[0-9]{4}[A-Z](?![A-Z0-9])/g;

// IPv4: strict 0-255 per octet; allow trailing sentence punctuation while rejecting 5-octet sequences
const IPV4_REGEX =
  /(?<!\d\.)(?<!\d)(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?!\.\d)(?!\d)/g;

// Indian mobile phone: optional +91 / 91 / 0 prefix + [6-9] followed by 9 digits (with optional standard spacing/hyphens)
const PHONE_REGEX =
  /(?<![\d.])(?<!\d[\s-])(?:(?:\+91|91|0)[\s-]?)?(?:[6-9]\d{4}[\s-]?\d{5}|[6-9]\d{2}[\s-]\d{3}[\s-]\d{4})(?![\s-]?\d)(?!\.\d)/g;

/**
 * Normalize a detected PII token so duplicate instances share a canonical key.
 * @param {string} category
 * @param {string} rawValue
 * @returns {string}
 */
export function normalizePIIValue(category, rawValue) {
  switch (category) {
    case 'EMAIL':
      return rawValue.trim().toLowerCase();
    case 'PHONE':
      return stripNonDigits(rawValue).slice(-10);
    case 'PAN':
      return rawValue.trim().toUpperCase();
    case 'AADHAAR':
    case 'CREDIT_CARD':
      return stripNonDigits(rawValue);
    case 'IP_ADDRESS':
    default:
      return rawValue.trim();
  }
}

function spansOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function collectRegexMatches(text, regex) {
  const found = [];
  regex.lastIndex = 0;
  let match = regex.exec(text);
  while (match !== null) {
    found.push({
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
    if (match.index === regex.lastIndex) {
      regex.lastIndex += 1;
    }
    match = regex.exec(text);
  }
  return found;
}

/**
 * Detect all supported PII entities inside raw text completely client-side.
 * Enforces Luhn verification on credit cards and prevents partial overlaps.
 *
 * @param {string} text
 * @returns {{
 *   matches: Array<{id: string, category: string, value: string, start: number, end: number, normalized: string}>,
 *   counts: Record<string, number>,
 *   uniqueCounts: Record<string, number>,
 *   totalDetected: number,
 *   luhnStats: { candidatesChecked: number, validCards: number, rejectedByLuhn: number }
 * }}
 */
export function detectPII(text) {
  const source = String(text || '');
  const counts = Object.fromEntries(CATEGORY_ORDER.map((cat) => [cat, 0]));
  const uniqueSets = Object.fromEntries(CATEGORY_ORDER.map((cat) => [cat, new Set()]));

  if (!source) {
    return {
      matches: [],
      counts,
      uniqueCounts: Object.fromEntries(CATEGORY_ORDER.map((cat) => [cat, 0])),
      totalDetected: 0,
      luhnStats: { candidatesChecked: 0, validCards: 0, rejectedByLuhn: 0 },
    };
  }

  const accepted = [];
  const blockedSpans = [];
  let candidatesChecked = 0;
  let rejectedByLuhn = 0;

  const isBlockedOrAccepted = (start, end) =>
    accepted.some((m) => spansOverlap(start, end, m.start, m.end)) ||
    blockedSpans.some((b) => spansOverlap(start, end, b.start, b.end));

  // 1. Emails first so embedded numbers/tokens inside email addresses are not misclassified
  for (const hit of collectRegexMatches(source, EMAIL_REGEX)) {
    if (!isBlockedOrAccepted(hit.start, hit.end)) {
      accepted.push({
        category: 'EMAIL',
        ...hit,
        normalized: normalizePIIValue('EMAIL', hit.value),
      });
    }
  }

  // 2. Credit card candidates with mandatory Luhn checksum validation
  for (const hit of collectRegexMatches(source, CARD_CANDIDATE_REGEX)) {
    const digitLen = stripNonDigits(hit.value).length;
    if (digitLen < 13 || digitLen > 19) continue;
    if (isBlockedOrAccepted(hit.start, hit.end)) continue;

    candidatesChecked += 1;
    if (passesLuhn(hit.value)) {
      accepted.push({
        category: 'CREDIT_CARD',
        ...hit,
        normalized: normalizePIIValue('CREDIT_CARD', hit.value),
      });
    } else {
      rejectedByLuhn += 1;
      // Block span so sub-digits of a failed card candidate are not sliced into Aadhaar/Phone
      blockedSpans.push({ start: hit.start, end: hit.end });
    }
  }

  // 3. Aadhaar (12 digits)
  for (const hit of collectRegexMatches(source, AADHAAR_REGEX)) {
    if (!isBlockedOrAccepted(hit.start, hit.end)) {
      accepted.push({
        category: 'AADHAAR',
        ...hit,
        normalized: normalizePIIValue('AADHAAR', hit.value),
      });
    }
  }

  // 4. Indian PAN
  for (const hit of collectRegexMatches(source, PAN_REGEX)) {
    if (!isBlockedOrAccepted(hit.start, hit.end)) {
      accepted.push({
        category: 'PAN',
        ...hit,
        normalized: normalizePIIValue('PAN', hit.value),
      });
    }
  }

  // 5. IPv4 (strict 0-255 octets)
  for (const hit of collectRegexMatches(source, IPV4_REGEX)) {
    if (!isBlockedOrAccepted(hit.start, hit.end)) {
      accepted.push({
        category: 'IP_ADDRESS',
        ...hit,
        normalized: normalizePIIValue('IP_ADDRESS', hit.value),
      });
    }
  }

  // 6. Indian Phone Numbers
  for (const hit of collectRegexMatches(source, PHONE_REGEX)) {
    if (!isBlockedOrAccepted(hit.start, hit.end)) {
      accepted.push({
        category: 'PHONE',
        ...hit,
        normalized: normalizePIIValue('PHONE', hit.value),
      });
    }
  }

  // Sort chronologically by start index
  accepted.sort((a, b) => a.start - b.start);

  const matches = accepted.map((item, idx) => {
    counts[item.category] += 1;
    uniqueSets[item.category].add(item.normalized);
    return {
      ...item,
      id: `${item.category}_${idx}`,
    };
  });

  const uniqueCounts = Object.fromEntries(
    CATEGORY_ORDER.map((cat) => [cat, uniqueSets[cat].size])
  );

  return {
    matches,
    counts,
    uniqueCounts,
    totalDetected: matches.length,
    luhnStats: {
      candidatesChecked,
      validCards: counts.CREDIT_CARD,
      rejectedByLuhn,
    },
  };
}
