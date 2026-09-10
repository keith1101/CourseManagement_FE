import { describe, it, expect } from 'vitest';
import {
  extractImageFileFromClipboard,
  normalizeScreenshotFile,
  SUPPORTED_IMAGE_MIME_TYPES,
  validateImageFile,
  MAX_IMAGE_SIZE_BYTES,
} from '../imageUpload';

describe('imageUpload utility', () => {
  describe('SUPPORTED_IMAGE_MIME_TYPES and MAX_IMAGE_SIZE_BYTES', () => {
    it('supports only the documented 5 image MIME types', () => {
      expect(SUPPORTED_IMAGE_MIME_TYPES).toEqual([
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ]);
      expect(MAX_IMAGE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    });
  });

  describe('validateImageFile', () => {
    it('accepts valid PNG, JPG, GIF, WebP, and SVG files within 5MB', () => {
      SUPPORTED_IMAGE_MIME_TYPES.forEach((mime) => {
        const file = new File(['valid content'], `test-image`, { type: mime });
        const result = validateImageFile(file);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('rejects unsupported image MIME types such as BMP, TIFF, ICO, or PDF', () => {
      const unsupportedTypes = ['image/bmp', 'image/tiff', 'image/x-icon', 'application/pdf', 'text/plain'];
      unsupportedTypes.forEach((mime) => {
        const file = new File(['content'], 'file', { type: mime });
        const result = validateImageFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, GIF, WebP, SVG).');
      });
    });

    it('rejects files exceeding 5MB', () => {
      const oversizedFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', {
        type: 'image/png',
      });
      const result = validateImageFile(oversizedFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Kích thước hình ảnh không được vượt quá 5 MB.');
    });

    it('accepts file exactly at 5MB boundary', () => {
      const boundaryFile = new File([new Uint8Array(5 * 1024 * 1024)], 'boundary.jpg', {
        type: 'image/jpeg',
      });
      const result = validateImageFile(boundaryFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('normalizeScreenshotFile', () => {
    it('preserves existing meaningful file name', () => {
      const file = new File(['content'], 'my-custom-diagram.png', { type: 'image/png' });
      const normalized = normalizeScreenshotFile(file);
      expect(normalized.name).toBe('my-custom-diagram.png');
    });

    it('assigns screenshot timestamp name when name is empty or default image.png or blob', () => {
      const defaultNames = ['', 'image.png', 'blob'];
      defaultNames.forEach((name) => {
        const file = new File(['content'], name, { type: 'image/png' });
        const normalized = normalizeScreenshotFile(file);
        expect(normalized.name).toMatch(/^screenshot-\d+\.png$/);
      });
    });

    it('maps extension correctly based on MIME type for screenshots', () => {
      const jpeg = normalizeScreenshotFile(new File(['content'], 'blob', { type: 'image/jpeg' }));
      expect(jpeg.name).toMatch(/^screenshot-\d+\.jpg$/);

      const webp = normalizeScreenshotFile(new File(['content'], 'blob', { type: 'image/webp' }));
      expect(webp.name).toMatch(/^screenshot-\d+\.webp$/);

      const svg = normalizeScreenshotFile(new File(['content'], 'blob', { type: 'image/svg+xml' }));
      expect(svg.name).toMatch(/^screenshot-\d+\.svg$/);

      const gif = normalizeScreenshotFile(new File(['content'], 'blob', { type: 'image/gif' }));
      expect(gif.name).toMatch(/^screenshot-\d+\.gif$/);
    });
  });

  describe('extractImageFileFromClipboard', () => {
    it('returns null if clipboardData is null or undefined', () => {
      expect(extractImageFileFromClipboard(null)).toBeNull();
      expect(extractImageFileFromClipboard(undefined)).toBeNull();
    });

    it('returns null if clipboard contains only text items', () => {
      const textItem = {
        kind: 'string',
        type: 'text/plain',
        getAsFile: () => null,
      } as unknown as DataTransferItem;

      const clipboardData = {
        items: [textItem],
        files: [] as unknown as FileList,
      } as unknown as DataTransfer;

      expect(extractImageFileFromClipboard(clipboardData)).toBeNull();
    });

    it('extracts image from clipboard items', () => {
      const mockImageFile = new File(['img-data'], 'blob', { type: 'image/png' });
      const imageItem = {
        kind: 'file',
        type: 'image/png',
        getAsFile: () => mockImageFile,
      } as unknown as DataTransferItem;

      const clipboardData = {
        items: [imageItem],
        files: [] as unknown as FileList,
      } as unknown as DataTransfer;

      const extracted = extractImageFileFromClipboard(clipboardData);
      expect(extracted).not.toBeNull();
      expect(extracted?.type).toBe('image/png');
      expect(extracted?.name).toMatch(/^screenshot-\d+\.png$/);
    });

    it('extracts only the first image if multiple images are present in clipboard', () => {
      const firstImg = new File(['first'], 'first.png', { type: 'image/png' });
      const secondImg = new File(['second'], 'second.jpg', { type: 'image/jpeg' });

      const items = [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => firstImg,
        },
        {
          kind: 'file',
          type: 'image/jpeg',
          getAsFile: () => secondImg,
        },
      ] as unknown as DataTransferItem[];

      const clipboardData = {
        items,
        files: [] as unknown as FileList,
      } as unknown as DataTransfer;

      const extracted = extractImageFileFromClipboard(clipboardData);
      expect(extracted?.name).toBe('first.png');
    });

    it('falls back to files list when items are not present', () => {
      const mockFile = new File(['content'], 'camera.jpg', { type: 'image/jpeg' });
      const clipboardData = {
        items: [] as unknown as DataTransferItemList,
        files: [mockFile] as unknown as FileList,
      } as unknown as DataTransfer;

      const extracted = extractImageFileFromClipboard(clipboardData);
      expect(extracted?.name).toBe('camera.jpg');
      expect(extracted?.type).toBe('image/jpeg');
    });
  });
});
