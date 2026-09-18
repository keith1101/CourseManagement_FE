import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Send, BookOpen } from 'lucide-react';
import { CountdownTimer } from '../../components/exam/CountdownTimer';
import { ExamProgress } from '../../components/exam/ExamProgress';
import { QuestionCard } from '../../components/exam/QuestionCard';
import { QuestionPalette } from '../../components/exam/QuestionPalette';
import { SubmitConfirmModal } from '../../components/exam/SubmitConfirmModal';
import { SequentialExamTakingView } from '../../components/exam/SequentialExamTakingView';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { UpgradeModal } from '../../components/common/UpgradeModal';
import { attemptsApi, SaveAnswerPayload } from '../../api/attempts';
import { examsApi } from '../../api/exams';
import { questionsApi } from '../../api/questions';
import { AttemptFeedback, Exam, ExamAttempt, Question, SequentialSession } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

interface PersistAnswerOptions {
  timedOut?: boolean;
  finalize?: boolean;
  revealFeedback?: boolean;
  parts?: Array<{ partId: string; rawValue: string }>;
}

export const ExamTakingPage: React.FC = () => {
  const { examId, attemptId } = useParams<{ examId?: string; attemptId?: string }>();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignmentId') || undefined;
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [sequentialSession, setSequentialSession] = useState<SequentialSession | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [partAnswers, setPartAnswers] = useState<Record<string, Record<string, string>>>({});
  const [feedback, setFeedback] = useState<Record<string, AttemptFeedback>>({});
  const [deadlines, setDeadlines] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<'question' | 'exam' | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const loadExamAndAttempt = useCallback(async () => {
    setIsLoading(true);
    setDeadlines({});
    setFeedback({});
    setSequentialSession(null);
    try {
      const currentAttempt = attemptId
        ? await attemptsApi.getAttempt(attemptId)
        : await attemptsApi.startAttempt(examId!, assignmentId);
      setAttempt(currentAttempt);
      if (currentAttempt.flowVersion === 2) {
        const session = currentAttempt.sequentialSession || await attemptsApi.getSequentialSession(currentAttempt.id);
        const targetExamId = currentAttempt.examId || examId!;
        const examData = await examsApi.getExamById(targetExamId);
        setExam(examData);
        setSequentialSession(session);
        return;
      }
      const deadlineKey = `course-management:attempt-deadlines:${currentAttempt.id}`;
      const storedDeadlines = localStorage.getItem(deadlineKey);
      if (storedDeadlines) {
        try {
          setDeadlines(JSON.parse(storedDeadlines) as Record<string, number>);
        } catch {
          localStorage.removeItem(deadlineKey);
        }
      }
      const targetExamId = currentAttempt.examId || examId!;
      const [examData, questionData] = await Promise.all([
        examsApi.getExamById(targetExamId),
        currentAttempt.questions?.length
          ? Promise.resolve(currentAttempt.questions)
          : questionsApi.getQuestionsByExam(targetExamId),
      ]);
      setExam(examData);
      setQuestions(questionData);
      const prefilled: Record<string, string> = {};
      const prefilledParts: Record<string, Record<string, string>> = {};
      currentAttempt.answers?.forEach((answer) => {
        if (answer.parts && Array.isArray(answer.parts) && answer.parts.length > 0) {
          const partsMap: Record<string, string> = {};
          answer.parts.forEach((p) => {
            if (p.partId) {
              partsMap[p.partId] = p.rawValue ?? '';
            }
          });
          if (Object.keys(partsMap).length > 0) {
            prefilledParts[answer.questionId] = partsMap;
          }
        }
        const value = answer.selectedOptionId || answer.textAnswer || answer.rawValue;
        if (value) prefilled[answer.questionId] = value;
        if (answer.isCorrect !== undefined || answer.partFeedback || answer.parts)
          setFeedback((previous) => ({
            ...previous,
            [answer.questionId]: answer as AttemptFeedback,
          }));
      });
      setAnswers(prefilled);
      setPartAnswers(prefilledParts);
    } catch (err: any) {
      const apiMessage = getApiErrorMessage(err, 'Không thể bắt đầu làm bài.');
      const apiCode = err?.response?.data?.code;
      if (err?.response?.status === 403 && apiCode === 'EXAM_REQUIRES_PRO') {
        setShowUpgrade(true);
        return;
      }
      error(apiMessage);
      navigate(assignmentId ? '/student/assignments' : '/student');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, attemptId, examId, error, navigate]);

  useEffect(() => {
    if (examId || attemptId) void loadExamAndAttempt();
  }, [examId, attemptId, loadExamAndAttempt]);

  const currentQuestion = questions[currentIndex];
  const currentDeadline = currentQuestion ? deadlines[currentQuestion.id] : undefined;
  const secondsLeft = currentDeadline ? Math.max(0, Math.ceil((currentDeadline - now) / 1000)) : 0;
  const currentFeedback = currentQuestion ? feedback[currentQuestion.id] : undefined;
  const currentLocked = !!currentFeedback;

  useEffect(() => {
    if (!currentQuestion || currentFeedback) return;
    if (!deadlines[currentQuestion.id]) {
      setDeadlines((previous) => ({
        ...previous,
        [currentQuestion.id]: Date.now() + (currentQuestion.timeLimit || 30) * 1000,
      }));
    }
  }, [currentFeedback, currentQuestion, deadlines]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!attempt?.id || Object.keys(deadlines).length === 0) return;
    localStorage.setItem(
      `course-management:attempt-deadlines:${attempt.id}`,
      JSON.stringify(deadlines)
    );
  }, [attempt?.id, deadlines]);

  const persistAnswer = useCallback(
    async (
      question: Question,
      value: string,
      {
        timedOut = false,
        finalize = false,
        revealFeedback = finalize || timedOut,
        parts,
      }: PersistAnswerOptions = {},
    ) => {
      if (!attempt?.id) return null;
      const isMultiPart = question.type === 'MULTI_PART_SHORT_ANSWER';

      let payload: SaveAnswerPayload;
      if (isMultiPart) {
        if (!parts || parts.length === 0 || parts.some((p) => !p.partId)) {
          return null;
        }
        payload = {
          questionId: question.id,
          parts,
          timedOut,
          finalize,
        };
      } else {
        if (!value && !timedOut) return null;
        payload = {
          questionId: question.id,
          selectedOptionId:
            question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE'
              ? value
              : undefined,
          textAnswer:
            question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE'
              ? undefined
              : value,
          rawValue: value || undefined,
          answerType:
            question.type === 'ESSAY' && /^-?\d+(\.\d+)?$/.test(value.trim())
              ? 'NUMBER'
              : 'TEXT',
          numericValue:
            question.type === 'ESSAY' && /^-?\d+(\.\d+)?$/.test(value.trim())
              ? Number(value)
              : undefined,
          timedOut,
          finalize,
        };
      }

      const result = await attemptsApi.saveAnswer(attempt.id, payload);
      if (revealFeedback && (result.isCorrect !== undefined || result.partFeedback || result.parts)) {
        setFeedback((previous) => ({
          ...previous,
          [question.id]: result as AttemptFeedback,
        }));
      }
      return result;
    },
    [attempt?.id]
  );

  useEffect(() => {
    if (!currentQuestion || currentFeedback || !currentDeadline || secondsLeft > 0) return;
    warning(`Câu ${currentIndex + 1} đã hết thời gian.`);

    if (currentQuestion.type === 'MULTI_PART_SHORT_ANSWER') {
      const partsList = currentQuestion.questionParts || currentQuestion.parts || [];
      if (partsList.length === 0 || partsList.some((p) => !p.id)) {
        setFeedback((previous) => ({
          ...previous,
          [currentQuestion.id]: {
            questionId: currentQuestion.id,
            isCorrect: false,
            timedOut: true,
            explanation: currentQuestion.explanation,
          },
        }));
        return;
      }
      const qPartAnswers = partAnswers[currentQuestion.id] || {};
      const parts = partsList.map((p) => ({
        partId: p.id!,
        rawValue: qPartAnswers[p.id!] ?? '',
      }));
      void persistAnswer(currentQuestion, '', {
        timedOut: true,
        finalize: true,
        revealFeedback: true,
        parts,
      }).catch(() => {
        setFeedback((previous) => ({
          ...previous,
          [currentQuestion.id]: {
            questionId: currentQuestion.id,
            isCorrect: false,
            timedOut: true,
            explanation: currentQuestion.explanation,
          },
        }));
      });
      return;
    }

    void persistAnswer(currentQuestion, answers[currentQuestion.id] || '', {
      timedOut: true,
      finalize: true,
      revealFeedback: true,
    }).catch(() => {
      setFeedback((previous) => ({
        ...previous,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          isCorrect: false,
          timedOut: true,
          explanation: currentQuestion.explanation,
        },
      }));
    });
  }, [
    answers,
    currentDeadline,
    currentFeedback,
    currentIndex,
    currentQuestion,
    partAnswers,
    persistAnswer,
    secondsLeft,
    warning,
  ]);

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion || currentLocked) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: optionId }));
  };

  const handleTextAnswerChange = (value: string) => {
    if (!currentQuestion || currentLocked) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value }));
  };

  const handlePartAnswerChange = (questionId: string, partId: string, value: string) => {
    if (currentLocked) return;
    setPartAnswers((previous) => ({
      ...previous,
      [questionId]: {
        ...(previous[questionId] || {}),
        [partId]: value,
      },
    }));
  };

  const handleSubmitQuestion = async () => {
    if (!attempt?.id || !currentQuestion) return;
    if (currentFeedback) {
      setShowSubmitModal(false);
      return warning(`Câu ${currentIndex + 1} đã được nộp.`);
    }

    if (currentQuestion.type === 'MULTI_PART_SHORT_ANSWER') {
      const partsList = currentQuestion.questionParts || currentQuestion.parts || [];
      if (partsList.length === 0 || partsList.some((p) => !p.id)) {
        return error('Không thể nộp câu hỏi do dữ liệu câu hỏi không hợp lệ.');
      }
      const qPartAnswers = partAnswers[currentQuestion.id] || {};
      const hasMissing = partsList.some((p) => !p.id || !qPartAnswers[p.id]?.trim());
      if (hasMissing) {
        return error('Vui lòng điền đầy đủ câu trả lời cho tất cả các ý.');
      }

      setIsSubmitting(true);
      setSubmittingAction('question');
      try {
        const parts = partsList.map((p) => ({
          partId: p.id!,
          rawValue: qPartAnswers[p.id!].trim(),
        }));
        await persistAnswer(currentQuestion, '', {
          finalize: true,
          revealFeedback: true,
          parts,
        });
        setShowSubmitModal(false);
        success(`Đã nộp câu ${currentIndex + 1}.`);
      } catch (err) {
        error(getApiErrorMessage(err, 'Không thể nộp câu hỏi.'));
      } finally {
        setIsSubmitting(false);
        setSubmittingAction(null);
      }
      return;
    }

    const value = answers[currentQuestion.id]?.trim();
    if (!value) return error('Vui lòng trả lời câu hỏi hiện tại trước khi nộp.');

    setIsSubmitting(true);
    setSubmittingAction('question');
    try {
      await persistAnswer(currentQuestion, value, {
        finalize: true,
        revealFeedback: true,
      });
      setShowSubmitModal(false);
      success(`Đã nộp câu ${currentIndex + 1}.`);
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể nộp câu hỏi.'));
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  const handleSubmitExam = async () => {
    if (!attempt?.id) return;
    setIsSubmitting(true);
    setSubmittingAction('exam');
    try {
      const pendingAnswers: Array<() => Promise<any>> = [];

      for (const question of questions) {
        if (feedback[question.id]) continue;

        if (question.type === 'MULTI_PART_SHORT_ANSWER') {
          const partsList = question.questionParts || question.parts || [];
          if (partsList.length > 0 && partsList.every((p) => !!p.id)) {
            const qPartAnswers = partAnswers[question.id] || {};
            const parts = partsList.map((p) => ({
              partId: p.id!,
              rawValue: qPartAnswers[p.id!]?.trim() || '',
            }));
            pendingAnswers.push(() =>
              persistAnswer(question, '', {
                finalize: true,
                revealFeedback: false,
                parts,
              }),
            );
          }
        } else {
          const value = answers[question.id]?.trim();
          if (value) {
            pendingAnswers.push(() =>
              persistAnswer(question, value, {
                finalize: true,
                revealFeedback: false,
              }),
            );
          }
        }
      }

      await Promise.all(pendingAnswers.map((fn) => fn()));
      await attemptsApi.submitAttempt(attempt.id);
      success('Nộp bài thi thành công!');
      navigate(`/student/attempts/${attempt.id}/result`);
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể nộp bài.'));
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
      setShowSubmitModal(false);
    }
  };

  const handleNextQuestion = () => {
    setCurrentIndex((index) => Math.min(questions.length - 1, index + 1));
  };

  const sections = useMemo(
    () => [{ id: 'all', title: 'Toàn bộ câu hỏi', questionCount: questions.length }],
    [questions.length]
  );

  const paletteAnswers = useMemo(() => {
    const result: Record<string, string> = { ...answers };
    questions.forEach((q) => {
      if (q.type === 'MULTI_PART_SHORT_ANSWER') {
        const qParts = q.questionParts || q.parts || [];
        const qAnswers = partAnswers[q.id] || {};
        const hasAll =
          qParts.length > 0 && qParts.every((p) => p.id && (qAnswers[p.id]?.trim() || '').length > 0);
        if (hasAll) {
          result[q.id] = 'answered';
        } else {
          const hasAny =
            qParts.length > 0 && qParts.some((p) => p.id && (qAnswers[p.id]?.trim() || '').length > 0);
          if (hasAny) {
            result[q.id] = 'partial';
          }
        }
      }
    });
    return result;
  }, [answers, partAnswers, questions]);

  if (isLoading) return <LoadingSpinner fullPage text="Đang chuẩn bị đề thi cho bạn..." />;

  if (attempt?.flowVersion === 2 && sequentialSession) {
    return (
      <SequentialExamTakingView
        attemptId={attempt.id}
        attempt={attempt}
        initialSession={sequentialSession}
        examTitle={exam?.title}
      />
    );
  }

  if (!currentQuestion)
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertTriangle size={48} color="var(--warning)" style={{ margin: '0 auto 16px' }} />
        <h2>Đề thi chưa có câu hỏi</h2>
        <Button
          variant="primary"
          style={{ marginTop: '20px' }}
          onClick={() => navigate('/student/assignments')}
        >
          Về danh sách bài thi
        </Button>
        <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      </div>
    );

  const isMultiPart = currentQuestion?.type === 'MULTI_PART_SHORT_ANSWER';
  const questionIds = questions.map((question) => question.id);
  const answeredCount = Object.keys(paletteAnswers).filter((id) => paletteAnswers[id] !== '').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1280px',
        margin: '0 auto',
        paddingBottom: '40px',
      }}
    >
      <ExamProgress sections={sections} activeSectionIndex={0} />

      {/* Exam Header */}
      <div className="exam-header">
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--accent)',
            }}
          >
            {exam?.subject?.name || 'Môn học'}
          </span>
          <h2
            style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}
          >
            {exam?.title || 'Bài thi trắc nghiệm'}
          </h2>
        </div>

        <CountdownTimer
          formattedTime={`${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
            secondsLeft % 60
          ).padStart(2, '0')}`}
          isWarning={secondsLeft > 0 && secondsLeft <= 300}
          isUrgent={secondsLeft > 0 && secondsLeft <= 60}
        />
      </div>

      {/* Main Exam 2-Column Layout */}
      <div className="exam-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <QuestionCard
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            selectedOptionId={isMultiPart ? undefined : answers[currentQuestion.id]}
            textAnswer={isMultiPart ? '' : (answers[currentQuestion.id] || '')}
            partAnswers={partAnswers[currentQuestion.id] || {}}
            feedback={currentFeedback}
            disabled={secondsLeft === 0 && !currentFeedback}
            onSelectOption={handleSelectOption}
            onTextAnswerChange={handleTextAnswerChange}
            onPartAnswerChange={(partId, val) =>
              handlePartAnswerChange(currentQuestion.id, partId, val)
            }
          />

          {currentFeedback && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                disabled={currentIndex === questions.length - 1}
                onClick={handleNextQuestion}
                rightIcon={<ChevronRight size={18} />}
              >
                Tiếp tục câu sau
              </Button>
            </div>
          )}

          {/* Bottom Exam Navigation Toolbar */}
          <div className="exam-navigation">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              leftIcon={<ChevronLeft size={18} />}
            >
              Câu trước
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowSubmitModal(true)}
              leftIcon={<Send size={16} />}
            >
              Nộp bài thi
            </Button>
            <Button
              variant="primary"
              disabled={
                currentIndex === questions.length - 1
              }
              onClick={handleNextQuestion}
              rightIcon={<ChevronRight size={18} />}
            >
              Câu tiếp
            </Button>
          </div>
        </div>

        {/* Sticky Question Palette */}
        <div className="exam-palette" style={{ position: 'sticky', top: '88px' }}>
          <QuestionPalette
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answers={paletteAnswers}
            questionIds={questionIds}
            onSelectIndex={(index) => setCurrentIndex(index)}
          />
        </div>
      </div>

      <SubmitConfirmModal
        isOpen={showSubmitModal}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        isSubmitting={isSubmitting}
        submittingAction={submittingAction}
        onSubmitQuestion={handleSubmitQuestion}
        onSubmitExam={handleSubmitExam}
        onClose={() => setShowSubmitModal(false)}
      />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};
