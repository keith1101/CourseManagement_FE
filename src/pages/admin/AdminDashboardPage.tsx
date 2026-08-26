import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileQuestion,
  BookOpen,
  Send,
  BarChart3,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { examsApi } from '../../api/exams';
import { usersApi } from '../../api/users';
import { subjectsApi } from '../../api/subjects';
import { attemptsApi } from '../../api/attempts';
import { getApiErrorMessage } from '../../api/errors';
import { useToast } from '../../contexts/ToastContext';
import { Exam, User, Subject, ExamAttempt } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
      try {
        const [examsData, usersData, subjectsData, attemptsData] = await Promise.all([
          examsApi.getExams(),
          usersApi.getUsers(),
          subjectsApi.getSubjects(),
          attemptsApi.getAllAttempts(),
        ]);
        setExams(examsData);
        setUsers(usersData);
        setSubjects(subjectsData);
        setAttempts(attemptsData);
      } catch (err) {
        error(getApiErrorMessage(err, 'Không thể tải dữ liệu tổng quan quản trị.'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Đang tải dữ liệu tổng quan quản trị..." />;
  }

  const studentCount = users.filter((u) => u.role === 'STUDENT').length;
  const publishedExamsCount = exams.filter((e) => e.status === 'PUBLISHED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. Header Banner */}
      <div
        className="dashboard-banner admin-dashboard-banner animate-slide-up"
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
            Hệ Thống Quản Trị Khóa Học & Đề Thi
          </h1>
          <p style={{ marginTop: '6px', opacity: 0.9, fontSize: '0.9375rem' }}>
            Quản lý câu hỏi trắc nghiệm Kahoot, tổ chức thi và theo dõi kết quả học sinh
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/admin/exams')}
            leftIcon={<PlusCircle size={18} />}
            style={{ backgroundColor: 'var(--secondary)', fontWeight: 700 }}
          >
            Tạo Đề Thi Mới
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/admin/assignments')}
            leftIcon={<Send size={18} />}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', borderColor: 'transparent' }}
          >
            Giao Đề Thi
          </Button>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <FileQuestion size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{exams.length}</span>
            <span className="stat-label">Tổng số đề thi ({publishedExamsCount} công khai)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
            <Users size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{studentCount}</span>
            <span className="stat-label">Học sinh đăng ký</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <BookOpen size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{subjects.length}</span>
            <span className="stat-label">Môn học kích hoạt</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <Award size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{attempts.length}</span>
            <span className="stat-label">Lượt thi đã làm</span>
          </div>
        </div>
      </div>

      {/* 3. Recent Exams & Attempts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(450px, 100%), 1fr))', gap: '24px' }}>
        {/* Recent Exams */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Đề Thi Mới Tạo
            </h3>
            <Button size="sm" variant="ghost" onClick={() => navigate('/admin/exams')} rightIcon={<ArrowRight size={14} />}>
              Quản lý
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {exams.slice(0, 4).map((ex) => (
              <div
                key={ex.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--border-radius-md)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{ex.title}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {ex.durationMinutes} phút • {ex.questionsCount || 0} câu hỏi
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant={ex.status === 'PUBLISHED' ? 'success' : 'warning'}>
                    {ex.status === 'PUBLISHED' ? 'Đã duyệt' : 'Bản nháp'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/exams/${ex.id}/questions`)}
                  >
                    Soạn câu hỏi
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Exam Attempts */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Lượt Nộp Bài Gần Đây
            </h3>
            <Button size="sm" variant="ghost" onClick={() => navigate('/admin/results')} rightIcon={<ArrowRight size={14} />}>
              Báo cáo
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {attempts.slice(0, 4).map((att) => (
              <div
                key={att.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--border-radius-md)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {att.student?.fullName || 'Học sinh'}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {att.exam?.title || 'Đề thi trắc nghiệm'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 800, color: (att.score || 0) >= 5 ? 'var(--success)' : 'var(--error)' }}>
                    {att.score !== undefined ? `${att.score}/10` : '-'}
                  </span>
                  <Badge variant={att.status === 'SUBMITTED' || att.status === 'SCORED' ? 'success' : 'warning'}>
                    {att.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
