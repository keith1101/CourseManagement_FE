import React, { useState } from 'react';
import { Check, Lightbulb, X, HelpCircle, FileText } from 'lucide-react';
import { AttemptFeedback, Question } from '../../types';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedOptionId?: string;
  textAnswer?: string;
  feedback?: AttemptFeedback;
  disabled?: boolean;
  onSelectOption: (optionId: string) => void;
  onTextAnswerChange: (text: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedOptionId,
  textAnswer = '',
  feedback,
  disabled = false,
  onSelectOption,
  onTextAnswerChange,
}) => {
  const [showHint, setShowHint] = useState(false);
  const isChoice = question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE';
  const correctOptionId = feedback?.correctOptionId;

  return (
    <div
      className="card question-card animate-slide-up"
      data-testid="question-card"
      data-question-id={question.id}
    >
      {/* Question Card Header */}
      <div className="question-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.875rem',
              padding: '4px 14px',
              borderRadius: 'var(--border-radius-full)',
            }}
          >
            Câu {currentIndex + 1} / {totalQuestions}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            ({question.points} điểm)
          </span>
        </div>

      </div>

      {/* Question Content & Media */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {question.instruction && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <HelpCircle size={16} />
            <div>
              <strong>Hướng dẫn:</strong> {question.instruction}
            </div>
          </div>
        )}

        <p
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.7,
          }}
        >
          {question.content}
        </p>

        {question.image && (
          <div style={{ margin: '8px 0' }}>
            <img
              src={question.image}
              alt="Hình ảnh minh họa câu hỏi"
              style={{
                maxWidth: '100%',
                maxHeight: '340px',
                objectFit: 'contain',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>
        )}

        {(question.hint || question.hintImage) && (
          <div>
            <button
              type="button"
              onClick={() => setShowHint((value) => !value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              <Lightbulb size={16} />
              {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý câu hỏi'}
            </button>
            {showHint && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--secondary-light)',
                  border: '1px solid rgba(200, 100, 62, 0.25)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}
              >
                {question.hint}
                {question.hintImage && (
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={question.hintImage}
                      alt="Hình ảnh gợi ý"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '220px',
                        objectFit: 'contain',
                        borderRadius: 'var(--border-radius-sm)',
                        border: '1px solid var(--border-color)',
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Answer Choices Grid or Essay Textarea */}
      {isChoice ? (
        <div className="question-options">
          {question.options.map((option, index) => {
            const optionId = option.id || option.label || `option-${index}`;
            const selected = selectedOptionId === optionId || selectedOptionId === option.label;
            const correct = correctOptionId === optionId || correctOptionId === option.id;
            const isWrongSelected = !!feedback && selected && !feedback.isCorrect;

            const bg = correct
              ? 'var(--success-bg)'
              : isWrongSelected
              ? 'var(--error-bg)'
              : selected
              ? 'var(--primary-light)'
              : 'var(--bg-card)';

            const border = correct
              ? 'var(--success)'
              : isWrongSelected
              ? 'var(--error)'
              : selected
              ? 'var(--primary)'
              : 'var(--border-color)';

            return (
              <button
                type="button"
                key={optionId}
                disabled={disabled || !!feedback}
                onClick={() => onSelectOption(optionId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: bg,
                  border: `2px solid ${border}`,
                  boxShadow: selected ? 'var(--shadow-sm)' : 'none',
                  cursor: disabled || feedback ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                  opacity: disabled && !feedback ? 0.7 : 1,
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${border}`,
                    backgroundColor: selected
                      ? isWrongSelected
                        ? 'var(--error)'
                        : 'var(--primary)'
                      : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {correct ? (
                    <Check size={14} color="var(--success)" strokeWidth={3} />
                  ) : isWrongSelected ? (
                    <X size={14} color="#FFFFFF" strokeWidth={3} />
                  ) : selected ? (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  ) : null}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <strong
                      style={{
                        color: selected ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: '0.9375rem',
                      }}
                    >
                      {option.label}.
                    </strong>
                    <span style={{ fontSize: '0.9375rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      {option.content}
                    </span>
                  </span>
                  {option.image && (
                    <div style={{ marginTop: '4px' }}>
                      <img
                        src={option.image}
                        alt={`Ảnh đáp án ${option.label}`}
                        style={{
                          maxHeight: '120px',
                          maxWidth: '100%',
                          objectFit: 'contain',
                          borderRadius: 'var(--border-radius-sm)',
                          border: '1px solid var(--border-color)',
                        }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <label className="form-label" style={{ marginBottom: '8px' }}>
            Nhập câu trả lời của bạn:
          </label>
          <textarea
            rows={4}
            value={textAnswer}
            disabled={disabled || !!feedback}
            onChange={(event) => onTextAnswerChange(event.target.value)}
            placeholder="Gõ câu trả lời tại đây..."
            className="input-field"
            style={{
              padding: '14px 16px',
              border: `1.5px solid ${
                feedback?.isCorrect
                  ? 'var(--success)'
                  : feedback
                  ? 'var(--error)'
                  : 'var(--border-color)'
              }`,
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
          />
        </div>
      )}

      {/* Immediate Question Feedback */}
      {feedback && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: feedback.isCorrect ? 'var(--success-bg)' : 'var(--error-bg)',
            border: `1px solid ${feedback.isCorrect ? 'var(--success-border)' : 'var(--error-border)'}`,
            color: 'var(--text-primary)',
            fontSize: '0.9375rem',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            {feedback.isCorrect ? (
              <>
                <Check size={18} color="var(--success)" strokeWidth={3} />
                <span style={{ color: 'var(--success)' }}>Chính xác!</span>
              </>
            ) : (
              <>
                <X size={18} color="var(--error)" strokeWidth={3} />
                <span style={{ color: 'var(--error)' }}>
                  {feedback.timedOut ? 'Hết giờ làm câu hỏi!' : 'Chưa chính xác.'}
                </span>
              </>
            )}
          </div>

          {feedback.correctTextAnswer && (
            <div style={{ marginTop: '6px' }}>
              Đáp án đúng: <strong>{feedback.correctTextAnswer}</strong>
            </div>
          )}

          {feedback.correctAnswer && (
            <div style={{ marginTop: '6px' }}>
              Đáp án đúng: <strong>{feedback.correctAnswer.content}</strong>
            </div>
          )}

          {feedback.guidance && (
            <div
              style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              <strong>Hướng dẫn:</strong>{feedback.guidance.text ? ` ${feedback.guidance.text}` : ' —'}
              {feedback.guidance.image && (
                <img
                  src={feedback.guidance.image}
                  alt="Hình minh họa hướng dẫn"
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '220px', marginTop: '8px' }}
                />
              )}
            </div>
          )}

          {(feedback.explanation || feedback.explanationImage) && (
            <div
              style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
              }}
            >
              <FileText size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div>
                  <strong>Giải thích:</strong>{feedback.explanation ? ` ${feedback.explanation}` : ' —'}
                </div>
                {feedback.explanationImage && (
                  <img
                    src={feedback.explanationImage}
                    alt="Hình ảnh giải thích đáp án"
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      maxHeight: '220px',
                      objectFit: 'contain',
                      marginTop: '8px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
