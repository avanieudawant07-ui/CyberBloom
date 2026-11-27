import { PII_CATEGORIES } from '../constants/piiConfig';
import { stripNonDigits } from './luhn';

/**
 * Create a reusable pseudonymization context to guarantee duplicate mapping
 * consistency across an entire text block or multi-row CSV file.
 */
export function createPseudonymContext() {
  return {
    map: new Map(),
    counters: {},
  };
}

/**
 * Partially mask a single PII token, preserving minimal trailing or domain context.
 * @param {string} category
 * @param {string} rawValue
 * @returns {string}
 */
export function applyPartialMask(category, rawValue) {
  switch (category) {
    case 'EMAIL': {
      const atIdx = rawValue.indexOf('@');
      if (atIdx <= 0) return '[REDACTED]';
      const local = rawValue.slice(0, atIdx);
      const domain = rawValue.slice(atIdx + 1);
      const visiblePrefix = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
      return `${visiblePrefix}****@${domain}`;
    }

    case 'PHONE': {
      const digits = stripNonDigits(rawValue);
      const last4 = digits.slice(-4);
      const hasCountryPrefix = /^\+?91/.test(rawValue.trim());
      return hasCountryPrefix ? `+91 ******${last4}` : `******${last4}`;
    }

    case 'IP_ADDRESS': {
      const octets = rawValue.split('.');
      const lastOctet = octets[3] || '***';
      return `***.***.***.${lastOctet}`;
    }

    case 'PAN': {
      const clean = rawValue.trim();
      return `******${clean.slice(-4)}`;
    }

    case 'AADHAAR': {
      const digits = stripNonDigits(rawValue);
      const last4 = digits.slice(-4);
      if (rawValue.includes('-')) return `XXXX-XXXX-${last4}`;
      if (rawValue.includes(' ')) return `XXXX XXXX ${last4}`;
      return `XXXXXXXX${last4}`;
    }

    case 'CREDIT_CARD': {
      const digits = stripNonDigits(rawValue);
      const last4 = digits.slice(-4);
      return `****-****-****-${last4}`;
    }

    default:
      return '[REDACTED]';
  }
}

/**
 * Resolve a single PII match into its sanitized representation according to the mode.
 * @param {{ category: string, value: string, normalized: string }} match
 * @param {'FULL_MASK' | 'PARTIAL_MASK' | 'PSEUDONYMIZATION'} mode
 * @param {{ map: Map<string, string>, counters: Record<string, number> }} pseudonymContext
 * @returns {string}
 */
export function sanitizeMatch(match, mode, pseudonymContext) {
  if (mode === 'FULL_MASK') {
    return '[REDACTED]';
  }

  if (mode === 'PARTIAL_MASK') {
    return applyPartialMask(match.category, match.value);
  }

  if (mode === 'PSEUDONYMIZATION') {
    const key = `${match.category}:${match.normalized}`;
    if (pseudonymContext.map.has(key)) {
      return pseudonymContext.map.get(key);
    }
    const nextCount = (pseudonymContext.counters[match.category] || 0) + 1;
    pseudonymContext.counters[match.category] = nextCount;
    const prefix = PII_CATEGORIES[match.category]?.pseudonymPrefix || match.category;
    const token = `${prefix}_${String(nextCount).padStart(2, '0')}`;
    pseudonymContext.map.set(key, token);
    return token;
  }

  return '[REDACTED]';
}

/**
 * Redact all detected PII matches inside text using the chosen protection mode.
 *
 * @param {string} text
 * @param {Array<{id: string, category: string, value: string, start: number, end: number, normalized: string}>} matches
 * @param {'FULL_MASK' | 'PARTIAL_MASK' | 'PSEUDONYMIZATION'} mode
 * @param {{ map: Map<string, string>, counters: Record<string, number> }} [existingContext]
 * @returns {{
 *   sanitizedText: string,
 *   replacements: Array<{id: string, category: string, replacement: string}>,
 *   pseudonymCount: number
 * }}
 */
export function redactText(text, matches, mode, existingContext) {
  const source = String(text || '');
  if (!source || !matches || matches.length === 0) {
    return {
      sanitizedText: source,
      replacements: [],
      pseudonymCount: existingContext ? existingContext.map.size : 0,
    };
  }

  const context = existingContext || createPseudonymContext();
  const segments = [];
  const replacements = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      segments.push(source.slice(cursor, match.start));
    }
    const replacement = sanitizeMatch(match, mode, context);
    segments.push(replacement);
    replacements.push({
      id: match.id,
      category: match.category,
      replacement,
    });
    cursor = match.end;
  }

  if (cursor < source.length) {
    segments.push(source.slice(cursor));
  }

  return {
    sanitizedText: segments.join(''),
    replacements,
    pseudonymCount: context.map.size,
  };
}
