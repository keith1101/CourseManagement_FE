import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Send } from 'lucide-react';
import { attemptsApi, SequentialAnswerPayload } from '../../api/attempts';
import { getApiErrorMessage } from '../../api/errors';
import { ExamAttempt, SequentialFeedback, SequentialSession } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../common/Button';
import { CountdownTimer } from './CountdownTimer';
import { QuestionCard } from './QuestionCard';
import { QuestionPalette } from './QuestionPalette';

interface SequentialExamTakingViewProps {
  attemptId: string;
  attempt?: ExamAttempt | null;
  initialSession?: SequentialSession;
  examTitle?: string;
  /** Optional URL for the existing correct-answer sound asset. */
  correctAnswerSoundUrl?: string;
}

const randomKey = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const SequentialExamTakingView: React.FC<SequentialExamTakingViewProps> = ({
  attemptId,
  attempt,
  initialSession,
  examTitle,
  correctAnswerSoundUrl,
}) => {
  const { error, warning } = useToast();
  const [session, setSession] = useState<SequentialSession | null>(initialSession || null);
  const [answer, setAnswer] = useState('');
  const [serverOffset, setServerOffset] = useState(() =>
    initialSession ? Date.parse(initialSession.serverNow) - Date.now() : 0,
  );
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialSession);
  const currentIdRef = useRef<string | null>(initialSession?.currentQuestion?.id || null);
  const appliedProgressVersionRef = useRef(initialSession?.progressVersion ?? -1);
  const expiryRequestRef = useRef<string | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const advanceKeyRef = useRef<string | null>(null);
  const autoAdvanceFailedRef = useRef<string | null>(null);
  const refreshInFlightRef = useRef<Promise<SequentialSession> | null>(null);
  const resyncQueuedRef = useRef(false);
  const soundUrl = correctAnswerSoundUrl || import.meta.env.VITE_CORRECT_ANSWER_SOUND_URL;

  const playCorrectAnswerSound = useCallback(() => {
    if (!soundUrl || typeof Audio === 'undefined') return;
    const audio = new Audio(soundUrl);
    void audio.play().catch(() => undefined);
  }, [soundUrl]);

  const applySession = useCallback((next: SequentialSession) => {
    if (next.progressVersion < appliedProgressVersionRef.current) return;
    appliedProgressVersionRef.current = next.progressVersion;
    const nextId = next.currentQuestion?.id || null;
    if (currentIdRef.current !== nextId) {
      setAnswer('');
      currentIdRef.current = nextId;
      autoAdvanceFailedRef.current = null;
    }
    setSession(next);
    setServerOffset(Date.parse(next.serverNow) - Date.now());
  }, []);

  const refreshSession = useCallback(() => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const request = (async () => {
      try {
        const next = await attemptsApi.getSequentialSession(attemptId);
        applySession(next);
        return next;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();
    refreshInFlightRef.current = request;
    return request;
  }, [applySession, attemptId]);

  useEffect(() => {
    if (session) return;
    let cancelled = false;
    void attemptsApi
      .getSequentialSession(attemptId)
      .then((next) => {
        if (!cancelled) applySession(next);
      })
      .catch((err) => error(getApiErrorMessage(err, 'Không thể tải tiến độ bài thi.')))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applySession, attemptId, error, session]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const current = session?.currentQuestion || null;
  const question = current?.question;
  const serverNow = now + serverOffset;
  const secondsLeft = current?.deadlineAt
    ? Math.max(0, Math.ceil((Date.parse(current.deadlineAt) - serverNow) / 1000))
    : 0;
  const isExpired = secondsLeft <= 0;
  const value = answer.trim();
  const isActive = current?.status === 'ACTIVE';
  const answerPayload = useCallback(
    (questionId: string, progressVersion: number, answerValue: string): SequentialAnswerPayload => ({
      questionId,
      progressVersion,
      selectedOptionId:
        question?.type === 'SINGLE_CHOICE' || question?.type === 'MULTIPLE_CHOICE'
          ? answerValue || undefined
          : undefined,
      rawValue:
        question?.type === 'SINGLE_CHOICE' || question?.type === 'MULTIPLE_CHOICE'
          ? undefined
          : answerValue,
      answerType:
        question?.type === 'ESSAY' && /^-?\d+(\.\d+)?$/.test(answerValue)
          ? 'NUMBER'
          : 'TEXT',
      numericValue:
        question?.type === 'ESSAY' && /^-?\d+(\.\d+)?$/.test(answerValue)
          ? Number(answerValue)
          : undefined,
    }),
    [question],
  );

  useEffect(() => {
    if (!current || !isActive || secondsLeft > 0 || isSubmitting) return;
    if (expiryRequestRef.current === current.id) return;
    expiryRequestRef.current = current.id;
    warning(`Câu ${current.ordinal} đã hết thời gian.`);
    void attemptsApi
      .expireCurrentQuestion(attemptId)
      .then(applySession)
      .catch(async (err) => {
        expiryRequestRef.current = null;
        if (err?.response?.status === 409) await refreshSession().catch(() => undefined);
        else error(getApiErrorMessage(err, 'Không thể ghi nhận hết giờ.'));
      });
  }, [applySession, attemptId, current, error, isActive, refreshSession, secondsLeft, isSubmitting, warning]);

  const continueQuestion = useCallback(async () => {
    if (!session || !current || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const next = await attemptsApi.continueCurrentQuestion(
        attemptId,
        current.id,
        session.progressVersion,
        randomKey(),
      );
      applySession(next);
      if (next.attemptStatus === 'COMPLETED' && next.resultUrl) {
        window.location.assign(next.resultUrl);
      }
    } catch (err: any) {
      // If the automatic advance cannot reach the server, allow a manual
      // retry once the feedback window has elapsed instead of leaving the
      // correct state permanently locked.
      advanceKeyRef.current = null;
      if (current.status === 'CORRECT' && current.advanceAfter) {
        autoAdvanceFailedRef.current = `${current.id}:${current.advanceAfter}`;
      }
      if (err?.response?.status === 409) {
        await refreshSession().catch(() => undefined);
      } else {
        error(getApiErrorMessage(err, 'Không thể chuyển sang câu tiếp theo.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [applySession, attemptId, current, error, isSubmitting, refreshSession, session]);

  const continueManually = useCallback(() => {
    autoAdvanceFailedRef.current = null;
    void continueQuestion();
  }, [continueQuestion]);

  const applySubmissionOutcome = useCallback(
    (outcome: {
      questionId: string;
      status: 'CORRECT' | 'INCORRECT' | 'TIMED_OUT';
      timedOut: boolean;
      advanceAfter?: string | null;
      progressVersion: number;
      feedback?: SequentialFeedback;
    }) => {
      appliedProgressVersionRef.current = Math.max(
        appliedProgressVersionRef.current,
        outcome.progressVersion,
      );
      setSession((previous) => {
        // A slow response from an older tab/request must not overwrite a
        // server refresh that has already moved to another question.
        if (!previous?.currentQuestion || previous.currentQuestion.id !== outcome.questionId) {
          return previous;
        }
        // Prefer the server's authoritative three-second deadline. The local
        // fallback is only for compatibility with older/mock responses.
        const visibleUntil = outcome.status === 'CORRECT'
          ? outcome.advanceAfter ?? new Date(Date.now() + 3000).toISOString()
          : outcome.advanceAfter ?? null;
        return {
          ...previous,
          progressVersion: outcome.progressVersion,
          currentQuestion: {
            ...previous.currentQuestion,
            status: outcome.status,
            advanceAfter: visibleUntil,
            feedback: outcome.feedback,
          },
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!current || current.status !== 'CORRECT' || !current.advanceAfter) return;
    const advanceKey = `${current.id}:${current.advanceAfter}`;
    if (advanceKeyRef.current === advanceKey) return;
    if (autoAdvanceFailedRef.current === advanceKey) return;
    advanceKeyRef.current = advanceKey;
    const delay = Math.max(0, Date.parse(current.advanceAfter) - (Date.now() + serverOffset));
    advanceTimerRef.current = window.setTimeout(() => {
      void continueQuestion();
    }, delay);
    return () => {
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    };
  }, [continueQuestion, current, serverOffset]);

  useEffect(() => {
    const resync = () => {
      // Browser lifecycle events often arrive in a burst (pageshow,
      // visibilitychange, and online). Coalesce that burst into one request;
      // refreshSession also coalesces callers that are already in flight.
      if (resyncQueuedRef.current) return;
      resyncQueuedRef.current = true;
      void refreshSession()
        .catch(() => undefined)
        .finally(() => {
          resyncQueuedRef.current = false;
        });
    };
    window.addEventListener('online', resync);
    window.addEventListener('pageshow', resync);
    window.addEventListener('popstate', resync);
    document.addEventListener('visibilitychange', resync);
    return () => {
      window.removeEventListener('online', resync);
      window.removeEventListener('pageshow', resync);
      window.removeEventListener('popstate', resync);
      document.removeEventListener('visibilitychange', resync);
    };
  }, [refreshSession]);

  const submit = async () => {
    if (!session || !current || !question || !isActive || !value || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await attemptsApi.submitCurrentQuestion(
        attemptId,
        answerPayload(current.id, session.progressVersion, answer),
        randomKey(),
      );
      if ('navigator' in response) applySession(response);
      else {
        if (response.status === 'CORRECT') playCorrectAnswerSound();
        applySubmissionOutcome(response);
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await refreshSession().catch(() => undefined);
      } else {
        error(getApiErrorMessage(err, 'Không thể nộp câu hỏi.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const statuses = useMemo(
    () => session?.navigator.map((item) => item.status) || [],
    [session],
  );
  const paletteAnswers = useMemo(
    () => (current ? { [current.id]: answer, [String(current.ordinal)]: answer } : {}),
    [answer, current],
  );

  if (isLoading || !session) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Đang tải tiến độ bài thi...</div>;
  }

  if (session.attemptStatus === 'COMPLETED' || !current || !question) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Check size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
        <h2>Bài thi đã hoàn tất</h2>
        {session.resultUrl && (
          <Button variant="primary" style={{ marginTop: 20 }} onClick={() => window.location.assign(session.resultUrl!)}>
            Xem kết quả
          </Button>
        )}
      </div>
    );
  }

  const feedback = current.feedback
    ? {
        ...current.feedback,
        explanation: current.feedback.explanation?.text,
        explanationImage: current.feedback.explanation?.image,
        guidance: current.feedback.guidance,
      }
    : undefined;
  const isFinalQuestion = current.ordinal === session.totalQuestions;
  const buttonLabel = isSubmitting
    ? 'Đang nộp…'
    : isActive
    ? 'Nộp'
    : isFinalQuestion
    ? 'Hoàn thành bài thi'
    : 'Tiếp tục';
  const correctFeedbackWaiting =
    current.status === 'CORRECT' &&
    !!current.advanceAfter &&
    Date.parse(current.advanceAfter) > serverNow;
  const buttonDisabled =
    isSubmitting ||
    correctFeedbackWaiting ||
    (isActive && (!value || secondsLeft === 0));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 1280,
        margin: '0 auto',
        paddingBottom: 40,
      }}
    >
      <div className="exam-header">
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.35rem', marginTop: 2 }}>
            {examTitle || attempt?.exam?.title || 'Bài thi'}
          </h2>
        </div>
        <CountdownTimer
          formattedTime={`${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`}
          isWarning={secondsLeft > 0 && secondsLeft <= 300}
          isUrgent={secondsLeft > 0 && secondsLeft <= 60}
        />
      </div>

      <div className="exam-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <QuestionCard
            question={question}
            currentIndex={current.ordinal - 1}
            totalQuestions={session.totalQuestions}
            selectedOptionId={question.type === 'ESSAY' ? undefined : answer}
            textAnswer={question.type === 'ESSAY' ? answer : ''}
            feedback={feedback as any}
            disabled={!isActive || secondsLeft === 0 || isSubmitting}
            onSelectOption={setAnswer}
            onTextAnswerChange={setAnswer}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <Button
              variant="primary"
              disabled={buttonDisabled}
              onClick={isActive ? submit : continueManually}
              leftIcon={isActive ? <Send size={16} /> : undefined}
            >
              {buttonLabel}
            </Button>
          </div>
        </div>

        <div className="exam-palette" style={{ position: 'sticky', top: 88 }}>
          <QuestionPalette
            totalQuestions={session.totalQuestions}
            currentIndex={current.ordinal - 1}
            answers={paletteAnswers}
            questionIds={session.navigator.map((item) => String(item.ordinal))}
            questionStatuses={statuses}
            onSelectIndex={() => undefined}
          />
        </div>
      </div>
    </div>
  );
};
