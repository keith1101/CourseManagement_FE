import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileQuestion,
  BookOpen,
  Send,
  PlusCircle,
  ArrowRight,
  Award,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
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
  }, [error]);

  if (isLoading) {
    return <LoadingSpinner text="Đang tải dữ liệu tổng quan quản trị..." />;
  }

  const studentCount = users.filter((u) => u.role === 'STUDENT').length;
  const publishedExamsCount = exams.filter((e) => e.status === 'PUBLISHED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader
        eyebrow="Trung tâm điều hành"
        title="Tổng quan hệ thống quản trị"
        description="Theo dõi số lượng học sinh, quản lý đề thi trắc nghiệm và thống kê kết quả kiểm tra toàn trường."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/assignments')}
              leftIcon={<Send size={16} />}
            >
              Giao Đề Thi
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/admin/exams')}
              leftIcon={<PlusCircle size={16} />}
            >
              Tạo Đề Thi Mới
            </Button>
          </>
        }
      />

      {/* 1. Stat Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <FileQuestion size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{exams.length}</span>
            <span className="stat-label">Tổng số đề thi ({publishedExamsCount} công khai)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{studentCount}</span>
            <span className="stat-label">Học sinh đăng ký</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{subjects.length}</span>
            <span className="stat-label">Môn học kích hoạt</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{attempts.length}</span>
            <span className="stat-label">Lượt thi đã thực hiện</span>
          </div>
        </div>
      </div>

      {/* 2. Recent Exams & Attempts Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(450px, 100%), 1fr))',
          gap: '24px',
        }}
      >
        {/* Recent Exams */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Đề Thi Mới Tạo
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/admin/exams')}
              rightIcon={<ArrowRight size={14} />}
            >
              Quản lý đề
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {exams.slice(0, 4).map((ex) => (
              <div
                key={ex.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 110px 120px',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--text-primary)',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ex.title}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {ex.durationMinutes} phút • {ex.questionsCount || 0} câu hỏi
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Badge variant={ex.status === 'PUBLISHED' ? 'success' : 'warning'}>
                    {ex.status === 'PUBLISHED' ? 'Đã duyệt' : 'Bản nháp'}
                  </Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/exams/${ex.id}/questions`)}
                    style={{ whiteSpace: 'nowrap' }}
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/admin/results')}
              rightIcon={<ArrowRight size={14} />}
            >
              Xem báo cáo
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {attempts.slice(0, 4).map((att) => {
              const isCompleted =
                att.status === 'SUBMITTED' || att.status === 'SCORED' || att.status === 'COMPLETED';
              return (
                <div
                  key={att.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 130px',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        fontSize: '0.9375rem',
                        color: 'var(--text-primary)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {att.student?.fullName || 'Học sinh'}
                    </strong>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {att.exam?.title || 'Đề thi trắc nghiệm'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span
                      style={{
                        fontWeight: 800,
                        color: (att.score || 0) >= 5 ? 'var(--success)' : 'var(--error)',
                        fontSize: '1rem',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {att.score !== undefined ? `${Number(att.score).toFixed(0)}/10` : '-'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Badge variant={isCompleted ? 'success' : 'warning'}>
                      {isCompleted ? 'ĐÃ HOÀN THÀNH' : 'ĐANG LÀM'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
