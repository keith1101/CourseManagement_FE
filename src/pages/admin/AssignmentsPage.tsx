import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Send, Calendar, User, Search, CheckSquare, Square } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { assignmentsApi } from '../../api/assignments';
import { examsApi } from '../../api/exams';
import { usersApi } from '../../api/users';
import { Assignment, Exam, User as UserType } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

const statusLabel: Record<Assignment['status'], string> = {
  PENDING: 'Chưa làm',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Đã nộp',
  OVERDUE: 'Đã quá hạn',
};

export const AssignmentsPage: React.FC = () => {
  const { success, error, warning } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Assign Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assignData, examsData, usersData] = await Promise.all([
        assignmentsApi.getAssignments(),
        examsApi.getExams({ status: 'PUBLISHED' }),
        usersApi.getUsers({ role: 'STUDENT' }),
      ]);
      setAssignments(assignData);
      setExams(examsData);
      setStudents(usersData);
      if (examsData.length > 0 && !selectedExamId) {
        setSelectedExamId(examsData[0].id);
      }
    } catch (err) {
      error('Không thể tải dữ liệu phân công.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignedStudentIdsForExam = useMemo(
    () => new Set(assignments.filter((assignment) => assignment.examId === selectedExamId).map((assignment) => assignment.studentId)),
    [assignments, selectedExamId],
  );
  const availableStudents = useMemo(
    () => students.filter((student) => !assignedStudentIdsForExam.has(student.id)),
    [assignedStudentIdsForExam, students],
  );

  useEffect(() => {
    setSelectedStudentIds((previous) => {
      const next = previous.filter((id) => !assignedStudentIdsForExam.has(id));
      return next.length === previous.length ? previous : next;
    });
  }, [assignedStudentIdsForExam]);

  const handleToggleSelectStudent = (id: string) => {
    if (assignedStudentIdsForExam.has(id)) return;
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === availableStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents.map((student) => student.id));
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      error('Vui lòng chọn đề thi để giao!');
      return;
    }
    const eligibleStudentIds = [...new Set(selectedStudentIds)].filter((id) => !assignedStudentIdsForExam.has(id));
    if (eligibleStudentIds.length === 0) {
      error('Vui lòng chọn ít nhất 1 học sinh!');
      return;
    }

    const dueAt = dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (new Date(dueAt).getTime() <= Date.now()) {
      error('Hạn nộp phải ở trong tương lai.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await assignmentsApi.createAssignment({
        examId: selectedExamId,
        studentIds: eligibleStudentIds,
        dueDate: dueAt,
      });
      setAssignments((prev) => [...(Array.isArray(created) ? created : [created]), ...prev]);
      success(`Đã giao đề thi thành công cho ${eligibleStudentIds.length} học sinh!`);
      setIsModalOpen(false);
      setSelectedStudentIds([]);
    } catch (err: any) {
      error(getApiErrorMessage(err, 'Không thể giao đề thi. Vui lòng thử lại!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn hủy phân công này?')) return;
    try {
      await assignmentsApi.deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      success('Đã xóa bài phân công');
    } catch (err) {
      error('Không thể xóa bài phân công');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Đang tải danh sách phân công đề thi..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Giao Đề Thi Cho Học Sinh
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Phân công đề thi trực tiếp tới từng học sinh và đặt hạn nộp bài
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Send size={16} />}
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Phân Công Đề Mới
        </Button>
      </div>

      {/* Assignments Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Đề Thi</th>
              <th>Học Sinh</th>
              <th>Hạn Nộp</th>
              <th>Trạng Thái</th>
              <th>Ngày Giao</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Chưa có bài thi nào được giao
                </td>
              </tr>
            ) : (
              assignments.map((assign) => (
                <tr key={assign.id}>
                  <td>
                    <strong>{assign.exam?.title || 'Đề thi trắc nghiệm'}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {assign.student?.fullName?.charAt(0) || 'H'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {assign.student?.fullName || 'Học sinh'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {assign.student?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {assign.dueDate ? new Date(assign.dueDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </span>
                  </td>
                  <td>
                    <Badge
                      variant={
                        assign.status === 'COMPLETED'
                          ? 'success'
                          : assign.status === 'OVERDUE'
                          ? 'error'
                          : assign.status === 'IN_PROGRESS'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {statusLabel[assign.status]}
                    </Badge>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {assign.createdAt ? new Date(assign.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteAssignment(assign.id)}
                      title="Hủy giao bài"
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        color: 'var(--error)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Giao Đề Thi Mới Cho Học Sinh"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Exam Selection */}
          <div className="form-group">
            <label className="form-label">Chọn Đề Thi</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="input-field"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.durationMinutes} phút)
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <Input
            label="Hạn nộp bài"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          {/* Student Multi-Select List */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label">Chọn Học Sinh ({selectedStudentIds.length}/{availableStudents.length} có thể nhận)</label>
              <button
                type="button"
                onClick={handleSelectAllStudents}
                disabled={availableStudents.length === 0}
                style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600 }}
              >
                {availableStudents.length > 0 && selectedStudentIds.length === availableStudents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {students.map((st) => {
                const isChecked = selectedStudentIds.includes(st.id);
                const alreadyAssigned = assignedStudentIdsForExam.has(st.id);
                return (
                  <div
                    key={st.id}
                    onClick={() => !alreadyAssigned && handleToggleSelectStudent(st.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: 'var(--border-radius-sm)',
                      backgroundColor: isChecked ? 'var(--primary-subtle)' : 'transparent',
                      cursor: alreadyAssigned ? 'not-allowed' : 'pointer',
                      opacity: alreadyAssigned ? 0.55 : 1,
                    }}
                  >
                    {isChecked ? (
                      <CheckSquare size={18} color="var(--primary)" />
                    ) : (
                      <Square size={18} color="var(--text-muted)" />
                    )}
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong>{st.fullName}</strong> ({st.email})
                      {alreadyAssigned && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đã được phân công đề này</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} leftIcon={<Send size={16} />}>
              Giao Đề Thi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
