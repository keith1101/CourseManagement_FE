import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
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
import { ExamAttempt, Question } from '../../types';
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
        <Button variant="primary" style={{ marginTop: '20px' }} onClick={() => navigate('/student/assignments')}>
          Về danh sách bài thi
        </Button>
      </div>
    );
  }

  const totalQuestions = attempt.totalQuestions || attempt.questions?.length || 0;
  const correctCount = attempt.correctAnswers ?? 0;
  const score = attempt.score !== undefined ? Number(attempt.score.toFixed(1)) : totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 10).toFixed(1)) : 0;
  const isPassed = score >= (attempt.exam?.passingScore || 5);
  const accuracyPercent = Math.round((correctCount / totalQuestions) * 100);

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
        maxWidth: '1000px',
        margin: '0 auto',
        paddingBottom: '60px',
      }}
    >
      {/* 1. Score Summary Banner */}
      <div
        className="animate-slide-up"
        style={{
          background: isPassed ? 'var(--success)' : 'var(--error)',
          borderRadius: 'var(--border-radius-xl)',
          padding: '36px 40px',
          color: '#FFFFFF',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div>
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              padding: '4px 14px',
              borderRadius: 'var(--border-radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {isPassed ? '🎉 ĐẠT KẾT QUẢ' : '⚠️ CHƯA ĐẠT'}
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '12px' }}>
            {attempt.exam?.title || 'Kết quả bài thi trắc nghiệm'}
          </h1>
          <p style={{ opacity: 0.9, fontSize: '0.9375rem', marginTop: '4px' }}>
            Môn học: {attempt.exam?.subject?.name || 'Chung'} • Điểm chuẩn: {attempt.exam?.passingScore || 5.0}/10
          </p>
        </div>

        {/* Large Score Circle */}
        <div
          style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '4px solid #FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, opacity: 0.9 }}>Thang điểm 10</span>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle2 size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{correctCount}/{totalQuestions}</span>
            <span className="stat-label">Số câu đúng</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
            <Percent size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{accuracyPercent}%</span>
            <span className="stat-label">Tỉ lệ chính xác</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <Clock size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {attempt.durationSeconds ? `${Math.floor(attempt.durationSeconds / 60)} phút` : 'Hoàn thành'}
            </span>
            <span className="stat-label">Thời gian làm bài</span>
          </div>
        </div>
      </div>

      {/* 3. Detailed Question Review */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Chi Tiết Đáp Án & Lời Giải
        </h2>

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
                  borderLeft: `5px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                  padding: '24px',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    Câu {idx + 1}: ({q.points} điểm)
                  </span>
                  <Badge variant={isCorrect ? 'success' : 'error'}>
                    {isCorrect ? 'Chính xác' : 'Chưa đúng'}
                  </Badge>
                </div>

                {/* Question text */}
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  {q.content}
                </p>

                {/* Options List */}
                {q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {q.options?.map((opt) => {
                      const isThisSelected = selectedOpt?.label === opt.label || selectedOpt?.id === opt.id;
                      const isThisCorrect = opt.isCorrect;

                      let itemBg = '#FFFFFF';
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
                            <span>{opt.content}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isThisSelected && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                (Đáp án bạn chọn)
                              </span>
                            )}
                            {icon}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
                      <strong>Câu trả lời của bạn:</strong> {studentAns?.textAnswer || '(Chưa trả lời)'}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--primary-subtle)',
                      borderRadius: 'var(--border-radius-md)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
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
