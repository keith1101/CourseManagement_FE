import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, ChevronDown, ChevronUp, Lightbulb, FileText, Trash, BookOpen } from 'lucide-react';
import { Question, AnswerOption } from '../../types';
import { AnswerOptionCard } from './AnswerOptionCard';
import { subjectsApi } from '../../api/subjects';

export interface QuestionCanvasProps {
  question: Question;
  onChange: (updated: Question) => void;
}

export const QuestionCanvas: React.FC<QuestionCanvasProps> = ({ question, onChange }) => {
  const [showHint, setShowHint] = useState(!!question.hint);
  const [showExplanation, setShowExplanation] = useState(!!question.explanation);
  const [showImageInput, setShowImageInput] = useState(!!question.image);
  const [subjects, setSubjects] = useState<{ id: string; code: string; name: string }[]>([]);

  useEffect(() => {
    void subjectsApi.getSubjects().then(setSubjects).catch(() => undefined);
  }, []);

  const isChoiceType = question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE';

  const handleOptionChange = (index: number, updatedOption: AnswerOption) => {
    let newOptions = [...question.options];
    if (question.type === 'SINGLE_CHOICE' && updatedOption.isCorrect) {
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
    <div className="question-editor-canvas">
      {/* 1. Subject Select Row */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <label
          htmlFor="question-subject"
          style={{
            fontWeight: 700,
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <BookOpen size={16} color="var(--primary)" /> Môn học của câu hỏi:
        </label>
        <select
          id="question-subject"
          className="input-field"
          value={question.subjectId}
          onChange={(event) => onChange({ ...question, subjectId: event.target.value })}
          style={{ flex: 1, minWidth: '220px', height: '38px', minHeight: '38px' }}
        >
          <option value="">-- Chọn môn học --</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.code} - {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Question Title & Content Box */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Nội dung câu hỏi <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowImageInput((value) => !value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            <ImageIcon size={15} />
            {showImageInput ? 'Ẩn đường dẫn ảnh' : 'Thêm hình ảnh minh họa'}
          </button>
        </div>

        {/* Instruction (Optional) */}
        <div>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Hướng dẫn trả lời (tùy chọn)
          </label>
          <input
            type="text"
            className="input-field"
            value={question.instruction || ''}
            onChange={(e) => onChange({ ...question, instruction: e.target.value })}
            placeholder="Ví dụ: Chọn câu trả lời đúng nhất, Điền số thích hợp..."
            style={{ marginTop: '4px', height: '38px', minHeight: '38px' }}
          />
        </div>

        {/* Content Textarea */}
        <textarea
          rows={4}
          className="input-field"
          value={question.content}
          onChange={(e) => onChange({ ...question, content: e.target.value })}
          placeholder="Nhập nội dung câu hỏi tại đây..."
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            padding: '14px 16px',
          }}
        />

        {/* Image Input and Preview */}
        {showImageInput && (
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                className="input-field"
                value={question.image || ''}
                onChange={(e) => onChange({ ...question, image: e.target.value })}
                placeholder="Dán đường dẫn URL hình ảnh (https://...)"
                style={{ flex: 1, height: '38px', minHeight: '38px' }}
              />
              {question.image && (
                <button
                  type="button"
                  onClick={() => onChange({ ...question, image: '' })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--error)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Xóa ảnh"
                >
                  <Trash size={16} />
                </button>
              )}
            </div>
            {question.image && (
              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <img
                  src={question.image}
                  alt="Xem trước hình ảnh"
                  style={{
                    maxHeight: '200px',
                    objectFit: 'contain',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Answers Grid / Form */}
      {isChoiceType ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Các Lựa Chọn Đáp Án (A, B, C, D)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Bấm “Đặt làm đáp án đúng” trên thẻ tương ứng
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
              gap: '16px',
            }}
          >
            {question.options.map((option, index) => (
              <AnswerOptionCard
                key={option.label || index}
                option={option}
                index={index}
                isMultiChoice={question.type === 'MULTIPLE_CHOICE'}
                onChange={(updated) => handleOptionChange(index, updated)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Đáp án chuẩn mẫu (Dành cho tự luận / điền từ)
          </h3>
          <textarea
            rows={3}
            className="input-field"
            value={question.options[0]?.content || ''}
            onChange={(e) => {
              const opts = [{ label: 'A', content: e.target.value, isCorrect: true }];
              onChange({ ...question, options: opts });
            }}
            placeholder="Nhập nội dung đáp án chuẩn..."
            style={{ padding: '14px 16px' }}
          />
        </div>
      )}

      {/* 4. Collapsible Hint & Explanation Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Hint Accordion */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <button
            type="button"
            onClick={() => setShowHint((value) => !value)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={17} color="var(--accent)" /> Gợi ý làm bài (Hint)
            </span>
            {showHint ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showHint && (
            <div style={{ marginTop: '12px' }}>
              <textarea
                rows={2}
                className="input-field"
                value={question.hint || ''}
                onChange={(e) => onChange({ ...question, hint: e.target.value })}
                placeholder="Nhập gợi ý hướng dẫn học sinh suy luận..."
                style={{ padding: '10px 14px' }}
              />
            </div>
          )}
        </div>

        {/* Explanation Accordion */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <button
            type="button"
            onClick={() => setShowExplanation((value) => !value)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={17} color="var(--primary)" /> Giải thích chi tiết đáp án (Explanation)
            </span>
            {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showExplanation && (
            <div style={{ marginTop: '12px' }}>
              <textarea
                rows={3}
                className="input-field"
                value={question.explanation || ''}
                onChange={(e) => onChange({ ...question, explanation: e.target.value })}
                placeholder="Nhập phần giải thích chi tiết vì sao đáp án này là đúng..."
                style={{ padding: '10px 14px' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
