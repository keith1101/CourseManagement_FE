import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Award,
  ArrowRight,
  PlayCircle,
  Calendar,
  Clock,
  BookOpen,
  Lock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { examsApi } from '../../api/exams';
import { assignmentsApi } from '../../api/assignments';
import { attemptsApi } from '../../api/attempts';
import { Assignment, Exam, ExamAttempt } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';
import { canStartExam } from '../../utils/access';
import { UpgradeModal } from '../../components/common/UpgradeModal';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lockedExam, setLockedExam] = useState<Exam | null>(null);
  const [lockedAssignment, setLockedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [examsData, assignData, attemptsData] = await Promise.all([
          examsApi.getExams(),
          assignmentsApi.getMyAssignments(),
          attemptsApi.getMyAttempts(),
        ]);
        setExams(examsData.filter((e) => e.status === 'PUBLISHED'));
        setAssignments(assignData);
        setAttempts(attemptsData);
      } catch (err) {
        error(getApiErrorMessage(err, 'Không thể tải dữ liệu học tập.'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [error]);

  if (isLoading) {
    return <LoadingSpinner text="Đang tải dữ liệu học tập của bạn..." />;
  }

  const completedAttempts = attempts.filter((a) => a.status === 'COMPLETED');
  const completedCount = completedAttempts.length;
  const averageScore =
    completedAttempts.length > 0
      ? (
          completedAttempts.reduce((acc, a) => acc + (a.score || 0), 0) /
          completedAttempts.length
        ).toFixed(1)
      : '0.0';

  const pendingAssignments = assignments.filter(
    (a) =>
      a.status === 'PENDING' ||
      a.status === 'IN_PROGRESS' ||
      a.status === 'OVERDUE' ||
      a.canRetake === true,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. Welcome HCMUS Hero Banner */}
      <div
        className="card animate-slide-up"
        style={{
          background: 'linear-gradient(135deg, #004085 0%, #002B5C 100%)',
          color: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-xl)',
          padding: '36px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '640px', zIndex: 2 }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#FFA89E',
              marginBottom: '8px',
            }}
          >
            Hồ sơ học tập & Khảo thí
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
            }}
          >
            Chào mừng trở lại, {user?.fullName}!
          </h1>
          <p style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Hệ thống đang mở <strong>{exams.length}</strong> đề thi luyện tập và{' '}
            <strong>{pendingAssignments.length}</strong> bài thi được giao. Hãy bắt đầu ôn luyện ngay hôm nay.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', zIndex: 2 }}>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              const el = document.getElementById('public-exams');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            rightIcon={<PlayCircle size={18} />}
          >
            Làm bài thi ngay
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/student/assignments')}
            rightIcon={<ArrowRight size={18} />}
            style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.4)' }}
          >
            Bài thi được giao ({pendingAssignments.length})
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Summary Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{exams.length}</span>
            <span className="stat-label">Đề thi mở luyện tập</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(234, 88, 12, 0.12)', color: '#EA580C' }}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{assignments.length}</span>
            <span className="stat-label">Bài thi được giao</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedCount}</span>
            <span className="stat-label">Bài thi đã hoàn thành</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{averageScore}</span>
            <span className="stat-label">
              Điểm trung bình{' '}
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>(Thang 10)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Public Exams Section (GET /api/exams) */}
      <div id="public-exams">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title-uppercase" style={{ fontSize: '1.25rem' }}>
              Danh Sách Đề Thi Luyện Tập
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Các đề thi công khai sẵn sàng cho học sinh làm bài không giới hạn (miễn phí cho đề FREE)
            </p>
          </div>
        </div>

        {exams.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={40} color="var(--primary)" />}
            title="Chưa có đề thi nào được mở"
            description="Hiện chưa có đề thi công khai nào trong hệ thống. Vui lòng quay lại sau."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
            {exams.map((exam) => {
              const canAccess = canStartExam(user, exam);
              const inProgressAttempt = attempts.find(
                (attempt) => attempt.examId === exam.id && attempt.status === 'IN_PROGRESS'
              );

              return (
                <Card key={exam.id} interactive style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge variant="primary">{exam.subject?.name || 'Môn học'}</Badge>
                      {exam.accessLevel === 'PRO' ? (
                        <Badge variant="premium">PRO</Badge>
                      ) : (
                        <Badge variant="success">FREE</Badge>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {exam.questionsCount ? `${exam.questionsCount} câu hỏi` : 'Đề thi trắc nghiệm'}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          marginTop: '6px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                        }}
                      >
                        {exam.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {exam.durationMinutes || 45} phút
                      </span>
                      <span>•</span>
                      <span>{exam.totalPoints || 10} điểm</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => {
                      if (inProgressAttempt?.id) {
                        navigate(`/student/attempts/${inProgressAttempt.id}/take`);
                        return;
                      }
                      if (!canAccess) {
                        setLockedExam(exam);
                        return;
                      }
                      // Start public exam directly without assignmentId
                      navigate(`/student/exams/${exam.id}/take`);
                    }}
                    leftIcon={canAccess || inProgressAttempt ? <PlayCircle size={16} /> : <Lock size={16} />}
                    style={{ width: '100%', marginTop: 'auto' }}
                  >
                    {inProgressAttempt
                      ? 'Tiếp tục làm bài'
                      : canAccess
                      ? 'Làm bài'
                      : 'Nâng cấp để làm bài'}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Pending Assignments List (GET /api/assignments) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title-uppercase" style={{ fontSize: '1.25rem' }}>
              Bài Thi Được Giao Cần Làm
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Danh sách nhiệm vụ có hạn nộp do giáo viên chỉ định
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/assignments')} rightIcon={<ArrowRight size={14} />}>
            Xem tất cả
          </Button>
        </div>

        {pendingAssignments.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={40} color="var(--success)" />}
            title="Không có bài thi nào đang chờ"
            description="Bạn đã hoàn thành tất cả các bài tập được giao. Hãy luyện tập thêm với danh sách đề thi mở bên trên."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
            {pendingAssignments.slice(0, 3).map((assign) => {
              const isOverdue = assign.status === 'OVERDUE';
              const canAccess = !isOverdue && !!assign.exam && canStartExam(user, assign.exam, assign);
              const inProgressAttempt = assign.examAttempts?.find(
                (attempt) => attempt.status === 'IN_PROGRESS',
              );
              const canRetake = assign.canRetake === true;

              return (
                <Card key={assign.id} interactive style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge variant="primary">{assign.exam?.subject?.name || 'Môn học'}</Badge>
                      {assign.exam?.accessLevel === 'PRO' && <Badge variant="premium">PRO</Badge>}
                    </div>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: isOverdue ? 'var(--error)' : 'var(--text-secondary)',
                        fontWeight: isOverdue ? 600 : 400,
                      }}
                    >
                      <Calendar size={13} /> Hạn: {assign.dueDate ? new Date(assign.dueDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {assign.exam?.title || 'Bài thi trắc nghiệm'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {assign.exam?.durationMinutes || 45} phút
                      </span>
                      <span>•</span>
                      <span>{assign.exam?.totalPoints || 10} điểm</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    disabled={isOverdue}
                    onClick={() => {
                      if (isOverdue) return;
                      if (inProgressAttempt?.id) {
                        navigate(`/student/attempts/${inProgressAttempt.id}/take`);
                        return;
                      }
                      if (!canAccess) {
                        setLockedAssignment(assign);
                        return;
                      }
                      navigate(`/student/exams/${assign.examId}/take?assignmentId=${encodeURIComponent(assign.id)}`);
                    }}
                    leftIcon={isOverdue ? <Lock size={16} /> : canRetake ? <RotateCcw size={16} /> : canAccess || inProgressAttempt ? <PlayCircle size={16} /> : <Lock size={16} />}
                    style={{ width: '100%', marginTop: 'auto' }}
                  >
                    {isOverdue
                      ? 'Đã quá hạn'
                      : inProgressAttempt
                      ? 'Tiếp tục làm bài'
                      : canRetake
                      ? canAccess ? 'Làm lại bài' : 'Nâng cấp để làm bài'
                      : canAccess ? 'Bắt đầu làm bài' : 'Nâng cấp để làm bài'}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Recent Attempts Table */}
      {attempts.length > 0 && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 className="section-title-uppercase" style={{ fontSize: '1.25rem' }}>
              Lịch Sử Làm Bài Gần Đây
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Kết quả điểm số và phân tích các bài thi bạn đã nộp
            </p>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên bài thi</th>
                  <th>Thời gian nộp</th>
                  <th>Điểm số</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 5).map((att) => (
                  <tr key={att.id}>
                    <td>
                      <strong style={{ fontSize: '0.9375rem' }}>{att.exam?.title || 'Bài thi trắc nghiệm'}</strong>
                    </td>
                    <td>{att.submittedAt ? new Date(att.submittedAt).toLocaleString('vi-VN') : 'Đang làm'}</td>
                    <td>
                      <strong style={{ color: (att.score || 0) >= 5 ? 'var(--success)' : 'var(--error)', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                        {att.score !== undefined ? `${Number(att.score).toFixed(1)} / 10` : '-'}
                      </strong>
                    </td>
                    <td>
                      <Badge variant={att.status === 'SUBMITTED' || att.status === 'SCORED' || att.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {att.status === 'SUBMITTED' || att.status === 'SCORED' || att.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang làm'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/student/attempts/${att.id}/result`)}
                      >
                        Xem kết quả
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={!!lockedExam || !!lockedAssignment}
        onClose={() => {
          setLockedExam(null);
          setLockedAssignment(null);
        }}
        title="Bài thi dành riêng cho tài khoản PRO"
      />
    </div>
  );
};
