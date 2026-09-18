import React, { useEffect, useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Trash2, X } from 'lucide-react';

export interface ImageUploadResult {
  url: string;
  storageUri: string;
  expiresAt?: string;
}

export interface ImageUploaderProps {
  value?: string;
  onChange: (imageUrl: string, storageUri?: string) => void;
  uploadImage: (file: File) => Promise<ImageUploadResult>;
  label?: string;
  compact?: boolean;
  maxHeight?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  uploadImage,
  label,
  compact = false,
  maxHeight = 220,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value?.startsWith('http') ? value : '');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value?.startsWith('http')) setUrlInput(value);
  }, [value]);

  const uploadImageFile = async (file: File) => {
    if (isUploading) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, GIF, WebP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước hình ảnh không được vượt quá 5 MB.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadImage(file);
      if (!uploaded?.url || !uploaded.storageUri) {
        throw new Error('Invalid image upload response');
      }
      onChange(uploaded.url, uploaded.storageUri);
    } catch {
      alert('Không thể tải hình ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const extractImageFromClipboard = (clipboardData: DataTransfer | null): File | null => {
    if (!clipboardData) return null;

    // Primary: check clipboard items for image/*
    const items = clipboardData.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) return file;
        }
      }
    }

    // Fallback: check clipboard files
    const files = clipboardData.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          return file;
        }
      }
    }

    return null;
  };

  const handleDropZonePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const file = extractImageFromClipboard(e.clipboardData);
    if (file) {
      e.preventDefault();
      e.stopPropagation();
      void uploadImageFile(file);
    }
  };

  useEffect(() => {
    const isTextInputElement = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const tagName = el.tagName?.toUpperCase();
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || el.isContentEditable;
    };

    const handleWindowPaste = (e: ClipboardEvent) => {
      if (e.defaultPrevented) return;
      if (activeTab !== 'upload' || isUploading) return;

      const activeEl = document.activeElement as HTMLElement | null;
      const targetEl = e.target as HTMLElement | null;

      // Do NOT intercept if activeElement or target is an input, textarea, or contentEditable
      if (isTextInputElement(activeEl) || isTextInputElement(targetEl)) {
        return;
      }

      // Only handle if this upload zone is focused or user is interacting with it
      const isZoneFocused =
        dropZoneRef.current &&
        (dropZoneRef.current === activeEl || dropZoneRef.current.contains(activeEl));

      const isInsideContainer =
        containerRef.current &&
        (containerRef.current.contains(activeEl) || containerRef.current.contains(targetEl));

      const isInteracting = isFocused || isZoneFocused || (isHovered && isInsideContainer);

      if (!isInteracting) {
        return;
      }

      const file = extractImageFromClipboard(e.clipboardData);
      if (file) {
        e.preventDefault();
        e.stopPropagation();
        void uploadImageFile(file);
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => {
      window.removeEventListener('paste', handleWindowPaste);
    };
  }, [activeTab, isUploading, isFocused, isHovered, uploadImage, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void uploadImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadImageFile(file);
  };

  const handleUrlSubmit = () => {
    const valueToApply = urlInput.trim();
    if (!valueToApply) return;

    try {
      const url = new URL(valueToApply);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    } catch {
      alert('Vui lòng nhập URL hình ảnh hợp lệ bắt đầu bằng http:// hoặc https://.');
      return;
    }

    onChange(valueToApply);
  };

  // Compact Mode (for Answer Option cards or small spaces)
  if (compact) {
    return (
      <div style={{ marginTop: '8px' }}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          disabled={isUploading}
          onChange={handleFileChange}
        />
        {value ? (
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              maxWidth: '100%',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-subtle)',
            }}
          >
            <img
              src={value}
              alt="Hình ảnh đáp án"
              style={{
                maxHeight: '120px',
                maxWidth: '100%',
                display: 'block',
                objectFit: 'contain',
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Xóa ảnh"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--primary)',
                backgroundColor: 'var(--primary-light)',
                border: '1px dashed var(--primary)',
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer',
              }}
            >
              <Upload size={13} /> {isUploading ? 'Đang tải ảnh...' : 'Thêm ảnh đáp án'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full / Standard Mode (for Question canvas, Hint, Explanation)
  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '16px',
        backgroundColor: 'var(--bg-subtle)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        disabled={isUploading}
        onChange={handleFileChange}
      />

      {/* Header with Mode Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        {label && (
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {label}
          </span>
        )}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '2px',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              backgroundColor: activeTab === 'upload' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'upload' ? '#FFFFFF' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Upload size={12} /> Tải từ máy tính
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              backgroundColor: activeTab === 'url' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'url' ? '#FFFFFF' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <LinkIcon size={12} /> Dán liên kết URL
          </button>
        </div>
      </div>

      {/* Action / Input based on Tab */}
      {activeTab === 'upload' ? (
        <div
          ref={dropZoneRef}
          tabIndex={0}
          role="region"
          aria-label="Khu vực tải lên hình ảnh"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handleDropZonePaste}
          onClick={() => {
            if (!isUploading) dropZoneRef.current?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isUploading) fileInputRef.current?.click();
            }
          }}
          style={{
            padding: '22px 16px',
            borderRadius: 'var(--border-radius-md)',
            border: `2px dashed ${
              isDragging
                ? 'var(--primary)'
                : isFocused
                ? 'var(--primary)'
                : 'var(--border-color)'
            }`,
            backgroundColor: isDragging
              ? 'var(--primary-light)'
              : isFocused
              ? 'var(--primary-light)'
              : 'var(--bg-card)',
            outline: isFocused ? '2px solid var(--primary)' : 'none',
            outlineOffset: '2px',
            boxShadow: isFocused ? '0 0 0 4px rgba(37, 99, 235, 0.15)' : 'none',
            textAlign: 'center',
            cursor: 'pointer',
            opacity: isUploading ? 0.65 : 1,
            pointerEvents: isUploading ? 'none' : 'auto',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isUploading) fileInputRef.current?.click();
            }}
            title="Tải ảnh lên từ máy tính"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isFocused ? 'var(--primary)' : 'var(--primary-light)',
              color: isFocused ? '#FFFFFF' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Upload size={20} />
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              flexWrap: 'wrap',
              lineHeight: 1.5,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isUploading) fileInputRef.current?.click();
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--primary)',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              {isUploading ? 'Đang tải ảnh lên...' : 'Nhấn để tải ảnh lên'}
            </button>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              , kéo thả tệp hoặc
            </span>
            <kbd
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
            >
              Ctrl + V
            </kbd>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              để dán ảnh
            </span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              color: isFocused ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: isFocused ? 600 : 400,
            }}
          >
            {isFocused
              ? '✓ Vùng tải ảnh đang được chọn. Nhấn Ctrl + V hoặc Cmd + V để dán ảnh'
              : 'Hỗ trợ PNG, JPG, JPEG, GIF, WebP, SVG (Tối đa 5MB)'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="url"
            className="input-field"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
            placeholder="Dán đường dẫn URL hình ảnh (https://...)"
            style={{ flex: 1, height: '42px', minHeight: '42px' }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUrlSubmit}
            disabled={isUploading}
            style={{ height: '42px', minHeight: '42px', padding: '0 16px', whiteSpace: 'nowrap' }}
          >
            Áp dụng
          </button>
        </div>
      )}

      {/* Image Preview & Delete */}
      {value && (
        <div
          style={{
            position: 'relative',
            marginTop: '4px',
            padding: '12px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '200px', flex: 1 }}>
            <img
              src={value}
              alt="Xem trước hình ảnh"
              style={{
                maxHeight: `${maxHeight}px`,
                maxWidth: '260px',
                objectFit: 'contain',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-subtle)',
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Hình ảnh đã tải lên
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                ✓ Đã sẵn sàng hiển thị
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                if (!isUploading) fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={14} /> Đổi ảnh
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setUrlInput('');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--border-color)',
                color: 'var(--error)',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Xóa ảnh"
            >
              <Trash2 size={15} /> Xóa ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
