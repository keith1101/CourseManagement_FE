import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attemptsApi } from '../../../api/attempts';
import { ToastProvider } from '../../../contexts/ToastContext';
import { SequentialExamTakingView } from '../SequentialExamTakingView';
import { SequentialSession } from '../../../types';

vi.mock('../../../api/attempts', () => ({
  attemptsApi: {
    getSequentialSession: vi.fn(),
    submitCurrentQuestion: vi.fn(),
    expireCurrentQuestion: vi.fn(),
    continueCurrentQuestion: vi.fn(),
  },
}));

const nowIso = () => new Date().toISOString();

const question = {
  id: 'question-1',
  examId: 'exam-1',
  subjectId: 'subject-1',
  content: 'What is 2 + 2?',
  type: 'SINGLE_CHOICE' as const,
  points: 1,
  timeLimit: 60,
  order: 0,
  options: [
    { id: 'option-correct', label: 'A', content: '4' },
    { id: 'option-wrong', label: 'B', content: '5' },
  ],
};

const feedback = {
  questionId: question.id,
  isCorrect: false,
  timedOut: false,
  correctOptionId: 'option-correct',
  correctAnswer: { id: 'option-correct', content: '4' },
  guidance: { text: 'Add the numbers.' },
  explanation: { text: 'Two plus two equals four.' },
};

const makeSession = (
  overrides: Partial<SequentialSession['currentQuestion']> = {},
  sessionOverrides: Partial<SequentialSession> = {},
): SequentialSession => {
  const serverNow = nowIso();
  return {
    attemptId: 'attempt-1',
    examId: 'exam-1',
    flowVersion: 2,
    attemptStatus: 'IN_PROGRESS',
    progressVersion: 0,
    totalQuestions: 2,
    currentOrdinal: 1,
    serverNow,
    navigator: [
      { ordinal: 1, status: 'ACTIVE' },
      { ordinal: 2, status: 'LOCKED' },
    ],
    currentQuestion: {
      id: question.id,
      ordinal: 1,
      status: 'ACTIVE',
      activatedAt: serverNow,
      deadlineAt: new Date(Date.now() + 60_000).toISOString(),
      advanceAfter: null,
      question,
      ...overrides,
    },
    ...sessionOverrides,
  } as SequentialSession;
};

const renderView = (initialSession: SequentialSession) =>
  render(
    <ToastProvider>
      <SequentialExamTakingView
        attemptId={initialSession.attemptId}
        initialSession={initialSession}
        examTitle="Submission test exam"
      />
    </ToastProvider>,
  );

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SequentialExamTakingView submission flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(attemptsApi.submitCurrentQuestion).mockResolvedValue({
      attemptId: 'attempt-1',
      questionId: question.id,
      status: 'INCORRECT',
      isCorrect: false,
      timedOut: false,
      progressVersion: 1,
      feedback,
    });
    vi.mocked(attemptsApi.expireCurrentQuestion).mockResolvedValue(makeSession(
      { status: 'TIMED_OUT', feedback: { ...feedback, timedOut: true } },
      { progressVersion: 1 },
    ));
    vi.mocked(attemptsApi.continueCurrentQuestion).mockResolvedValue(makeSession({
      id: 'question-2',
      ordinal: 2,
      question: { ...question, id: 'question-2', content: 'What is 3 + 3?', order: 1 },
      status: 'ACTIVE',
    }, {
      currentOrdinal: 2,
      progressVersion: 2,
      navigator: [
        { ordinal: 1, status: 'COMPLETED' },
        { ordinal: 2, status: 'ACTIVE' },
      ],
    }));
  });

  it('submits the selected answer without an intermediate save', async () => {
    const submission = deferred<any>();
    vi.mocked(attemptsApi.submitCurrentQuestion).mockReturnValue(submission.promise);

    const user = userEvent.setup();
    renderView(makeSession());

    const submitButton = screen.getByRole('button', { name: 'Nộp' });
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /A\.\s*4/ }));
    expect(screen.getByRole('button', { name: 'Nộp' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Nộp' }));

    expect(attemptsApi.submitCurrentQuestion).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Đang nộp…' })).toBeDisabled();

    submission.resolve({
      attemptId: 'attempt-1',
      questionId: question.id,
      status: 'INCORRECT',
      isCorrect: false,
      timedOut: false,
      progressVersion: 1,
      feedback,
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled());
  });

  it('shows incorrect feedback and waits for Continue without auto-advancing', async () => {
    vi.mocked(attemptsApi.submitCurrentQuestion).mockResolvedValue({
      attemptId: 'attempt-1',
      questionId: question.id,
      status: 'INCORRECT',
      isCorrect: false,
      timedOut: false,
      progressVersion: 1,
      feedback,
    });

    const user = userEvent.setup();
    renderView(makeSession());
    await user.click(screen.getByRole('button', { name: /B\.\s*5/ }));
    await user.click(await screen.findByRole('button', { name: 'Nộp' }));

    expect(await screen.findByText('Đáp án đúng:')).toBeInTheDocument();
    expect(screen.getByText(/Hướng dẫn:/)).toBeInTheDocument();
    expect(screen.getByText(/Giải thích:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled();
    expect(attemptsApi.continueCurrentQuestion).not.toHaveBeenCalled();
  });

  it('auto-continues a correct answer once using the server advanceAfter deadline', async () => {
    const nextSession = makeSession(
      {
        id: 'question-2',
        ordinal: 2,
        question: { ...question, id: 'question-2', content: 'What is 3 + 3?', order: 1 },
      },
      {
        currentOrdinal: 2,
        progressVersion: 2,
        navigator: [
          { ordinal: 1, status: 'COMPLETED' },
          { ordinal: 2, status: 'ACTIVE' },
        ],
      },
    );
    const advanceAfter = new Date(Date.now() + 500).toISOString();
    vi.mocked(attemptsApi.submitCurrentQuestion).mockResolvedValue({
      attemptId: 'attempt-1',
      questionId: question.id,
      status: 'CORRECT',
      isCorrect: true,
      timedOut: false,
      advanceAfter,
      progressVersion: 1,
      feedback: { questionId: question.id, isCorrect: true, timedOut: false },
    });
    vi.mocked(attemptsApi.continueCurrentQuestion).mockResolvedValue(nextSession);

    const user = userEvent.setup();
    renderView(makeSession());
    await user.click(screen.getByRole('button', { name: /A\.\s*4/ }));
    await user.click(await screen.findByRole('button', { name: 'Nộp' }));

    expect(await screen.findByRole('button', { name: 'Tiếp tục' })).toBeDisabled();
    await waitFor(() => expect(attemptsApi.continueCurrentQuestion).toHaveBeenCalledTimes(1), {
      timeout: 1_000,
    });
  });

  it('keeps correct feedback retryable when automatic Continue fails', async () => {
    const advanceAfter = new Date(Date.now() + 250).toISOString();
    vi.mocked(attemptsApi.submitCurrentQuestion).mockResolvedValue({
      attemptId: 'attempt-1',
      questionId: question.id,
      status: 'CORRECT',
      isCorrect: true,
      timedOut: false,
      advanceAfter,
      progressVersion: 1,
      feedback: { questionId: question.id, isCorrect: true, timedOut: false },
    });
    vi.mocked(attemptsApi.continueCurrentQuestion)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(makeSession({
        id: 'question-2',
        ordinal: 2,
        question: { ...question, id: 'question-2', order: 1 },
        status: 'ACTIVE',
      }, {
        currentOrdinal: 2,
        progressVersion: 2,
        navigator: [
          { ordinal: 1, status: 'COMPLETED' },
          { ordinal: 2, status: 'ACTIVE' },
        ],
      }));

    const user = userEvent.setup();
    renderView(makeSession());
    await user.click(screen.getByRole('button', { name: /A\.\s*4/ }));
    await user.click(await screen.findByRole('button', { name: 'Nộp' }));

    await waitFor(() => expect(attemptsApi.continueCurrentQuestion).toHaveBeenCalledTimes(1), {
      timeout: 1_500,
    });
    const retry = await screen.findByRole('button', { name: 'Tiếp tục' });
    expect(retry).toBeEnabled();
    await user.click(retry);
    await waitFor(() => expect(attemptsApi.continueCurrentQuestion).toHaveBeenCalledTimes(2));
  });

  it('plays the optional correct-answer sound exactly once', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    class AudioMock {
      play = play;
      constructor(public readonly src: string) {}
    }
    vi.stubGlobal('Audio', AudioMock);
    vi.mocked(attemptsApi.submitCurrentQuestion).mockResolvedValue({
      attemptId: 'attempt-1',
      questionId: question.id,
      status: 'CORRECT',
      isCorrect: true,
      timedOut: false,
      advanceAfter: new Date(Date.now() + 3_000).toISOString(),
      progressVersion: 1,
      feedback: { questionId: question.id, isCorrect: true, timedOut: false },
    });

    const user = userEvent.setup();
    render(
      <ToastProvider>
        <SequentialExamTakingView
          attemptId="attempt-1"
          initialSession={makeSession()}
          examTitle="Submission test exam"
          correctAnswerSoundUrl="/sounds/correct.mp3"
        />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: /A\.\s*4/ }));
    await user.click(await screen.findByRole('button', { name: 'Nộp' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('automatically completes the final question after correct feedback', async () => {
    const finalSession = makeSession(
      {
        id: 'question-2',
        ordinal: 2,
        question: { ...question, id: 'question-2', content: 'Final question', order: 1 },
      },
      {
        currentOrdinal: 2,
        navigator: [
          { ordinal: 1, status: 'COMPLETED' },
          { ordinal: 2, status: 'ACTIVE' },
        ],
      },
    );
    vi.mocked(attemptsApi.submitCurrentQuestion).mockResolvedValue({
      attemptId: 'attempt-1',
      questionId: 'question-2',
      status: 'CORRECT',
      isCorrect: true,
      timedOut: false,
      advanceAfter: new Date(Date.now() + 500).toISOString(),
      progressVersion: 1,
      feedback: { questionId: 'question-2', isCorrect: true, timedOut: false },
    });
    vi.mocked(attemptsApi.continueCurrentQuestion).mockResolvedValue({
      ...finalSession,
      attemptStatus: 'COMPLETED',
      currentQuestion: null,
      currentOrdinal: null,
      navigator: [
        { ordinal: 1, status: 'COMPLETED' },
        { ordinal: 2, status: 'COMPLETED' },
      ],
      progressVersion: 2,
    });

    const user = userEvent.setup();
    renderView(finalSession);
    await user.click(screen.getByRole('button', { name: /A\.\s*4/ }));
    await user.click(await screen.findByRole('button', { name: 'Nộp' }));
    await waitFor(() => expect(attemptsApi.continueCurrentQuestion).toHaveBeenCalledTimes(1), {
      timeout: 1_500,
    });
    expect(await screen.findByText('Bài thi đã hoàn tất')).toBeInTheDocument();
  });

  it('enables Nộp immediately for a non-whitespace short answer', async () => {
    const shortSession = makeSession({
      question: { ...question, type: 'ESSAY', options: [], content: 'Name a city.' },
    });
    const user = userEvent.setup();
    renderView(shortSession);
    const textbox = screen.getByPlaceholderText('Gõ câu trả lời tại đây...');
    await user.type(textbox, 'Bangkok');

    expect(screen.getByRole('button', { name: 'Nộp' })).toBeEnabled();
  });

  it('keeps Nộp disabled for whitespace-only answers', async () => {
    const shortSession = makeSession({
      question: { ...question, type: 'ESSAY', options: [], content: 'Name a city.' },
    });
    const user = userEvent.setup();
    renderView(shortSession);
    await user.type(screen.getByPlaceholderText('Gõ câu trả lời tại đây...'), '   ');
    expect(screen.getByRole('button', { name: 'Nộp' })).toBeDisabled();
  });

  it('recovers the Nộp button after a transient submit failure', async () => {
    vi.mocked(attemptsApi.submitCurrentQuestion).mockRejectedValueOnce(new Error('network down'));
    const user = userEvent.setup();
    renderView(makeSession());
    await user.click(screen.getByRole('button', { name: /A\.\s*4/ }));
    await user.click(await screen.findByRole('button', { name: 'Nộp' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Nộp' })).toBeEnabled());
  });

  it('coalesces lifecycle resync events into one session request', async () => {
    const refresh = deferred<SequentialSession>();
    vi.mocked(attemptsApi.getSequentialSession).mockReturnValue(refresh.promise);
    renderView(makeSession());

    act(() => {
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('pageshow'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(attemptsApi.getSequentialSession).toHaveBeenCalledTimes(1));
    refresh.resolve(makeSession());
  });

  it('uses the incorrect-answer UX after expiry', async () => {
    const timeoutSession = makeSession(
      {
        status: 'TIMED_OUT',
        deadlineAt: new Date(Date.now() - 1_000).toISOString(),
        feedback: { ...feedback, timedOut: true },
      },
      { progressVersion: 1 },
    );
    vi.mocked(attemptsApi.expireCurrentQuestion).mockResolvedValue(timeoutSession);

    const user = userEvent.setup();
    renderView(makeSession({ deadlineAt: new Date(Date.now() - 1_000).toISOString() }));

    await waitFor(() => expect(attemptsApi.expireCurrentQuestion).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Hết giờ làm câu hỏi!')).toBeInTheDocument();
    expect(screen.getByText(/Hướng dẫn:/)).toBeInTheDocument();
    expect(screen.getByText(/Giải thích:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    expect(attemptsApi.continueCurrentQuestion).toHaveBeenCalledTimes(1);
  });

  it('locks the final question after incorrect feedback and completes on Continue', async () => {
    const finalSession = makeSession(
      { ordinal: 2 },
      {
        totalQuestions: 2,
        currentOrdinal: 2,
        navigator: [
          { ordinal: 1, status: 'COMPLETED' },
          { ordinal: 2, status: 'ACTIVE' },
        ],
      },
    );
    vi.mocked(attemptsApi.submitCurrentQuestion).mockResolvedValue({
      attemptId: 'attempt-1',
      questionId: question.id,
      status: 'INCORRECT',
      isCorrect: false,
      timedOut: false,
      progressVersion: 1,
      feedback,
    });
    vi.mocked(attemptsApi.continueCurrentQuestion).mockResolvedValue({
      ...finalSession,
      attemptStatus: 'COMPLETED',
      currentQuestion: null,
      currentOrdinal: null,
      navigator: [
        { ordinal: 1, status: 'COMPLETED' },
        { ordinal: 2, status: 'COMPLETED' },
      ],
      progressVersion: 2,
    });

    const user = userEvent.setup();
    renderView(finalSession);
    await user.click(screen.getByRole('button', { name: /B\.\s*5/ }));
    await user.click(await screen.findByRole('button', { name: 'Nộp' }));
    expect(await screen.findByRole('button', { name: 'Hoàn thành bài thi' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Hoàn thành bài thi' }));
    expect(attemptsApi.continueCurrentQuestion).toHaveBeenCalledTimes(1);
  });
});
