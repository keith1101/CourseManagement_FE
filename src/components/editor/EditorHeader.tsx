import React from 'react';
import { ArrowLeft, Clock, Award, Save, X, Layers } from 'lucide-react';
import { QuestionType } from '../../types';
import { Button } from '../common/Button';

interface EditorHeaderProps {
  examTitle: string;
  timeLimit: number;
  points: number;
  questionType: QuestionType;
  isSaving: boolean;
  onTimeLimitChange: (time: number) => void;
  onPointsChange: (points: number) => void;
  onQuestionTypeChange: (type: QuestionType) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  examTitle,
  timeLimit,
  points,
  questionType,
  isSaving,
  onTimeLimitChange,
  onPointsChange,
  onQuestionTypeChange,
  onSave,
  onCancel,
}) => {
  return (
    <header
      className="editor-header"
      style={{
        height: '64px',
        backgroundColor: 'var(--primary)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-primary-strong)',
      }}
    >
      {/* Left: Back & Exam Title */}
      <div className="editor-header-leading" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onCancel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'background var(--transition-fast)',
          }}
        >
          <ArrowLeft size={16} /> Quay lại Đề thi
        </button>
        <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.2)', paddingLeft: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>{examTitle}</h2>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            Trình soạn thảo câu hỏi Kahoot-Style
          </span>
        </div>
      </div>

      {/* Center: Controls (Time, Points, Type) */}
      <div className="editor-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Time Limit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-md)',
          }}
        >
          <Clock size={16} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Thời gian:</span>
          <input
            type="number"
            min={5}
            max={3600}
            step={5}
            value={timeLimit}
            onChange={(e) => onTimeLimitChange(Number(e.target.value))}
            style={{
              width: '56px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              outline: 'none',
              padding: '2px 4px',
            }}
          />
          <span style={{ fontSize: '0.75rem' }}>giây</span>
        </div>

        {/* Points */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-md)',
          }}
        >
          <Award size={16} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Điểm số:</span>
          <input
            type="number"
            min={0.5}
            max={100}
            step={0.5}
            value={points}
            onChange={(e) => onPointsChange(Number(e.target.value))}
            style={{
              width: '50px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              outline: 'none',
              padding: '2px 4px',
            }}
          />
        </div>

        {/* Question Type */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-md)',
          }}
        >
          <Layers size={16} />
          <select
            value={questionType}
            onChange={(e) => onQuestionTypeChange(e.target.value as QuestionType)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="SINGLE_CHOICE" style={{ color: 'var(--text-primary)' }}>Trắc nghiệm (1 đáp án)</option>
            <option value="MULTIPLE_CHOICE" style={{ color: 'var(--text-primary)' }}>Trắc nghiệm (Nhiều đáp án)</option>
            <option value="ESSAY" style={{ color: 'var(--text-primary)' }}>Tự luận</option>
            <option value="FILL_BLANK" style={{ color: 'var(--text-primary)' }}>Điền vào chỗ trống</option>
          </select>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="editor-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onCancel}
          style={{
            color: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 14px',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <X size={16} /> Hủy
        </button>
        <Button
          onClick={onSave}
          variant="secondary"
          isLoading={isSaving}
          leftIcon={<Save size={16} />}
          style={{
            backgroundColor: 'var(--secondary)',
            fontWeight: 700,
          }}
        >
          Lưu Câu Hỏi
        </Button>
      </div>
    </header>
  );
};
