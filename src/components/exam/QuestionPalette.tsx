import React from 'react';
import { Flag, CheckCircle } from 'lucide-react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, any>;
  flaggedQuestions: Record<number, boolean>;
  questionIds: string[];
  onSelectIndex: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  flaggedQuestions,
  questionIds,
  onSelectIndex,
}) => {
  const answeredCount = Object.keys(answers).length;

  return (
    <div
      className="question-palette"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Danh Sách Câu Hỏi
        </h4>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
          Đã làm: {answeredCount}/{totalQuestions}
        </span>
      </div>

      {/* Grid of question buttons */}
      <div
        className="question-palette-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '4px',
        }}
      >
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qId = questionIds[idx];
          const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
          const isFlagged = !!flaggedQuestions[idx];
          const isCurrent = idx === currentIndex;

          let bg = '#FFFFFF';
          let color = 'var(--text-primary)';
          let border = '1px solid var(--border-color)';

          if (isAnswered) {
            bg = 'var(--primary)';
            color = '#FFFFFF';
            border = '1px solid var(--primary)';
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectIndex(idx)}
              style={{
                height: '40px',
                borderRadius: '8px',
                backgroundColor: bg,
                color,
                border: isCurrent ? '2px solid var(--secondary)' : border,
                fontWeight: 700,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: isCurrent ? '0 0 0 3px rgba(242, 184, 75, 0.35)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              {idx + 1}
              {isFlagged && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--secondary-accent)',
                    border: '2px solid #FFFFFF',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Status Legend */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--primary)' }} />
          <span>Đã trả lời ({answeredCount})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)' }} />
          <span>Chưa trả lời ({totalQuestions - answeredCount})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--secondary-accent)' }} />
          <span>Đã đánh dấu xem lại</span>
        </div>
      </div>
    </div>
  );
};
