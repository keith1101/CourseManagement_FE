import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  FileText,
  Percent,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { attemptsApi } from '../../api/attempts';
import { ExamAttempt } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export const ExamResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { error } = useToast();

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchResult = useCallback(async () => {
    if (!attemptId) return;
    setIsLoading(true);
    try {
      const data = await attemptsApi.getResult(attemptId);
      setAttempt(data);
    } catch (err: any) {
      error('Không thể tải kết quả bài thi!');
    } finally {
      setIsLoading(false);
    }
  }, [attemptId, error]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (isLoading) {
    return <LoadingSpinner fullPage text="Đang tổng hợp bảng kết quả..." />;
  }

  if (!attempt) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Không tìm thấy kết quả bài thi</h2>
        <Button
          variant="primary"
          style={{ marginTop: '20px' }}
          onClick={() => navigate('/student/assignments')}
        >
          Về danh sách bài thi
        </Button>
      </div>
    );
  }

  const totalQuestions = attempt.totalQuestions || attempt.questions?.length || 0;
  const correctCount = attempt.correctAnswers ?? 0;
  const score =
    attempt.score !== undefined
      ? Number(attempt.score.toFixed(1))
      : totalQuestions > 0
      ? Number(((correctCount / totalQuestions) * 10).toFixed(1))
      : 0;
  const isPassed = score >= (attempt.exam?.passingScore || 5);
  const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Map student answers
  const answersMap = new Map();
  if (attempt.answers) {
    attempt.answers.forEach((ans) => {
      answersMap.set(ans.questionId, ans);
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        maxWidth: '960px',
        margin: '0 auto',
        paddingBottom: '60px',
      }}
    >
      {/* 1. Score Summary Banner */}
      <div
        className="card animate-slide-up"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--border-radius-xl)',
          padding: '36px 40px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div style={{ maxWidth: '580px' }}>
          <div style={{ marginBottom: '10px' }}>
            <Badge variant={isPassed ? 'success' : 'error'}>
              {isPassed ? '🎉 ĐẠT YÊU CẦU' : '⚠️ CHƯA ĐẠT CHUẨN'}
            </Badge>
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {attempt.exam?.title || 'Kết quả bài thi trắc nghiệm'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '6px' }}>
            Môn học: <strong>{attempt.exam?.subject?.name || 'Chung'}</strong> • Điểm đạt yêu cầu: <strong>{attempt.exam?.passingScore || 5.0}/10</strong>
          </p>
        </div>

        {/* Large Score Badge */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: isPassed ? 'var(--success-bg)' : 'var(--error-bg)',
            border: `3px solid ${isPassed ? 'var(--success)' : 'var(--error)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1,
              color: isPassed ? 'var(--success)' : 'var(--error)',
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: isPassed ? 'var(--success)' : 'var(--error)',
              marginTop: '4px',
            }}
          >
            THANG ĐIỂM 10
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {correctCount} / {totalQuestions}
            </span>
            <span className="stat-label">Số câu trả lời đúng</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
            <Percent size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{accuracyPercent}%</span>
            <span className="stat-label">Tỉ lệ chính xác</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {attempt.durationSeconds ? `${Math.floor(attempt.durationSeconds / 60)} phút` : 'Đã hoàn thành'}
            </span>
            <span className="stat-label">Thời gian làm bài</span>
          </div>
        </div>
      </div>

      {/* 3. Detailed Question Review */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2
            className="section-title-uppercase"
            style={{ fontSize: '1.25rem' }}
          >
            Chi Tiết Đáp Án & Lời Giải Chuyên Sâu
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Xem lại từng câu hỏi, lựa chọn của bạn và giải thích chi tiết đáp án đúng.
          </p>
        </div>

        {attempt.questions && attempt.questions.length > 0 ? (
          attempt.questions.map((q, idx) => {
            const studentAns = answersMap.get(q.id);
            const selectedOpt = q.options?.find(
              (o) => o.id === studentAns?.selectedOptionId || o.label === studentAns?.selectedOptionId
            );
            const correctOpt = q.options?.find((o) => o.isCorrect);
            const isCorrect = studentAns?.isCorrect ?? (selectedOpt?.isCorrect || false);

            return (
              <Card
                key={q.id || idx}
                style={{
                  borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '12px',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    Câu {idx + 1}: ({q.points} điểm)
                  </span>
                  <Badge variant={isCorrect ? 'success' : 'error'}>
                    {isCorrect ? '✓ Chính xác' : '✕ Chưa đúng'}
                  </Badge>
                </div>

                {/* Question text */}
                <p style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {q.content}
                </p>

                {/* Options List */}
                {q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.options?.map((opt) => {
                      const isThisSelected = selectedOpt?.label === opt.label || selectedOpt?.id === opt.id;
                      const isThisCorrect = opt.isCorrect;

                      let itemBg = 'var(--bg-card)';
                      let itemBorder = 'var(--border-color)';
                      let icon = null;

                      if (isThisSelected && isThisCorrect) {
                        itemBg = 'var(--success-bg)';
                        itemBorder = 'var(--success)';
                        icon = <Check size={16} color="var(--success)" strokeWidth={3} />;
                      } else if (isThisSelected && !isThisCorrect) {
                        itemBg = 'var(--error-bg)';
                        itemBorder = 'var(--error)';
                        icon = <X size={16} color="var(--error)" strokeWidth={3} />;
                      } else if (!isThisSelected && isThisCorrect) {
                        itemBg = 'var(--success-bg)';
                        itemBorder = 'var(--success)';
                        icon = <Check size={16} color="var(--success)" strokeWidth={3} />;
                      }

                      return (
                        <div
                          key={opt.label}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: 'var(--border-radius-md)',
                            border: `1.5px solid ${itemBorder}`,
                            backgroundColor: itemBg,
                            fontSize: '0.875rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ color: 'var(--primary)' }}>{opt.label}.</strong>
                            <span style={{ color: 'var(--text-primary)' }}>{opt.content}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isThisSelected && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                (Bạn đã chọn)
                              </span>
                            )}
                            {icon}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div>
                      <strong>Câu trả lời của bạn:</strong> {studentAns?.textAnswer || '(Chưa trả lời)'}
                    </div>
                  </div>
                )}

                {/* Explanation Box */}
                {q.explanation && (
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--primary-subtle)',
                      border: '1px solid var(--primary-light)',
                      borderRadius: 'var(--border-radius-md)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <FileText size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: 'var(--primary)' }}>Giải thích chi tiết: </strong>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Chi tiết câu hỏi đang được cập nhật.</p>
        )}
      </div>

      {/* 4. Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '12px',
        }}
      >
        <Button
          variant="outline"
          onClick={() => navigate('/student/assignments')}
          leftIcon={<ArrowLeft size={16} />}
        >
          Về danh sách bài thi
        </Button>
        {attempt.examId && (
          <Button
            variant="primary"
            onClick={() => navigate(`/student/exams/${attempt.examId}/take`)}
            leftIcon={<RotateCcw size={16} />}
          >
            Luyện tập lại đề này
          </Button>
        )}
      </div>
    </div>
  );
};
