import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { CountdownTimer } from '../../components/exam/CountdownTimer';
import { ExamProgress } from '../../components/exam/ExamProgress';
import { QuestionCard } from '../../components/exam/QuestionCard';
import { QuestionPalette } from '../../components/exam/QuestionPalette';
import { SubmitConfirmModal } from '../../components/exam/SubmitConfirmModal';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { UpgradeModal } from '../../components/common/UpgradeModal';
import { attemptsApi, SaveAnswerPayload } from '../../api/attempts';
import { examsApi } from '../../api/exams';
import { questionsApi } from '../../api/questions';
import { AttemptFeedback, Exam, ExamAttempt, Question } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

const playSuccessTone = () => {
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(660, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
  oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.24);
  window.setTimeout(() => { void context.close(); }, 300);
};

export const ExamTakingPage: React.FC = () => {
  const { examId, attemptId } = useParams<{ examId?: string; attemptId?: string }>();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignmentId') || undefined;
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, AttemptFeedback>>({});
  const [deadlines, setDeadlines] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
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
    try {
      const currentAttempt = attemptId ? await attemptsApi.getAttempt(attemptId) : await attemptsApi.startAttempt(examId!, assignmentId);
      setAttempt(currentAttempt);
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
        currentAttempt.questions?.length ? Promise.resolve(currentAttempt.questions) : questionsApi.getQuestionsByExam(targetExamId),
      ]);
      setExam(examData);
      setQuestions(questionData);
      const prefilled: Record<string, string> = {};
      currentAttempt.answers?.forEach((answer) => {
        const value = answer.selectedOptionId || answer.textAnswer || answer.rawValue;
        if (value) prefilled[answer.questionId] = value;
        if (answer.isCorrect !== undefined) setFeedback((previous) => ({ ...previous, [answer.questionId]: answer as AttemptFeedback }));
      });
      setAnswers(prefilled);
    } catch (err: any) {
      const apiMessage = getApiErrorMessage(err, 'Không thể bắt đầu làm bài.');
      if (err?.response?.status === 403 && !apiMessage.toLowerCase().includes('overdue') && !apiMessage.toLowerCase().includes('quá hạn')) {
        setShowUpgrade(true);
        return;
      }
      error(apiMessage);
      navigate('/student/assignments');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, attemptId, examId, error, navigate]);

  useEffect(() => { if (examId || attemptId) void loadExamAndAttempt(); }, [examId, attemptId, loadExamAndAttempt]);

  const currentQuestion = questions[currentIndex];
  const currentDeadline = currentQuestion ? deadlines[currentQuestion.id] : undefined;
  const secondsLeft = currentDeadline ? Math.max(0, Math.ceil((currentDeadline - now) / 1000)) : 0;
  const currentFeedback = currentQuestion ? feedback[currentQuestion.id] : undefined;
  const currentLocked = !!currentFeedback;

  useEffect(() => {
    if (!currentQuestion || currentFeedback) return;
    if (!deadlines[currentQuestion.id]) {
      setDeadlines((previous) => ({ ...previous, [currentQuestion.id]: Date.now() + (currentQuestion.timeLimit || 30) * 1000 }));
    }
  }, [currentFeedback, currentQuestion, deadlines]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!attempt?.id || Object.keys(deadlines).length === 0) return;
    localStorage.setItem(`course-management:attempt-deadlines:${attempt.id}`, JSON.stringify(deadlines));
  }, [attempt?.id, deadlines]);

  const persistAnswer = useCallback(async (question: Question, value: string, timedOut = false, revealFeedback = true) => {
    if (!attempt?.id || (!value && !timedOut)) return null;
    const payload: SaveAnswerPayload = {
      questionId: question.id,
      selectedOptionId: question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE' ? value : undefined,
      textAnswer: question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE' ? undefined : value,
      rawValue: value || undefined,
      answerType: question.type === 'FILL_BLANK' && /^-?\d+(\.\d+)?$/.test(value.trim()) ? 'NUMBER' : 'TEXT',
      numericValue: question.type === 'FILL_BLANK' && /^-?\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : undefined,
      timedOut,
    };
    const result = await attemptsApi.saveAnswer(attempt.id, payload);
    if (revealFeedback) setFeedback((previous) => ({ ...previous, [question.id]: result }));
    return result;
  }, [attempt?.id]);

  useEffect(() => {
    if (!currentQuestion || currentFeedback || !currentDeadline || secondsLeft > 0) return;
    warning(`Câu ${currentIndex + 1} đã hết thời gian.`);
    void persistAnswer(currentQuestion, answers[currentQuestion.id] || '', true).catch(() => {
      setFeedback((previous) => ({ ...previous, [currentQuestion.id]: { questionId: currentQuestion.id, isCorrect: false, timedOut: true, explanation: currentQuestion.explanation } }));
    });
  }, [answers, currentDeadline, currentFeedback, currentIndex, currentQuestion, persistAnswer, secondsLeft, warning]);

  const handleSelectOption = async (optionId: string) => {
    if (!currentQuestion || currentLocked) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: optionId }));
    try {
      const result = await persistAnswer(currentQuestion, optionId);
      if (result?.isCorrect) {
        playSuccessTone();
        if (currentIndex < questions.length - 1) window.setTimeout(() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1)), 800);
      }
    } catch (err) { error(getApiErrorMessage(err, 'Không thể lưu đáp án.')); }
  };

  const handleTextAnswerChange = (value: string) => {
    if (!currentQuestion || currentLocked) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value }));
  };

  useEffect(() => {
    if (!currentQuestion || currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'MULTIPLE_CHOICE' || currentFeedback || !attempt?.id) return;
    const value = answers[currentQuestion.id];
    if (!value) return;
    const timer = window.setTimeout(() => { void persistAnswer(currentQuestion, value, false, false).catch(() => undefined); }, 500);
    return () => window.clearTimeout(timer);
  }, [answers, attempt?.id, currentFeedback, currentQuestion, persistAnswer]);

  const handleSubmitQuestion = async () => {
    if (!attempt?.id || !currentQuestion) return;
    if (currentFeedback) {
      setShowSubmitModal(false);
      return warning(`Câu ${currentIndex + 1} đã được nộp.`);
    }

    const value = answers[currentQuestion.id]?.trim();
    if (!value) return error('Vui lòng trả lời câu hỏi hiện tại trước khi nộp.');

    setIsSubmitting(true);
    setSubmittingAction('question');
    try {
      await persistAnswer(currentQuestion, value);
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
      if (currentQuestion && !currentFeedback && answers[currentQuestion.id]) {
        await persistAnswer(currentQuestion, answers[currentQuestion.id]);
      }
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

  const handleNextQuestion = async () => {
    if (currentQuestion && answers[currentQuestion.id] && currentQuestion.type !== 'SINGLE_CHOICE' && currentQuestion.type !== 'MULTIPLE_CHOICE' && !currentFeedback) {
      await persistAnswer(currentQuestion, answers[currentQuestion.id], false, false).catch(() => undefined);
    }
    setCurrentIndex((index) => Math.min(questions.length - 1, index + 1));
  };

  const sections = useMemo(() => [{ id: 'all', title: 'Toàn bộ câu hỏi', questionCount: questions.length }], [questions.length]);
  if (isLoading) return <LoadingSpinner fullPage text="Đang chuẩn bị đề thi cho bạn..." />;
  if (!currentQuestion) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><AlertTriangle size={48} color="var(--warning)" style={{ margin: '0 auto 16px' }} /><h2>Đề thi chưa có câu hỏi</h2><Button variant="primary" style={{ marginTop: '20px' }} onClick={() => navigate('/student/assignments')}>Về danh sách bài thi</Button><UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} /></div>;

  const questionIds = questions.map((question) => question.id);
  const answeredCount = Object.keys(answers).filter((id) => answers[id] !== '').length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
      <ExamProgress sections={sections} activeSectionIndex={0} />
      <div className="exam-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', backgroundColor: '#FFFFFF', padding: '16px 24px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}><div><span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{exam?.subject?.name || 'Môn học'}</span><h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{exam?.title || 'Bài thi'}</h2></div><CountdownTimer formattedTime={`${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`} isWarning={secondsLeft > 0 && secondsLeft <= 300} isUrgent={secondsLeft > 0 && secondsLeft <= 60} /></div>
      <div className="exam-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <QuestionCard question={currentQuestion} currentIndex={currentIndex} totalQuestions={questions.length} selectedOptionId={answers[currentQuestion.id]} textAnswer={answers[currentQuestion.id] || ''} feedback={currentFeedback} disabled={secondsLeft === 0 && !currentFeedback} isFlagged={!!flaggedQuestions[currentIndex]} onSelectOption={handleSelectOption} onTextAnswerChange={handleTextAnswerChange} onToggleFlag={() => setFlaggedQuestions((previous) => ({ ...previous, [currentIndex]: !previous[currentIndex] }))} />
          {currentFeedback && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="primary" disabled={currentIndex === questions.length - 1} onClick={handleNextQuestion} rightIcon={<ChevronRight size={18} />}>Tiếp tục</Button></div>}
          <div className="exam-navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '16px 24px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}><Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} leftIcon={<ChevronLeft size={18} />}>Câu trước</Button><Button variant="secondary" onClick={() => setShowSubmitModal(true)} leftIcon={<Send size={16} />}>Nộp bài</Button><Button variant="primary" disabled={currentIndex === questions.length - 1 || ((currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'MULTIPLE_CHOICE') && !currentFeedback)} onClick={handleNextQuestion} rightIcon={<ChevronRight size={18} />}>Câu sau</Button></div>
        </div>
        <div className="exam-palette" style={{ position: 'sticky', top: '88px' }}><QuestionPalette totalQuestions={questions.length} currentIndex={currentIndex} answers={answers} flaggedQuestions={flaggedQuestions} questionIds={questionIds} onSelectIndex={(index) => setCurrentIndex(index)} /></div>
      </div>
      <SubmitConfirmModal isOpen={showSubmitModal} totalQuestions={questions.length} answeredCount={answeredCount} isSubmitting={isSubmitting} submittingAction={submittingAction} onSubmitQuestion={handleSubmitQuestion} onSubmitExam={handleSubmitExam} onClose={() => setShowSubmitModal(false)} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};
