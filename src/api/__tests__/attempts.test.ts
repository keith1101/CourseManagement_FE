import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../client';
import { attemptsApi } from '../attempts';

const rawSession = {
  id: 'attempt-1',
  attemptId: 'attempt-1',
  examId: 'exam-1',
  flowVersion: 2,
  attemptStatus: 'IN_PROGRESS',
  progressVersion: 7,
  totalQuestions: 3,
  currentOrdinal: 2,
  serverNow: '2026-09-11T04:00:00.000Z',
  navigator: [
    { ordinal: 1, status: 'COMPLETED' },
    { ordinal: 2, status: 'ACTIVE' },
    { ordinal: 3, status: 'LOCKED' },
  ],
  currentQuestion: {
    id: 'question-2',
    ordinal: 2,
    status: 'ACTIVE',
    deadlineAt: '2026-09-11T04:01:00.000Z',
    question: {
      id: 'question-2',
      examId: 'exam-1',
      questionType: 'MULTIPLE_CHOICE',
      contentText: 'Which option?',
      questionOptions: [],
    },
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('attemptsApi sequential contract', () => {
  it('submits the current question with the idempotency key and never uses full-exam submit', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        attemptId: 'attempt-1',
        questionId: 'question-2',
        status: 'INCORRECT',
        isCorrect: false,
        timedOut: false,
        progressVersion: 8,
        feedback: {
          questionId: 'question-2',
          isCorrect: false,
          guidance: { text: 'Try again.' },
          explanation: { text: 'The other option is correct.' },
        },
      },
    } as any);
    const answer = {
      questionId: 'question-2',
      progressVersion: 7,
      selectedOptionId: 'option-a',
    };

    await attemptsApi.submitCurrentQuestion('attempt-1', answer, 'submit-key-1');

    expect(post).toHaveBeenCalledWith(
      '/attempts/attempt-1/current-question/submit',
      answer,
      { headers: { 'Idempotency-Key': 'submit-key-1' } },
    );
    expect(post.mock.calls.some(([url]) => String(url).endsWith('/submit'))).toBe(true);
    expect(post.mock.calls.some(([url]) => String(url).endsWith('/current-question/submit') === false)).toBe(false);
  });

  it('sends continue with the current question, progress version, and idempotency key', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: rawSession } as any);

    await attemptsApi.continueCurrentQuestion(
      'attempt-1',
      'question-2',
      8,
      'continue-key-1',
    );

    expect(post).toHaveBeenCalledWith(
      '/attempts/attempt-1/current-question/continue',
      { questionId: 'question-2', progressVersion: 8 },
      { headers: { 'Idempotency-Key': 'continue-key-1' } },
    );
  });

  it('maps a sequential submit response without dropping timeout or feedback fields', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        attemptId: 'attempt-1',
        questionId: 'question-2',
        status: 'TIMED_OUT',
        isCorrect: false,
        timedOut: true,
        progressVersion: 8,
        feedback: {
          questionId: 'question-2',
          isCorrect: false,
          timedOut: true,
          correctTextAnswer: 'four',
          guidance: { text: 'Review the definition.' },
          explanation: 'The answer is four.',
        },
      },
    } as any);

    const result = await attemptsApi.submitCurrentQuestion(
      'attempt-1',
      { questionId: 'question-2', progressVersion: 7, rawValue: 'wrong' },
      'timeout-key-1',
    );

    expect(result).toMatchObject({ status: 'TIMED_OUT', timedOut: true });
    expect((result as any).feedback).toMatchObject({
      timedOut: true,
      correctTextAnswer: 'four',
      guidance: { text: 'Review the definition.' },
      explanation: { text: 'The answer is four.' },
    });
  });
});
