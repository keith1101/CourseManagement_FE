import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Eye, Calendar, Clock, Check, X, FileText, UserRound } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { attemptsApi } from '../../api/attempts';
import { examsApi } from '../../api/exams';
import { ExamAttempt, Exam } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

const getAttemptTotalQuestions = (attempt: ExamAttempt) =>
  attempt.totalQuestions || attempt.questions?.length || 0;

const getAttemptCorrectAnswers = (attempt: ExamAttempt) => attempt.correctAnswers ?? 0;

const getAttemptScore = (attempt: ExamAttempt) => {
  const totalQuestions = getAttemptTotalQuestions(attempt);
  const correctAnswers = getAttemptCorrectAnswers(attempt);

  if (attempt.score !== undefined) {
    return Number(attempt.score.toFixed(1));
  }

  return totalQuestions > 0
    ? Number(((correctAnswers / totalQuestions) * 10).toFixed(1))
    : 0;
};

const formatDuration = (durationSeconds?: number) => {
  if (!durationSeconds) return '-';
  return `${Math.floor(durationSeconds / 60)} phút`;
};

const formatAttemptDate = (value?: string) =>
  value ? new Date(value).toLocaleString('vi-VN') : '-';

const mergeAttemptDetail = (summary: ExamAttempt, detail: ExamAttempt): ExamAttempt => ({
  ...summary,
  ...detail,
  student: summary.student ?? detail.student,
  exam: summary.exam
    ? { ...summary.exam, title: detail.exam?.title || summary.exam.title }
    : detail.exam,
  startedAt: detail.startedAt || summary.startedAt,
  submittedAt: detail.submittedAt || summary.submittedAt,
  durationSeconds: detail.durationSeconds ?? summary.durationSeconds,
  assignmentId: detail.assignmentId ?? summary.assignmentId,
});

interface StudentExamHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: ExamAttempt['student'];
  historyAttempts: ExamAttempt[];
  selectedAttempt: ExamAttempt | null;
  isDetailLoading: boolean;
  onSelectAttempt: (attempt: ExamAttempt) => void;
}

const StudentExamHistoryModal: React.FC<StudentExamHistoryModalProps> = ({
  isOpen,
  onClose,
  student,
  historyAttempts,
  selectedAttempt,
  isDetailLoading,
  onSelectAttempt,
}) => {
  const selectedTotalQuestions = selectedAttempt
    ? getAttemptTotalQuestions(selectedAttempt)
    : 0;
  const selectedCorrectAnswers = selectedAttempt
    ? getAttemptCorrectAnswers(selectedAttempt)
    : 0;
  const selectedScore = selectedAttempt ? getAttemptScore(selectedAttempt) : 0;
  const selectedIsPassed = selectedAttempt
    ? selectedScore >= (selectedAttempt.exam?.passingScore || 5)
    : false;
  const answersMap = new Map(
    (selectedAttempt?.answers || []).map((answer) => [answer.questionId, answer]),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lịch sử thi - ${student?.fullName || 'Học sinh'}`}
      maxWidth="1180px"
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              flexShrink: 0,
            }}
          >
            <UserRound size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
              {student?.fullName || 'Học sinh'}
            </strong>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '3px' }}>
              {student?.email || 'Chưa cập nhật email'}
            </div>
          </div>
        </div>

        <div
          className="stat-grid"
          style={{
            gap: '12px',
            marginBottom: 0,
          }}
        >
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-info">
              <span className="stat-value">{historyAttempts.length}</span>
              <span className="stat-label">Tổng lượt thi</span>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-info">
              <span className="stat-value">
                {historyAttempts.length > 0
                  ? (
                      historyAttempts.reduce((sum, attempt) => sum + getAttemptScore(attempt), 0) /
                      historyAttempts.length
                    ).toFixed(1)
                  : '0.0'}
              </span>
              <span className="stat-label">Điểm trung bình</span>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-info">
              <span className="stat-value">
                {historyAttempts.length > 0
                  ? `${Math.round(
                      (historyAttempts.filter(
                        (attempt) => getAttemptScore(attempt) >= (attempt.exam?.passingScore || 5),
                      ).length /
                        historyAttempts.length) *
                        100,
                    )}%`
                  : '0%'}
              </span>
              <span className="stat-label">Tỉ lệ đạt</span>
            </div>
          </div>
        </div>

        <section>
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
              Các lần thi đã hoàn thành
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '4px' }}>
              Chọn một lần thi để xem chi tiết từng câu hỏi và đáp án.
            </p>
          </div>

          {historyAttempts.length > 0 ? (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
              <table className="data-table" style={{ minWidth: '720px' }}>
                <thead>
                  <tr>
                    <th>Đề thi</th>
                    <th>Thời gian nộp</th>
                    <th style={{ textAlign: 'center' }}>Thời lượng</th>
                    <th style={{ textAlign: 'center' }}>Điểm</th>
                    <th style={{ textAlign: 'center' }}>Kết quả</th>
                    <th style={{ textAlign: 'center', width: '150px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {historyAttempts.map((attempt) => {
                    const score = getAttemptScore(attempt);
                    const isPassed = score >= (attempt.exam?.passingScore || 5);
                    const isSelected = selectedAttempt?.id === attempt.id;

                    return (
                      <tr
                        key={attempt.id}
                        style={{
                          backgroundColor: isSelected ? 'var(--primary-subtle)' : undefined,
                        }}
                      >
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {attempt.exam?.title || 'Đề thi trắc nghiệm'}
                          </strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                            {getAttemptCorrectAnswers(attempt)}/{getAttemptTotalQuestions(attempt)} câu đúng
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {formatAttemptDate(attempt.submittedAt)}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {formatDuration(attempt.durationSeconds)}
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: isPassed ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-mono)' }}>
                            {score.toFixed(1)} / 10
                          </strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Badge variant={isPassed ? 'success' : 'error'}>
                            {isPassed ? 'Đạt' : 'Chưa đạt'}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Button
                            size="sm"
                            variant={isSelected ? 'primary' : 'outline'}
                            onClick={() => onSelectAttempt(attempt)}
                            leftIcon={<Eye size={14} />}
                          >
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Học sinh chưa có lượt thi hoàn thành.</p>
          )}
        </section>

        {selectedAttempt && (
          <section style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                flexWrap: 'wrap',
                marginBottom: '18px',
              }}
            >
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                  Chi tiết lần thi
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '4px' }}>
                  {selectedAttempt.exam?.title || 'Đề thi trắc nghiệm'} • Nộp lúc{' '}
                  {formatAttemptDate(selectedAttempt.submittedAt)}
                </p>
              </div>
              <Badge variant={selectedIsPassed ? 'success' : 'error'}>
                {selectedScore.toFixed(1)} / 10 • {selectedIsPassed ? 'Đạt' : 'Chưa đạt'}
              </Badge>
            </div>

            {isDetailLoading ? (
              <LoadingSpinner text="Đang tải chi tiết đáp án..." />
            ) : selectedAttempt.questions && selectedAttempt.questions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <span><strong style={{ color: 'var(--text-primary)' }}>{selectedCorrectAnswers}</strong>/{selectedTotalQuestions} câu đúng</span>
                  <span>Thời lượng: <strong style={{ color: 'var(--text-primary)' }}>{formatDuration(selectedAttempt.durationSeconds)}</strong></span>
                </div>

                {selectedAttempt.questions.map((question, index) => {
                  const answer = answersMap.get(question.id);
                  const selectedOption = question.options?.find(
                    (option) => option.id === answer?.selectedOptionId || option.label === answer?.selectedOptionId,
                  );
                  const isCorrect = answer?.isCorrect ?? selectedOption?.isCorrect ?? false;
                  const textAnswer = answer?.textAnswer ?? answer?.rawValue ?? answer?.content;
                  const correctTextAnswer = question.correctTextAnswer ?? answer?.correctTextAnswer;

                  return (
                    <Card
                      key={question.id || index}
                      style={{
                        padding: '18px',
                        borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                          paddingBottom: '10px',
                          borderBottom: '1px solid var(--border-color)',
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>Câu {index + 1}</strong>
                        <Badge variant={isCorrect ? 'success' : 'error'}>
                          {isCorrect ? '✓ Chính xác' : '✕ Chưa đúng'}
                        </Badge>
                      </div>

                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.55, margin: '14px 0' }}>
                        {question.content}
                      </p>

                      {question.options && question.options.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {question.options.map((option) => {
                            const isSelected = selectedOption?.id === option.id || selectedOption?.label === option.label;
                            const optionIsCorrect = option.isCorrect;
                            const optionColor = isSelected && !optionIsCorrect
                              ? 'var(--error)'
                              : optionIsCorrect
                              ? 'var(--success)'
                              : 'var(--border-color)';
                            const optionBackground = isSelected && !optionIsCorrect
                              ? 'var(--error-bg)'
                              : optionIsCorrect
                              ? 'var(--success-bg)'
                              : 'var(--bg-card)';

                            return (
                              <div
                                key={option.id || option.label}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                  padding: '10px 12px',
                                  border: `1px solid ${optionColor}`,
                                  borderRadius: 'var(--border-radius-md)',
                                  backgroundColor: optionBackground,
                                  fontSize: '0.8125rem',
                                }}
                              >
                                <span style={{ color: 'var(--text-primary)' }}>
                                  <strong style={{ color: 'var(--primary)', marginRight: '6px' }}>{option.label}.</strong>
                                  {option.content}
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                  {isSelected && (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Đã chọn</span>
                                  )}
                                  {optionIsCorrect ? <Check size={15} color="var(--success)" /> : isSelected ? <X size={15} color="var(--error)" /> : null}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '12px',
                            backgroundColor: 'var(--bg-subtle)',
                            borderRadius: 'var(--border-radius-md)',
                            fontSize: '0.8125rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <div><strong>Câu trả lời của học sinh:</strong> {textAnswer || '(Chưa trả lời)'}</div>
                          {correctTextAnswer && (
                            <div style={{ marginTop: '6px', color: 'var(--success)' }}>
                              <strong>Đáp án đúng:</strong> {correctTextAnswer}
                            </div>
                          )}
                        </div>
                      )}

                      {question.explanation && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            marginTop: '12px',
                            padding: '10px 12px',
                            backgroundColor: 'var(--primary-subtle)',
                            border: '1px solid var(--primary-light)',
                            borderRadius: 'var(--border-radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '0.8125rem',
                            lineHeight: 1.5,
                          }}
                        >
                          <FileText size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span><strong style={{ color: 'var(--primary)' }}>Giải thích: </strong>{question.explanation}</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Chi tiết câu hỏi đang được cập nhật.</p>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
};

export const AdminResultsPage: React.FC = () => {
  const { error } = useToast();

  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [examFilter, setExamFilter] = useState<string>('ALL');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<ExamAttempt['student']>();
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const detailRequestRef = useRef(0);

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

  const studentHistory = useMemo(() => {
    if (!selectedStudentId) return [];

    return attempts
      .filter((attempt) => attempt.status === 'COMPLETED' && attempt.studentId === selectedStudentId)
      .sort((first, second) => {
        const firstDate = Date.parse(first.submittedAt || first.startedAt || '') || 0;
        const secondDate = Date.parse(second.submittedAt || second.startedAt || '') || 0;
        return secondDate - firstDate;
      });
  }, [attempts, selectedStudentId]);

  const openAttemptHistory = useCallback(async (attempt: ExamAttempt) => {
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setSelectedStudentId(attempt.studentId);
    setSelectedStudent(attempt.student);
    setSelectedAttempt(attempt);
    setIsHistoryOpen(true);
    setIsDetailLoading(true);

    try {
      const detail = await attemptsApi.getResult(attempt.id);
      if (detailRequestRef.current === requestId) {
        setSelectedAttempt(mergeAttemptDetail(attempt, detail));
      }
    } catch (err) {
      if (detailRequestRef.current === requestId) {
        error(getApiErrorMessage(err, 'Không thể tải chi tiết lịch sử thi.'));
      }
    } finally {
      if (detailRequestRef.current === requestId) {
        setIsDetailLoading(false);
      }
    }
  }, [error]);

  const closeAttemptHistory = useCallback(() => {
    detailRequestRef.current += 1;
    setIsHistoryOpen(false);
    setSelectedStudentId(null);
    setSelectedStudent(undefined);
    setSelectedAttempt(null);
    setIsDetailLoading(false);
  }, []);

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
              <th style={{ textAlign: 'center', width: '130px' }}>Thời lượng</th>
              <th style={{ textAlign: 'center', minWidth: '150px', width: '160px' }}>Điểm số</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Kết quả</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Thao tác</th>
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
                const totalQ = getAttemptTotalQuestions(att);
                const correct = getAttemptCorrectAnswers(att);
                const score = getAttemptScore(att);
                const isPassed = score >= (att.exam?.passingScore || 5);

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
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
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
                    <td style={{ textAlign: 'center', minWidth: '150px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                        <strong
                          style={{
                            color: isPassed ? 'var(--success)' : 'var(--error)',
                            fontSize: '1.125rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {score.toFixed(1)} / 10
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {correct}/{totalQ} câu đúng
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={isPassed ? 'success' : 'error'}>
                        {isPassed ? 'Đạt' : 'Chưa đạt'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAttemptHistory(att)}
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

      <StudentExamHistoryModal
        isOpen={isHistoryOpen}
        onClose={closeAttemptHistory}
        student={selectedStudent}
        historyAttempts={studentHistory}
        selectedAttempt={selectedAttempt}
        isDetailLoading={isDetailLoading}
        onSelectAttempt={openAttemptHistory}
      />
    </div>
  );
};
