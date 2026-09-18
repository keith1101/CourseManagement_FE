import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { attemptsApi } from '../../../api/attempts';
import { ToastProvider } from '../../../contexts/ToastContext';
import { SequentialExamTakingView } from '../SequentialExamTakingView';
import { Question, SequentialSession } from '../../../types';

vi.mock('../../../api/attempts', () => ({
  attemptsApi: {
    getSequentialSession: vi.fn(),
    submitCurrentQuestion: vi.fn(),
    expireCurrentQuestion: vi.fn(),
    continueCurrentQuestion: vi.fn(),
  },
}));

const multiPartQuestion: Question = {
  id: 'q-multi-1',
  examId: 'exam-1',
  subjectId: 'subject-1',
  content: 'Vui lòng tính toán các thông số sau:',
  instruction: 'Điền đáp án cho từng ý',
  type: 'MULTI_PART_SHORT_ANSWER',
  points: 2,
  timeLimit: 180,
  order: 0,
  options: [],
  questionParts: [
    { id: 'part-1', contentText: 'BMI của học sinh là:', position: 0 },
    { id: 'part-2', contentText: 'Phân loại tình trạng cơ thể:', position: 1 },
  ],
};

const makeMultiPartSession = (overrides: Partial<SequentialSession['currentQuestion']> = {}): SequentialSession => {
  const serverNow = new Date().toISOString();
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
      id: multiPartQuestion.id,
      ordinal: 1,
      status: 'ACTIVE',
      activatedAt: serverNow,
      deadlineAt: new Date(Date.now() + 180_000).toISOString(),
      advanceAfter: null,
      question: multiPartQuestion,
      ...overrides,
    },
  };
};

const renderView = (initialSession: SequentialSession) =>
  render(
    <ToastProvider>
      <SequentialExamTakingView
        attemptId={initialSession.attemptId}
        initialSession={initialSession}
        examTitle="Multi-part test exam"
      />
    </ToastProvider>,
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SequentialExamTakingView with MULTI_PART_SHORT_ANSWER', () => {
  it('renders inputs for each part and submits payload containing parts array', async () => {
    const user = userEvent.setup();
    const session = makeMultiPartSession();

    vi.mocked(attemptsApi.submitCurrentQuestion).mockResolvedValue({
      attemptId: 'attempt-1',
      questionId: 'q-multi-1',
      status: 'INCORRECT',
      isCorrect: false,
      timedOut: false,
      progressVersion: 1,
      feedback: {
        questionId: 'q-multi-1',
        isCorrect: false,
        parts: [
          { partId: 'part-1', isCorrect: true },
          { partId: 'part-2', isCorrect: false, correctAnswer: 'overweight' },
        ],
      },
    });

    renderView(session);

    // Verify part headers
    expect(screen.getByText(/BMI của học sinh là:/)).toBeInTheDocument();
    expect(screen.getByText(/Phân loại tình trạng cơ thể:/)).toBeInTheDocument();

    const inputs = screen.getAllByPlaceholderText('Nhập câu trả lời cho ý này...');
    expect(inputs).toHaveLength(2);

    // Fill in answers for both parts
    await user.type(inputs[0], '20.0');
    await user.type(inputs[1], 'normal');

    const submitBtn = screen.getByRole('button', { name: 'Nộp' });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    // Verify payload sent
    expect(attemptsApi.submitCurrentQuestion).toHaveBeenCalledWith(
      'attempt-1',
      {
        questionId: 'q-multi-1',
        progressVersion: 0,
        parts: [
          { partId: 'part-1', rawValue: '20.0' },
          { partId: 'part-2', rawValue: 'normal' },
        ],
      },
      expect.any(String),
    );

    // Verify feedback rendering
    await waitFor(() => {
      // Part 1 is correct
      expect(screen.getByText('Chính xác')).toBeInTheDocument();
      // Part 2 is incorrect
      expect(screen.getByText('Chưa chính xác')).toBeInTheDocument();
      // Correct answer is displayed for part 2
      expect(screen.getByText('overweight')).toBeInTheDocument();
      // Continue button is displayed
      expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeInTheDocument();
    });
  });

  it('reconstructs feedback when session is loaded with existing feedback', async () => {
    const sessionWithFeedback = makeMultiPartSession({
      status: 'INCORRECT',
      feedback: {
        questionId: 'q-multi-1',
        isCorrect: false,
        parts: [
          { partId: 'part-1', isCorrect: true },
          { partId: 'part-2', isCorrect: false, correctAnswer: 'overweight' },
        ],
      },
    });

    renderView(sessionWithFeedback);

    expect(screen.getByText('Chính xác')).toBeInTheDocument();
    expect(screen.getByText('Chưa chính xác')).toBeInTheDocument();
    expect(screen.getByText('overweight')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeInTheDocument();
  });
});
