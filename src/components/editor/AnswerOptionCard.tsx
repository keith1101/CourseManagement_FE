import React from 'react';
import { Check, Circle } from 'lucide-react';
import { AnswerOption } from '../../types';

interface AnswerOptionCardProps {
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
  isMultiChoice = false,
  onChange,
}) => {
  const config = colorMap[index % colorMap.length];

  return (
    <div
      style={{
        borderRadius: 'var(--border-radius-lg)',
        backgroundColor: '#FFFFFF',
        border: `2px solid ${option.isCorrect ? config.border : 'var(--border-color)'}`,
        boxShadow: option.isCorrect ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Top Banner with Label & Correct Answer Toggle */}
      <div
        style={{
          backgroundColor: config.bg,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            {option.label}
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Đáp án {option.label}</span>
        </div>

        {/* Checkbox / Toggle for Correct Answer */}
        <button
          type="button"
          onClick={() => onChange({ ...option, isCorrect: !option.isCorrect })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: option.isCorrect ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
            color: option.isCorrect ? config.bg : '#FFFFFF',
            padding: '4px 12px',
            borderRadius: 'var(--border-radius-full)',
            fontWeight: 700,
            fontSize: '0.75rem',
            transition: 'all var(--transition-fast)',
          }}
        >
          {option.isCorrect ? (
            <>
              <Check size={14} strokeWidth={3} /> ĐÁP ÁN ĐÚNG
            </>
          ) : (
            <>
              <Circle size={14} /> Chọn đáp án đúng
            </>
          )}
        </button>
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <textarea
          rows={3}
          value={option.content}
          onChange={(e) => onChange({ ...option, content: e.target.value })}
          placeholder={`Nhập nội dung cho đáp án ${option.label}...`}
          style={{
            width: '100%',
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '0.9375rem',
            resize: 'none',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        />
      </div>
    </div>
  );
};
