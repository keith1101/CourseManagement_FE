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
import { Exam, Question, Subject, Material, Assignment, User, ExamAttempt } from '../types';

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

export const setupMockAdapter = (client: AxiosInstance) => {
  // Use request adapter to intercept all calls before sending to network
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const isMock = import.meta.env.VITE_ENABLE_MOCKS === 'true';
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
        tier: 'PRO' as const,
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
        tier: 'FREE',
        status: 'ACTIVE',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      usersState.push(newUser);
      return Promise.reject({
        isMock: true,
        mockResponse: mockResponse(newUser),
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
        return Promise.reject({ isMock: true, mockResponse: mockResponse(examsState) });
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
        return Promise.reject({ isMock: true, mockResponse: mockResponse(assignmentsState) });
      }
      if (method === 'post') {
        const exam = examsState.find((e) => e.id === data.examId) || examsState[0];
        const student = usersState.find((u) => u.id === data.userId) || usersState[1];
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
      assignmentsState = assignmentsState.filter((a) => a.id !== id);
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

    if (url.startsWith('/users/') && method === 'patch') {
      const id = url.split('/')[2];
      usersState = usersState.map((u) => (u.id === id ? { ...u, ...data, updatedAt: nowIso() } : u));
      const updated = usersState.find((u) => u.id === id);
      return Promise.reject({ isMock: true, mockResponse: mockResponse(updated) });
    }

    // 8. Exam Attempts routes
    if (url === '/exam-attempts/my-attempts' || url === '/attempts/my-attempts' || url.includes('/attempts')) {
      if (url.includes('/start') || (url.includes('/exam-attempts') && method === 'post')) {
        const examId = data.examId || 'exam-1';
        const exam = examsState.find((e) => e.id === examId) || examsState[0];
        const questions = questionsState[examId] || questionsState['exam-1'] || [];
        const newAttempt: ExamAttempt = {
          id: `attempt-${Date.now()}`,
          examId,
          studentId: 'user-student-1',
          assignmentId: data.assignmentId,
          exam,
          questions,
          answers: [],
          status: 'IN_PROGRESS',
          startedAt: nowIso(),
        };
        attemptsState.unshift(newAttempt);
        return Promise.reject({ isMock: true, mockResponse: mockResponse(newAttempt) });
      }

      if (url.includes('/save-answer') || url.includes('/answers')) {
        const qId = data.questionId;
        const allQ = Object.values(questionsState).flat();
        const targetQ = allQ.find((q) => q.id === qId);
        const isCorrect = targetQ?.options.find((o) => o.id === data.selectedOptionId)?.isCorrect ?? true;

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
        return Promise.reject({
          isMock: true,
          mockResponse: mockResponse({ success: true, message: 'Đã nộp bài thi thành công' }),
        });
      }

      if (url.includes('/result') || url.includes('/score')) {
        const sample = attemptsState[0] || MOCK_ATTEMPTS[0];
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
