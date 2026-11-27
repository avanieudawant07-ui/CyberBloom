import { CATEGORY_ORDER, PII_CATEGORIES, PROTECTION_MODES } from '../constants/piiConfig';

/**
 * Generate a unique non-PII operation identifier.
 */
export function generateOperationId() {
  return `OP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

/**
 * Calculate the Privacy Coverage Score (0–100%).
 * Measures sanitization coverage of detected entities only; does not guarantee
 * complete privacy or legal compliance.
 */
export function calculatePrivacyCoverageScore({
  hasInput,
  totalDetected,
  totalProtected,
}) {
  if (!hasInput) {
    return {
      score: 100,
      detected: 0,
      protectedCount: 0,
      remainingUnprotected: 0,
      label: 'Standby',
    };
  }

  if (totalDetected === 0) {
    return {
      score: 100,
      detected: 0,
      protectedCount: 0,
      remainingUnprotected: 0,
      label: 'No PII Detected',
    };
  }

  const protectedClamped = Math.min(totalProtected, totalDetected);
  const remaining = Math.max(0, totalDetected - protectedClamped);
  const score = Math.round((protectedClamped / totalDetected) * 100);

  return {
    score,
    detected: totalDetected,
    protectedCount: protectedClamped,
    remainingUnprotected: remaining,
    label: score === 100 ? 'Full Coverage' : 'Partial Coverage',
  };
}

/**
 * Build structured, strictly zero-PII records for all three IndexedDB audit stores.
 */
export function buildWorkspaceRecords({
  operation,
  fileType = 'RAW PROMPT',
  fileName = 'Direct Input',
  fileSizeBytes = 0,
  mode = 'PSEUDONYMIZATION',
  detectionResult = null,
  status = 'Completed',
  exportStatus = 'Not Exported',
  charCount = 0,
  wordCount = 0,
  lineCount = 0,
  hasInput = false,
}) {
  const timestamp = new Date().toISOString();
  const id = generateOperationId();
  const counts = detectionResult?.counts || {};
  const totalDetected = detectionResult?.totalDetected ?? 0;
  const protectedCount = hasInput ? totalDetected : 0;

  const coverage = calculatePrivacyCoverageScore({
    hasInput,
    totalDetected,
    totalProtected: protectedCount,
  });

  const activeCategorySummary = CATEGORY_ORDER.filter(
    (cat) => (counts[cat] || 0) > 0
  )
    .map((cat) => `${PII_CATEGORIES[cat].label}: ${counts[cat]}`)
    .join(', ');

  const historyRecord = {
    id,
    timestamp,
    operation,
    fileType,
    fileName: fileName || 'Direct Input',
    fileSizeBytes,
    mode,
    modeLabel: PROTECTION_MODES[mode]?.name || mode,
    totalDetected,
    protectedCount,
    categoryCounts: Object.fromEntries(
      CATEGORY_ORDER.map((cat) => [cat, counts[cat] || 0])
    ),
    status,
  };

  const auditRecord = {
    id: `AUD-${id}`,
    operationId: id,
    timestamp,
    entitiesProtected: protectedCount,
    protectionMethod: PROTECTION_MODES[mode]?.name || mode,
    mode,
    exportStatus,
    privacyScore: coverage.score,
    luhnStats: detectionResult?.luhnStats || {
      candidatesChecked: 0,
      validCards: 0,
      rejectedByLuhn: 0,
    },
  };

  const promptRecord = {
    id: `PRM-${id}`,
    timestamp,
    operationType: operation,
    status,
    promptDescription:
      charCount > 0
        ? `Processed ${charCount} chars (${wordCount} words, ${lineCount} lines) via ${
            PROTECTION_MODES[mode]?.name || mode
          }. ${
            activeCategorySummary
              ? `Detected [${activeCategorySummary}].`
              : 'No PII patterns detected.'
          } Original input excluded.`
        : 'Workspace input buffer cleared. Zero PII retained.',
  };

  return {
    historyRecord,
    auditRecord,
    promptRecord,
    coverage,
  };
}

/**
 * Generate a downloadable zero-PII JSON sanitization audit report.
 */
export function buildAuditReportJSON({
  detection,
  mode,
  fileMeta,
  coverage,
  historyCount,
}) {
  return JSON.stringify(
    {
      application: 'CyberBloom Local PII Sanitization Workspace',
      generatedAt: new Date().toISOString(),
      privacyGuarantee: '100% client-side processing; zero raw PII included in this report.',
      sourceMetadata: {
        fileType: fileMeta.fileType,
        fileName: fileMeta.fileName || 'Direct Input',
        fileSizeBytes: fileMeta.fileSizeBytes || 0,
      },
      protectionMode: PROTECTION_MODES[mode]?.name || mode,
      coverageSummary: {
        privacyCoverageScorePercent: coverage.score,
        detectedEntities: coverage.detected,
        successfullyProtectedEntities: coverage.protectedCount,
        remainingUnprotectedEntities: coverage.remainingUnprotected,
        disclaimer:
          'Coverage score measures sanitization of detected format patterns only and does not guarantee overall security or regulatory compliance.',
      },
      categoryBreakdown: Object.fromEntries(
        CATEGORY_ORDER.map((cat) => [
          PII_CATEGORIES[cat].label,
          {
            detectedCount: detection.counts[cat] || 0,
            uniqueCount: detection.uniqueCounts?.[cat] || 0,
          },
        ])
      ),
      luhnValidationSummary: detection.luhnStats,
      historicalRecordsCount: historyCount,
    },
    null,
    2
  );
}
