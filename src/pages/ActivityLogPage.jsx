import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  Database,
  Lock,
  Search,
  Trash2,
} from 'lucide-react';
import { PROTECTION_MODES } from '../constants/piiConfig';

export default function ActivityLogPage({
  historyRecords,
  auditRecords,
  promptLogs,
  savedSnapshots,
  dbError,
  onDeleteHistoryRecord,
  onDeleteSavedSnapshot,
  onRequestClearAll,
  onNavigate,
}) {
  const [activeTab, setActiveTab] = useState('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('DESC');

  const formatDateTime = (iso) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = historyRecords.filter((item) => {
      const matchesMode = modeFilter === 'ALL' || item.mode === modeFilter;
      const matchesSearch =
        !q ||
        (item.operation || '').toLowerCase().includes(q) ||
        (item.fileType || '').toLowerCase().includes(q) ||
        (item.fileName || '').toLowerCase().includes(q) ||
        (item.modeLabel || '').toLowerCase().includes(q) ||
        (item.status || '').toLowerCase().includes(q);
      return matchesMode && matchesSearch;
    });

    return [...list].sort((a, b) => {
      const diff =
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortOrder === 'ASC' ? diff : -diff;
    });
  }, [historyRecords, searchQuery, modeFilter, sortOrder]);

  const filteredAudit = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = auditRecords.filter((item) => {
      const matchesMode = modeFilter === 'ALL' || item.mode === modeFilter;
      const matchesSearch =
        !q ||
        (item.operationId || '').toLowerCase().includes(q) ||
        (item.protectionMethod || '').toLowerCase().includes(q) ||
        (item.exportStatus || '').toLowerCase().includes(q);
      return matchesMode && matchesSearch;
    });

    return [...list].sort((a, b) => {
      const diff =
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortOrder === 'ASC' ? diff : -diff;
    });
  }, [auditRecords, searchQuery, modeFilter, sortOrder]);

  const filteredPrompts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = promptLogs.filter(
      (item) =>
        !q ||
        (item.operationType || '').toLowerCase().includes(q) ||
        (item.promptDescription || '').toLowerCase().includes(q)
    );

    return [...list].sort((a, b) => {
      const diff =
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortOrder === 'ASC' ? diff : -diff;
    });
  }, [promptLogs, searchQuery, sortOrder]);

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('export')) {
      return 'bg-[#EAE6F7] text-[#3B2E6E] border-[#D2C9EC]';
    }
    if (s.includes('clear') || s.includes('error')) {
      return 'bg-[#FBEAE8] text-[#9E3D37] border-[#F0C6C2]';
    }
    if (s.includes('protect') || s.includes('complete')) {
      return 'bg-[#EBF1FA] text-[#3B2E6E] border-[#C8D7EE]';
    }
    return 'bg-[#F7F6FB] text-[#6D6A7C] border-[#E6E2F0]';
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[12px] font-medium text-[#8B7CC8] uppercase tracking-wider">
            IndexedDB · PrivacyWorkspaceDB
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#22202B]">
            Activity History
          </h1>
          <p className="text-[14px] text-[#6D6A7C]">
            Persistent local audit history across browser refreshes without
            storing raw sensitive values.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('studio')}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#E6E2F0] text-[13px] font-medium text-[#22202B] hover:bg-[#F7F6FB] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#8B7CC8]" />
            <span>Sanitization Lab</span>
          </button>

          <button
            type="button"
            onClick={onRequestClearAll}
            disabled={
              historyRecords.length === 0 &&
              auditRecords.length === 0 &&
              promptLogs.length === 0 &&
              savedSnapshots.length === 0
            }
            className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#D96C65] text-[#FFFFFF] text-[13px] font-medium hover:bg-[#c55b54] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All History</span>
          </button>
        </div>
      </div>

      {/* Zero-PII Guarantee Banner */}
      <div className="soft-card p-4 bg-[#EAE6F7]/40 border-[#D2C9EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-[9px] bg-[#3B2E6E] text-[#FFFFFF] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-[13px] text-[#22202B]">
            <strong className="font-semibold text-[#3B2E6E]">
              Zero-PII Storage Policy:
            </strong>{' '}
            Original unredacted text, emails, phones, PAN, Aadhaar, and credit
            card numbers are never persisted in IndexedDB.
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#3B2E6E] shrink-0">
          <Database className="w-3.5 h-3.5" />
          <span>{historyRecords.length} operations stored</span>
        </div>
      </div>

      {dbError && (
        <div className="soft-card p-4 bg-[#FBEAE8] border-[#F0C6C2] text-[13px] text-[#9E3D37]">
          IndexedDB Warning: {dbError}
        </div>
      )}

      {/* Store Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          {
            id: 'history',
            label: 'Sanitization History',
            count: historyRecords.length,
          },
          {
            id: 'audit',
            label: 'Audit Records',
            count: auditRecords.length,
          },
          {
            id: 'prompts',
            label: 'Prompt Log',
            count: promptLogs.length,
          },
          {
            id: 'saved',
            label: 'Saved Outputs',
            count: savedSnapshots.length,
          },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13px] font-medium border transition-colors ${
                active
                  ? 'bg-[#3B2E6E] text-[#FFFFFF] border-[#3B2E6E]'
                  : 'bg-[#FFFFFF] text-[#6D6A7C] border-[#E6E2F0] hover:text-[#22202B]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full tabular-nums ${
                  active
                    ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                    : 'bg-[#F7F6FB] text-[#6D6A7C]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="soft-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6D6A7C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operations, file types, or status..."
            className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[#E6E2F0] bg-[#F7F6FB]/70 text-[13px] text-[#22202B] placeholder:text-[#6D6A7C] focus:outline-none focus:border-[#8B7CC8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab !== 'prompts' && (
            <select
              aria-label="Filter by redaction mode"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-3 py-2 rounded-[10px] border border-[#E6E2F0] bg-[#FFFFFF] text-[13px] text-[#22202B] focus:outline-none focus:border-[#8B7CC8]"
            >
              <option value="ALL">All Redaction Modes</option>
              {Object.values(PROTECTION_MODES).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'))
            }
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-[#E6E2F0] bg-[#FFFFFF] text-[13px] text-[#22202B] hover:bg-[#F7F6FB] transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8B7CC8]" />
            <span>
              {sortOrder === 'DESC' ? 'Newest First' : 'Oldest First'}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: SANITIZATION HISTORY */}
      {activeTab === 'history' && (
        <div className="soft-card overflow-x-auto">
          {filteredHistory.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-[#6D6A7C]">
              No sanitization history records match your current filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#E6E2F0] bg-[#F7F6FB]/70 text-[12px] font-medium text-[#6D6A7C]">
                  <th className="px-4 py-3">Date and Time</th>
                  <th className="px-4 py-3">Operation</th>
                  <th className="px-4 py-3">File Type</th>
                  <th className="px-4 py-3">Redaction Mode</th>
                  <th className="px-4 py-3">Entities Detected</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-b-0 border-[#E6E2F0] hover:bg-[#F7F6FB]/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#6D6A7C]">
                      {formatDateTime(row.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#22202B]">
                      <div>{row.operation}</div>
                      {row.fileName && row.fileName !== 'Direct Input' && (
                        <div className="text-[11px] text-[#6D6A7C] font-normal">
                          {row.fileName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-[6px] bg-[#F7F6FB] border border-[#E6E2F0] text-[11.5px] font-medium text-[#22202B]">
                        {row.fileType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#22202B]">
                      {row.modeLabel || row.mode}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-[#22202B]">
                      {row.totalDetected}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-[11.5px] font-medium ${statusBadge(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteHistoryRecord(row.id)}
                        aria-label={`Delete record ${row.id}`}
                        className="cursor-pointer p-1.5 rounded-[8px] text-[#6D6A7C] hover:text-[#D96C65] hover:bg-[#D96C65]/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT RECORDS */}
      {activeTab === 'audit' && (
        <div className="soft-card overflow-x-auto">
          {filteredAudit.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-[#6D6A7C]">
              No audit records found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#E6E2F0] bg-[#F7F6FB]/70 text-[12px] font-medium text-[#6D6A7C]">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Operation ID</th>
                  <th className="px-4 py-3">Protection Method</th>
                  <th className="px-4 py-3">Entities Protected</th>
                  <th className="px-4 py-3">Coverage Score</th>
                  <th className="px-4 py-3">Export Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map((rec) => (
                  <tr
                    key={rec.id}
                    className="border-b last:border-b-0 border-[#E6E2F0] hover:bg-[#F7F6FB]/50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#6D6A7C]">
                      {formatDateTime(rec.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-mono-tech text-[12px] text-[#22202B]">
                      {rec.operationId}
                    </td>
                    <td className="px-4 py-3 text-[#22202B]">
                      {rec.protectionMethod}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-[#3B2E6E]">
                      {rec.entitiesProtected}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {rec.privacyScore}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-[11.5px] font-medium ${statusBadge(
                          rec.exportStatus
                        )}`}
                      >
                        {rec.exportStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: PROMPT LOG */}
      {activeTab === 'prompts' && (
        <div className="soft-card overflow-x-auto">
          {filteredPrompts.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-[#6D6A7C]">
              No prompt metadata logs recorded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#E6E2F0] bg-[#F7F6FB]/70 text-[12px] font-medium text-[#6D6A7C]">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Operation Type</th>
                  <th className="px-4 py-3">Prompt Description (Zero PII)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrompts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-b-0 border-[#E6E2F0] hover:bg-[#F7F6FB]/50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#6D6A7C]">
                      {formatDateTime(p.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#22202B]">
                      {p.operationType}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-[#6D6A7C] max-w-lg">
                      {p.promptDescription}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-[11.5px] font-medium ${statusBadge(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 4: OPTIONAL EXPLICIT SAVED SANITIZED OUTPUTS */}
      {activeTab === 'saved' && (
        <div className="space-y-3">
          {savedSnapshots.length === 0 ? (
            <div className="soft-card p-10 text-center text-[13px] text-[#6D6A7C]">
              No sanitized snapshots saved locally yet. Use &ldquo;Save
              Snapshot Locally&rdquo; in the Sanitization Lab if you want to
              store sanitized output inside IndexedDB.
            </div>
          ) : (
            savedSnapshots.map((snap) => (
              <div key={snap.id} className="soft-card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-semibold text-[#22202B]">
                      {snap.label}
                    </div>
                    <div className="text-[12px] text-[#6D6A7C]">
                      {formatDateTime(snap.timestamp)} · {snap.fileType} ·{' '}
                      {PROTECTION_MODES[snap.mode]?.name || snap.mode} ·{' '}
                      {snap.entityCount} entities masked
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSavedSnapshot(snap.id)}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E6E2F0] text-[12px] text-[#D96C65] hover:bg-[#D96C65]/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {snap.hasIdentifyingRiskWarning && (
                  <div className="text-[11.5px] text-[#9A5B13] bg-[#FDF1DF]/70 border border-[#E8A34A]/35 px-3 py-1.5 rounded-[8px]">
                    Notice: Saved with {PROTECTION_MODES[snap.mode]?.name}.
                    Partial masking or pseudonymization may retain identifying
                    patterns.
                  </div>
                )}

                <pre className="p-3.5 rounded-[10px] bg-[#F7F6FB] border border-[#E6E2F0] font-mono-tech text-[12px] text-[#3B2E6E] whitespace-pre-wrap break-words max-h-48 overflow-auto">
                  {snap.sanitizedOutput}
                </pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
