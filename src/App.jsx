import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmDialog from './components/ConfirmDialog';
import FooterBar from './components/FooterBar';
import SidebarNav from './components/SidebarNav';
import ToastContainer from './components/ToastContainer';
import { PROTECTION_MODES } from './constants/piiConfig';
import ActivityLogPage from './pages/ActivityLogPage';
import IntelligenceReport from './pages/IntelligenceReport';
import LandingPage from './pages/LandingPage';
import PrivacyArchitecturePage from './pages/PrivacyArchitecturePage';
import SanitizationStudio from './pages/SanitizationStudio';
import {
  buildAuditReportJSON,
  buildWorkspaceRecords,
  calculatePrivacyCoverageScore,
  generateOperationId,
} from './utils/activityLogger';
import { sanitizeCSV } from './utils/csvProcessor';
import { downloadBlobFile } from './utils/fileProcessor';
import { detectPII } from './utils/piiDetector';
import { redactText } from './utils/piiRedactor';
import {
  addAuditRecord,
  addPromptLog,
  addSanitizationHistory,
  clearAllWorkspaceHistory,
  DEFAULT_PREFERENCES,
  deleteSanitizationHistoryRecord,
  deleteSavedSnapshot,
  getAllAuditRecords,
  getAllPromptLogs,
  getAllSanitizationHistory,
  getAllSavedSnapshots,
  getUserPreferences,
  saveSanitizedSnapshot,
  saveUserPreferences,
} from './utils/privacyDb';

const INITIAL_FILE_META = {
  fileName: '',
  fileType: 'RAW PROMPT',
  fileSizeBytes: 0,
};

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [inputText, setInputText] = useState('');
  const [fileMeta, setFileMeta] = useState(INITIAL_FILE_META);
  const [mode, setMode] = useState(DEFAULT_PREFERENCES.preferredMode);

  // IndexedDB state
  const [historyRecords, setHistoryRecords] = useState([]);
  const [auditRecords, setAuditRecords] = useState([]);
  const [promptLogs, setPromptLogs] = useState([]);
  const [savedSnapshots, setSavedSnapshots] = useState([]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [dbError, setDbError] = useState('');

  // Interactive UI state
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false });

  const lastAutoLoggedSignature = useRef('');

  const pushToast = useCallback(({ type = 'info', title, message }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hydrate all stores from PrivacyWorkspaceDB on initial load
  useEffect(() => {
    let active = true;
    async function hydrateDB() {
      try {
        const [history, audits, prompts, saved, prefs] = await Promise.all([
          getAllSanitizationHistory(),
          getAllAuditRecords(),
          getAllPromptLogs(),
          getAllSavedSnapshots(),
          getUserPreferences(),
        ]);
        if (!active) return;
        setHistoryRecords(history);
        setAuditRecords(audits);
        setPromptLogs(prompts);
        setSavedSnapshots(saved);
        setPreferences(prefs);
        if (prefs.preferredMode && PROTECTION_MODES[prefs.preferredMode]) {
          setMode(prefs.preferredMode);
        }
      } catch (err) {
        if (!active) return;
        setDbError(err?.message || 'Unable to initialize local IndexedDB.');
      }
    }
    hydrateDB();
    return () => {
      active = false;
    };
  }, []);

  // Real-time local detection & sanitization (resets pseudonym mappings per document)
  const processingResult = useMemo(() => {
    if (!inputText) {
      return {
        detection: detectPII(''),
        sanitizedText: '',
        csvPreview: null,
      };
    }

    if (fileMeta.fileType === 'CSV') {
      const csvRes = sanitizeCSV(inputText, mode);
      return {
        detection: csvRes.detection,
        sanitizedText: csvRes.sanitizedText,
        csvPreview: {
          rowsCount: csvRes.rowsCount,
          colsCount: csvRes.colsCount,
          sanitizedRows: csvRes.sanitizedRows,
        },
      };
    }

    const detection = detectPII(inputText);
    const { sanitizedText } = redactText(inputText, detection.matches, mode);
    return {
      detection,
      sanitizedText,
      csvPreview: null,
    };
  }, [inputText, fileMeta.fileType, mode]);

  const coverageScore = useMemo(
    () =>
      calculatePrivacyCoverageScore({
        hasInput: Boolean(inputText.trim()),
        totalDetected: processingResult.detection.totalDetected,
        totalProtected: processingResult.detection.totalDetected,
      }),
    [inputText, processingResult.detection.totalDetected]
  );

  // Persist non-PII operation metadata into IndexedDB
  const recordOperationToDB = useCallback(
    async ({
      operation,
      targetFileMeta,
      targetMode,
      detection,
      status,
      exportStatus = 'Not Exported',
      textForMetrics = '',
      includePromptLog = true,
    }) => {
      const trimmed = textForMetrics.trim();
      const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
      const lineCount = textForMetrics ? textForMetrics.split(/\r?\n/).length : 0;

      const { historyRecord, auditRecord, promptRecord } = buildWorkspaceRecords({
        operation,
        fileType: targetFileMeta.fileType,
        fileName: targetFileMeta.fileName || 'Direct Input',
        fileSizeBytes: targetFileMeta.fileSizeBytes || 0,
        mode: targetMode,
        detectionResult: detection,
        status,
        exportStatus,
        charCount: textForMetrics.length,
        wordCount,
        lineCount,
        hasInput: Boolean(trimmed),
      });

      setHistoryRecords((prev) => [historyRecord, ...prev]);
      setAuditRecords((prev) => [auditRecord, ...prev]);
      if (includePromptLog) {
        setPromptLogs((prev) => [promptRecord, ...prev]);
      }

      try {
        await Promise.all([
          addSanitizationHistory(historyRecord),
          addAuditRecord(auditRecord),
          includePromptLog ? addPromptLog(promptRecord) : Promise.resolve(),
        ]);
      } catch (err) {
        setDbError(err?.message || 'Failed to persist record to IndexedDB.');
      }
    },
    []
  );

  // Debounced prompt metadata logging for typed/pasted input
  useEffect(() => {
    if (
      !preferences.autoLogPrompts ||
      !inputText.trim() ||
      fileMeta.fileType !== 'RAW PROMPT'
    ) {
      return undefined;
    }

    const signature = `${inputText.length}:${processingResult.detection.totalDetected}:${mode}`;
    if (signature === lastAutoLoggedSignature.current) {
      return undefined;
    }

    const timer = setTimeout(() => {
      lastAutoLoggedSignature.current = signature;
      recordOperationToDB({
        operation: 'Prompt Input Sanitization',
        targetFileMeta: fileMeta,
        targetMode: mode,
        detection: processingResult.detection,
        status:
          processingResult.detection.totalDetected > 0
            ? 'Protected'
            : 'Scanned',
        textForMetrics: inputText,
        includePromptLog: true,
      });
    }, 1400);

    return () => clearTimeout(timer);
  }, [
    inputText,
    fileMeta,
    mode,
    processingResult.detection,
    preferences.autoLogPrompts,
    recordOperationToDB,
  ]);

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (nextText) => {
    setInputText(nextText);
    if (!nextText) {
      setFileMeta(INITIAL_FILE_META);
    }
  };

  const handleLoadSample = (sampleContent, sampleType, sampleName) => {
    const nextMeta = {
      fileType: sampleType,
      fileName: sampleName,
      fileSizeBytes: new Blob([sampleContent]).size,
    };
    setInputText(sampleContent);
    setFileMeta(nextMeta);

    const det =
      sampleType === 'CSV'
        ? sanitizeCSV(sampleContent, mode).detection
        : detectPII(sampleContent);

    recordOperationToDB({
      operation: `Load Synthetic ${sampleType} Sample`,
      targetFileMeta: nextMeta,
      targetMode: mode,
      detection: det,
      status: 'Protected',
      textForMetrics: sampleContent,
    });

    pushToast({
      type: 'success',
      title: `Sample ${sampleType} Loaded`,
      message: `${det.totalDetected} entities detected and protected locally.`,
    });
  };

  const handleFileLoaded = ({ content, fileName, fileType, fileSizeBytes }) => {
    const nextMeta = { fileName, fileType, fileSizeBytes };
    setInputText(content);
    setFileMeta(nextMeta);

    const det =
      fileType === 'CSV'
        ? sanitizeCSV(content, mode).detection
        : detectPII(content);

    recordOperationToDB({
      operation: 'File Upload & Scan',
      targetFileMeta: nextMeta,
      targetMode: mode,
      detection: det,
      status: det.totalDetected > 0 ? 'Protected' : 'Scanned',
      textForMetrics: content,
    });

    pushToast({
      type: 'success',
      title: `${fileName} Processed`,
      message: `${det.totalDetected} sensitive entities detected (${fileType}).`,
    });
  };

  const handleFileError = (message) => {
    pushToast({
      type: 'error',
      title: 'Operation Failed',
      message,
    });
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);

    if (inputText.trim()) {
      const modeName = PROTECTION_MODES[nextMode]?.name || nextMode;
      recordOperationToDB({
        operation: `Switch Mode → ${modeName}`,
        targetFileMeta: fileMeta,
        targetMode: nextMode,
        detection: processingResult.detection,
        status: 'Protected',
        textForMetrics: inputText,
      });

      pushToast({
        type: 'info',
        title: `Protection Mode: ${modeName}`,
        message: 'Output updated locally in real time.',
      });
    }
  };

  const performClearWorkspace = () => {
    const prevMeta = fileMeta;
    setInputText('');
    setFileMeta(INITIAL_FILE_META);
    lastAutoLoggedSignature.current = '';

    recordOperationToDB({
      operation: 'Workspace Buffer Cleared',
      targetFileMeta: prevMeta,
      targetMode: mode,
      detection: detectPII(''),
      status: 'Cleared',
      textForMetrics: '',
    });

    setConfirmState({ open: false });
    pushToast({
      type: 'info',
      title: 'Workspace Cleared',
      message: 'Input and preview buffers have been reset.',
    });
  };

  const handleRequestClear = () => {
    if (!inputText) return;
    setConfirmState({
      open: true,
      title: 'Clear Workspace Input?',
      message:
        'This will remove the current text and sanitized preview from memory. Local audit metadata in IndexedDB will remain intact.',
      confirmLabel: 'Clear Workspace',
      tone: 'warning',
      onConfirm: performClearWorkspace,
    });
  };

  const handleExportProtectedFile = () => {
    const { sanitizedText, detection } = processingResult;
    if (!sanitizedText) return;

    const isCSV = fileMeta.fileType === 'CSV';
    const mimeType = isCSV
      ? 'text/csv;charset=utf-8'
      : 'text/plain;charset=utf-8';
    const baseName = fileMeta.fileName
      ? fileMeta.fileName.replace(/\.[^/.]+$/, '')
      : 'cyberbloom-sanitized';
    const exportName = `sanitized-${baseName}.${isCSV ? 'csv' : 'txt'}`;

    downloadBlobFile({
      content: sanitizedText,
      filename: exportName,
      mimeType,
    });

    recordOperationToDB({
      operation: 'Download Protected File',
      targetFileMeta: fileMeta,
      targetMode: mode,
      detection,
      status: 'Exported',
      exportStatus: `Exported (${exportName})`,
      textForMetrics: inputText,
    });

    pushToast({
      type: 'success',
      title: 'Protected File Downloaded',
      message: `Saved locally as ${exportName}.`,
    });
  };

  const handleSaveSnapshot = async () => {
    const { sanitizedText, detection } = processingResult;
    if (!sanitizedText) return;

    const snapshot = {
      id: `SNP-${generateOperationId()}`,
      timestamp: new Date().toISOString(),
      label: fileMeta.fileName
        ? `Sanitized: ${fileMeta.fileName}`
        : 'Sanitized Text Snapshot',
      fileType: fileMeta.fileType,
      mode,
      entityCount: detection.totalDetected,
      sanitizedOutput: sanitizedText,
    };

    try {
      const saved = await saveSanitizedSnapshot(snapshot);
      setSavedSnapshots((prev) => [saved, ...prev]);
      pushToast({
        type: mode === 'FULL_MASK' ? 'success' : 'warning',
        title: 'Snapshot Saved in IndexedDB',
        message:
          mode === 'FULL_MASK'
            ? 'Irreversibly masked output saved locally.'
            : 'Saved locally. Note: partial masking or pseudonymization may retain identifying cues.',
      });
    } catch (err) {
      pushToast({
        type: 'error',
        title: 'Unable to Save Snapshot',
        message: err?.message || 'IndexedDB write failed.',
      });
    }
  };

  const handleDownloadAuditReport = () => {
    const reportJson = buildAuditReportJSON({
      detection: processingResult.detection,
      mode,
      fileMeta,
      coverage: coverageScore,
      historyCount: historyRecords.length,
    });

    const filename = `cyberbloom-audit-report-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    downloadBlobFile({
      content: reportJson,
      filename,
      mimeType: 'application/json;charset=utf-8',
    });

    pushToast({
      type: 'success',
      title: 'Audit Report Downloaded',
      message: `Zero-PII JSON report saved as ${filename}.`,
    });
  };

  const handleDeleteHistoryRecord = (id) => {
    setConfirmState({
      open: true,
      title: 'Delete History Record?',
      message:
        'Remove this operation metadata entry from PrivacyWorkspaceDB?',
      confirmLabel: 'Delete Record',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await deleteSanitizationHistoryRecord(id);
          setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
          pushToast({
            type: 'info',
            title: 'Record Deleted',
            message: 'Entry removed from local IndexedDB.',
          });
        } catch (err) {
          setDbError(err?.message || 'Failed to delete record.');
        } finally {
          setConfirmState({ open: false });
        }
      },
    });
  };

  const handleDeleteSavedSnapshot = (id) => {
    setConfirmState({
      open: true,
      title: 'Delete Saved Snapshot?',
      message: 'Remove this saved sanitized snapshot from IndexedDB?',
      confirmLabel: 'Delete Snapshot',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await deleteSavedSnapshot(id);
          setSavedSnapshots((prev) => prev.filter((s) => s.id !== id));
          pushToast({
            type: 'info',
            title: 'Snapshot Deleted',
            message: 'Saved output removed from IndexedDB.',
          });
        } catch (err) {
          setDbError(err?.message || 'Failed to delete snapshot.');
        } finally {
          setConfirmState({ open: false });
        }
      },
    });
  };

  const handleRequestClearAllHistory = () => {
    setConfirmState({
      open: true,
      title: 'Clear All Local History?',
      message:
        'This permanently deletes all Sanitization History, Audit Records, Prompt Logs, and Saved Outputs from PrivacyWorkspaceDB.',
      confirmLabel: 'Clear All History',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await clearAllWorkspaceHistory();
          setHistoryRecords([]);
          setAuditRecords([]);
          setPromptLogs([]);
          setSavedSnapshots([]);
          pushToast({
            type: 'success',
            title: 'All History Cleared',
            message: 'PrivacyWorkspaceDB history stores are now empty.',
          });
        } catch (err) {
          setDbError(err?.message || 'Failed to clear IndexedDB history.');
        } finally {
          setConfirmState({ open: false });
        }
      },
    });
  };

  const handleUpdatePreferences = async (patch) => {
    const nextPrefs = { ...preferences, ...patch };
    setPreferences(nextPrefs);
    if (patch.preferredMode && PROTECTION_MODES[patch.preferredMode]) {
      setMode(patch.preferredMode);
    }
    try {
      await saveUserPreferences(nextPrefs);
      pushToast({
        type: 'success',
        title: 'Preferences Saved',
        message: 'Updated settings stored locally in IndexedDB.',
      });
    } catch (err) {
      setDbError(err?.message || 'Failed to save preferences.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F6FB] text-[#22202B]">
      <SidebarNav
        activePage={activePage}
        onNavigate={handleNavigate}
        totalDetected={processingResult.detection.totalDetected}
        historyCount={historyRecords.length}
        privacyScore={coverageScore.score}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1">
          {activePage === 'home' && (
            <LandingPage onNavigate={handleNavigate} />
          )}

          {activePage === 'studio' && (
            <SanitizationStudio
              inputText={inputText}
              fileMeta={fileMeta}
              mode={mode}
              detection={processingResult.detection}
              sanitizedText={processingResult.sanitizedText}
              csvPreview={processingResult.csvPreview}
              coverageScore={coverageScore}
              showInlineBadges={preferences.showInlineBadges}
              onInputChange={handleInputChange}
              onModeChange={handleModeChange}
              onLoadSample={handleLoadSample}
              onFileLoaded={handleFileLoaded}
              onFileError={handleFileError}
              onRequestClear={handleRequestClear}
              onExport={handleExportProtectedFile}
              onSaveSnapshot={handleSaveSnapshot}
              onCopySuccess={() =>
                pushToast({
                  type: 'success',
                  title: 'Copied to Clipboard',
                  message: 'Sanitized output copied locally.',
                })
              }
            />
          )}

          {activePage === 'report' && (
            <IntelligenceReport
              detection={processingResult.detection}
              mode={mode}
              hasInput={Boolean(inputText.trim())}
              fileMeta={fileMeta}
              coverageScore={coverageScore}
              historyRecords={historyRecords}
              auditRecords={auditRecords}
              onDownloadAuditReport={handleDownloadAuditReport}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'activity' && (
            <ActivityLogPage
              historyRecords={historyRecords}
              auditRecords={auditRecords}
              promptLogs={promptLogs}
              savedSnapshots={savedSnapshots}
              dbError={dbError}
              onDeleteHistoryRecord={handleDeleteHistoryRecord}
              onDeleteSavedSnapshot={handleDeleteSavedSnapshot}
              onRequestClearAll={handleRequestClearAllHistory}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'architecture' && (
            <PrivacyArchitecturePage
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
            />
          )}
        </main>

        <FooterBar />
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        tone={confirmState.tone}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false })}
      />
    </div>
  );
}
