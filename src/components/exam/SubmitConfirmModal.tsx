import React from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  isSubmitting: boolean;
  submittingAction: 'question' | 'exam' | null;
  onSubmitQuestion: () => void;
  onSubmitExam: () => void;
  onClose: () => void;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  totalQuestions,
  answeredCount,
  isSubmitting,
  submittingAction,
  onSubmitQuestion,
  onSubmitExam,
  onClose,
}) => {
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận nộp bài thi"
      maxWidth="600px"
      footer={
        <div className="submit-confirm-actions">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Tiếp tục làm bài
          </Button>
          <Button
            variant="secondary"
            onClick={onSubmitQuestion}
            isLoading={submittingAction === 'question'}
            disabled={isSubmitting}
            leftIcon={<CheckCircle2 size={16} />}
          >
            Nộp câu hiện tại
          </Button>
          <Button
            variant="primary"
            onClick={onSubmitExam}
            isLoading={submittingAction === 'exam'}
            disabled={isSubmitting}
            leftIcon={<Send size={16} />}
          >
            Nộp cả đề thi
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: unansweredCount > 0 ? 'var(--warning-bg)' : 'var(--success-bg)',
            border: `1px solid ${unansweredCount > 0 ? 'var(--warning-border)' : 'var(--success-border)'}`,
          }}
        >
          {unansweredCount > 0 ? (
            <AlertCircle size={22} color="var(--warning)" style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={22} color="var(--success)" style={{ flexShrink: 0 }} />
          )}
          <div style={{ fontSize: '0.875rem' }}>
            {unansweredCount > 0 ? (
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                Bạn vẫn còn <strong>{unansweredCount}</strong> câu hỏi chưa hoàn thành.
              </span>
            ) : (
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                Tuyệt vời! Bạn đã hoàn thành toàn bộ <strong>{totalQuestions}</strong> câu hỏi.
              </span>
            )}
          </div>
        </div>

        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Chọn <strong>nộp câu hiện tại</strong> để xác nhận riêng đáp án câu đang làm, hoặc chọn <strong>nộp cả đề thi</strong> để kết thúc bài làm và chuyển sang trang xem điểm và giải thích chi tiết.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            padding: '14px 18px',
            borderRadius: 'var(--border-radius-md)',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              {answeredCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Đã làm
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: unansweredCount > 0 ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {unansweredCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Chưa làm
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
