import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Award,
  Clock,
  ArrowRight,
  PlayCircle,
  BarChart,
  Calendar,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { assignmentsApi } from '../../api/assignments';
import { attemptsApi } from '../../api/attempts';
import { Assignment, ExamAttempt } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [assignData, attemptsData] = await Promise.all([
          assignmentsApi.getMyAssignments(),
          attemptsApi.getMyAttempts(),
        ]);
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
    (a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. Welcome Banner */}
      <div
        className="dashboard-banner student-dashboard-banner animate-slide-up"
        style={{
          background: 'var(--primary-gradient)',
          borderRadius: 'var(--border-radius-xl)',
          padding: '32px 36px',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Chào mừng trở lại, {user?.fullName}! 👋
          </h1>
          <p style={{ marginTop: '6px', opacity: 0.9, fontSize: '0.9375rem' }}>
            Hôm nay bạn có <strong>{pendingAssignments.length}</strong> bài thi cần hoàn thành. Hãy tiếp tục nâng cao kiến thức nhé!
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate('/student/assignments')}
          rightIcon={<ArrowRight size={18} />}
          style={{ backgroundColor: 'var(--secondary)', fontWeight: 700 }}
        >
          Xem Bài Thi Cần Làm
        </Button>
      </div>

      {/* 2. Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <FileText size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{assignments.length}</span>
            <span className="stat-label">Tổng bài thi được giao</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedCount}</span>
            <span className="stat-label">Bài thi đã hoàn thành</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <Award size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{averageScore}</span>
            <span className="stat-label">Điểm trung bình (Hệ 10)</span>
          </div>
        </div>
      </div>

      {/* 3. Pending Assignments List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Bài Thi Cần Làm Gần Đây
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/assignments')} rightIcon={<ArrowRight size={14} />}>
            Xem tất cả
          </Button>
        </div>

        {pendingAssignments.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={40} color="var(--success)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Bạn không có bài thi nào đang chờ!
            </p>
            <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
              Hãy nghỉ ngơi hoặc ôn lại các bài kiểm tra đã hoàn thành bên dưới.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
            {pendingAssignments.slice(0, 3).map((assign) => (
              <Card key={assign.id} interactive style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Badge variant="primary">{assign.exam?.subject?.name || 'Môn học'}</Badge>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={12} /> Hạn: {assign.dueDate ? new Date(assign.dueDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {assign.exam?.title || 'Bài thi trắc nghiệm'}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Thời gian: {assign.exam?.durationMinutes || 45} phút • {assign.exam?.totalPoints || 10} điểm
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={() => navigate(`/student/exams/${assign.examId}/take?assignmentId=${encodeURIComponent(assign.id)}`)}
                  leftIcon={<PlayCircle size={16} />}
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  Bắt đầu làm bài
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 4. Recent Attempts Table */}
      {attempts.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Lịch Sử Làm Bài Gần Đây
          </h2>
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
                      <strong>{att.exam?.title || 'Bài thi trắc nghiệm'}</strong>
                    </td>
                    <td>{att.submittedAt ? new Date(att.submittedAt).toLocaleString('vi-VN') : 'Đang làm'}</td>
                    <td>
                      <strong style={{ color: (att.score || 0) >= 5 ? 'var(--success)' : 'var(--error)', fontSize: '1rem' }}>
                        {att.score !== undefined ? `${att.score}/10` : '-'}
                      </strong>
                    </td>
                    <td>
                      <Badge variant={att.status === 'SUBMITTED' || att.status === 'SCORED' ? 'success' : 'warning'}>
                        {att.status === 'SUBMITTED' || att.status === 'SCORED' ? 'Đã hoàn thành' : 'Đang làm'}
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
    </div>
  );
};
