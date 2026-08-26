import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { assignmentsApi } from '../../api/assignments';
import { Assignment } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

const statusLabel: Record<Assignment['status'], string> = { PENDING: 'Chưa làm', IN_PROGRESS: 'Đang làm', COMPLETED: 'Đã hoàn thành', OVERDUE: 'Đã quá hạn' };

export const MyAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    assignmentsApi.getMyAssignments().then(setAssignments).catch((err) => error(getApiErrorMessage(err, 'Không thể tải danh sách bài thi.'))).finally(() => setIsLoading(false));
  }, [error]);

  const filtered = useMemo(() => assignments.filter((assignment) => {
    const query = searchTerm.toLowerCase();
    const matchesText = (assignment.exam?.title || '').toLowerCase().includes(query) || (assignment.exam?.subject?.name || '').toLowerCase().includes(query);
    return matchesText && (statusFilter === 'ALL' || assignment.status === statusFilter);
  }), [assignments, searchTerm, statusFilter]);

  if (isLoading) return <LoadingSpinner text="Đang tải danh sách bài thi được giao..." />;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div className="assignments-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}><div><h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Danh sách bài thi được giao</h1><p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>Theo dõi trạng thái và hạn hoàn thành bài thi.</p></div><div className="assignments-filters" style={{ display: 'flex', gap: '12px' }}><input placeholder="Tìm kiếm đề thi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field" style={{ height: '40px' }} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field" style={{ height: '40px' }}><option value="ALL">Tất cả trạng thái</option><option value="PENDING">Chưa làm</option><option value="IN_PROGRESS">Đang làm</option><option value="COMPLETED">Đã hoàn thành</option><option value="OVERDUE">Đã quá hạn</option></select></div></div>
    {filtered.length === 0 ? <Card style={{ textAlign: 'center', padding: '60px 20px' }}><AlertCircle size={48} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} /><h3>Không tìm thấy bài thi</h3></Card> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '20px' }}>{filtered.map((assignment) => {
      const overdue = assignment.status === 'OVERDUE';
      const completed = assignment.status === 'COMPLETED';
      const inProgress = assignment.status === 'IN_PROGRESS';
      const canOpen = !overdue;
      const completedAttempt = assignment.examAttempts?.find((attempt) => attempt.status === 'COMPLETED');
      return <Card key={assignment.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: `4px solid ${overdue ? 'var(--error)' : completed ? 'var(--success)' : 'var(--primary)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><Badge variant={overdue ? 'error' : completed ? 'success' : inProgress ? 'warning' : 'primary'}>{statusLabel[assignment.status]}</Badge><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} />{assignment.dueDate ? new Date(assignment.dueDate).toLocaleString('vi-VN') : 'Không giới hạn'}</span></div>
        <div><h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{assignment.exam?.title || 'Đề kiểm tra'}</h3><div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}><span><Clock size={14} /> {assignment.exam?.durationMinutes || 'Theo từng câu'} </span><span>{assignment.exam?.totalPoints || 10} điểm</span></div>{completedAttempt?.score !== undefined && <strong style={{ display: 'block', color: 'var(--success)', marginTop: '8px' }}>Điểm: {completedAttempt.score.toFixed(1)}/10</strong>}</div>
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>{completed ? <Button variant="outline" style={{ width: '100%' }} onClick={() => completedAttempt?.id && navigate(`/student/attempts/${completedAttempt.id}/result`)} leftIcon={<CheckCircle2 size={16} />}>Xem kết quả</Button> : <Button variant="primary" disabled={!canOpen} style={{ width: '100%' }} onClick={() => navigate(`/student/exams/${assignment.examId}/take?assignmentId=${encodeURIComponent(assignment.id)}`)} leftIcon={<PlayCircle size={16} />}>{inProgress ? 'Tiếp tục làm bài' : overdue ? 'Đã quá hạn' : 'Bắt đầu làm bài'}</Button>}</div>
      </Card>;
    })}</div>}
  </div>;
};
