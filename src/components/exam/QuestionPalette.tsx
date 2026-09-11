import React from 'react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, any>;
  questionIds: string[];
  questionStatuses?: Array<'LOCKED' | 'ACTIVE' | 'CORRECT' | 'INCORRECT' | 'TIMED_OUT' | 'COMPLETED'>;
  onSelectIndex: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  questionStatuses,
  onSelectIndex,
}) => {
  const answeredCount = questionStatuses
    ? questionStatuses.filter((status) => status === 'COMPLETED').length
    : Object.keys(answers).filter((k) => answers[k] !== '' && answers[k] !== undefined).length;

  return (
    <div className="card question-palette">
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Danh Sách Câu Hỏi
        </h4>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)' }}>
          {answeredCount} / {totalQuestions} đã làm
        </span>
      </div>

      {/* Grid of question buttons */}
      <div className="question-palette-grid">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qId = questionIds[idx];
          const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
          const status = questionStatuses?.[idx];
          const isCurrent = idx === currentIndex;
          const isNavigable = !questionStatuses || status === 'ACTIVE' && isCurrent;

          let bg = 'var(--bg-card)';
          let color = 'var(--text-primary)';
          let border = '1px solid var(--border-color)';

          if (status === 'COMPLETED' || isAnswered) {
            bg = 'var(--primary)';
            color = '#FFFFFF';
            border = '1px solid var(--primary)';
          }
          if (status === 'LOCKED') {
            bg = 'var(--bg-subtle)';
            color = 'var(--text-secondary)';
          }

          return (
            <button
              key={idx}
              onClick={() => isNavigable && onSelectIndex(idx)}
              disabled={!isNavigable}
              style={{
                height: '38px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: bg,
                color,
                border: isCurrent ? '2px solid var(--accent)' : border,
                fontWeight: 700,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: isCurrent ? '0 0 0 2px rgba(200, 100, 62, 0.3)' : 'none',
                transition: 'all var(--transition-fast)',
                cursor: isNavigable ? 'pointer' : 'not-allowed',
                opacity: status === 'LOCKED' ? 0.65 : 1,
              }}
            >
              {idx + 1}
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
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} />
          <span>Chưa trả lời ({totalQuestions - answeredCount})</span>
        </div>
      </div>
    </div>
  );
};
