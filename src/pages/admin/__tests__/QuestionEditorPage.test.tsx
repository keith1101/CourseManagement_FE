import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionEditorPage } from '../QuestionEditorPage';
import { examsApi } from '../../../api/exams';
import { questionsApi } from '../../../api/questions';
import { subjectsApi } from '../../../api/subjects';
import { useAuth } from '../../../contexts/AuthContext';
import * as downloadUtil from '../../../utils/download';
import { ToastProvider } from '../../../contexts/ToastContext';
import { Exam, Question, Subject, User } from '../../../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ examId: 'exam-123' }),
  };
});

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../api/exams', () => ({
  examsApi: {
    getExamById: vi.fn(),
    exportExamPdf: vi.fn(),
  },
}));

vi.mock('../../../api/questions', () => ({
  questionsApi: {
    getQuestionsByExam: vi.fn(),
  },
}));

vi.mock('../../../api/subjects', () => ({
  subjectsApi: {
    getSubjects: vi.fn(),
  },
}));

const mockAdminUser: User = {
  id: 'admin-1',
  email: 'admin@test.com',
  fullName: 'Quản Trị Viên',
  role: 'ADMIN',
  accessLevel: 'PRO',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockExam: Exam = {
  id: 'exam-123',
  title: 'Đề thi Hoá Học',
  description: 'Mô tả đề thi',
  accessLevel: 'FREE',
  status: 'PUBLISHED',
  durationMinutes: 45,
  totalPoints: 10,
  passingScore: 5,
  questionsCount: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockQuestions: Question[] = [
  {
    id: 'q-1',
    examId: 'exam-123',
    subjectId: 'sub-1',
    content: 'Chất nào sau đây là kim loại kiềm?',
    type: 'SINGLE_CHOICE',
    points: 1,
    timeLimit: 30,
    order: 0,
    options: [
      { id: 'opt-1', label: 'A', content: 'Natri', isCorrect: true },
      { id: 'opt-2', label: 'B', content: 'Sắt', isCorrect: false },
    ],
  },
];

const mockSubjects: Subject[] = [
  {
    id: 'sub-1',
    code: 'CHEM',
    name: 'Hoá Học',
    description: '',
    order: 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('QuestionEditorPage - Export Exam PDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(examsApi.getExamById).mockResolvedValue(mockExam);
    vi.mocked(questionsApi.getQuestionsByExam).mockResolvedValue(mockQuestions);
    vi.mocked(subjectsApi.getSubjects).mockResolvedValue(mockSubjects);
    vi.mocked(useAuth).mockReturnValue({
      user: mockAdminUser,
      token: 'admin-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('renders "Xuất PDF" button in EditorHeader for admin', async () => {
    render(
      <ToastProvider>
        <QuestionEditorPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Đề thi Hoá Học')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Xuất PDF/i });
    expect(exportBtn).toBeInTheDocument();
  });

  it('calls exportExamPdf, downloads file, and disables button with "Đang tạo PDF..." while exporting', async () => {
    const downloadSpy = vi.spyOn(downloadUtil, 'downloadBlob').mockImplementation(() => {});
    const fakeBlob = new Blob(['%PDF fake content'], { type: 'application/pdf' });

    let resolveExport: (val: any) => void;
    const exportPromise = new Promise((resolve) => {
      resolveExport = resolve;
    });
    vi.mocked(examsApi.exportExamPdf).mockReturnValueOnce(exportPromise as any);

    render(
      <ToastProvider>
        <QuestionEditorPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Đề thi Hoá Học')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Xuất PDF/i });
    fireEvent.click(exportBtn);

    expect(screen.getByText('Đang tạo PDF...')).toBeInTheDocument();
    expect(exportBtn).toBeDisabled();

    // Duplicate click blocked
    fireEvent.click(exportBtn);
    expect(examsApi.exportExamPdf).toHaveBeenCalledTimes(1);

    resolveExport!({ blob: fakeBlob, filename: 'De_thi_Hoa_Hoc.pdf' });

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(fakeBlob, 'De_thi_Hoa_Hoc.pdf');
      expect(screen.getByRole('button', { name: /Xuất PDF/i })).not.toBeDisabled();
    });
  });

  it('handles 403 error by showing "Bạn không có quyền xuất PDF."', async () => {
    vi.mocked(examsApi.exportExamPdf).mockRejectedValueOnce({
      response: { status: 403 },
    });

    render(
      <ToastProvider>
        <QuestionEditorPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Đề thi Hoá Học')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Xuất PDF/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText('Bạn không có quyền xuất PDF.')).toBeInTheDocument();
    });
  });
});
