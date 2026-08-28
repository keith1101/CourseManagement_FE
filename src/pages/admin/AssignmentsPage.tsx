import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Send, Calendar, User, Search, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { StatusBadge, StatusTone } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { assignmentsApi } from '../../api/assignments';
import { examsApi } from '../../api/exams';
import { usersApi } from '../../api/users';
import { Assignment, Exam, User as UserType } from '../../types';
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
  COMPLETED: 'Đã nộp',
  OVERDUE: 'Đã quá hạn',
};

export const AssignmentsPage: React.FC = () => {
  const { success, error, warning } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Assign Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState<string>('');

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
  }, [error, selectedExamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignedStudentIdsForExam = useMemo(
    () =>
      new Set(
        assignments
          .filter((assignment) => assignment.examId === selectedExamId)
          .map((assignment) => assignment.studentId)
      ),
    [assignments, selectedExamId]
  );

  const availableStudents = useMemo(
    () => students.filter((student) => !assignedStudentIdsForExam.has(student.id)),
    [assignedStudentIdsForExam, students]
  );

  const filteredModalStudents = useMemo(() => {
    return availableStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
    );
  }, [availableStudents, studentSearch]);

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
    if (selectedStudentIds.length === filteredModalStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredModalStudents.map((student) => student.id));
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      error('Vui lòng chọn đề thi để giao!');
      return;
    }
    const eligibleStudentIds = [...new Set(selectedStudentIds)].filter(
      (id) => !assignedStudentIdsForExam.has(id)
    );
    if (eligibleStudentIds.length === 0) {
      warning('Không có học sinh hợp lệ nào để giao.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await assignmentsApi.createAssignment({
        examId: selectedExamId,
        studentIds: eligibleStudentIds,
        dueDate: dueDate ? new Date(dueDate).toISOString() : '',
      });
      setAssignments((prev) => [...created, ...prev]);
      success(`Đã giao bài thi thành công cho ${created.length} học sinh!`);
      setIsModalOpen(false);
      setSelectedStudentIds([]);
      setDueDate('');
    } catch (err: any) {
      error(getApiErrorMessage(err, 'Không thể giao bài thi. Vui lòng thử lại!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa lượt giao bài thi này?')) return;
    try {
      await assignmentsApi.deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      success('Đã xóa lượt giao bài.');
    } catch (err) {
      error('Không thể xóa lượt giao bài thi.');
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const studentName = a.student?.fullName?.toLowerCase() || '';
    const examTitle = a.exam?.title?.toLowerCase() || '';
    return (
      studentName.includes(searchTerm.toLowerCase()) || examTitle.includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return <LoadingSpinner text="Đang tải dữ liệu giao bài thi..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        eyebrow="Khảo thí & Phân công"
        title="Giao bài thi cho học sinh"
        description="Chỉ định đề thi cho từng học viên hoặc toàn bộ lớp kèm thời hạn chót hoàn thành."
        actions={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus size={18} />}
          >
            Giao Bài Thi Mới
          </Button>
        }
      />

      {/* Search Toolbar */}
      <div style={{ position: 'relative', width: '320px' }}>
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
          type="text"
          placeholder="Tìm theo tên học sinh hoặc đề thi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '36px', height: '40px', minHeight: '40px' }}
        />
      </div>

      {/* Assignments Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Đề thi</th>
              <th>Hạn hoàn thành</th>
              <th>Trạng thái</th>
              <th>Ngày giao</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                  <EmptyState
                    title="Chưa có lượt giao bài thi nào"
                    description="Bấm 'Giao Bài Thi Mới' để bắt đầu chỉ định đề thi cho học sinh."
                  />
                </td>
              </tr>
            ) : (
              filteredAssignments.map((assign) => (
                <tr key={assign.id}>
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
                        {assign.student?.fullName?.charAt(0) || 'H'}
                      </div>
                      <div>
                        <strong>{assign.student?.fullName || 'Học sinh'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {assign.student?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {assign.exam?.title || 'Đề thi trắc nghiệm'}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Môn: {assign.exam?.subject?.name || 'Chung'}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8125rem',
                        color: assign.status === 'OVERDUE' ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: assign.status === 'OVERDUE' ? 700 : 400,
                      }}
                    >
                      <Calendar size={14} />
                      {assign.dueDate
                        ? new Date(assign.dueDate).toLocaleDateString('vi-VN')
                        : 'Không giới hạn'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge tone={statusToneMap[assign.status]}>
                      {statusLabel[assign.status]}
                    </StatusBadge>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {assign.createdAt ? new Date(assign.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteAssignment(assign.id)}
                      title="Thu hồi bài thi"
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        color: 'var(--error)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={15} />
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
        title="Giao bài thi cho học sinh"
        maxWidth="640px"
      >
        <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Exam Selection */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Chọn đề thi công khai <span className="required">*</span>
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="input-field"
              required
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.subject?.name || 'Môn học'})
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Picker */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hạn chót hoàn thành (Tùy chọn)</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Student Picker */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Chọn học sinh nhận bài ({selectedStudentIds.length} đã chọn)
              </label>
              <button
                type="button"
                onClick={handleSelectAllStudents}
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {selectedStudentIds.length === filteredModalStudents.length &&
                filteredModalStudents.length > 0 ? (
                  <>
                    <CheckSquare size={14} /> Bỏ chọn tất cả
                  </>
                ) : (
                  <>
                    <Square size={14} /> Chọn tất cả
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              placeholder="Lọc danh sách học sinh theo tên..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="input-field"
              style={{ marginBottom: '8px', height: '36px', minHeight: '36px', fontSize: '0.8125rem' }}
            />

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-card)',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {filteredModalStudents.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  Không có học sinh khả dụng cho đề thi này
                </div>
              ) : (
                filteredModalStudents.map((st) => {
                  const isSelected = selectedStudentIds.includes(st.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSelectStudent(st.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--border-radius-sm)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--border-color)',
                            color: 'var(--primary)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {st.fullName.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {st.fullName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          ({st.email})
                        </span>
                      </div>
                      {isSelected ? (
                        <CheckSquare size={16} color="var(--primary)" />
                      ) : (
                        <Square size={16} color="var(--border-color)" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={selectedStudentIds.length === 0}
            >
              Giao cho {selectedStudentIds.length} học sinh
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
