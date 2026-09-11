import { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  MOCK_USERS,
  MOCK_SUBJECTS,
  MOCK_EXAMS,
  MOCK_QUESTIONS_EXAM_1,
  MOCK_ASSIGNMENTS,
  MOCK_MATERIALS,
  MOCK_ATTEMPTS,
} from './mockData';
import {
  Exam,
  Question,
  Subject,
  Material,
  Assignment,
  User,
  ExamAttempt,
  SequentialQuestionStatus,
} from '../types';
import { isProActive } from '../utils/access';

const nowIso = () => new Date().toISOString();

let usersState: User[] = [...MOCK_USERS];
let subjectsState: Subject[] = [...MOCK_SUBJECTS];
let examsState: Exam[] = [...MOCK_EXAMS];
let questionsState: Record<string, Question[]> = {
  'exam-1': [...MOCK_QUESTIONS_EXAM_1],
  'exam-2': [
    {
      id: 'q-phys-1',
      examId: 'exam-2',
      subjectId: 'subj-phys',
      content: 'Một sóng cơ lan truyền trong môi trường với tốc độ v = 2 m/s, tần số f = 10 Hz. Bước sóng λ có giá trị bằng:',
      type: 'SINGLE_CHOICE',
      points: 2.5,
      timeLimit: 45,
      order: 0,
      explanation: 'λ = v / f = 2 / 10 = 0.2 m = 20 cm.',
      options: [
        { id: 'opt-p1-a', label: 'A', content: '20 cm', isCorrect: true },
        { id: 'opt-p1-b', label: 'B', content: '5 cm', isCorrect: false },
        { id: 'opt-p1-c', label: 'C', content: '2 cm', isCorrect: false },
        { id: 'opt-p1-d', label: 'D', content: '50 cm', isCorrect: false },
      ],
    },
    {
      id: 'q-phys-2',
      examId: 'exam-2',
      subjectId: 'subj-phys',
      content: 'Khoảng cách giữa hai nút sóng liên tiếp trên một sợi dây có sóng dừng là:',
      type: 'SINGLE_CHOICE',
      points: 2.5,
      timeLimit: 30,
      order: 1,
      explanation: 'Khoảng cách giữa 2 nút sóng (hoặc 2 bụng sóng) liên tiếp là λ / 2.',
      options: [
        { id: 'opt-p2-a', label: 'A', content: 'λ / 2', isCorrect: true },
        { id: 'opt-p2-b', label: 'B', content: 'λ', isCorrect: false },
        { id: 'opt-p2-c', label: 'C', content: 'λ / 4', isCorrect: false },
        { id: 'opt-p2-d', label: 'D', content: '2λ', isCorrect: false },
      ],
    },
  ],
};
let assignmentsState: Assignment[] = [...MOCK_ASSIGNMENTS];
let materialsState: Material[] = [...MOCK_MATERIALS];
let attemptsState: ExamAttempt[] = [...MOCK_ATTEMPTS];

type MockSequentialAnswer = {
  selectedOptionId?: string;
  rawValue?: string;
  answerType?: 'TEXT' | 'NUMBER';
  normalizedText?: string;
  content?: string;
  numericValue?: number;
  submittedAt?: string | null;
  timedOut?: boolean;
};

type MockSequentialAttempt = {
  attempt: ExamAttempt;
  questions: Question[];
  statuses: SequentialQuestionStatus[];
  currentIndex: number;
  progressVersion: number;
  answers: Record<string, MockSequentialAnswer>;
  feedback: Record<string, any>;
  activatedAt: Record<string, string>;
  deadlines: Record<string, string | null>;
  advanceAfter: Record<string, string | null>;
  submissionKeys: Record<string, any>;
};

const sequentialAttempts = new Map<string, MockSequentialAttempt>();

const mockSequentialEnabled = () =>
  (import.meta.env.VITE_SEQUENTIAL_EXAM_FLOW ?? import.meta.env.SEQUENTIAL_EXAM_FLOW_ENABLED) === 'true';

const mockAnswerValue = (data: any): MockSequentialAnswer => ({
  selectedOptionId: data.selectedOptionId || undefined,
  rawValue: data.rawValue ?? data.textAnswer ?? undefined,
  answerType: data.answerType,
  normalizedText: data.normalizedText,
  content: data.content,
  numericValue: data.numericValue,
});

const mockSequentialFeedback = (question: Question, isCorrect: boolean, timedOut: boolean) => {
  if (isCorrect) return { questionId: question.id, isCorrect: true, timedOut: false };
  const correctOption = question.options?.find((option) => option.isCorrect);
  return {
    questionId: question.id,
    isCorrect: false,
    timedOut,
    correctOptionId: correctOption?.id,
    correctAnswer: correctOption
      ? { id: correctOption.id, content: correctOption.content }
      : undefined,
    guidance: { text: question.hint || null, image: question.hintImage || null },
    explanation: { text: question.explanation || null, image: question.explanationImage || null },
  };
};

// Keep the mock contract aligned with the student-facing backend allowlist.
// Grading fields stay in memory and are only returned as feedback after a
// submit/timeout.
const mockStudentQuestion = (question: Question): Question => {
  const {
    explanation: _explanation,
    explanationImage: _explanationImage,
    correctTextAnswer: _correctTextAnswer,
    options,
    ...safeQuestion
  } = question;
  return {
    ...safeQuestion,
    options: (options || []).map(({ isCorrect: _isCorrect, ...option }) => option),
  };
};

const mockSequentialSession = (state: MockSequentialAttempt) => {
  const currentQuestion = state.currentIndex >= 0 ? state.questions[state.currentIndex] : undefined;
  const currentStatus = state.currentIndex >= 0 ? state.statuses[state.currentIndex] : undefined;
  return {
    id: state.attempt.id,
    attemptId: state.attempt.id,
    userId: state.attempt.studentId,
    examId: state.attempt.examId,
    flowVersion: 2,
    attemptStatus: state.attempt.status,
    progressVersion: state.progressVersion,
    totalQuestions: state.questions.length,
    startedAt: state.attempt.startedAt,
    currentOrdinal: currentQuestion ? state.currentIndex + 1 : null,
    serverNow: nowIso(),
    navigator: state.statuses.map((status, index) => ({ ordinal: index + 1, status })),
    currentQuestion: currentQuestion
      ? {
          id: currentQuestion.id,
          ordinal: state.currentIndex + 1,
          status: currentStatus,
          activatedAt: state.activatedAt[currentQuestion.id] || state.attempt.startedAt,
          deadlineAt: state.deadlines[currentQuestion.id],
          advanceAfter: state.advanceAfter[currentQuestion.id],
          question: mockStudentQuestion(currentQuestion),
          feedback: state.feedback[currentQuestion.id],
        }
      : null,
    ...(state.attempt.status === 'COMPLETED'
      ? { resultUrl: `/student/attempts/${state.attempt.id}/result` }
      : {}),
  };
};

export const setupMockAdapter = (client: AxiosInstance) => {
  // Use request adapter to intercept all calls before sending to network
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const isMock = (import.meta.env.ENABLE_MOCKS ?? import.meta.env.VITE_ENABLE_MOCKS) === 'true';
    if (!isMock) return config;

    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();
    const data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {};

    const mockResponse = (body: any, status = 200): AxiosResponse => ({
      data: body,
      status,
      statusText: 'OK',
      headers: {},
      config,
    });

    // Simulate small realistic network latency (80ms)
    await new Promise((r) => setTimeout(r, 80));

    // 1. Auth routes
    if (url.includes('/auth/login') && method === 'post') {
      const email = data.email?.toLowerCase().trim() || '';
      const matched = usersState.find((u) => u.email.toLowerCase() === email) || {
        id: `user-${Date.now()}`,
        email,
        fullName: email.includes('admin') ? 'Quản Trị Viên (Mock)' : 'Học Sinh (Mock)',
        role: email.includes('admin') ? ('ADMIN' as const) : ('STUDENT' as const),
        accessLevel: 'PRO' as const,
        status: 'ACTIVE' as const,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      return Promise.reject({
        isMock: true,
        mockResponse: mockResponse({
          accessToken: `mock-token-${matched.id}`,
          user: matched,
        }),
      });
    }

    if (url.includes('/auth/register') && method === 'post') {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: data.email,
        fullName: data.fullName,
        phoneNumber: data.phone,
        role: 'STUDENT',
        accessLevel: 'FREE',
        status: 'ACTIVE',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      usersState.push(newUser);
      return Promise.reject({
        isMock: true,
        mockResponse: mockResponse({
          message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.',
          email: newUser.email,
          verificationRequired: true,
        }),
      });
    }

    if (url.includes('/auth/verify-email') && method === 'post') {
      return Promise.reject({
        isMock: true,
        mockResponse: mockResponse({
          message: 'Email đã được xác nhận. Bạn có thể đăng nhập.',
          email: data.email || 'student@example.com',
        }),
      });
    }

    if (url.includes('/auth/resend-verification') && method === 'post') {
      return Promise.reject({
        isMock: true,
        mockResponse: mockResponse({
          message: 'Nếu tài khoản tồn tại và chưa được xác nhận, email mới đã được gửi.',
        }),
      });
    }

    if (url.includes('/auth/me')) {
      const saved = localStorage.getItem('user_info');
      const current = saved ? JSON.parse(saved) : usersState[1];
      return Promise.reject({
        isMock: true,
        mockResponse: mockResponse(current),
      });
    }

    if (url.includes('/auth/profile') && method === 'patch') {
      const saved = localStorage.getItem('user_info');
      const current = saved ? JSON.parse(saved) : usersState[1];
      const updated = { ...current, ...data, updatedAt: nowIso() };
      localStorage.setItem('user_info', JSON.stringify(updated));
      return Promise.reject({
        isMock: true,
        mockResponse: mockResponse(updated),
      });
    }

    if (url.includes('/auth/change-password')) {
      return Promise.reject({
        isMock: true,
        mockResponse: mockResponse({ message: 'Đổi mật khẩu thành công' }),
      });
    }

    // 2. Subjects routes
    if (url === '/subjects' || url.startsWith('/subjects?')) {
      if (method === 'get') {
        return Promise.reject({ isMock: true, mockResponse: mockResponse(subjectsState) });
      }
      if (method === 'post') {
        const newSub: Subject = {
          id: `subj-${Date.now()}`,
          name: data.name,
          code: data.code,
          description: data.description,
          order: data.order || subjectsState.length + 1,
          isActive: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        subjectsState.push(newSub);
        return Promise.reject({ isMock: true, mockResponse: mockResponse(newSub) });
      }
    }

    if (url.startsWith('/subjects/') && method === 'patch') {
      const id = url.split('/')[2];
      subjectsState = subjectsState.map((s) => (s.id === id ? { ...s, ...data, updatedAt: nowIso() } : s));
      const updated = subjectsState.find((s) => s.id === id);
      return Promise.reject({ isMock: true, mockResponse: mockResponse(updated) });
    }

    if (url.startsWith('/subjects/') && method === 'delete') {
      const id = url.split('/')[2];
      subjectsState = subjectsState.filter((s) => s.id !== id);
      return Promise.reject({ isMock: true, mockResponse: mockResponse({ success: true }) });
    }

    // 3. Exams routes
    if (url === '/exams' || url.startsWith('/exams?')) {
      if (method === 'get') {
        const savedUser = localStorage.getItem('user_info');
        const currentUser = savedUser
          ? usersState.find((user) => user.id === JSON.parse(savedUser).id)
          : undefined;
        const visibleExams =
          currentUser?.role === 'ADMIN'
            ? examsState
            : examsState.filter((exam) => {
                if (exam.status !== 'PUBLISHED') return false;
                if (isProActive(currentUser)) return true;
                return (
                  exam.accessLevel === 'FREE' &&
                  assignmentsState.some(
                    (assignment) =>
                      assignment.studentId === currentUser?.id &&
                      assignment.examId === exam.id &&
                      !assignment.deletedAt,
                  )
                );
              });
        return Promise.reject({ isMock: true, mockResponse: mockResponse(visibleExams) });
      }
      if (method === 'post') {
        const newExam: Exam = {
          id: `exam-${Date.now()}`,
          title: data.title,
          description: data.description,
          accessLevel: data.accessLevel || 'FREE',
          durationMinutes: data.durationMinutes || 45,
          passingScore: data.passingScore || 5.0,
          totalPoints: 10,
          status: 'DRAFT',
          subjectId: data.subjectId || subjectsState[0]?.id,
          subject: subjectsState.find((s) => s.id === data.subjectId) || subjectsState[0],
          questionsCount: 0,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        examsState.unshift(newExam);
        questionsState[newExam.id] = [];
        return Promise.reject({ isMock: true, mockResponse: mockResponse(newExam) });
      }
    }

    if (url.startsWith('/exams/') && method === 'get' && !url.includes('/questions')) {
      const id = url.split('/')[2];
      const exam = examsState.find((e) => e.id === id) || examsState[0];
      const savedUser = localStorage.getItem('user_info');
      const currentUser = savedUser
        ? usersState.find((user) => user.id === JSON.parse(savedUser).id)
        : undefined;
      const hasAssignment = assignmentsState.some(
        (assignment) =>
          assignment.studentId === currentUser?.id &&
          assignment.examId === id &&
          !assignment.deletedAt,
      );
      if (
        currentUser?.role === 'STUDENT' &&
        (!exam || exam.status !== 'PUBLISHED' ||
          (!isProActive(currentUser) && (exam.accessLevel !== 'FREE' || !hasAssignment)))
      ) {
        return Promise.reject({
          isMock: true,
          mockResponse: mockResponse({ message: 'Exam not found' }, 404),
        });
      }
      return Promise.reject({ isMock: true, mockResponse: mockResponse(exam) });
    }

    if (url.startsWith('/exams/') && method === 'patch') {
      const id = url.split('/')[2];
      if (url.includes('/publish')) {
        examsState = examsState.map((e) => (e.id === id ? { ...e, status: 'PUBLISHED', updatedAt: nowIso() } : e));
      } else if (url.includes('/unpublish')) {
        examsState = examsState.map((e) => (e.id === id ? { ...e, status: 'DRAFT', updatedAt: nowIso() } : e));
      } else {
        examsState = examsState.map((e) => (e.id === id ? { ...e, ...data, updatedAt: nowIso() } : e));
      }
      const exam = examsState.find((e) => e.id === id);
      return Promise.reject({ isMock: true, mockResponse: mockResponse(exam) });
    }

    if (url.startsWith('/exams/') && method === 'delete') {
      const id = url.split('/')[2];
      examsState = examsState.filter((e) => e.id !== id);
      return Promise.reject({ isMock: true, mockResponse: mockResponse({ success: true }) });
    }

    // 4. Questions routes
    if (url.includes('/questions') || url.startsWith('/questions')) {
      if (url.startsWith('/exams/') && url.endsWith('/questions') && method === 'get') {
        const examId = url.split('/')[2];
        const list = questionsState[examId] || questionsState['exam-1'] || [];
        return Promise.reject({ isMock: true, mockResponse: mockResponse(list) });
      }

      if (url.startsWith('/questions/exam/') && method === 'get') {
        const examId = url.split('/')[3];
        const list = questionsState[examId] || questionsState['exam-1'] || [];
        return Promise.reject({ isMock: true, mockResponse: mockResponse(list) });
      }

      if (url.startsWith('/questions/exam/') && method === 'post') {
        const examId = url.split('/')[3];
        const list = questionsState[examId] || [];
        const newQ: Question = {
          ...data,
          id: `q-${Date.now()}`,
          examId,
          order: list.length,
        };
        list.push(newQ);
        questionsState[examId] = list;
        examsState = examsState.map((e) => (e.id === examId ? { ...e, questionsCount: list.length } : e));
        return Promise.reject({ isMock: true, mockResponse: mockResponse(newQ) });
      }

      if (url.startsWith('/questions/') && method === 'patch') {
        const qId = url.split('/')[2];
        let found: Question | null = null;
        Object.keys(questionsState).forEach((eId) => {
          questionsState[eId] = questionsState[eId].map((q) => {
            if (q.id === qId) {
              const updatedQ = { ...q, ...data } as Question;
              found = updatedQ;
              return updatedQ;
            }
            return q;
          });
        });
        return Promise.reject({ isMock: true, mockResponse: mockResponse(found || (data as Question)) });
      }

      if (url.startsWith('/questions/') && method === 'delete') {
        const qId = url.split('/')[2];
        Object.keys(questionsState).forEach((eId) => {
          questionsState[eId] = questionsState[eId].filter((q) => q.id !== qId);
        });
        return Promise.reject({ isMock: true, mockResponse: mockResponse({ success: true }) });
      }
    }

    // 5. Assignments routes
    if (url === '/assignments' || url.startsWith('/assignments?')) {
      if (method === 'get') {
        const activeAssignments = assignmentsState.filter(
          (assignment) =>
            !assignment.deletedAt &&
            examsState.some(
              (exam) => exam.id === assignment.examId && exam.status === 'PUBLISHED',
            ),
        );
        return Promise.reject({ isMock: true, mockResponse: mockResponse(activeAssignments) });
      }
      if (method === 'post') {
        const exam = examsState.find((e) => e.id === data.examId) || examsState[0];
        const student = usersState.find((u) => u.id === data.userId) || usersState[1];
        if (!exam || exam.status !== 'PUBLISHED') {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse({ message: 'Published exam not found' }, 404),
          });
        }
        if (!isProActive(student) && exam.accessLevel !== 'FREE') {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse({ message: 'Tài khoản miễn phí chỉ được nhận đề thi FREE.' }, 403),
          });
        }
        const activeExamIds = new Set(
          assignmentsState
            .filter(
              (assignment) =>
                assignment.studentId === data.userId &&
                !assignment.deletedAt &&
                examsState.find((exam) => exam.id === assignment.examId)?.status === 'PUBLISHED' &&
                examsState.find((exam) => exam.id === assignment.examId)?.accessLevel === 'FREE',
            )
            .map((assignment) => assignment.examId),
        );
        if (activeExamIds.has(data.examId)) {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse(
              { message: 'Assignment already exists for this student and exam' },
              409,
            ),
          });
        }
        if (!isProActive(student) && activeExamIds.size >= 2) {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse(
              {
                code: 'FREE_EXAM_LIMIT_REACHED',
                message: 'Tài khoản miễn phí chỉ được nhận tối đa 2 đề thi đang hoạt động.',
              },
              409,
            ),
          });
        }
        const newAssignment: Assignment = {
          id: `assign-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          examId: data.examId,
          studentId: data.userId,
          exam,
          student,
          status: 'PENDING',
          dueDate: data.dueAt || undefined,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        assignmentsState.unshift(newAssignment);
        return Promise.reject({ isMock: true, mockResponse: mockResponse(newAssignment) });
      }
    }

    if (url.startsWith('/assignments/') && method === 'delete') {
      const id = url.split('/')[2];
      assignmentsState = assignmentsState.map((assignment) =>
        assignment.id === id ? { ...assignment, deletedAt: nowIso() } : assignment,
      );
      return Promise.reject({ isMock: true, mockResponse: mockResponse({ success: true }) });
    }

    // 6. Materials routes
    if (url === '/materials' || url.startsWith('/materials?')) {
      if (method === 'get') {
        return Promise.reject({ isMock: true, mockResponse: mockResponse(materialsState) });
      }
      if (method === 'post') {
        const subject = subjectsState.find((s) => s.id === data.subjectId) || subjectsState[0];
        const newMat: Material = {
          id: `mat-${Date.now()}`,
          title: data.title,
          materialType: data.materialType || 'PDF',
          storageUrl: data.storageUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          embedUrl: data.embedUrl,
          accessLevel: data.accessLevel || 'FREE',
          subjectId: data.subjectId || subject.id,
          subject,
          isPublished: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        materialsState.unshift(newMat);
        return Promise.reject({ isMock: true, mockResponse: mockResponse(newMat) });
      }
    }

    if (url.includes('/materials/upload') && method === 'post') {
      const newMat: Material = {
        id: `mat-${Date.now()}`,
        title: 'Tài liệu vừa tải lên (Mock)',
        materialType: 'PDF',
        storageUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        accessLevel: 'FREE',
        subjectId: subjectsState[0]?.id || '',
        subject: subjectsState[0],
        isPublished: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      materialsState.unshift(newMat);
      return Promise.reject({ isMock: true, mockResponse: mockResponse(newMat) });
    }

    if (url.includes('/download')) {
      return Promise.reject({
        isMock: true,
        mockResponse: mockResponse({
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });
    }

    if (url.startsWith('/materials/') && method === 'patch') {
      const id = url.split('/')[2];
      if (url.includes('/publish')) {
        materialsState = materialsState.map((m) => (m.id === id ? { ...m, isPublished: true, updatedAt: nowIso() } : m));
      } else if (url.includes('/unpublish')) {
        materialsState = materialsState.map((m) => (m.id === id ? { ...m, isPublished: false, updatedAt: nowIso() } : m));
      } else {
        materialsState = materialsState.map((m) => (m.id === id ? { ...m, ...data, updatedAt: nowIso() } : m));
      }
      const updated = materialsState.find((m) => m.id === id);
      return Promise.reject({ isMock: true, mockResponse: mockResponse(updated) });
    }

    if (url.startsWith('/materials/') && method === 'delete') {
      const id = url.split('/')[2];
      materialsState = materialsState.filter((m) => m.id !== id);
      return Promise.reject({ isMock: true, mockResponse: mockResponse({ success: true }) });
    }

    // 7. Users routes (Admin)
    if (url === '/users' || url.startsWith('/users?')) {
      return Promise.reject({ isMock: true, mockResponse: mockResponse(usersState) });
    }

    if (url.startsWith('/users/') && url.endsWith('/reset-password') && method === 'patch') {
      return Promise.reject({ isMock: true, mockResponse: mockResponse({ message: 'Password reset successfully' }) });
    }

    if (url.startsWith('/users/') && method === 'patch') {
      const id = url.split('/')[2];
      usersState = usersState.map((u) => (u.id === id ? { ...u, ...data, updatedAt: nowIso() } : u));
      const updated = usersState.find((u) => u.id === id);
      return Promise.reject({ isMock: true, mockResponse: mockResponse(updated) });
    }

    // 8. Exam Attempts routes
    if (url === '/exam-attempts/my-attempts' || url === '/attempts/my-attempts' || url.includes('/attempts')) {
      if (
        method === 'post' &&
        (url.includes('/start') ||
          url.includes('/exam-attempts') ||
          /^\/exams\/[^/]+\/attempts$/.test(url))
      ) {
        const examId = data.examId || url.match(/^\/exams\/([^/]+)\/attempts/)?.[1] || 'exam-1';
        const exam = examsState.find((e) => e.id === examId) || examsState[0];
        const savedUser = localStorage.getItem('user_info');
        const currentUser = savedUser
          ? usersState.find((user) => user.id === JSON.parse(savedUser).id) || usersState[1]
          : usersState[1];
        const activeAssignment = assignmentsState.find(
          (assignment) =>
            assignment.id === data.assignmentId &&
            !assignment.deletedAt &&
            assignment.studentId === currentUser?.id &&
            assignment.examId === examId,
        );
        if (!exam || exam.status !== 'PUBLISHED') {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse({ message: 'Exam not found' }, 404),
          });
        }
        if (exam.accessLevel === 'PRO' && !isProActive(currentUser)) {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse(
              { code: 'EXAM_REQUIRES_PRO', message: 'Nội dung này yêu cầu tài khoản PRO.' },
              403,
            ),
          });
        }
        if (!isProActive(currentUser) && !activeAssignment) {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse(
              {
                code: 'ASSIGNMENT_REQUIRED',
                message: 'Tài khoản miễn phí chỉ được làm đề thi đã được giao.',
              },
              403,
            ),
          });
        }
        if (activeAssignment && new Date(activeAssignment.dueDate).getTime() < Date.now()) {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse({ message: 'Assignment is overdue' }, 403),
          });
        }
        const questions = questionsState[examId] || questionsState['exam-1'] || [];
        const newAttempt: ExamAttempt = {
          id: `attempt-${Date.now()}`,
          examId,
          studentId: currentUser?.id || 'user-student-1',
          assignmentId: data.assignmentId,
          exam,
          questions: mockSequentialEnabled() ? undefined : questions,
          answers: [],
          status: 'IN_PROGRESS',
          startedAt: nowIso(),
          flowVersion: mockSequentialEnabled() ? 2 : 1,
        };
        attemptsState.unshift(newAttempt);
        if (mockSequentialEnabled()) {
          const startedAt = newAttempt.startedAt;
          const firstQuestion = questions[0];
          sequentialAttempts.set(newAttempt.id, {
            attempt: newAttempt,
            questions,
            statuses: questions.map((_, index) =>
              index === 0 ? 'ACTIVE' : 'LOCKED',
            ),
            currentIndex: 0,
            progressVersion: 0,
            answers: {},
            feedback: {},
            activatedAt: { [firstQuestion.id]: startedAt },
            deadlines: {
              [firstQuestion.id]: new Date(
                Date.parse(startedAt) + (firstQuestion.timeLimit || 30) * 1000,
              ).toISOString(),
            },
            advanceAfter: {},
            submissionKeys: {},
          });
        }
        return Promise.reject({ isMock: true, mockResponse: mockResponse(newAttempt) });
      }

      const sequentialAttemptId = url.match(/^\/attempts\/([^/]+)(?:\/|$)/)?.[1];
      const sequentialAttempt = sequentialAttemptId
        ? sequentialAttempts.get(sequentialAttemptId)
        : undefined;
      if (sequentialAttempt) {
        const currentQuestion =
          sequentialAttempt.currentIndex >= 0
            ? sequentialAttempt.questions[sequentialAttempt.currentIndex]
            : undefined;
        const currentStatus = currentQuestion
          ? sequentialAttempt.statuses[sequentialAttempt.currentIndex]
          : undefined;
        const currentDeadline = currentQuestion
          ? sequentialAttempt.deadlines[currentQuestion.id]
          : null;
        const currentNow = Date.now();

        if (url === `/attempts/${sequentialAttempt.attempt.id}` && method === 'get') {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse(mockSequentialSession(sequentialAttempt)),
          });
        }

        if (url.endsWith('/result') && method === 'get') {
          if (sequentialAttempt.attempt.status !== 'COMPLETED') {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse({ message: 'Attempt has not been submitted' }, 409),
            });
          }
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse({
              ...sequentialAttempt.attempt,
              questions: sequentialAttempt.questions,
              answers: sequentialAttempt.questions.map((question) => ({
                questionId: question.id,
                selectedOptionId: sequentialAttempt.answers[question.id]?.selectedOptionId,
                rawValue: sequentialAttempt.answers[question.id]?.rawValue,
                isCorrect: sequentialAttempt.feedback[question.id]?.isCorrect === true,
              })),
            }),
          });
        }

        if (url.endsWith('/session') && method === 'get') {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse(mockSequentialSession(sequentialAttempt)),
          });
        }

        if (url.endsWith('/current-question/submit') && method === 'post') {
          const idempotencyKey = String(
            (config.headers as any)?.['Idempotency-Key'] ||
              (config.headers as any)?.['idempotency-key'] ||
              '',
          );
          if (idempotencyKey && sequentialAttempt.submissionKeys[idempotencyKey]) {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse(sequentialAttempt.submissionKeys[idempotencyKey]),
            });
          }
          if (!idempotencyKey) {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse({ message: 'Idempotency-Key header is required' }, 400),
            });
          }
          if (
            !currentQuestion ||
            currentStatus !== 'ACTIVE' ||
            data.questionId !== currentQuestion.id ||
            Number(data.progressVersion) !== sequentialAttempt.progressVersion
          ) {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse({ message: 'Question is no longer active' }, 409),
            });
          }
          const selected = currentQuestion.options?.find(
            (option) => option.id === data.selectedOptionId,
          );
          if (currentQuestion.type !== 'ESSAY' && (!data.selectedOptionId || !selected)) {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse({ message: 'A valid selected option is required' }, 400),
            });
          }
          if (currentQuestion.type === 'ESSAY' && !String(data.rawValue ?? '').trim()) {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse({ message: 'rawValue is required' }, 400),
            });
          }
          const timedOut = !!currentDeadline && currentNow >= Date.parse(currentDeadline);
          const isCorrect = !timedOut && !!selected?.isCorrect;
          const status: SequentialQuestionStatus = timedOut
            ? 'TIMED_OUT'
            : isCorrect
            ? 'CORRECT'
            : 'INCORRECT';
          const submittedAt = nowIso();
          sequentialAttempt.answers[currentQuestion.id] = {
            ...sequentialAttempt.answers[currentQuestion.id],
            ...mockAnswerValue(data),
            submittedAt,
            timedOut,
          };
          sequentialAttempt.statuses[sequentialAttempt.currentIndex] = status;
          sequentialAttempt.feedback[currentQuestion.id] = mockSequentialFeedback(
            currentQuestion,
            isCorrect,
            timedOut,
          );
          sequentialAttempt.progressVersion += 1;
          const advanceAfter = isCorrect
            ? new Date(currentNow + 3000).toISOString()
            : null;
          sequentialAttempt.advanceAfter[currentQuestion.id] = advanceAfter;
          const outcome = {
            attemptId: sequentialAttempt.attempt.id,
            questionId: currentQuestion.id,
            status,
            isCorrect,
            timedOut,
            advanceAfter,
            progressVersion: sequentialAttempt.progressVersion,
            feedback: sequentialAttempt.feedback[currentQuestion.id],
          };
          if (idempotencyKey) sequentialAttempt.submissionKeys[idempotencyKey] = outcome;
          return Promise.reject({ isMock: true, mockResponse: mockResponse(outcome) });
        }

        if (url.endsWith('/current-question/expire') && method === 'post') {
          if (
            currentQuestion &&
            currentStatus === 'ACTIVE' &&
            currentDeadline &&
            currentNow >= Date.parse(currentDeadline)
          ) {
            sequentialAttempt.statuses[sequentialAttempt.currentIndex] = 'TIMED_OUT';
            sequentialAttempt.feedback[currentQuestion.id] = mockSequentialFeedback(
              currentQuestion,
              false,
              true,
            );
            sequentialAttempt.answers[currentQuestion.id] = {
              ...sequentialAttempt.answers[currentQuestion.id],
              submittedAt: nowIso(),
              timedOut: true,
            };
            sequentialAttempt.progressVersion += 1;
          }
          return Promise.reject({
            isMock: true,
            mockResponse: mockSequentialSession(sequentialAttempt),
          });
        }

        if (url.endsWith('/current-question/continue') && method === 'post') {
          const idempotencyKey = String(
            (config.headers as any)?.['Idempotency-Key'] ||
              (config.headers as any)?.['idempotency-key'] ||
              '',
          );
          if (idempotencyKey && sequentialAttempt.submissionKeys[idempotencyKey]) {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse(sequentialAttempt.submissionKeys[idempotencyKey]),
            });
          }
          if (!idempotencyKey) {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse({ message: 'Idempotency-Key header is required' }, 400),
            });
          }
          if (
            !currentQuestion ||
            data.questionId !== currentQuestion.id ||
            Number(data.progressVersion) !== sequentialAttempt.progressVersion
          ) {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse({ message: 'The exam progress has changed' }, 409),
            });
          }
          const canContinue =
            currentQuestion &&
            (currentStatus === 'INCORRECT' || currentStatus === 'TIMED_OUT' ||
              (currentStatus === 'CORRECT' &&
                sequentialAttempt.advanceAfter[currentQuestion.id] &&
                currentNow >= Date.parse(sequentialAttempt.advanceAfter[currentQuestion.id]!)));
          if (!canContinue) {
            return Promise.reject({
              isMock: true,
              mockResponse: mockResponse({ message: 'Question cannot be continued yet' }, 409),
            });
          }
          sequentialAttempt.statuses[sequentialAttempt.currentIndex] = 'COMPLETED';
          const nextIndex = sequentialAttempt.currentIndex + 1;
          if (nextIndex < sequentialAttempt.questions.length) {
            sequentialAttempt.currentIndex = nextIndex;
            sequentialAttempt.statuses[nextIndex] = 'ACTIVE';
            const nextQuestion = sequentialAttempt.questions[nextIndex];
            sequentialAttempt.activatedAt[nextQuestion.id] = new Date(currentNow).toISOString();
            sequentialAttempt.deadlines[nextQuestion.id] = new Date(
              currentNow + (nextQuestion.timeLimit || 30) * 1000,
            ).toISOString();
          } else {
            sequentialAttempt.currentIndex = -1;
            sequentialAttempt.attempt.status = 'COMPLETED';
            sequentialAttempt.attempt.submittedAt = nowIso();
            sequentialAttempt.attempt.correctAnswers = Object.values(
              sequentialAttempt.feedback,
            ).filter((feedback: any) => feedback?.isCorrect === true).length;
            sequentialAttempt.attempt.totalQuestions = sequentialAttempt.questions.length;
            sequentialAttempt.attempt.score = Number(
              ((sequentialAttempt.attempt.correctAnswers / sequentialAttempt.questions.length) * 10).toFixed(1),
            );
          }
          sequentialAttempt.progressVersion += 1;
          const nextSession = mockSequentialSession(sequentialAttempt);
          if (idempotencyKey) sequentialAttempt.submissionKeys[idempotencyKey] = nextSession;
          return Promise.reject({
            isMock: true,
            mockResponse: nextSession,
          });
        }
      }

      if (url.includes('/save-answer') || url.includes('/answers')) {
        const attemptId = url.split('/')[2];
        const currentAttempt = attemptsState.find((a) => a.id === attemptId);
        if (currentAttempt?.flowVersion === 2) {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse({
              code: 'SEQUENTIAL_FLOW_REQUIRED',
              message: 'Use the current-question endpoints for this attempt',
            }, 409),
          });
        }
        if (!data.finalize && !data.timedOut) {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse(
              { message: 'Answers can only be saved when submitted or timed out' },
              400,
            ),
          });
        }
        const qId = data.questionId;
        const allQ = Object.values(questionsState).flat();
        const targetQ = allQ.find((q) => q.id === qId);
        const selectedOpt = targetQ?.options?.find((o) => o.id === data.selectedOptionId);
        const isCorrect = selectedOpt ? selectedOpt.isCorrect : true;

        if (currentAttempt) {
          if (!currentAttempt.answers) currentAttempt.answers = [];
          const idx = currentAttempt.answers.findIndex((a) => a.questionId === qId);
          const savedAnswer = {
            id: `ans-${Date.now()}`,
            attemptId,
            questionId: qId,
            selectedOptionId: data.selectedOptionId,
            textAnswer: data.textAnswer ?? data.rawValue,
            rawValue: data.rawValue ?? data.textAnswer,
            isCorrect,
            score: isCorrect ? targetQ?.points || 1 : 0,
            explanation: targetQ?.explanation || 'Đáp án chính xác.',
          };
          if (idx >= 0) {
            currentAttempt.answers[idx] = savedAnswer;
          } else {
            currentAttempt.answers.push(savedAnswer);
          }
        }

        return Promise.reject({
          isMock: true,
          mockResponse: mockResponse({
            questionId: qId,
            selectedOptionId: data.selectedOptionId,
            textAnswer: data.textAnswer,
            isCorrect,
            explanation: targetQ?.explanation || 'Đáp án chính xác.',
            score: isCorrect ? targetQ?.points || 1 : 0,
          }),
        });
      }

      if (url.includes('/submit')) {
        const attemptId = url.split('/')[2];
        const currentAttempt = attemptsState.find((a) => a.id === attemptId);
        if (currentAttempt?.flowVersion === 2) {
          return Promise.reject({
            isMock: true,
            mockResponse: mockResponse({
              code: 'SEQUENTIAL_FLOW_REQUIRED',
              message: 'Use the current-question endpoints for this attempt',
            }, 409),
          });
        }
        if (currentAttempt) {
          currentAttempt.status = 'COMPLETED';
          currentAttempt.submittedAt = nowIso();
          const totalQ = currentAttempt.questions?.length || currentAttempt.answers?.length || 1;
          const correctQ = currentAttempt.answers?.filter((a) => a.isCorrect).length || 0;
          currentAttempt.totalQuestions = totalQ;
          currentAttempt.correctAnswers = correctQ;
          currentAttempt.score = Number(((correctQ / totalQ) * 10).toFixed(1));
        }
        return Promise.reject({
          isMock: true,
          mockResponse: mockResponse({ success: true, message: 'Đã nộp bài thi thành công' }),
        });
      }

      if (url.includes('/result') || url.includes('/score')) {
        const attemptId = url.split('/')[2];
        const sample = attemptsState.find((attempt) => attempt.id === attemptId) || attemptsState[0] || MOCK_ATTEMPTS[0];
        return Promise.reject({ isMock: true, mockResponse: mockResponse(sample) });
      }

      return Promise.reject({ isMock: true, mockResponse: mockResponse(attemptsState) });
    }

    return config;
  });

  // Handle mock responses intercepted
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error && error.isMock && error.mockResponse) {
        return Promise.resolve(error.mockResponse);
      }
      return Promise.reject(error);
    }
  );
};
