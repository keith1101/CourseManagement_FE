import React from 'react';
import { ArrowLeft, Clock, Award, Save, X, Layers, Download } from 'lucide-react';
import { QuestionType } from '../../types';
import { Button } from '../common/Button';

export interface EditorHeaderProps {
  examTitle: string;
  timeLimit: number;
  points: number;
  questionType: QuestionType;
  partsCount?: number;
  isSaving: boolean;
  onTimeLimitChange: (time: number) => void;
  onPointsChange: (points: number) => void;
  onQuestionTypeChange: (type: QuestionType) => void;
  onSave: () => void;
  onCancel: () => void;
  isAdmin?: boolean;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  examTitle,
  timeLimit,
  points,
  questionType,
  partsCount,
  isSaving,
  onTimeLimitChange,
  onPointsChange,
  onQuestionTypeChange,
  onSave,
  onCancel,
  isAdmin,
  onExportPdf,
  isExportingPdf,
}) => {
  return (
    <header className="editor-header">
      {/* Left: Back & Exam Title */}
      <div className="editor-header-leading" style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
        <button
          onClick={onCancel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            transition: 'background var(--transition-fast)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
        >
          <ArrowLeft size={15} /> Quay lại
        </button>
        <div
          style={{
            borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
            paddingLeft: '16px',
            minWidth: 0,
          }}
        >
          <h2
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              lineHeight: 1.2,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {examTitle}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>
            Soạn thảo câu hỏi trắc nghiệm
          </span>
        </div>
      </div>

      {/* Center: Controls (Time, Points, Type) */}
      <div className="editor-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Time Limit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 10px',
            borderRadius: 'var(--border-radius-md)',
          }}
        >
          <Clock size={15} color="rgba(255, 255, 255, 0.8)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
            Thời gian:
          </span>
          <input
            type="number"
            min={5}
            max={3600}
            step={5}
            value={timeLimit}
            onChange={(e) => onTimeLimitChange(Number(e.target.value))}
            style={{
              width: '52px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.8125rem',
              outline: 'none',
              padding: '2px 4px',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>giây</span>
        </div>

        {/* Points */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 10px',
            borderRadius: 'var(--border-radius-md)',
          }}
        >
          <Award size={15} color="rgba(255, 255, 255, 0.8)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
            Điểm:
          </span>
          {questionType === 'MULTI_PART_SHORT_ANSWER' ? (
            <span
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8125rem',
                padding: '2px 4px',
              }}
            >
              {partsCount ?? 1} ý = {partsCount ?? 1} điểm thành phần
            </span>
          ) : (
            <input
              type="number"
              min={0.5}
              max={100}
              step={0.5}
              value={points}
              onChange={(e) => onPointsChange(Number(e.target.value))}
              style={{
                width: '46px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '4px',
                color: '#FFFFFF',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.8125rem',
                outline: 'none',
                padding: '2px 4px',
              }}
            />
          )}
        </div>

        {/* Question Type */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 10px',
            borderRadius: 'var(--border-radius-md)',
          }}
        >
          <Layers size={15} color="rgba(255, 255, 255, 0.8)" />
          <select
            value={questionType}
            onChange={(e) => onQuestionTypeChange(e.target.value as QuestionType)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.8125rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="SINGLE_CHOICE" style={{ color: '#202938' }}>
              Trắc nghiệm (1 đáp án)
            </option>
            <option value="ESSAY" style={{ color: '#202938' }}>
              Tự luận
            </option>
            <option value="MULTI_PART_SHORT_ANSWER" style={{ color: '#202938' }}>
              Tự luận nhiều ý
            </option>
          </select>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="editor-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAdmin && onExportPdf && (
          <Button
            type="button"
            onClick={onExportPdf}
            variant="outline"
            size="sm"
            disabled={isExportingPdf}
            isLoading={isExportingPdf}
            leftIcon={<Download size={14} />}
            style={{
              borderColor: 'rgba(255, 255, 255, 0.4)',
              color: '#FFFFFF',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}
            title="Xuất đề thi PDF"
          >
            {isExportingPdf ? 'Đang tạo PDF...' : 'Xuất PDF'}
          </Button>
        )}
        <button
          onClick={onCancel}
          style={{
            color: 'rgba(255, 255, 255, 0.75)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
        >
          <X size={15} /> Hủy
        </button>
        <Button
          onClick={onSave}
          variant="secondary"
          size="sm"
          isLoading={isSaving}
          leftIcon={<Save size={15} />}
        >
          Lưu Câu Hỏi
        </Button>
      </div>
    </header>
  );
};
