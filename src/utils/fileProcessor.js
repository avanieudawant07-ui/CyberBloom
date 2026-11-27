const ALLOWED_EXTENSIONS = ['.txt', '.csv'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB safe browser processing cap

/**
 * Format byte size cleanly for UI telemetry.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  const num = Number(bytes || 0);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validate uploaded file extension and size before reading locally.
 * @param {File} file
 * @returns {{ valid: boolean, fileType?: 'TXT' | 'CSV', error?: string }}
 */
export function validateUploadedFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const lowerName = (file.name || '').toLowerCase();
  const matchedExt = ALLOWED_EXTENSIONS.find((ext) => lowerName.endsWith(ext));

  if (!matchedExt) {
    return {
      valid: false,
      error: `Unsupported file "${file.name}". Only .txt and .csv files are accepted.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds the 5 MB client-side buffer limit (${formatFileSize(file.size)}).`,
    };
  }

  return {
    valid: true,
    fileType: matchedExt === '.csv' ? 'CSV' : 'TXT',
  };
}

/**
 * Read a local File using the Browser FileReader API with progress reporting.
 * @param {File} file
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<{ content: string, fileName: string, fileType: 'TXT' | 'CSV', fileSizeBytes: number }>}
 */
export function readLocalFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const check = validateUploadedFile(file);
    if (!check.valid) {
      reject(new Error(check.error));
      return;
    }

    const reader = new FileReader();
    reader.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    reader.onload = (evt) => {
      if (onProgress) onProgress(100);
      resolve({
        content: String(evt.target?.result || ''),
        fileName: file.name,
        fileType: check.fileType,
        fileSizeBytes: file.size || 0,
      });
    };
    reader.onerror = () => {
      reject(new Error(`Unable to read "${file.name}" inside the browser.`));
    };

    reader.readAsText(file);
  });
}

/**
 * Trigger a client-side file download via the Browser Blob API.
 * @param {{ content: string, filename: string, mimeType: string }} options
 */
export function downloadBlobFile({ content, filename, mimeType }) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
