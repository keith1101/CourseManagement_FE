import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExamsManagementPage } from '../ExamsManagementPage';
import { examsApi } from '../../../api/exams';
import { useAuth } from '../../../contexts/AuthContext';
import * as downloadUtil from '../../../utils/download';
import { ToastProvider } from '../../../contexts/ToastContext';
import { Exam, User } from '../../../types';

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
    createExam: vi.fn(),
    updateExam: vi.fn(),
    publishExam: vi.fn(),
    deleteExam: vi.fn(),
    exportExamPdf: vi.fn(),
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

const mockStudentUser: User = {
  id: 'student-1',
  email: 'student@test.com',
  fullName: 'Học Sinh',
  role: 'STUDENT',
  accessLevel: 'FREE',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const sampleExams: Exam[] = [
  {
    id: 'exam-1',
    title: 'Đề thi Toán Học Kỳ 1',
    description: 'Đề thi trắc nghiệm Toán',
    accessLevel: 'FREE',
    status: 'PUBLISHED',
    durationMinutes: 45,
    totalPoints: 10,
    passingScore: 5,
    questionsCount: 20,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'exam-2',
    title: 'Đề thi Vật Lý Nâng Cao',
    description: 'Đề thi trắc nghiệm Lý',
    accessLevel: 'PRO',
    status: 'DRAFT',
    durationMinutes: 60,
    totalPoints: 10,
    passingScore: 5,
    questionsCount: 15,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const renderComponent = () => {
  return render(
    <ToastProvider>
      <ExamsManagementPage />
    </ToastProvider>
  );
};

describe('ExamsManagementPage - Export Exam PDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(examsApi.getExams).mockResolvedValue(sampleExams);
  });

  it('renders "Xuất PDF" button for users with role ADMIN', async () => {
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

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Toán Học Kỳ 1')).toBeInTheDocument();
    });

    const exportButtons = screen.getAllByRole('button', { name: /Xuất PDF/i });
    expect(exportButtons.length).toBe(sampleExams.length);
  });

  it('does NOT render "Xuất PDF" button for users without ADMIN role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockStudentUser,
      token: 'student-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Toán Học Kỳ 1')).toBeInTheDocument();
    });

    const exportButtons = screen.queryAllByRole('button', { name: /Xuất PDF/i });
    expect(exportButtons.length).toBe(0);
  });

  it('successfully triggers exportExamPdf, downloads file, and does not show answers on UI', async () => {
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

    const downloadSpy = vi.spyOn(downloadUtil, 'downloadBlob').mockImplementation(() => {});
    const fakeBlob = new Blob(['%PDF-1.4 test blob'], { type: 'application/pdf' });
    vi.mocked(examsApi.exportExamPdf).mockResolvedValueOnce({
      blob: fakeBlob,
      filename: 'De_thi_Toan_HK1.pdf',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Toán Học Kỳ 1')).toBeInTheDocument();
    });

    const exportButtons = screen.getAllByRole('button', { name: /Xuất PDF/i });
    fireEvent.click(exportButtons[0]);

    await waitFor(() => {
      expect(examsApi.exportExamPdf).toHaveBeenCalledWith('exam-1');
      expect(downloadSpy).toHaveBeenCalledWith(fakeBlob, 'De_thi_Toan_HK1.pdf');
    });

    // Ensure answers are NOT displayed on UI
    expect(screen.queryByText(/Đáp án/i)).toBeNull();
    expect(screen.queryByText(/Giải thích chi tiết/i)).toBeNull();
  });

  it('disables button and shows "Đang tạo PDF..." while downloading, and prevents duplicate calls', async () => {
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

    let resolveExport: (val: any) => void;
    const exportPromise = new Promise((resolve) => {
      resolveExport = resolve;
    });
    vi.mocked(examsApi.exportExamPdf).mockReturnValueOnce(exportPromise as any);
    const downloadSpy = vi.spyOn(downloadUtil, 'downloadBlob').mockImplementation(() => {});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Toán Học Kỳ 1')).toBeInTheDocument();
    });

    const exportButtons = screen.getAllByRole('button', { name: /Xuất PDF/i });
    const firstButton = exportButtons[0];

    fireEvent.click(firstButton);

    // During loading:
    expect(screen.getByText('Đang tạo PDF...')).toBeInTheDocument();
    expect(firstButton).toBeDisabled();

    // Clicking again while in flight should be blocked
    fireEvent.click(firstButton);
    expect(examsApi.exportExamPdf).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolveExport!({ blob: new Blob([]), filename: 'exam.pdf' });

    await waitFor(() => {
      expect(screen.queryByText('Đang tạo PDF...')).toBeNull();
      expect(screen.getAllByRole('button', { name: /Xuất PDF/i })[0]).not.toBeDisabled();
    });
  });

  it('displays "Bạn không có quyền xuất PDF." on 401 and 403 errors', async () => {
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

    vi.mocked(examsApi.exportExamPdf).mockRejectedValueOnce({
      response: { status: 403, data: { message: 'Forbidden' } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Toán Học Kỳ 1')).toBeInTheDocument();
    });

    const exportButtons = screen.getAllByRole('button', { name: /Xuất PDF/i });
    fireEvent.click(exportButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Bạn không có quyền xuất PDF.')).toBeInTheDocument();
    });
  });

  it('displays "Bạn không có quyền xuất PDF." on 401 error', async () => {
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

    vi.mocked(examsApi.exportExamPdf).mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Unauthorized' } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Toán Học Kỳ 1')).toBeInTheDocument();
    });

    const exportButtons = screen.getAllByRole('button', { name: /Xuất PDF/i });
    fireEvent.click(exportButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Bạn không có quyền xuất PDF.')).toBeInTheDocument();
    });
  });

  it('displays "Không thể xuất PDF. Vui lòng thử lại." on other errors (500, network error)', async () => {
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

    vi.mocked(examsApi.exportExamPdf).mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Internal Server Error' } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Toán Học Kỳ 1')).toBeInTheDocument();
    });

    const exportButtons = screen.getAllByRole('button', { name: /Xuất PDF/i });
    fireEvent.click(exportButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Không thể xuất PDF. Vui lòng thử lại.')).toBeInTheDocument();
    });
  });
});
