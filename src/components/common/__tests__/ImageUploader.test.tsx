import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ImageUploader } from '../ImageUploader';

describe('ImageUploader Component', () => {
  const mockUploadImage = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof ImageUploader>> = {}) => {
    return render(
      <ImageUploader
        label="Hình ảnh minh họa cho câu hỏi"
        onChange={mockOnChange}
        uploadImage={mockUploadImage}
        {...props}
      />
    );
  };

  it('renders the dropzone with the requested UI instruction text', () => {
    renderComponent();

    expect(screen.getByText('Hình ảnh minh họa cho câu hỏi')).toBeInTheDocument();
    expect(screen.getByText('Nhấn để tải ảnh lên')).toBeInTheDocument();
    expect(screen.getByText(', kéo thả tệp hoặc')).toBeInTheDocument();
    expect(screen.getByText('Ctrl + V')).toBeInTheDocument();
    expect(screen.getByText('để dán ảnh')).toBeInTheDocument();
  });

  it('focuses the dropzone when clicked and displays focus feedback', async () => {
    renderComponent();

    const dropZone = screen.getByRole('region', { name: 'Khu vực tải lên hình ảnh' });
    expect(dropZone).toBeInTheDocument();

    // Click to focus
    fireEvent.click(dropZone);
    expect(document.activeElement).toBe(dropZone);

    // Shows focused indicator text
    expect(
      screen.getByText('✓ Vùng tải ảnh đang được chọn. Nhấn Ctrl + V hoặc Cmd + V để dán ảnh')
    ).toBeInTheDocument();
  });

  it('handles file upload via file input correctly', async () => {
    mockUploadImage.mockResolvedValueOnce({
      url: 'https://cdn.example.com/question-1.png',
      storageUri: 'questions/question-1.png',
    });

    renderComponent();

    const file = new File(['image-content'], 'test-image.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(file);
      expect(mockOnChange).toHaveBeenCalledWith(
        'https://cdn.example.com/question-1.png',
        'questions/question-1.png'
      );
    });
  });

  it('handles file upload via drag and drop', async () => {
    mockUploadImage.mockResolvedValueOnce({
      url: 'https://cdn.example.com/dropped-image.png',
      storageUri: 'questions/dropped-image.png',
    });

    renderComponent();

    const dropZone = screen.getByRole('region', { name: 'Khu vực tải lên hình ảnh' });
    const file = new File(['image-bytes'], 'drop.jpg', { type: 'image/jpeg' });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(file);
      expect(mockOnChange).toHaveBeenCalledWith(
        'https://cdn.example.com/dropped-image.png',
        'questions/dropped-image.png'
      );
    });
  });

  it('handles image paste directly from clipboard items', async () => {
    mockUploadImage.mockResolvedValueOnce({
      url: 'https://cdn.example.com/screenshot.png',
      storageUri: 'questions/screenshot.png',
    });

    renderComponent();

    const dropZone = screen.getByRole('region', { name: 'Khu vực tải lên hình ảnh' });
    const screenshotFile = new File(['screenshot-bytes'], 'screenshot.png', { type: 'image/png' });

    const clipboardItem = {
      type: 'image/png',
      getAsFile: () => screenshotFile,
    };

    fireEvent.paste(dropZone, {
      clipboardData: {
        items: [clipboardItem],
      },
    });

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(screenshotFile);
      expect(mockOnChange).toHaveBeenCalledWith(
        'https://cdn.example.com/screenshot.png',
        'questions/screenshot.png'
      );
    });
  });

  it('handles window paste event when the upload zone is focused (Win + Shift + S flow)', async () => {
    mockUploadImage.mockResolvedValueOnce({
      url: 'https://cdn.example.com/pasted-window.png',
      storageUri: 'questions/pasted-window.png',
    });

    renderComponent();

    const dropZone = screen.getByRole('region', { name: 'Khu vực tải lên hình ảnh' });
    
    // User clicks upload zone to focus it
    fireEvent.click(dropZone);
    expect(document.activeElement).toBe(dropZone);

    const screenshotFile = new File(['win-shift-s-data'], 'snip.png', { type: 'image/png' });
    const clipboardItem = {
      type: 'image/png',
      getAsFile: () => screenshotFile,
    };

    // Global paste event dispatched while dropZone is focused
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [clipboardItem],
      },
    });

    window.dispatchEvent(pasteEvent);

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(screenshotFile);
      expect(mockOnChange).toHaveBeenCalledWith(
        'https://cdn.example.com/pasted-window.png',
        'questions/pasted-window.png'
      );
    });
  });

  it('does NOT intercept paste when user is typing inside a textarea or input', async () => {
    // Render a test page with an input/textarea and ImageUploader
    const TestPage = () => {
      const [text, setText] = useState('');
      return (
        <div>
          <textarea
            data-testid="question-content"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <ImageUploader
            label="Hình ảnh minh họa cho câu hỏi"
            onChange={mockOnChange}
            uploadImage={mockUploadImage}
          />
        </div>
      );
    };

    render(<TestPage />);

    const textarea = screen.getByTestId('question-content');
    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    const screenshotFile = new File(['text-or-image'], 'clipboard.png', { type: 'image/png' });
    const clipboardItem = {
      type: 'image/png',
      getAsFile: () => screenshotFile,
    };

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [clipboardItem],
      },
    });

    textarea.dispatchEvent(pasteEvent);

    // uploadImage should NOT be called because user was focused on textarea
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('validates non-image files and displays alert without uploading', async () => {
    const alertSpy = vi.spyOn(window, 'alert');
    renderComponent();

    const dropZone = screen.getByRole('region', { name: 'Khu vực tải lên hình ảnh' });
    const textFile = new File(['hello text'], 'document.txt', { type: 'text/plain' });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [textFile],
      },
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, GIF, WebP, SVG).'
    );
    expect(mockUploadImage).not.toHaveBeenCalled();
  });

  it('validates file size > 5MB and displays alert without uploading', async () => {
    const alertSpy = vi.spyOn(window, 'alert');
    renderComponent();

    const dropZone = screen.getByRole('region', { name: 'Khu vực tải lên hình ảnh' });
    const largeFile = new File([''], 'huge-image.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6 MB

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [largeFile],
      },
    });

    expect(alertSpy).toHaveBeenCalledWith('Kích thước hình ảnh không được vượt quá 5 MB.');
    expect(mockUploadImage).not.toHaveBeenCalled();
  });
});
