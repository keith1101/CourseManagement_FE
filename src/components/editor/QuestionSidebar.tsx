import React from 'react';
import { ChevronDown, ChevronUp, Copy, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { Question } from '../../types';
import { Button } from '../common/Button';

export interface QuestionSidebarProps {
  questions: Question[];
  activeQuestionId: string | null;
  onSelectQuestion: (question: Question) => void;
  onAddNewQuestion: () => void;
  onDuplicateQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: -1 | 1) => void;
}

export const QuestionSidebar: React.FC<QuestionSidebarProps> = ({
  questions,
  activeQuestionId,
  onSelectQuestion,
  onAddNewQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
}) => (
  <aside className="question-editor-sidebar">
    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
      <Button
        variant="primary"
        onClick={onAddNewQuestion}
        style={{ width: '100%' }}
        leftIcon={<Plus size={16} />}
      >
        Thêm câu hỏi mới
      </Button>
    </div>

    <div
      style={{
        flex: 1,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {questions.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <HelpCircle size={32} style={{ margin: '0 auto 8px' }} />
          Chưa có câu hỏi nào.
        </div>
      ) : (
        questions.map((question, index) => {
          const active = question.id === activeQuestionId;
          return (
            <div
              key={question.id}
              onClick={() => onSelectQuestion(question)}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: active ? 'var(--primary-light)' : 'var(--bg-card)',
                border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: active ? 'var(--shadow-xs)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ color: active ? 'var(--primary)' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                  Câu {index + 1}
                </strong>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    type="button"
                    title="Đưa lên"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveQuestion(question.id, -1);
                    }}
                    disabled={index === 0}
                    style={{ padding: '3px', color: 'var(--text-secondary)', opacity: index === 0 ? 0.3 : 1 }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    title="Đưa xuống"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveQuestion(question.id, 1);
                    }}
                    disabled={index === questions.length - 1}
                    style={{ padding: '3px', color: 'var(--text-secondary)', opacity: index === questions.length - 1 ? 0.3 : 1 }}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    title="Nhân bản"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDuplicateQuestion(question);
                    }}
                    style={{ padding: '3px', color: 'var(--text-secondary)' }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    title="Xóa câu hỏi"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteQuestion(question.id);
                    }}
                    style={{ padding: '3px', color: 'var(--error)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  marginTop: '6px',
                  fontSize: '0.8125rem',
                  lineHeight: 1.4,
                  minHeight: '34px',
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {question.content || '(Chưa nhập nội dung câu hỏi)'}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                <span>{question.points} điểm</span>
                <span>{question.timeLimit || 30}s</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  </aside>
);
