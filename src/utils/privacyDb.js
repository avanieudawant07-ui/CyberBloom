export const DB_NAME = 'PrivacyWorkspaceDB';
export const DB_VERSION = 1;

export const STORES = {
  SANITIZATION_HISTORY: 'sanitization_history',
  AUDIT_RECORDS: 'audit_records',
  PROMPT_LOG: 'prompt_log',
  USER_PREFERENCES: 'user_preferences',
  SAVED_OUTPUTS: 'saved_outputs',
};

export const DEFAULT_PREFERENCES = {
  key: 'workspace_prefs',
  theme: 'light-minimal',
  preferredMode: 'PSEUDONYMIZATION',
  autoLogPrompts: true,
  showInlineBadges: true,
};

function getIDBFactory() {
  if (typeof globalThis !== 'undefined' && globalThis.indexedDB) {
    return globalThis.indexedDB;
  }
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB;
  }
  return null;
}

/**
 * Open or initialize the local PrivacyWorkspaceDB IndexedDB instance.
 * Runs 100% inside the browser with zero external transmission.
 * @returns {Promise<IDBDatabase>}
 */
export function openPrivacyDB() {
  return new Promise((resolve, reject) => {
    const idb = getIDBFactory();
    if (!idb) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORES.SANITIZATION_HISTORY)) {
        const historyStore = db.createObjectStore(STORES.SANITIZATION_HISTORY, {
          keyPath: 'id',
        });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('mode', 'mode', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.AUDIT_RECORDS)) {
        const auditStore = db.createObjectStore(STORES.AUDIT_RECORDS, {
          keyPath: 'id',
        });
        auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        auditStore.createIndex('operationId', 'operationId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PROMPT_LOG)) {
        const promptStore = db.createObjectStore(STORES.PROMPT_LOG, {
          keyPath: 'id',
        });
        promptStore.createIndex('timestamp', 'timestamp', { unique: false });
        promptStore.createIndex('operationType', 'operationType', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
        db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.SAVED_OUTPUTS)) {
        const savedStore = db.createObjectStore(STORES.SAVED_OUTPUTS, {
          keyPath: 'id',
        });
        savedStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Failed to open PrivacyWorkspaceDB.'));
  });
}

async function runStoreTx(storeName, mode, operationFn) {
  const db = await openPrivacyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let resultValue;

    try {
      const request = operationFn(store);
      if (request && typeof request === 'object' && 'onsuccess' in request) {
        request.onsuccess = () => {
          resultValue = request.result;
        };
        request.onerror = () => {
          reject(request.error || new Error(`IndexedDB request failed in ${storeName}`));
        };
      }
    } catch (err) {
      reject(err);
      return;
    }

    tx.oncomplete = () => {
      db.close();
      resolve(resultValue);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error(`IndexedDB transaction failed in ${storeName}`));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error(`IndexedDB transaction aborted in ${storeName}`));
    };
  });
}

function sortByTimestampDesc(records) {
  return [...(records || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Strip any prohibited sensitive keys before persisting history/audit/prompt records.
 */
function sanitizeMetadataRecord(record) {
  const clean = { ...record };
  delete clean.rawInput;
  delete clean.originalText;
  delete clean.rawValues;
  delete clean.matches;
  return clean;
}

// --- A. SANITIZATION HISTORY ---
export async function addSanitizationHistory(record) {
  const safeRecord = sanitizeMetadataRecord(record);
  await runStoreTx(STORES.SANITIZATION_HISTORY, 'readwrite', (store) =>
    store.put(safeRecord)
  );
  return safeRecord;
}

export async function getAllSanitizationHistory() {
  const rows = await runStoreTx(STORES.SANITIZATION_HISTORY, 'readonly', (store) =>
    store.getAll()
  );
  return sortByTimestampDesc(rows);
}

export async function deleteSanitizationHistoryRecord(id) {
  await runStoreTx(STORES.SANITIZATION_HISTORY, 'readwrite', (store) =>
    store.delete(id)
  );
}

// --- B. AUDIT RECORDS ---
export async function addAuditRecord(record) {
  const safeRecord = sanitizeMetadataRecord(record);
  await runStoreTx(STORES.AUDIT_RECORDS, 'readwrite', (store) =>
    store.put(safeRecord)
  );
  return safeRecord;
}

export async function getAllAuditRecords() {
  const rows = await runStoreTx(STORES.AUDIT_RECORDS, 'readonly', (store) =>
    store.getAll()
  );
  return sortByTimestampDesc(rows);
}

export async function deleteAuditRecord(id) {
  await runStoreTx(STORES.AUDIT_RECORDS, 'readwrite', (store) =>
    store.delete(id)
  );
}

// --- C. PROMPT LOG ---
export async function addPromptLog(record) {
  const safeRecord = sanitizeMetadataRecord(record);
  await runStoreTx(STORES.PROMPT_LOG, 'readwrite', (store) =>
    store.put(safeRecord)
  );
  return safeRecord;
}

export async function getAllPromptLogs() {
  const rows = await runStoreTx(STORES.PROMPT_LOG, 'readonly', (store) =>
    store.getAll()
  );
  return sortByTimestampDesc(rows);
}

export async function deletePromptLogRecord(id) {
  await runStoreTx(STORES.PROMPT_LOG, 'readwrite', (store) =>
    store.delete(id)
  );
}

// --- D. USER PREFERENCES ---
export async function saveUserPreferences(prefs) {
  const payload = {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    key: 'workspace_prefs',
    updatedAt: new Date().toISOString(),
  };
  await runStoreTx(STORES.USER_PREFERENCES, 'readwrite', (store) =>
    store.put(payload)
  );
  return payload;
}

export async function getUserPreferences() {
  const saved = await runStoreTx(STORES.USER_PREFERENCES, 'readonly', (store) =>
    store.get('workspace_prefs')
  );
  return saved ? { ...DEFAULT_PREFERENCES, ...saved } : { ...DEFAULT_PREFERENCES };
}

// --- E. OPTIONAL EXPLICIT SAVED SANITIZED OUTPUTS ---
export async function saveSanitizedSnapshot(snapshot) {
  const record = {
    id: snapshot.id,
    timestamp: snapshot.timestamp || new Date().toISOString(),
    label: snapshot.label || 'Sanitized Snapshot',
    fileType: snapshot.fileType || 'TXT',
    mode: snapshot.mode,
    entityCount: snapshot.entityCount || 0,
    sanitizedOutput: snapshot.sanitizedOutput || '',
    hasIdentifyingRiskWarning: snapshot.mode !== 'FULL_MASK',
  };
  await runStoreTx(STORES.SAVED_OUTPUTS, 'readwrite', (store) =>
    store.put(record)
  );
  return record;
}

export async function getAllSavedSnapshots() {
  const rows = await runStoreTx(STORES.SAVED_OUTPUTS, 'readonly', (store) =>
    store.getAll()
  );
  return sortByTimestampDesc(rows);
}

export async function deleteSavedSnapshot(id) {
  await runStoreTx(STORES.SAVED_OUTPUTS, 'readwrite', (store) =>
    store.delete(id)
  );
}

// --- CLEAR ALL HISTORY ---
export async function clearAllWorkspaceHistory() {
  const db = await openPrivacyDB();
  const targetStores = [
    STORES.SANITIZATION_HISTORY,
    STORES.AUDIT_RECORDS,
    STORES.PROMPT_LOG,
    STORES.SAVED_OUTPUTS,
  ];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(targetStores, 'readwrite');
    for (const storeName of targetStores) {
      tx.objectStore(storeName).clear();
    }
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to clear PrivacyWorkspaceDB history.'));
    };
  });
}
