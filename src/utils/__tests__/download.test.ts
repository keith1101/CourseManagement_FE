import { describe, expect, it, vi } from 'vitest';
import { getFilenameFromContentDisposition, downloadBlob } from '../download';

describe('getFilenameFromContentDisposition', () => {
  it('returns exam.pdf when header is null or undefined or empty', () => {
    expect(getFilenameFromContentDisposition()).toBe('exam.pdf');
    expect(getFilenameFromContentDisposition(null)).toBe('exam.pdf');
    expect(getFilenameFromContentDisposition('')).toBe('exam.pdf');
  });

  it('returns exam.pdf when header has no filename attribute', () => {
    expect(getFilenameFromContentDisposition('attachment')).toBe('exam.pdf');
    expect(getFilenameFromContentDisposition('inline')).toBe('exam.pdf');
  });

  it('extracts filename with quotes', () => {
    expect(getFilenameFromContentDisposition('attachment; filename="toan_12_de_thi.pdf"')).toBe(
      'toan_12_de_thi.pdf'
    );
  });

  it('extracts filename without quotes', () => {
    expect(getFilenameFromContentDisposition('attachment; filename=ly_ky_1.pdf')).toBe(
      'ly_ky_1.pdf'
    );
  });

  it('prioritizes RFC 5987 filename* with UTF-8 encoding', () => {
    const header = `attachment; filename="fallback.pdf"; filename*=UTF-8''%C4%91%E1%BB%81%20thi%20to%C3%A1n.pdf`;
    expect(getFilenameFromContentDisposition(header)).toBe('đề thi toán.pdf');
  });

  it('handles lowercase utf-8 in filename*', () => {
    const header = `attachment; filename*=utf-8''de_hoa_hoc.pdf`;
    expect(getFilenameFromContentDisposition(header)).toBe('de_hoa_hoc.pdf');
  });

  it('falls back to standard filename when filename* contains invalid URI percent encoding', () => {
    const header = `attachment; filename="backup.pdf"; filename*=UTF-8''%ZZmalformed.pdf`;
    expect(getFilenameFromContentDisposition(header)).toBe('backup.pdf');
  });
});

describe('downloadBlob', () => {
  it('creates an object URL, clicks a link, and revokes the URL', () => {
    const fakeUrl = 'blob:http://localhost/fake-uuid';
    const createSpy = vi.fn().mockReturnValue(fakeUrl);
    const revokeSpy = vi.fn();
    window.URL.createObjectURL = createSpy;
    window.URL.revokeObjectURL = revokeSpy;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const blob = new Blob(['pdf data'], { type: 'application/pdf' });
    downloadBlob(blob, 'my_exam.pdf');

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith(fakeUrl);

    clickSpy.mockRestore();
  });

  it('falls back to exam.pdf when filename is empty', () => {
    const fakeUrl = 'blob:http://localhost/fake-uuid';
    const createSpy = vi.fn().mockReturnValue(fakeUrl);
    const revokeSpy = vi.fn();
    window.URL.createObjectURL = createSpy;
    window.URL.revokeObjectURL = revokeSpy;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const blob = new Blob(['test']);
    downloadBlob(blob, '');

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(revokeSpy).toHaveBeenCalledWith(fakeUrl);

    clickSpy.mockRestore();
  });
});
