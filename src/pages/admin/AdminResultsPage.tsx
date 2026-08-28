import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Calendar, Clock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { attemptsApi } from '../../api/attempts';
import { examsApi } from '../../api/exams';
import { ExamAttempt, Exam } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

export const AdminResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();

  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [examFilter, setExamFilter] = useState<string>('ALL');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attemptsData, examsData] = await Promise.all([
        attemptsApi.getAllAttempts(),
        examsApi.getExams(),
      ]);
      setAttempts(attemptsData);
      setExams(examsData);
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể tải báo cáo kết quả.'));
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = attempts.filter((att) => {
    if (att.status !== 'COMPLETED') return false;
    const studentName = att.student?.fullName?.toLowerCase() || '';
    const examTitle = att.exam?.title?.toLowerCase() || '';
    const matchSearch =
      studentName.includes(searchTerm.toLowerCase()) || examTitle.includes(searchTerm.toLowerCase());
    const matchExam = examFilter === 'ALL' || att.examId === examFilter;
    return matchSearch && matchExam;
  });

  if (isLoading) {
    return <LoadingSpinner text="Đang tải báo cáo điểm số..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        eyebrow="Thống kê & Báo cáo"
        title="Báo cáo kết quả bài thi toàn trường"
        description="Xem chi tiết điểm số, tỉ lệ chính xác và thời gian làm bài của học sinh theo từng đề thi."
      />

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '360px', maxWidth: '100%' }}>
          <span
            style={{
              position: 'absolute',
              left: '14px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo học sinh hoặc đề thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '44px', width: '100%' }}
          />
        </div>

        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="input-field"
          style={{ minWidth: '280px', width: 'auto', height: '46px', minHeight: '46px', cursor: 'pointer' }}
        >
          <option value="ALL">Tất cả đề thi</option>
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title}
            </option>
          ))}
        </select>
      </div>

      {/* Results Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Đề thi</th>
              <th>Thời gian nộp</th>
              <th>Thời lượng</th>
              <th>Điểm số</th>
              <th>Kết quả</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <EmptyState
                    title="Chưa có lượt thi nào hoàn thành"
                    description="Hiện chưa có kết quả làm bài nào phù hợp với bộ lọc."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((att) => {
                const totalQ = att.totalQuestions || att.questions?.length || 0;
                const correct = att.correctAnswers ?? 0;
                const score =
                  att.score !== undefined
                    ? att.score.toFixed(1)
                    : totalQ > 0
                    ? ((correct / totalQ) * 10).toFixed(1)
                    : '0.0';
                const isPassed = Number(score) >= (att.exam?.passingScore || 5);

                return (
                  <tr key={att.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {att.student?.fullName?.charAt(0) || 'H'}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                            {att.student?.fullName || 'Học sinh'}
                          </strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {att.student?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {att.exam?.title || 'Đề thi trắc nghiệm'}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Môn: {att.exam?.subject?.name || 'Chung'}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Calendar size={13} />
                        {att.submittedAt
                          ? new Date(att.submittedAt).toLocaleString('vi-VN')
                          : '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Clock size={13} />
                        {att.durationSeconds
                          ? `${Math.floor(att.durationSeconds / 60)} phút`
                          : '-'}
                      </span>
                    </td>
                    <td>
                      <strong
                        style={{
                          color: isPassed ? 'var(--success)' : 'var(--error)',
                          fontSize: '1.0625rem',
                        }}
                      >
                        {score} / 10
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {correct}/{totalQ} câu đúng
                      </div>
                    </td>
                    <td>
                      <Badge variant={isPassed ? 'success' : 'error'}>
                        {isPassed ? 'Đạt' : 'Chưa đạt'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/student/attempts/${att.id}/result`)}
                        leftIcon={<Eye size={14} />}
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
