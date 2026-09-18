import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentDashboardPage } from '../StudentDashboardPage';
import { examsApi } from '../../../api/exams';
import { assignmentsApi } from '../../../api/assignments';
import { attemptsApi } from '../../../api/attempts';
import { useAuth } from '../../../contexts/AuthContext';
import { Assignment, Exam, ExamAttempt, User } from '../../../types';
import { ToastProvider } from '../../../contexts/ToastContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../api/exams', () => ({
  examsApi: {
    getExams: vi.fn(),
  },
}));

vi.mock('../../../api/assignments', () => ({
  assignmentsApi: {
    getMyAssignments: vi.fn(),
  },
}));

vi.mock('../../../api/attempts', () => ({
  attemptsApi: {
    getMyAttempts: vi.fn(),
  },
}));

describe('StudentDashboardPage Component', () => {
  const freeStudent: User = {
    id: 'student-free-1',
    email: 'free@test.com',
    fullName: 'Nguyễn Văn A',
    role: 'STUDENT',
    accessLevel: 'FREE',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const proStudent: User = {
    ...freeStudent,
    id: 'student-pro-1',
    accessLevel: 'PRO',
    proExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  };

  const mockFreeExam: Exam = {
    id: 'exam-free-1',
    title: 'Đề thi Toán đại cương (FREE)',
    description: 'Đề thi miễn phí mở cho toàn bộ học sinh',
    accessLevel: 'FREE',
    status: 'PUBLISHED',
    durationMinutes: 45,
    totalPoints: 10,
    passingScore: 5.0,
    subjectId: 'subj-math',
    subject: { id: 'subj-math', name: 'Toán học', code: 'MATH101', description: '', order: 1, isActive: true, createdAt: '', updatedAt: '' },
    questionsCount: 20,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockProExam: Exam = {
    id: 'exam-pro-1',
    title: 'Đề thi Vật lý nâng cao (PRO)',
    description: 'Đề thi chuyên sâu dành cho học sinh PRO',
    accessLevel: 'PRO',
    status: 'PUBLISHED',
    durationMinutes: 60,
    totalPoints: 10,
    passingScore: 5.0,
    subjectId: 'subj-phys',
    subject: { id: 'subj-phys', name: 'Vật lý', code: 'PHYS101', description: '', order: 2, isActive: true, createdAt: '', updatedAt: '' },
    questionsCount: 30,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockPendingAssignment: Assignment = {
    id: 'assign-pending-1',
    studentId: 'student-free-1',
    examId: mockFreeExam.id,
    exam: mockFreeExam,
    status: 'PENDING',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockOverdueAssignment: Assignment = {
    id: 'assign-overdue-1',
    studentId: 'student-free-1',
    examId: 'exam-free-2',
    exam: {
      ...mockFreeExam,
      id: 'exam-free-2',
      title: 'Bài tập Hóa học đã hết hạn',
    },
    status: 'OVERDUE',
    dueDate: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockAttempts: ExamAttempt[] = [
    {
      id: 'att-1',
      examId: mockFreeExam.id,
      studentId: 'student-free-1',
      exam: mockFreeExam,
      status: 'COMPLETED',
      score: 8.5,
      startedAt: '2026-02-01T10:00:00Z',
      submittedAt: '2026-02-01T10:40:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: freeStudent });
    (examsApi.getExams as any).mockResolvedValue([mockFreeExam, mockProExam]);
    (assignmentsApi.getMyAssignments as any).mockResolvedValue([
      mockPendingAssignment,
      mockOverdueAssignment,
    ]);
    (attemptsApi.getMyAttempts as any).mockResolvedValue(mockAttempts);
  });

  const renderPage = () =>
    render(
      <ToastProvider>
        <StudentDashboardPage />
      </ToastProvider>
    );

  it('fetches both exams, assignments, and attempts on mount', async () => {
    renderPage();

    await waitFor(() => {
      expect(examsApi.getExams).toHaveBeenCalledTimes(1);
      expect(assignmentsApi.getMyAssignments).toHaveBeenCalledTimes(1);
      expect(attemptsApi.getMyAttempts).toHaveBeenCalledTimes(1);
    });

    // Check header greeting
    expect(screen.getByText(/Chào mừng trở lại, Nguyễn Văn A!/i)).toBeInTheDocument();
  });

  it('allows Student FREE to see published FREE exam and click "Làm bài" without assignmentId', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Đề thi Toán đại cương (FREE)').length).toBeGreaterThanOrEqual(1);
    });

    // Find the card for mockFreeExam in the Public Exams section (first card)
    const examCardTitle = screen.getAllByText('Đề thi Toán đại cương (FREE)')[0];
    const cardContainer = examCardTitle.closest('.card') || examCardTitle.parentElement?.parentElement;
    expect(cardContainer).not.toBeNull();

    // The button should be "Làm bài" and enabled
    const startButton = cardContainer?.querySelector('button');
    expect(startButton).toHaveTextContent('Làm bài');
    expect(startButton).not.toBeDisabled();

    // Click "Làm bài"
    fireEvent.click(startButton!);

    // Must navigate directly to /student/exams/:examId/take without assignmentId
    expect(mockNavigate).toHaveBeenCalledWith(`/student/exams/${mockFreeExam.id}/take`);
  });

  it('shows locked UI / upgrade modal for Student FREE when viewing PRO exam', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Vật lý nâng cao (PRO)')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByRole('button', { name: /nâng cấp để làm bài/i });
    expect(upgradeButton).toHaveTextContent('Nâng cấp để làm bài');

    // Clicking opens UpgradeModal
    fireEvent.click(upgradeButton);

    // Modal with title should be in document
    await waitFor(() => {
      expect(screen.getByText('Bài thi dành riêng cho tài khoản PRO')).toBeInTheDocument();
    });
  });

  it('allows Student PRO to take both FREE and PRO exams', async () => {
    (useAuth as any).mockReturnValue({ user: proStudent });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Vật lý nâng cao (PRO)')).toBeInTheDocument();
    });

    // Both exams should have "Làm bài"
    const buttons = screen.getAllByRole('button', { name: /làm bài/i });
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // Click PRO exam "Làm bài"
    const proExamTitle = screen.getByText('Đề thi Vật lý nâng cao (PRO)');
    const cardContainer = proExamTitle.closest('.card') || proExamTitle.parentElement?.parentElement;
    const proButton = cardContainer?.querySelector('button');

    expect(proButton).toHaveTextContent('Làm bài');
    fireEvent.click(proButton!);

    expect(mockNavigate).toHaveBeenCalledWith(`/student/exams/${mockProExam.id}/take`);
  });

  it('keeps Assignment section separate and disables overdue assignments', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bài Thi Được Giao Cần Làm')).toBeInTheDocument();
      expect(screen.getByText('Bài tập Hóa học đã hết hạn')).toBeInTheDocument();
    });

    // The overdue assignment button should be disabled and say "Đã quá hạn"
    const overdueButton = screen.getByRole('button', { name: /đã quá hạn/i });
    expect(overdueButton).toBeDisabled();

    // Clicking does not navigate
    fireEvent.click(overdueButton);
    expect(mockNavigate).not.toHaveBeenCalled();

    // The pending assignment button should navigate WITH assignmentId
    const pendingCards = screen.getAllByText('Đề thi Toán đại cương (FREE)');
    // The second one is in the assignments section
    const assignmentCard = pendingCards[1].closest('.card');
    const startAssignButton = assignmentCard?.querySelector('button');

    expect(startAssignButton).toHaveTextContent('Bắt đầu làm bài');
    fireEvent.click(startAssignButton!);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/student/exams/${mockFreeExam.id}/take?assignmentId=${encodeURIComponent(mockPendingAssignment.id)}`
    );
  });
});
