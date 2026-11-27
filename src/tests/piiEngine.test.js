import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SYNTHETIC_SAMPLE_CSV,
  SYNTHETIC_SAMPLE_TEXT,
} from '../constants/piiConfig';
import {
  buildAuditReportJSON,
  buildWorkspaceRecords,
  calculatePrivacyCoverageScore,
} from '../utils/activityLogger';
import { parseCSV, sanitizeCSV } from '../utils/csvProcessor';
import { formatFileSize, validateUploadedFile } from '../utils/fileProcessor';
import { explainLuhn, passesLuhn } from '../utils/luhn';
import { detectPII } from '../utils/piiDetector';
import { redactText } from '../utils/piiRedactor';
import {
  addAuditRecord,
  addPromptLog,
  addSanitizationHistory,
  clearAllWorkspaceHistory,
  deleteSanitizationHistoryRecord,
  deleteSavedSnapshot,
  getAllAuditRecords,
  getAllPromptLogs,
  getAllSanitizationHistory,
  getAllSavedSnapshots,
  getUserPreferences,
  saveSanitizedSnapshot,
  saveUserPreferences,
} from '../utils/privacyDb';

describe('CyberBloom // Luhn Verification Engine', () => {
  it('validates legitimate test credit card numbers', () => {
    expect(passesLuhn('4111 1111 1111 1111')).toBe(true);
    expect(passesLuhn('4242-4242-4242-4242')).toBe(true);
    expect(passesLuhn('5500000000000004')).toBe(true);
  });

  it('rejects Luhn-invalid numbers and trivial all-identical digits', () => {
    expect(passesLuhn('4111 1111 1111 1112')).toBe(false);
    expect(passesLuhn('5432 9876 5432 1098')).toBe(false);
    expect(passesLuhn('0000 0000 0000 0000')).toBe(false);
    expect(passesLuhn('12345')).toBe(false);
  });

  it('produces educational Luhn breakdown steps accurately', () => {
    const valid = explainLuhn('4111 1111 1111 1111');
    expect(valid.valid).toBe(true);
    expect(valid.remainder).toBe(0);
    expect(valid.steps.length).toBe(16);

    const invalid = explainLuhn('4111 1111 1111 1112');
    expect(invalid.valid).toBe(false);
    expect(invalid.remainder).toBe(1);
  });
});

describe('CyberBloom // Multi-Category PII Detection', () => {
  it('detects all 6 PII categories accurately and ignores invalid IPv4 / Luhn-failed numbers', () => {
    const res = detectPII(SYNTHETIC_SAMPLE_TEXT);

    expect(res.counts.EMAIL).toBe(5);
    expect(res.uniqueCounts.EMAIL).toBe(3);
    expect(res.counts.PHONE).toBe(4);
    expect(res.uniqueCounts.PHONE).toBe(3);
    expect(res.counts.IP_ADDRESS).toBe(3);
    expect(res.counts.PAN).toBe(3);
    expect(res.uniqueCounts.PAN).toBe(2);
    expect(res.counts.AADHAAR).toBe(2);
    expect(res.counts.CREDIT_CARD).toBe(3);
    expect(res.luhnStats.rejectedByLuhn).toBe(2);
    expect(res.totalDetected).toBe(20);
  });

  it('does not misclassify Luhn-failed 16-digit numbers or malformed IPv4 octets', () => {
    const sample =
      'Rejected card: 4111 1111 1111 1112 and 5432 9876 5432 1098. Bad IPs: 256.10.1.1, 1.2.3.4.5';
    const res = detectPII(sample);

    expect(res.totalDetected).toBe(0);
    expect(res.luhnStats.rejectedByLuhn).toBe(2);
  });
});

describe('CyberBloom // Protection Modes & Duplicate Consistency', () => {
  const sample =
    'Contact ananya.rao@vault.in or call +91 98201 44210. Repeat: ANANYA.RAO@VAULT.IN / 9820144210. Card: 4111 1111 1111 1111. PAN: ABCDE1234F. Aadhaar: 4821 9034 1182. IP: 192.168.14.22.';

  it('applies FULL MASK replacing every detected entity with [REDACTED]', () => {
    const det = detectPII(sample);
    const { sanitizedText } = redactText(sample, det.matches, 'FULL_MASK');

    expect(sanitizedText).not.toContain('ananya.rao@vault.in');
    expect(sanitizedText).not.toContain('98201');
    expect(sanitizedText).not.toContain('4111');
    expect(sanitizedText).not.toContain('ABCDE1234F');
    expect(sanitizedText).not.toContain('4821');
    expect(sanitizedText).not.toContain('192.168.14.22');
    expect(sanitizedText.match(/\[REDACTED\]/g)?.length).toBe(det.totalDetected);
  });

  it('applies PARTIAL MASK preserving limited trailing or domain context', () => {
    const det = detectPII(sample);
    const { sanitizedText } = redactText(sample, det.matches, 'PARTIAL_MASK');

    expect(sanitizedText).toContain('an****@vault.in');
    expect(sanitizedText).toContain('+91 ******4210');
    expect(sanitizedText).toContain('****-****-****-1111');
    expect(sanitizedText).toContain('******234F');
    expect(sanitizedText).toContain('XXXX XXXX 1182');
    expect(sanitizedText).toContain('***.***.***.22');
  });

  it('applies PSEUDONYMIZATION with consistent duplicate mapping across normalized values', () => {
    const det = detectPII(sample);
    const { sanitizedText } = redactText(sample, det.matches, 'PSEUDONYMIZATION');

    expect(sanitizedText.match(/EMAIL_01/g)?.length).toBe(2);
    expect(sanitizedText.match(/PHONE_01/g)?.length).toBe(2);
    expect(sanitizedText).toContain('CARD_01');
    expect(sanitizedText).toContain('PAN_01');
    expect(sanitizedText).toContain('AADHAAR_01');
    expect(sanitizedText).toContain('IP_01');
  });
});

describe('CyberBloom // CSV Preservation & File Validation', () => {
  it('preserves CSV rows, columns, and quoted commas while maintaining cross-row pseudonyms', () => {
    const originalParsed = parseCSV(SYNTHETIC_SAMPLE_CSV);
    const csvResult = sanitizeCSV(SYNTHETIC_SAMPLE_CSV, 'PSEUDONYMIZATION');
    const sanitizedParsed = parseCSV(csvResult.sanitizedText);

    expect(sanitizedParsed.rows.length).toBe(originalParsed.rows.length);
    for (let i = 0; i < originalParsed.rows.length; i += 1) {
      expect(sanitizedParsed.rows[i].length).toBe(originalParsed.rows[i].length);
    }

    expect(sanitizedParsed.rows[1][2]).toBe('EMAIL_01');
    expect(sanitizedParsed.rows[3][2]).toBe('EMAIL_01');
    expect(sanitizedParsed.rows[1][3]).toBe('PHONE_01');
    expect(sanitizedParsed.rows[3][3]).toBe('PHONE_01');
    expect(sanitizedParsed.rows[1][5]).toBe('PAN_01');
    expect(sanitizedParsed.rows[3][5]).toBe('PAN_01');
    expect(sanitizedParsed.rows[3][7]).toBe('4111 1111 1111 1112');
    expect(sanitizedParsed.rows[1][8]).toBe('Primary synthetic record, valid Luhn');
  });

  it('validates TXT/CSV extensions and rejects unsupported files', () => {
    expect(validateUploadedFile({ name: 'logs.txt', size: 512 })).toEqual({
      valid: true,
      fileType: 'TXT',
    });
    expect(validateUploadedFile({ name: 'users.CSV', size: 1024 })).toEqual({
      valid: true,
      fileType: 'CSV',
    });

    const badExt = validateUploadedFile({ name: 'payload.pdf', size: 1024 });
    expect(badExt.valid).toBe(false);
    expect(badExt.error).toContain('Unsupported file');

    const tooLarge = validateUploadedFile({
      name: 'huge.csv',
      size: 6 * 1024 * 1024,
    });
    expect(tooLarge.valid).toBe(false);
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});

describe('CyberBloom // Privacy Score & Zero-PII Audit Builders', () => {
  it('calculates privacy coverage score and generates zero-PII audit records & reports', () => {
    const det = detectPII(SYNTHETIC_SAMPLE_TEXT);
    const coverage = calculatePrivacyCoverageScore({
      hasInput: true,
      totalDetected: det.totalDetected,
      totalProtected: det.totalDetected,
    });
    expect(coverage.score).toBe(100);
    expect(coverage.remainingUnprotected).toBe(0);

    const { historyRecord, auditRecord, promptRecord } = buildWorkspaceRecords({
      operation: 'Test Scan',
      fileType: 'TXT',
      fileName: 'synthetic.txt',
      mode: 'PSEUDONYMIZATION',
      detectionResult: det,
      status: 'Protected',
      charCount: SYNTHETIC_SAMPLE_TEXT.length,
      wordCount: 110,
      lineCount: 24,
      hasInput: true,
    });

    const reportJson = buildAuditReportJSON({
      detection: det,
      mode: 'PSEUDONYMIZATION',
      fileMeta: { fileType: 'TXT', fileName: 'synthetic.txt', fileSizeBytes: 900 },
      coverage,
      historyCount: 1,
    });

    const combined = JSON.stringify({ historyRecord, auditRecord, promptRecord, reportJson });
    expect(combined).not.toContain('ananya.rao@cyberbloom-lab.test');
    expect(combined).not.toContain('98201');
    expect(combined).not.toContain('ABCDE1234F');
    expect(combined).not.toContain('4111 1111 1111 1111');
    expect(combined).not.toContain('4821 9034 1182');
  });
});

describe('CyberBloom // IndexedDB (PrivacyWorkspaceDB) Persistence', () => {
  beforeEach(async () => {
    await clearAllWorkspaceHistory();
  });

  it('persists, retrieves, strips raw PII fields, and deletes records across object stores', async () => {
    const det = detectPII(SYNTHETIC_SAMPLE_TEXT);
    const { historyRecord, auditRecord, promptRecord } = buildWorkspaceRecords({
      operation: 'Synthetic Sample Scan',
      fileType: 'TXT',
      fileName: 'sample.txt',
      mode: 'FULL_MASK',
      detectionResult: det,
      status: 'Protected',
      exportStatus: 'Exported',
      charCount: 500,
      wordCount: 80,
      lineCount: 15,
      hasInput: true,
    });

    // Inject prohibited rawInput to verify privacyDb strips it before storing
    await addSanitizationHistory({
      ...historyRecord,
      rawInput: 'SHOULD_BE_STRIPPED_ananya.rao@cyberbloom-lab.test',
    });
    await addAuditRecord(auditRecord);
    await addPromptLog(promptRecord);

    const history = await getAllSanitizationHistory();
    const audits = await getAllAuditRecords();
    const prompts = await getAllPromptLogs();

    expect(history.length).toBe(1);
    expect(history[0].id).toBe(historyRecord.id);
    expect(history[0].rawInput).toBeUndefined();
    expect(audits.length).toBe(1);
    expect(audits[0].entitiesProtected).toBe(det.totalDetected);
    expect(prompts.length).toBe(1);

    await deleteSanitizationHistoryRecord(historyRecord.id);
    const afterDelete = await getAllSanitizationHistory();
    expect(afterDelete.length).toBe(0);
  });

  it('persists user preferences and optional saved snapshots, and clears all history cleanly', async () => {
    await saveUserPreferences({
      preferredMode: 'PARTIAL_MASK',
      autoLogPrompts: false,
    });
    const prefs = await getUserPreferences();
    expect(prefs.preferredMode).toBe('PARTIAL_MASK');
    expect(prefs.autoLogPrompts).toBe(false);

    await saveSanitizedSnapshot({
      id: 'SNP-01',
      label: 'Masked Log',
      fileType: 'TXT',
      mode: 'PARTIAL_MASK',
      entityCount: 5,
      sanitizedOutput: 'Contact an****@vault.in',
    });

    let snapshots = await getAllSavedSnapshots();
    expect(snapshots.length).toBe(1);
    expect(snapshots[0].hasIdentifyingRiskWarning).toBe(true);

    await deleteSavedSnapshot('SNP-01');
    snapshots = await getAllSavedSnapshots();
    expect(snapshots.length).toBe(0);

    await saveSanitizedSnapshot({
      id: 'SNP-02',
      label: 'Full Mask Log',
      fileType: 'TXT',
      mode: 'FULL_MASK',
      entityCount: 2,
      sanitizedOutput: '[REDACTED]',
    });
    await clearAllWorkspaceHistory();
    expect((await getAllSavedSnapshots()).length).toBe(0);
  });
});
