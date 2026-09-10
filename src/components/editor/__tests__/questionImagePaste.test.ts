import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Question } from '../../../types';
import { extractImageFileFromClipboard, validateImageFile } from '../../../utils/imageUpload';

describe('Question Image Paste Workflow & Component Integration', () => {
  let sampleQuestion: Question;
  let uploadApiMock: Mock<(file: File) => Promise<{ url: string; storageUri: string }>>;
  let alertMock: Mock<(msg?: any) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    uploadApiMock = vi.fn().mockResolvedValue({
      url: 'https://cdn.example.com/questions/screenshot-123.png',
      storageUri: 'gs://bucket/questions/screenshot-123.png',
    });
    alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);

    sampleQuestion = {
      id: 'q-1',
      examId: 'exam-1',
      subjectId: 'sub-1',
      content: 'Câu hỏi ban đầu',
      type: 'SINGLE_CHOICE',
      points: 1,
      timeLimit: 30,
      options: [
        { label: 'A', content: 'Đáp án A', isCorrect: true },
        { label: 'B', content: 'Đáp án B', isCorrect: false },
      ],
      order: 0,
    };
  });

  // Helper simulating QuestionCanvas + ImageUploader state & event processing
  function createTestQuestionController(initialQuestion: Question, initialShowImage = false) {
    let currentQuestion = { ...initialQuestion };
    let showImageInput = initialShowImage;
    let pendingFile: File | null = null;
    let isUploading = false;
    let lastHandledFile: File | null = null;

    const onChangeQuestion = vi.fn((updated: Question) => {
      currentQuestion = updated;
    });

    const uploadSelectedFile = async (file: File) => {
      if (isUploading) return false;

      const validation = validateImageFile(file);
      if (!validation.valid) {
        alertMock(validation.error);
        return false;
      }

      isUploading = true;
      try {
        const res = await uploadApiMock(file);
        if (!res?.url || !res?.storageUri) {
          throw new Error('Invalid response');
        }
        onChangeQuestion({
          ...currentQuestion,
          image: res.url,
          imageStorageUri: res.storageUri,
        });
        return true;
      } catch {
        alertMock('Không thể tải hình ảnh lên. Vui lòng thử lại.');
        return false;
      } finally {
        isUploading = false;
      }
    };

    const processPendingFileEffect = async () => {
      if (pendingFile && pendingFile !== lastHandledFile) {
        lastHandledFile = pendingFile;
        const fileToUpload = pendingFile;
        pendingFile = null;
        await uploadSelectedFile(fileToUpload);
      }
    };

    // Card / Textarea Paste Handler (QuestionCanvas)
    const handleQuestionBoxPaste = async (e: {
      defaultPrevented: boolean;
      clipboardData: any;
      preventDefault: () => void;
    }) => {
      if (e.defaultPrevented) return;
      const file = extractImageFileFromClipboard(e.clipboardData);
      if (!file) return;

      e.preventDefault();
      if (isUploading) return;

      showImageInput = true;
      pendingFile = file;
      await processPendingFileEffect();
    };

    // ImageUploader Direct Paste Handler
    const handleImageUploaderPaste = async (e: {
      clipboardData: any;
      preventDefault: () => void;
      stopPropagation: () => void;
    }) => {
      const file = extractImageFileFromClipboard(e.clipboardData);
      if (file) {
        e.preventDefault();
        e.stopPropagation();
        await uploadSelectedFile(file);
      }
    };

    return {
      getQuestion: () => currentQuestion,
      getShowImageInput: () => showImageInput,
      getIsUploading: () => isUploading,
      onChangeQuestion,
      uploadSelectedFile,
      handleQuestionBoxPaste,
      handleImageUploaderPaste,
    };
  }

  it('automatically reveals the image section and uploads a valid pasted PNG screenshot when initially hidden', async () => {
    const controller = createTestQuestionController(sampleQuestion, false);
    expect(controller.getShowImageInput()).toBe(false);

    const validPngFile = new File(['valid-png-binary'], 'image.png', { type: 'image/png' });
    const preventDefault = vi.fn();

    const mockEvent = {
      defaultPrevented: false,
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => validPngFile }],
      },
      preventDefault,
    };

    await controller.handleQuestionBoxPaste(mockEvent);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(controller.getShowImageInput()).toBe(true);
    expect(uploadApiMock).toHaveBeenCalledTimes(1);
    expect(controller.getQuestion().image).toBe('https://cdn.example.com/questions/screenshot-123.png');
    expect(controller.getQuestion().imageStorageUri).toBe('gs://bucket/questions/screenshot-123.png');
    expect(controller.getQuestion().content).toBe('Câu hỏi ban đầu'); // Form data preserved
  });

  it('allows natural text paste in the textarea without preventing default or triggering upload', async () => {
    const controller = createTestQuestionController(sampleQuestion, false);
    const preventDefault = vi.fn();

    const mockTextEvent = {
      defaultPrevented: false,
      clipboardData: {
        items: [{ kind: 'string', type: 'text/plain', getAsFile: () => null }],
      },
      preventDefault,
    };

    await controller.handleQuestionBoxPaste(mockTextEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(controller.getShowImageInput()).toBe(false);
    expect(uploadApiMock).not.toHaveBeenCalled();
    expect(controller.getQuestion().image).toBeUndefined();
  });

  it('does nothing and triggers no upload when clipboard contains no image', async () => {
    const controller = createTestQuestionController(sampleQuestion, true);
    const preventDefault = vi.fn();

    const emptyClipboardEvent = {
      defaultPrevented: false,
      clipboardData: {
        items: [],
        files: [],
      },
      preventDefault,
    };

    await controller.handleQuestionBoxPaste(emptyClipboardEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(uploadApiMock).not.toHaveBeenCalled();
  });

  it('rejects oversized images (> 5MB) before uploading and preserves form data', async () => {
    const controller = createTestQuestionController(sampleQuestion, false);
    const oversizedFile = new File([new Uint8Array(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
    const preventDefault = vi.fn();

    const mockEvent = {
      defaultPrevented: false,
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => oversizedFile }],
      },
      preventDefault,
    };

    await controller.handleQuestionBoxPaste(mockEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(uploadApiMock).not.toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith('Kích thước hình ảnh không được vượt quá 5 MB.');
    expect(controller.getQuestion().content).toBe('Câu hỏi ban đầu');
  });

  it('rejects unsupported image MIME types and preserves form data', async () => {
    const controller = createTestQuestionController(sampleQuestion, false);
    const bmpFile = new File(['bmp-binary'], 'graphic.bmp', { type: 'image/bmp' });
    const preventDefault = vi.fn();

    const mockEvent = {
      defaultPrevented: false,
      clipboardData: {
        items: [{ kind: 'file', type: 'image/bmp', getAsFile: () => bmpFile }],
      },
      preventDefault,
    };

    await controller.handleQuestionBoxPaste(mockEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(uploadApiMock).not.toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith(
      'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, GIF, WebP, SVG).'
    );
    expect(controller.getQuestion().content).toBe('Câu hỏi ban đầu');
  });

  it('handles upload failure gracefully without losing form content', async () => {
    uploadApiMock.mockRejectedValueOnce(new Error('Network error'));
    const controller = createTestQuestionController(sampleQuestion, false);
    const pngFile = new File(['png-data'], 'image.png', { type: 'image/png' });

    const mockEvent = {
      defaultPrevented: false,
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => pngFile }],
      },
      preventDefault: vi.fn(),
    };

    await controller.handleQuestionBoxPaste(mockEvent);

    expect(uploadApiMock).toHaveBeenCalledTimes(1);
    expect(alertMock).toHaveBeenCalledWith('Không thể tải hình ảnh lên. Vui lòng thử lại.');
    expect(controller.getQuestion().content).toBe('Câu hỏi ban đầu');
    expect(controller.getIsUploading()).toBe(false);
  });

  it('prevents duplicate upload requests during an ongoing upload', async () => {
    let resolveUpload: (val: any) => void;
    uploadApiMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
    );

    const controller = createTestQuestionController(sampleQuestion, true);
    const pngFile = new File(['png-data'], 'image.png', { type: 'image/png' });

    // First paste: starts upload
    const event1 = {
      defaultPrevented: false,
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => pngFile }],
      },
      preventDefault: vi.fn(),
    };
    void controller.handleQuestionBoxPaste(event1);

    expect(controller.getIsUploading()).toBe(true);

    // Second paste while upload is in-flight
    const event2 = {
      defaultPrevented: false,
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => pngFile }],
      },
      preventDefault: vi.fn(),
    };
    await controller.handleQuestionBoxPaste(event2);

    expect(uploadApiMock).toHaveBeenCalledTimes(1);

    // Complete the first upload
    resolveUpload!({
      url: 'https://cdn.example.com/questions/first.png',
      storageUri: 'gs://bucket/questions/first.png',
    });
  });

  it('stops propagation when pasting directly inside ImageUploader so Card handler is not called twice', async () => {
    const controller = createTestQuestionController(sampleQuestion, true);
    const pngFile = new File(['png-data'], 'dropzone.png', { type: 'image/png' });

    const stopPropagation = vi.fn();
    const preventDefault = vi.fn();

    const uploaderPasteEvent = {
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => pngFile }],
      },
      preventDefault,
      stopPropagation,
    };

    await controller.handleImageUploaderPaste(uploaderPasteEvent);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(uploadApiMock).toHaveBeenCalledTimes(1);
  });

  it('reuses the exact same validation and upload pipeline for file input and drag-and-drop', async () => {
    const controller = createTestQuestionController(sampleQuestion, true);
    const selectedFile = new File(['content'], 'manual.jpg', { type: 'image/jpeg' });

    // File input selection or Drop event both invoke uploadSelectedFile
    const success = await controller.uploadSelectedFile(selectedFile);

    expect(success).toBe(true);
    expect(uploadApiMock).toHaveBeenCalledWith(selectedFile);
    expect(controller.getQuestion().image).toBe('https://cdn.example.com/questions/screenshot-123.png');
  });

  it('works for newly created questions as well as existing question updates', async () => {
    const newTempQuestion: Question = {
      ...sampleQuestion,
      id: `temp-${Date.now()}-0`,
      content: 'Câu hỏi mới',
      image: undefined,
    };

    const controller = createTestQuestionController(newTempQuestion, false);
    const pngFile = new File(['png'], 'new.png', { type: 'image/png' });

    await controller.handleQuestionBoxPaste({
      defaultPrevented: false,
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => pngFile }],
      },
      preventDefault: vi.fn(),
    });

    expect(controller.getQuestion().id).toMatch(/^temp-/);
    expect(controller.getQuestion().image).toBe('https://cdn.example.com/questions/screenshot-123.png');
  });

  it('replaces an existing image when a new image is pasted', async () => {
    const questionWithOldImage: Question = {
      ...sampleQuestion,
      image: 'https://cdn.example.com/old-image.png',
      imageStorageUri: 'gs://bucket/old.png',
    };

    const controller = createTestQuestionController(questionWithOldImage, true);
    const newScreenshot = new File(['new-image'], 'blob', { type: 'image/png' });

    await controller.handleQuestionBoxPaste({
      defaultPrevented: false,
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => newScreenshot }],
      },
      preventDefault: vi.fn(),
    });

    expect(controller.getQuestion().image).toBe('https://cdn.example.com/questions/screenshot-123.png');
    expect(controller.getQuestion().imageStorageUri).toBe('gs://bucket/questions/screenshot-123.png');
  });
});
