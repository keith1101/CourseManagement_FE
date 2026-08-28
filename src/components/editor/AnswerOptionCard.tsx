import React from 'react';
import { Check, Circle } from 'lucide-react';
import { AnswerOption } from '../../types';
import { ImageUploader } from '../common/ImageUploader';

export interface AnswerOptionCardProps {
  option: AnswerOption;
  index: number;
  isMultiChoice?: boolean;
  onChange: (updated: AnswerOption) => void;
}

const colorMap = [
  { label: 'A', bg: 'var(--answer-a)', lightBg: 'var(--answer-a-light)', border: 'var(--answer-a)' },
  { label: 'B', bg: 'var(--answer-b)', lightBg: 'var(--answer-b-light)', border: 'var(--answer-b)' },
  { label: 'C', bg: 'var(--answer-c)', lightBg: 'var(--answer-c-light)', border: 'var(--answer-c)' },
  { label: 'D', bg: 'var(--answer-d)', lightBg: 'var(--answer-d-light)', border: 'var(--answer-d)' },
];

export const AnswerOptionCard: React.FC<AnswerOptionCardProps> = ({
  option,
  index,
  onChange,
}) => {
  const config = colorMap[index % colorMap.length];

  return (
    <div
      style={{
        borderRadius: 'var(--border-radius-lg)',
        backgroundColor: 'var(--bg-card)',
        border: `2px solid ${option.isCorrect ? config.border : 'var(--border-color)'}`,
        boxShadow: option.isCorrect ? 'var(--shadow-sm)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Top Banner with Label & Correct Answer Toggle */}
      <div
        style={{
          backgroundColor: option.isCorrect ? config.bg : 'var(--bg-subtle)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          color: option.isCorrect ? '#FFFFFF' : 'var(--text-primary)',
          borderBottom: `1px solid ${option.isCorrect ? config.border : 'var(--border-color)'}`,
          transition: 'all var(--transition-fast)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: option.isCorrect ? 'rgba(255, 255, 255, 0.25)' : config.bg,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            {option.label}
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            Đáp án {option.label}
          </span>
        </div>

        {/* Checkbox / Toggle for Correct Answer */}
        <button
          type="button"
          onClick={() => onChange({ ...option, isCorrect: !option.isCorrect })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: option.isCorrect ? '#FFFFFF' : 'var(--bg-card)',
            color: option.isCorrect ? config.bg : 'var(--text-secondary)',
            border: `1px solid ${option.isCorrect ? '#FFFFFF' : 'var(--border-color)'}`,
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-full)',
            fontWeight: 700,
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {option.isCorrect ? (
            <>
              <Check size={13} strokeWidth={3} /> ĐÁP ÁN ĐÚNG
            </>
          ) : (
            <>
              <Circle size={13} /> Đặt làm đáp án đúng
            </>
          )}
        </button>
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          rows={3}
          value={option.content}
          onChange={(e) => onChange({ ...option, content: e.target.value })}
          placeholder={`Nhập nội dung cho đáp án ${option.label}...`}
          style={{
            width: '100%',
            flex: 1,
            minHeight: '72px',
            border: 'none',
            outline: 'none',
            fontSize: '0.9375rem',
            resize: 'none',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            backgroundColor: 'transparent',
          }}
        />

        {/* Compact Image Uploader for Answer Option */}
        <ImageUploader
          compact
          value={option.image}
          onChange={(imageUrl) => onChange({ ...option, image: imageUrl })}
        />
      </div>
    </div>
  );
};
