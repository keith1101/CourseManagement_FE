import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, Trash2, X } from 'lucide-react';

export interface ImageUploaderProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  compact?: boolean;
  maxHeight?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label,
  compact = false,
  maxHeight = 220,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value?.startsWith('http') ? value : '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, GIF, WebP, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) onChange(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset file input value so the same file can be chosen again if needed
    e.target.value = '';
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
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
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
              <Upload size={13} /> Thêm ảnh đáp án
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full / Standard Mode (for Question canvas, Hint, Explanation)
  return (
    <div
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
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '20px 16px',
            borderRadius: 'var(--border-radius-md)',
            border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
            backgroundColor: isDragging ? 'var(--primary-light)' : 'var(--bg-card)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Upload size={20} />
          </div>
          <div>
            <strong style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>
              Nhấn để tải ảnh lên
            </strong>{' '}
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              hoặc kéo và thả tệp vào đây
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Hỗ trợ PNG, JPG, JPEG, GIF, WebP, SVG (Tối đa 5MB)
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
              onClick={() => fileInputRef.current?.click()}
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
