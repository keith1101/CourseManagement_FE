import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, ChevronDown, ChevronUp, Lightbulb, FileText, BookOpen } from 'lucide-react';
import { Question, AnswerOption } from '../../types';
import { AnswerOptionCard } from './AnswerOptionCard';
import { ImageUploader } from '../common/ImageUploader';
import { subjectsApi } from '../../api/subjects';
import { questionsApi } from '../../api/questions';

export interface QuestionCanvasProps {
  question: Question;
  onChange: (updated: Question) => void;
}

export const QuestionCanvas: React.FC<QuestionCanvasProps> = ({ question, onChange }) => {
  const [showHint, setShowHint] = useState(!!(question.hint || question.hintImage));
  const [showExplanation, setShowExplanation] = useState(!!(question.explanation || question.explanationImage));
  const [showImageInput, setShowImageInput] = useState(!!question.image);
  const [subjects, setSubjects] = useState<{ id: string; code: string; name: string }[]>([]);

  useEffect(() => {
    void subjectsApi.getSubjects().then(setSubjects).catch(() => undefined);
  }, []);

  const isChoiceType = question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE';

  const handleOptionChange = (index: number, updatedOption: AnswerOption) => {
    let newOptions = [...question.options];
    newOptions[index] = updatedOption;
    if (question.type === 'SINGLE_CHOICE' && updatedOption.isCorrect) {
      newOptions = newOptions.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }));
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
            fontSize: '0.9375rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <BookOpen size={18} color="var(--primary)" /> Môn học của câu hỏi:
        </label>
        <select
          id="question-subject"
          className="input-field"
          value={question.subjectId}
          onChange={(event) => onChange({ ...question, subjectId: event.target.value })}
          style={{ flex: 1, minWidth: '240px', height: '46px', minHeight: '46px', cursor: 'pointer' }}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <label style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Nội dung câu hỏi <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowImageInput((value) => !value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              padding: '6px 12px',
              backgroundColor: 'var(--primary-light)',
              borderRadius: 'var(--border-radius-md)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ImageIcon size={16} />
            {showImageInput ? 'Ẩn phần hình ảnh' : 'Thêm hình ảnh minh họa câu hỏi'}
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
            placeholder="Ví dụ: Chọn câu trả lời đúng nhất, Trình bày chi tiết..."
            style={{ marginTop: '6px', height: '46px', minHeight: '46px' }}
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
            minHeight: '110px',
          }}
        />

        {/* Full Image Upload Component */}
        {showImageInput && (
          <ImageUploader
            label="Hình ảnh minh họa cho câu hỏi"
            value={question.image}
            uploadImage={questionsApi.uploadImage}
            onChange={(imageUrl, storageUri) =>
              onChange({
                ...question,
                image: imageUrl,
                imageStorageUri: storageUri,
              })
            }
          />
        )}
      </div>

      {/* 3. Answers Grid / Form */}
      {isChoiceType ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Các Lựa Chọn Đáp Án (A, B, C, D)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Bấm “Đặt làm đáp án đúng” trên thẻ tương ứng
            </span>
          </div>

          <div className="question-options-grid">
            {question.options.map((option, index) => (
              <AnswerOptionCard
                key={option.label || index}
                option={option}
                index={index}
                uploadImage={questionsApi.uploadImage}
                onChange={(updated) => handleOptionChange(index, updated)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Đáp án chuẩn mẫu (Dành cho tự luận)
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
            style={{ padding: '14px 16px', minHeight: '90px' }}
          />
        </div>
      )}

      {/* 4. Collapsible Hint & Explanation Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={18} color="var(--accent)" /> Gợi ý làm bài (Hint)
            </span>
            {showHint ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showHint && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                rows={2}
                className="input-field"
                value={question.hint || ''}
                onChange={(e) => onChange({ ...question, hint: e.target.value })}
                placeholder="Nhập gợi ý hướng dẫn học sinh suy luận..."
                style={{ padding: '12px 16px', minHeight: '80px' }}
              />
              <ImageUploader
                label="Hình ảnh gợi ý (tùy chọn)"
                value={question.hintImage}
                uploadImage={questionsApi.uploadImage}
                onChange={(imageUrl, storageUri) =>
                  onChange({
                    ...question,
                    hintImage: imageUrl,
                    hintImageStorageUri: storageUri,
                  })
                }
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
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--primary)" /> Giải thích chi tiết đáp án
            </span>
            {showExplanation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showExplanation && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                rows={3}
                className="input-field"
                value={question.explanation || ''}
                onChange={(e) => onChange({ ...question, explanation: e.target.value })}
                placeholder="Nhập phần giải thích chi tiết vì sao đáp án này là đúng..."
                style={{ padding: '12px 16px', minHeight: '90px' }}
              />
              <ImageUploader
                label="Hình ảnh giải thích đáp án (tùy chọn)"
                value={question.explanationImage}
                uploadImage={questionsApi.uploadImage}
                onChange={(imageUrl, storageUri) =>
                  onChange({
                    ...question,
                    explanationImage: imageUrl,
                    explanationImageStorageUri: storageUri,
                  })
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

