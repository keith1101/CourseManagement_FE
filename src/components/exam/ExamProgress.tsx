import React from 'react';
import { Check } from 'lucide-react';

export interface ExamSection {
  id: string;
  title: string;
  questionCount: number;
}

interface ExamProgressProps {
  sections: ExamSection[];
  activeSectionIndex: number;
  onSelectSection?: (index: number) => void;
}

export const ExamProgress: React.FC<ExamProgressProps> = ({
  sections,
  activeSectionIndex,
  onSelectSection,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px 24px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        width: '100%',
      }}
    >
      {sections.map((sec, idx) => {
        const isCurrent = idx === activeSectionIndex;
        const isPassed = idx < activeSectionIndex;

        return (
          <React.Fragment key={sec.id || idx}>
            <button
              onClick={() => onSelectSection && onSelectSection(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-full)',
                backgroundColor: isCurrent
                  ? 'var(--primary)'
                  : isPassed
                  ? 'var(--primary-light)'
                  : 'var(--bg-subtle)',
                color: isCurrent
                  ? '#FFFFFF'
                  : isPassed
                  ? 'var(--primary)'
                  : 'var(--text-secondary)',
                fontWeight: isCurrent ? 700 : 500,
                fontSize: '0.875rem',
                transition: 'all var(--transition-fast)',
                cursor: onSelectSection ? 'pointer' : 'default',
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: isCurrent
                    ? 'rgba(255, 255, 255, 0.25)'
                    : isPassed
                    ? 'var(--primary)'
                    : '#CBD5E1',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {isPassed ? <Check size={12} strokeWidth={3} /> : idx + 1}
              </span>
              <span>{sec.title}</span>
            </button>

            {idx < sections.length - 1 && (
              <span
                style={{
                  color: 'var(--border-color)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  margin: '0 4px',
                  userSelect: 'none',
                }}
              >
                ─▶
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
