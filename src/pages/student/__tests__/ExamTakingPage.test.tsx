import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamTakingPage } from '../ExamTakingPage';
import { attemptsApi } from '../../../api/attempts';
import { examsApi } from '../../../api/exams';
import { questionsApi } from '../../../api/questions';
import { Exam, ExamAttempt, Question } from '../../../types';
import { ToastProvider } from '../../../contexts/ToastContext';

const mockNavigate = vi.fn();
let mockParams = { examId: 'exam-1', attemptId: undefined as string | undefined };
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useSearchParams: () => [mockSearchParams],
  };
});

vi.mock('../../../api/attempts', () => ({
  attemptsApi: {
    startAttempt: vi.fn(),
    getAttempt: vi.fn(),
    saveAnswer: vi.fn(),
    submitAttempt: vi.fn(),
    getSequentialSession: vi.fn(),
  },
}));

vi.mock('../../../api/exams', () => ({
  examsApi: {
    getExamById: vi.fn(),
  },
}));

vi.mock('../../../api/questions', () => ({
  questionsApi: {
    getQuestionsByExam: vi.fn(),
  },
}));

describe('ExamTakingPage - MULTI_PART_SHORT_ANSWER support', () => {
  const multiPartQuestion: Question = {
    id: 'q-multi-1',
    examId: 'exam-1',
    subjectId: 'subj-1',
    content: 'Tính các thông số cơ bản:',
    type: 'MULTI_PART_SHORT_ANSWER',
    points: 2,
    timeLimit: 300,
    order: 0,
    options: [],
    questionParts: [
      { id: 'part-1', contentText: 'Ý a) BMI:', position: 0 },
      { id: 'part-2', contentText: 'Ý b) Tình trạng:', position: 1 },
    ],
  };

  const sampleExam: Exam = {
    id: 'exam-1',
    title: 'Bài thi Khoa học',
    durationMinutes: 45,
    totalPoints: 10,
    passingScore: 5,
    status: 'PUBLISHED',
    accessLevel: 'FREE',
    questionsCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const sampleAttempt: ExamAttempt = {
    id: 'attempt-123',
    examId: 'exam-1',
    studentId: 'student-1',
    status: 'IN_PROGRESS',
    startedAt: '2026-01-01T00:00:00Z',
    flowVersion: 1,
    answers: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { examId: 'exam-1', attemptId: undefined };
    mockSearchParams = new URLSearchParams();

    vi.mocked(examsApi.getExamById).mockResolvedValue(sampleExam);
    vi.mocked(questionsApi.getQuestionsByExam).mockResolvedValue([multiPartQuestion]);
    vi.mocked(attemptsApi.startAttempt).mockResolvedValue(sampleAttempt);
    vi.mocked(attemptsApi.saveAnswer).mockResolvedValue({
      questionId: 'q-multi-1',
      isCorrect: true,
      parts: [
        { partId: 'part-1', isCorrect: true },
        { partId: 'part-2', isCorrect: true },
      ],
    } as any);
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <ExamTakingPage />
      </ToastProvider>,
    );

  it('gửi đúng payload parts khi nộp câu multi-part và không chứa selectedOptionId/textAnswer', async () => {
    const user = userEvent.setup();
    renderComponent();

    expect(await screen.findByText('Tính các thông số cơ bản:')).toBeInTheDocument();
    expect(screen.getByText(/Ý a\) BMI:/)).toBeInTheDocument();
    expect(screen.getByText(/Ý b\) Tình trạng:/)).toBeInTheDocument();

    const inputs = screen.getAllByPlaceholderText('Nhập câu trả lời cho ý này...');
    expect(inputs).toHaveLength(2);

    await user.type(inputs[0], '22.5');
    await user.type(inputs[1], 'Bình thường');

    // Click "Nộp bài thi" to open modal, then submit current question
    const openModalBtn = screen.getByRole('button', { name: /Nộp bài thi/i });
    await user.click(openModalBtn);

    const submitQuestionBtn = await screen.findByRole('button', { name: /Nộp câu hiện tại/i });
    await user.click(submitQuestionBtn);

    await waitFor(() => {
      expect(attemptsApi.saveAnswer).toHaveBeenCalledTimes(1);
    });

    expect(attemptsApi.saveAnswer).toHaveBeenCalledWith('attempt-123', {
      questionId: 'q-multi-1',
      parts: [
        { partId: 'part-1', rawValue: '22.5' },
        { partId: 'part-2', rawValue: 'Bình thường' },
      ],
      timedOut: false,
      finalize: true,
    });
  });

  it('không cho nộp thủ công khi thiếu một ý và hiển thị thông báo lỗi', async () => {
    const user = userEvent.setup();
    renderComponent();

    expect(await screen.findByText('Tính các thông số cơ bản:')).toBeInTheDocument();

    const inputs = screen.getAllByPlaceholderText('Nhập câu trả lời cho ý này...');
    // Only fill part 1, leave part 2 blank
    await user.type(inputs[0], '22.5');

    const openModalBtn = screen.getByRole('button', { name: /Nộp bài thi/i });
    await user.click(openModalBtn);

    const submitQuestionBtn = await screen.findByRole('button', { name: /Nộp câu hiện tại/i });
    await user.click(submitQuestionBtn);

    // saveAnswer must NOT be called
    expect(attemptsApi.saveAnswer).not.toHaveBeenCalled();

    // Error toast should appear
    expect(
      await screen.findByText('Vui lòng điền đầy đủ câu trả lời cho tất cả các ý.'),
    ).toBeInTheDocument();
  });

  it('khôi phục câu trả lời multi-part từ backend khi mở lại attempt chưa hoàn thành', async () => {
    mockParams = { examId: 'exam-1', attemptId: 'attempt-123' };

    vi.mocked(attemptsApi.getAttempt).mockResolvedValue({
      ...sampleAttempt,
      answers: [
        {
          questionId: 'q-multi-1',
          parts: [
            { partId: 'part-1', rawValue: '18.5' },
            { partId: 'part-2', rawValue: 'Hơi gầy' },
          ],
        },
      ],
    });

    renderComponent();

    expect(await screen.findByText('Tính các thông số cơ bản:')).toBeInTheDocument();

    const inputs = screen.getAllByPlaceholderText('Nhập câu trả lời cho ý này...');
    expect(inputs[0]).toHaveValue('18.5');
    expect(inputs[1]).toHaveValue('Hơi gầy');
  });

  it('lưu tất cả câu multi-part chưa nộp khi nộp toàn bài', async () => {
    const user = userEvent.setup();
    vi.mocked(attemptsApi.submitAttempt).mockResolvedValue({
      ...sampleAttempt,
      status: 'COMPLETED',
    });

    renderComponent();

    expect(await screen.findByText('Tính các thông số cơ bản:')).toBeInTheDocument();

    const inputs = screen.getAllByPlaceholderText('Nhập câu trả lời cho ý này...');
    await user.type(inputs[0], '25.0');
    await user.type(inputs[1], 'Thừa cân');

    // Click Nộp bài thi -> Click Nộp toàn bài
    const openModalBtn = screen.getByRole('button', { name: /Nộp bài thi/i });
    await user.click(openModalBtn);

    const submitExamBtn = await screen.findByRole('button', { name: /Nộp cả đề thi/i });
    await user.click(submitExamBtn);

    await waitFor(() => {
      expect(attemptsApi.saveAnswer).toHaveBeenCalledWith('attempt-123', {
        questionId: 'q-multi-1',
        parts: [
          { partId: 'part-1', rawValue: '25.0' },
          { partId: 'part-2', rawValue: 'Thừa cân' },
        ],
        timedOut: false,
        finalize: true,
      });
      expect(attemptsApi.submitAttempt).toHaveBeenCalledWith('attempt-123');
    });
  });
});
