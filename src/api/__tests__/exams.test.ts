import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { examsApi } from '../exams';
import { apiClient } from '../client';

describe('examsApi.exportExamPdf', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('calls GET /exams/:id/pdf with responseType: blob and attaches Bearer token', async () => {
    localStorage.setItem('access_token', 'mock-admin-token-123');

    const fakeBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: fakeBlob,
      headers: {
        'content-disposition': 'attachment; filename="toan_hoc_12.pdf"',
      },
      status: 200,
      statusText: 'OK',
    } as any);

    const result = await examsApi.exportExamPdf('exam-abc');

    expect(getSpy).toHaveBeenCalledTimes(1);
    const [url, config] = getSpy.mock.calls[0];
    expect(url).toBe('/exams/exam-abc/pdf');
    expect(config?.responseType).toBe('blob');
    expect(config?.headers?.Authorization).toBe('Bearer mock-admin-token-123');

    expect(result.filename).toBe('toan_hoc_12.pdf');
    expect(result.blob).toBe(fakeBlob);
  });

  it('falls back to exam.pdf when Content-Disposition is missing', async () => {
    const fakeBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: fakeBlob,
      headers: {},
      status: 200,
      statusText: 'OK',
    } as any);

    const result = await examsApi.exportExamPdf('exam-xyz');
    expect(result.filename).toBe('exam.pdf');
  });

  it('correctly decodes RFC 5987 UTF-8 filename* in Content-Disposition', async () => {
    const fakeBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: fakeBlob,
      headers: {
        'content-disposition': "attachment; filename*=UTF-8''%C4%91%E1%BB%81%20thi%20v%E1%BA%ADt%20l%C3%BD.pdf",
      },
      status: 200,
      statusText: 'OK',
    } as any);

    const result = await examsApi.exportExamPdf('exam-phys');
    expect(result.filename).toBe('đề thi vật lý.pdf');
  });
});
