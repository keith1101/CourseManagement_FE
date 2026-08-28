import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, PlayCircle, Search, FileText } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatusBadge, StatusTone } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { assignmentsApi } from '../../api/assignments';
import { Assignment } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

const statusToneMap: Record<Assignment['status'], StatusTone> = {
  PENDING: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  OVERDUE: 'danger',
};

const statusLabel: Record<Assignment['status'], string> = {
  PENDING: 'Chưa làm',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Đã hoàn thành',
  OVERDUE: 'Đã quá hạn',
};

export const MyAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    assignmentsApi
      .getMyAssignments()
      .then(setAssignments)
      .catch((err) => error(getApiErrorMessage(err, 'Không thể tải danh sách bài thi.')))
      .finally(() => setIsLoading(false));
  }, [error]);

  const filtered = useMemo(() => {
    return assignments.filter((assignment) => {
      const query = searchTerm.toLowerCase();
      const matchesText =
        (assignment.exam?.title || '').toLowerCase().includes(query) ||
        (assignment.exam?.subject?.name || '').toLowerCase().includes(query);
      return matchesText && (statusFilter === 'ALL' || assignment.status === statusFilter);
    });
  }, [assignments, searchTerm, statusFilter]);

  if (isLoading) {
    return <LoadingSpinner text="Đang tải danh sách bài thi được giao..." />;
  }

  const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chưa làm' },
    { key: 'IN_PROGRESS', label: 'Đang làm' },
    { key: 'COMPLETED', label: 'Đã hoàn thành' },
    { key: 'OVERDUE', label: 'Đã quá hạn' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        eyebrow="Nhiệm vụ học tập"
        title="Danh sách bài thi được giao"
        description="Theo dõi tiến độ làm bài, hạn nộp và kết quả điểm số của từng bài kiểm tra."
      />

      {/* Toolbar & Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Segmented Filter Tabs */}
        <div className="segmented-tabs" style={{ flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`segmented-tab ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            placeholder="Tìm theo tên đề thi hoặc môn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', height: '40px', minHeight: '40px' }}
          />
        </div>
      </div>

      {/* Assignments List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={44} />}
          title="Không tìm thấy bài thi"
          description="Không có bài thi nào phù hợp với bộ lọc hiện tại của bạn."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
            gap: '20px',
          }}
        >
          {filtered.map((assignment) => {
            const overdue = assignment.status === 'OVERDUE';
            const completed = assignment.status === 'COMPLETED';
            const inProgress = assignment.status === 'IN_PROGRESS';
            const canOpen = !overdue;
            const completedAttempt = assignment.examAttempts?.find(
              (attempt) => attempt.status === 'COMPLETED'
            );

            return (
              <Card
                key={assignment.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderTop: `3px solid ${
                    overdue
                      ? 'var(--accent)'
                      : completed
                      ? 'var(--success)'
                      : inProgress
                      ? 'var(--warning)'
                      : 'var(--primary)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge tone={statusToneMap[assignment.status]}>
                    {statusLabel[assignment.status]}
                  </StatusBadge>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: overdue ? 'var(--accent)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: overdue ? 600 : 400,
                    }}
                  >
                    <Calendar size={13} />
                    {assignment.dueDate
                      ? new Date(assignment.dueDate).toLocaleDateString('vi-VN')
                      : 'Không giới hạn'}
                  </span>
                </div>

                <div>
                  <div style={{ marginBottom: '6px' }}>
                    <Badge variant="neutral">{assignment.exam?.subject?.name || 'Môn học'}</Badge>
                  </div>
                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {assignment.exam?.title || 'Đề kiểm tra'}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      marginTop: '8px',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> {assignment.exam?.durationMinutes || 'Theo từng câu'}
                    </span>
                    <span>•</span>
                    <span>{assignment.exam?.totalPoints || 10} điểm</span>
                  </div>

                  {completedAttempt?.score !== undefined && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--success-bg)',
                        borderRadius: 'var(--border-radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 600 }}>
                        Điểm đạt được:
                      </span>
                      <strong style={{ color: 'var(--success)', fontSize: '1rem' }}>
                        {completedAttempt.score.toFixed(1)} / 10
                      </strong>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  {completed ? (
                    <Button
                      variant="outline"
                      style={{ width: '100%' }}
                      onClick={() =>
                        completedAttempt?.id &&
                        navigate(`/student/attempts/${completedAttempt.id}/result`)
                      }
                      leftIcon={<CheckCircle2 size={16} />}
                    >
                      Xem kết quả
                    </Button>
                  ) : (
                    <Button
                      variant={inProgress ? 'primary' : 'primary'}
                      disabled={!canOpen}
                      style={{ width: '100%' }}
                      onClick={() =>
                        navigate(
                          `/student/exams/${assignment.examId}/take?assignmentId=${encodeURIComponent(
                            assignment.id
                          )}`
                        )
                      }
                      leftIcon={<PlayCircle size={16} />}
                    >
                      {inProgress ? 'Tiếp tục làm bài' : overdue ? 'Đã quá hạn' : 'Bắt đầu làm bài'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
