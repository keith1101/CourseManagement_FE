import {
  AnswerOption,
  Assignment,
  Exam,
  ExamAttempt,
  Material,
  Question,
  Subject,
  User,
} from '../types';

const asIso = (value: unknown) => (value ? new Date(String(value)).toISOString() : '');

export const mapUser = (raw: any): User => ({
  id: raw.id,
  email: raw.email,
  fullName: raw.fullName || '',
  role: raw.role,
  accessLevel: raw.accessLevel || raw.tier || 'FREE',
  status: raw.isActive === false || raw.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE',
  phoneNumber: raw.phone ?? raw.phoneNumber ?? undefined,
  dateOfBirth: raw.dateOfBirth ? asIso(raw.dateOfBirth) : undefined,
  proExpiresAt: raw.proExpiresAt ? asIso(raw.proExpiresAt) : null,
  avatar: raw.avatar,
  createdAt: asIso(raw.createdAt),
  updatedAt: asIso(raw.updatedAt),
});

export const mapSubject = (raw: any): Subject => ({
  id: raw.id,
  code: raw.code,
  name: raw.name,
  description: raw.description || undefined,
  order: raw.displayOrder ?? raw.order ?? 0,
  isActive: raw.isActive !== false,
  createdAt: asIso(raw.createdAt),
  updatedAt: asIso(raw.updatedAt),
});

export const mapOption = (raw: any, index: number): AnswerOption => ({
  id: raw.id,
  label: raw.label || String.fromCharCode(65 + index),
  content: raw.contentText ?? raw.content ?? '',
  isCorrect: raw.isCorrect === true,
  position: raw.position ?? index,
  image: raw.imageUrl ?? raw.image,
  imageStorageUri: raw.imageStorageUri,
});

export const mapQuestion = (raw: any): Question => {
  const type = raw.questionType || raw.type;
  return {
    id: raw.id,
    examId: raw.examId,
    subjectId: raw.subjectId || '',
    title: raw.title,
    content: raw.contentText ?? raw.content ?? '',
    // The backend stores every choice question as MULTIPLE_CHOICE, but its
    // answer-key contract requires exactly one correct option. Keep the UI
    // in single-select mode after a question is reloaded.
    type: type === 'SHORT_ANSWER' || type === 'ESSAY' || type === 'FILL_BLANK'
      ? 'ESSAY'
      : type === 'MULTIPLE_CHOICE'
      ? 'SINGLE_CHOICE'
      : type || 'SINGLE_CHOICE',
    points: raw.points ?? 1,
    timeLimit: raw.timeLimitSeconds ?? raw.timeLimit ?? 30,
    image: raw.imageUrl ?? raw.image,
    imageStorageUri: raw.imageStorageUri,
    instruction: raw.instruction,
    options: (raw.questionOptions ?? raw.options ?? []).map(mapOption),
    hint: raw.hint,
    hintImage: raw.hintImageUrl ?? raw.hintImage,
    hintImageStorageUri: raw.hintImageStorageUri,
    explanation: raw.explaination ?? raw.explanation,
    explanationImage: raw.explanationImageUrl ?? raw.explanationImage,
    explanationImageStorageUri: raw.explanationImageStorageUri,
    correctTextAnswer: raw.correctTextAnswer ?? raw.questionAcceptedAnswers?.find((a: any) => a.isPrimary)?.rawValue,
    order: raw.position ?? raw.order ?? 0,
  };
};

export const mapExam = (raw: any): Exam => ({
  id: raw.id,
  title: raw.title || '',
  description: raw.description || undefined,
  accessLevel: raw.accessLevel || 'FREE',
  displayOrder: raw.displayOrder,
  durationMinutes: raw.durationMinutes ?? 0,
  totalPoints: raw.totalPoints ?? 10,
  passingScore: raw.passingScore ?? 5,
  status: raw.status,
  questionsCount: raw.questionsCount ?? raw._count?.questions,
  questions: raw.questions?.map(mapQuestion),
  createdAt: asIso(raw.createdAt),
  updatedAt: asIso(raw.updatedAt),
});

export const mapAssignment = (raw: any): Assignment => ({
  id: raw.id,
  examId: raw.examId,
  exam: raw.exam ? mapExam(raw.exam) : undefined,
  studentId: raw.userId ?? raw.studentId,
  student: raw.user ? mapUser(raw.user) : raw.student ? mapUser(raw.student) : undefined,
  dueDate: asIso(raw.dueAt ?? raw.dueDate),
  deletedAt: raw.deletedAt ? asIso(raw.deletedAt) : null,
  status: raw.status === 'OVERDUE' ? 'OVERDUE' : raw.status,
  createdAt: asIso(raw.createdAt ?? raw.assignedAt),
  updatedAt: asIso(raw.updatedAt),
  examAttempts: (raw.examAttempts || []).map((attempt: any) => ({
    id: attempt.id,
    status: attempt.status,
    score: attempt.score ?? (attempt.totalQuestions ? (attempt.correctCount / attempt.totalQuestions) * 10 : undefined),
  })),
});

export const mapAnswer = (raw: any): any => ({
  id: raw.id,
  attemptId: raw.attemptId,
  questionId: raw.questionId,
  selectedOptionId: raw.selectedOptionId,
  textAnswer: raw.rawValue ?? raw.textAnswer ?? raw.content,
  rawValue: raw.rawValue,
  content: raw.content,
  answerType: raw.answerType,
  numericValue: raw.numericValue,
  isCorrect: raw.isCorrect,
  timedOut: raw.timedOut,
  correctOptionId: raw.correctOptionId,
  correctTextAnswer: raw.correctTextAnswer,
  explanation: raw.explanation,
  explanationImage: raw.explanationImageUrl ?? raw.explanationImage,
});

export const mapAttempt = (raw: any): ExamAttempt => {
  const totalQuestions = raw.totalQuestions ?? raw.questions?.length ?? 0;
  const correctAnswers = raw.correctCount ?? raw.correctAnswers;
  return {
    id: raw.id,
    examId: raw.examId,
    assignmentId: raw.assignmentId,
    exam: raw.exam ? mapExam(raw.exam) : undefined,
    studentId: raw.userId ?? raw.studentId,
    student: raw.user ? mapUser(raw.user) : raw.student ? mapUser(raw.student) : undefined,
    startedAt: asIso(raw.startedAt),
    submittedAt: raw.submittedAt ? asIso(raw.submittedAt) : undefined,
    durationSeconds: raw.durationSeconds,
    score: raw.score ?? (typeof correctAnswers === 'number' && totalQuestions ? (correctAnswers / totalQuestions) * 10 : undefined),
    totalQuestions,
    correctAnswers,
    status: raw.status,
    answers: (raw.attemptedAnswers ?? raw.answers ?? []).map(mapAnswer),
    questions: (raw.questions ?? raw.attemptedAnswers?.map((a: any) => a.question).filter(Boolean) ?? []).map(mapQuestion),
  };
};

export const mapMaterial = (raw: any): Material => ({
  id: raw.id,
  subjectId: raw.subjectId,
  subject: raw.subject ? mapSubject(raw.subject) : undefined,
  title: raw.title || '',
  materialType: raw.materialType,
  storageUrl: raw.storageUrl,
  embedUrl: raw.embedUrl,
  originalFileName: raw.originalFileName,
  mimeType: raw.mimeType,
  fileSizeBytes: raw.fileSizeBytes,
  accessLevel: raw.accessLevel || 'FREE',
  isPublished: raw.isPublished,
  createdAt: asIso(raw.createdAt),
  updatedAt: asIso(raw.updatedAt),
});
