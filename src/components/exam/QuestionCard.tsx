import React, { useState } from 'react';
import { Check, Flag, Lightbulb, X } from 'lucide-react';
import { AttemptFeedback, Question } from '../../types';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedOptionId?: string;
  textAnswer?: string;
  feedback?: AttemptFeedback;
  disabled?: boolean;
  isFlagged?: boolean;
  onSelectOption: (optionId: string) => void;
  onTextAnswerChange: (text: string) => void;
  onToggleFlag: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedOptionId,
  textAnswer = '',
  feedback,
  disabled = false,
  isFlagged = false,
  onSelectOption,
  onTextAnswerChange,
  onToggleFlag,
}) => {
  const [showHint, setShowHint] = useState(false);
  const isChoice = question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE';
  const correctOptionId = feedback?.correctOptionId;

  return (
    <div className="card question-card animate-slide-up" style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 'var(--border-radius-lg)', padding: '32px 36px', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="question-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ backgroundColor: 'var(--primary)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.875rem', padding: '4px 12px', borderRadius: 'var(--border-radius-full)' }}>Câu {currentIndex + 1} / {totalQuestions}</span>
          <span style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', fontWeight: 600 }}>({question.points} điểm)</span>
        </div>
        <button type="button" onClick={onToggleFlag} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--border-radius-full)', backgroundColor: isFlagged ? 'var(--warning-bg)' : 'var(--bg-subtle)', color: isFlagged ? 'var(--secondary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem' }}>
          <Flag size={14} fill={isFlagged ? 'var(--secondary-accent)' : 'none'} />{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {question.instruction && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: '0.875rem' }}><strong>Hướng dẫn:</strong> {question.instruction}</div>}
        <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>{question.content}</p>
        {question.image && <img src={question.image} alt="Hình ảnh câu hỏi" style={{ maxWidth: '500px', maxHeight: '300px', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border-color)' }} />}
        {question.hint && <div><button type="button" onClick={() => setShowHint((value) => !value)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)', fontWeight: 700, fontSize: '0.875rem' }}><Lightbulb size={16} />{showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}</button>{showHint && <div style={{ marginTop: '8px', padding: '10px 14px', background: 'var(--secondary-light)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{question.hint}</div>}</div>}
      </div>

      {isChoice ? (
        <div className="question-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>
          {question.options.map((option, index) => {
            const optionId = option.id || option.label || `option-${index}`;
            const selected = selectedOptionId === optionId || selectedOptionId === option.label;
            const correct = correctOptionId === optionId || correctOptionId === option.id;
            const isWrongSelected = !!feedback && selected && !feedback.isCorrect;
            const background = correct ? 'var(--success-bg)' : isWrongSelected ? 'var(--error-bg)' : selected ? 'var(--primary-light)' : '#FFFFFF';
            const border = correct ? 'var(--success)' : isWrongSelected ? 'var(--error)' : selected ? 'var(--primary)' : 'var(--border-color)';
            return <button type="button" key={optionId} disabled={disabled || !!feedback} onClick={() => onSelectOption(optionId)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '14px', backgroundColor: background, border: `2px solid ${border}`, boxShadow: selected ? 'var(--shadow-primary)' : 'var(--shadow-sm)', cursor: disabled || feedback ? 'default' : 'pointer', textAlign: 'left', opacity: disabled && !feedback ? 0.7 : 1 }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${border}`, backgroundColor: selected ? (isWrongSelected ? 'var(--error)' : 'var(--primary)') : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{correct ? <Check size={14} color="var(--success)" /> : isWrongSelected ? <X size={14} color="#FFFFFF" /> : selected ? <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} /> : null}</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flex: 1 }}><strong style={{ color: selected ? 'var(--primary)' : 'var(--text-secondary)' }}>{option.label}.</strong><span style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{option.content}</span></span>
            </button>;
          })}
        </div>
      ) : (
        <div>
          <label className="form-label" style={{ marginBottom: '8px' }}>Nhập câu trả lời của bạn:</label>
          <textarea rows={4} value={textAnswer} disabled={disabled || !!feedback} onChange={(event) => onTextAnswerChange(event.target.value)} placeholder="Gõ câu trả lời tại đây..." style={{ width: '100%', padding: '16px', borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${feedback?.isCorrect ? 'var(--success)' : feedback ? 'var(--error)' : 'var(--border-color)'}`, outline: 'none', fontSize: '1rem', lineHeight: 1.6 }} />
        </div>
      )}

      {feedback && <div style={{ padding: '14px 16px', borderRadius: '10px', background: feedback.isCorrect ? 'var(--success-bg)' : 'var(--error-bg)', border: `1px solid ${feedback.isCorrect ? 'var(--success)' : 'var(--error)'}`, color: 'var(--text-primary)' }}><strong>{feedback.timedOut ? 'Hết giờ.' : feedback.isCorrect ? 'Chính xác!' : 'Chưa chính xác.'}</strong>{feedback.correctTextAnswer && <div style={{ marginTop: '6px' }}>Đáp án đúng: <strong>{feedback.correctTextAnswer}</strong></div>}{feedback.explanation && <div style={{ marginTop: '6px' }}>Giải thích: {feedback.explanation}</div>}</div>}
    </div>
  );
};
