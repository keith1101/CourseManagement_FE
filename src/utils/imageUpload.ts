export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

export type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!file || !SUPPORTED_IMAGE_MIME_TYPES.includes(file.type as SupportedImageMimeType)) {
    return {
      valid: false,
      error: 'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, GIF, WebP, SVG).',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Kích thước hình ảnh không được vượt quá 5 MB.',
    };
  }

  return { valid: true };
}

export function normalizeScreenshotFile(file: File): File {
  const isDefaultName = !file.name || file.name === 'image.png' || file.name === 'blob';
  if (!isDefaultName) {
    return file;
  }

  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/png': 'png',
  };

  const ext = extMap[file.type] || 'png';
  const newName = `screenshot-${Date.now()}.${ext}`;

  try {
    return new File([file], newName, {
      type: file.type || 'image/png',
      lastModified: Date.now(),
    });
  } catch {
    // Fallback in case File constructor with blob parts is limited in some environments
    return file;
  }
}

/**
 * Trích xuất file ảnh đầu tiên từ ClipboardData (items hoặc files).
 * Trả về null nếu không có ảnh, để cho phép dán văn bản bình thường.
 */
export function extractImageFileFromClipboard(
  clipboardData: DataTransfer | null | undefined
): File | null {
  if (!clipboardData) return null;

  // 1. Kiểm tra items trước (phổ biến nhất cho clipboard paste)
  if (clipboardData.items && clipboardData.items.length > 0) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.kind === 'file' && item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          return normalizeScreenshotFile(file);
        }
      }
    }
  }

  // 2. Fallback sang files
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      if (file && file.type && file.type.startsWith('image/')) {
        return normalizeScreenshotFile(file);
      }
    }
  }

  return null;
}
