/**
 * Utilities for file download and Content-Disposition header parsing.
 */

/**
 * Extracts a filename from the Content-Disposition header.
 * Supports standard `filename="..."` and RFC 5987 / RFC 6266 `filename*=UTF-8''...`.
 * Falls back to 'exam.pdf' if header is absent or does not contain a filename.
 */
export function getFilenameFromContentDisposition(contentDisposition?: string | null): string {
  if (!contentDisposition) {
    return 'exam.pdf';
  }

  // 1. Try RFC 5987 / RFC 6266 format: filename*=UTF-8''<encoded-filename>
  const filenameStarMatch = contentDisposition.match(/filename\*=(?:UTF-8|utf-8)''([^;]+)/i);
  if (filenameStarMatch && filenameStarMatch[1]) {
    try {
      const decoded = decodeURIComponent(filenameStarMatch[1].trim().replace(/^["']|["']$/g, ''));
      if (decoded) {
        return decoded;
      }
    } catch {
      // Fall through to standard filename if decoding fails
    }
  }

  // 2. Try standard format: filename="filename.ext" or filename=filename.ext
  const filenameMatch = contentDisposition.match(/filename=(?:"([^"]+)"|([^;\s]+))/i);
  if (filenameMatch) {
    const raw = (filenameMatch[1] ?? filenameMatch[2] ?? '').trim();
    if (raw) {
      return raw.replace(/^["']|["']$/g, '');
    }
  }

  return 'exam.pdf';
}

/**
 * Triggers a client-side download of a Blob file and immediately releases the created object URL.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const safeFilename = filename || 'exam.pdf';
  const createObjectURL =
    window.URL?.createObjectURL?.bind(window.URL) ??
    ((() => '') as unknown as typeof window.URL.createObjectURL);
  const revokeObjectURL =
    window.URL?.revokeObjectURL?.bind(window.URL) ??
    (() => {});

  const url = createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  revokeObjectURL(url);
}
