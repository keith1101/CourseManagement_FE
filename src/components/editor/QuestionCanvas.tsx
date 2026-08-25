import React, { useState } from 'react';
import { Image as ImageIcon, ChevronDown, ChevronUp, Lightbulb, FileText, Trash } from 'lucide-react';
import { Question, AnswerOption } from '../../types';
import { AnswerOptionCard } from './AnswerOptionCard';

interface QuestionCanvasProps {
  question: Question;
  onChange: (updated: Question) => void;
}

export const QuestionCanvas: React.FC<QuestionCanvasProps> = ({ question, onChange }) => {
  const [showHint, setShowHint] = useState(!!question.hint);
  const [showExplanation, setShowExplanation] = useState(!!question.explanation);
  const [showImageInput, setShowImageInput] = useState(!!question.image);

  const isChoiceType = question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE';

  const handleOptionChange = (index: number, updatedOption: AnswerOption) => {
    let newOptions = [...question.options];
    if (question.type === 'SINGLE_CHOICE' && updatedOption.isCorrect) {
      // Single choice -> only 1 correct answer
      newOptions = newOptions.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }));
    } else {
      newOptions[index] = updatedOption;
    }
    onChange({ ...question, options: newOptions });
  };

  return (
    <div
      style={{
        flex: 1,
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-app)',
        padding: '32px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* 1. Question Title & Content Box */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Nội dung câu hỏi <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--primary-light)',
            }}
          >
            <ImageIcon size={16} />
            {showImageInput ? 'Ẩn hình ảnh' : 'Chèn hình ảnh'}
          </button>
        </div>

        <textarea
          rows={3}
          value={question.content}
          onChange={(e) => onChange({ ...question, content: e.target.value })}
          placeholder="Nhập nội dung câu hỏi trắc nghiệm ở đây (Ví dụ: Thủ đô của Việt Nam là gì?)..."
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: '1.0625rem',
            lineHeight: 1.6,
            borderRadius: 'var(--border-radius-md)',
            border: '1.5px solid var(--border-color)',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'vertical',
            color: 'var(--text-primary)',
          }}
        />

        <div className="form-group">
          <label className="form-label">Hướng dẫn hiển thị cho học sinh</label>
          <textarea
            rows={2}
            value={question.instruction || ''}
            onChange={(e) => onChange({ ...question, instruction: e.target.value })}
            placeholder="Ví dụ: Chọn một đáp án đúng nhất."
            className="input-field"
          />
        </div>

        {/* Optional Image Input & Preview */}
        {showImageInput && (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={question.image || ''}
                onChange={(e) => onChange({ ...question, image: e.target.value })}
                placeholder="Dán đường dẫn ảnh minh họa (URL https://...)"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              {question.image && (
                <button
                  type="button"
                  onClick={() => onChange({ ...question, image: '' })}
                  style={{
                    color: 'var(--error)',
                    padding: '8px 12px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  <Trash size={14} /> Xóa ảnh
                </button>
              )}
            </div>
            {question.image && (
              <div style={{ maxWidth: '350px', maxHeight: '200px', overflow: 'hidden', borderRadius: '8px' }}>
                <img
                  src={question.image}
                  alt="Ảnh minh họa"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Answer Options Area (Kahoot Style 2x2 Grid) */}
      {isChoiceType ? (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Các lựa chọn đáp án (A, B, C, D)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              * Tích chọn nút <strong>ĐÁP ÁN ĐÚNG</strong> ở góc mỗi ô
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}
          >
            {question.options.map((option, idx) => (
              <AnswerOptionCard
                key={idx}
                option={option}
                index={idx}
                isMultiChoice={question.type === 'MULTIPLE_CHOICE'}
                onChange={(updated) => handleOptionChange(idx, updated)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Essay / Fill-in-the-blank Form */
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
            Đáp án chuẩn / Từ khóa chấm điểm
          </h3>
          <textarea
            rows={3}
            value={question.options[0]?.content || ''}
            onChange={(e) =>
              onChange({
                ...question,
                options: [{ label: 'Answer', content: e.target.value, isCorrect: true }],
              })
            }
            placeholder="Nhập câu trả lời mẫu hoặc các từ khóa bắt buộc..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--border-radius-md)',
              border: '1.5px solid var(--border-color)',
              outline: 'none',
              fontSize: '0.9375rem',
            }}
          />
        </div>
      )}

      {/* 3. Collapsible Hint Section */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={() => setShowHint(!showHint)}
          style={{
            width: '100%',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: showHint ? 'var(--primary-subtle)' : '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.9375rem',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={18} color="var(--secondary)" />
            <span>Gợi ý / Hướng dẫn giải (Tùy chọn)</span>
          </div>
          {showHint ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showHint && (
          <div style={{ padding: '16px 20px' }}>
            <textarea
              rows={2}
              value={question.hint || ''}
              onChange={(e) => onChange({ ...question, hint: e.target.value })}
              placeholder="Nhập gợi ý giúp học sinh tự suy luận..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-md)',
                border: '1.5px solid var(--border-color)',
                outline: 'none',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}
      </div>

      {/* 4. Collapsible Explanation Section */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          style={{
            width: '100%',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: showExplanation ? 'var(--primary-subtle)' : '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.9375rem',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" />
            <span>Giải thích chi tiết đáp án (Hiện khi xem kết quả)</span>
          </div>
          {showExplanation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showExplanation && (
          <div style={{ padding: '16px 20px' }}>
            <textarea
              rows={3}
              value={question.explanation || ''}
              onChange={(e) => onChange({ ...question, explanation: e.target.value })}
              placeholder="Nhập lời giải chi tiết và kiến thức liên quan..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-md)',
                border: '1.5px solid var(--border-color)',
                outline: 'none',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
