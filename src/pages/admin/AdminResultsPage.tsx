import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Award, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
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
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Báo Cáo Điểm Số & Kết Quả Toàn Hệ Thống
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
          Xem chi tiết kết quả làm bài của tất cả học sinh theo từng đề thi
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="results-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh hoặc đề thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="input-field"
          style={{ width: '220px', height: '40px', cursor: 'pointer' }}
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
              <th>Học Sinh</th>
              <th>Đề Thi</th>
              <th>Thời Gian Hoàn Thành</th>
              <th>Điểm Số</th>
              <th>Đánh Giá</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Chưa có kết quả làm bài nào
                </td>
              </tr>
            ) : (
              filtered.map((att) => {
                const score = att.score !== undefined ? att.score : 0;
                const isPassed = score >= (att.exam?.passingScore || 5);

                return (
                  <tr key={att.id}>
                    <td>
                      <div>
                        <strong>{att.student?.fullName || 'Học sinh'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {att.student?.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{att.exam?.title || 'Đề thi'}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleString('vi-VN') : 'Đang làm'}
                      </span>
                    </td>
                    <td>
                      <strong
                        style={{
                          fontSize: '1.0625rem',
                          color: isPassed ? 'var(--success)' : 'var(--error)',
                        }}
                      >
                        {att.score !== undefined ? `${score}/10` : '-'}
                      </strong>
                    </td>
                    <td>
                      <Badge variant={isPassed ? 'success' : 'error'}>
                        {isPassed ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/student/attempts/${att.id}/result`)}
                        leftIcon={<Eye size={14} />}
                      >
                        Xem chi tiết
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
