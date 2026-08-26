export type UserRole = 'ADMIN' | 'STUDENT';
export type UserTier = 'FREE' | 'PRO';
export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tier: UserTier;
  status: UserStatus;
  phoneNumber?: string;
  dateOfBirth?: string;
  proExpiresAt?: string | null;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'ESSAY' | 'FILL_BLANK';

export interface AnswerOption {
  id?: string;
  label: string;
  content: string;
  isCorrect: boolean;
  position?: number;
}

export interface Question {
  id: string;
  examId: string;
  subjectId: string;
  title?: string;
  content: string;
  type: QuestionType;
  points: number;
  timeLimit?: number;
  image?: string;
  instruction?: string;
  options: AnswerOption[];
  hint?: string;
  explanation?: string;
  correctTextAnswer?: string;
  order: number;
}

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AccessLevel = 'FREE' | 'PRO';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  /** Deprecated: exams are not assigned to a Subject. Subjects belong to Questions. */
  subjectId?: string;
  subject?: Subject;
  accessLevel: AccessLevel;
  displayOrder?: number;
  durationMinutes: number;
  totalPoints: number;
  passingScore: number;
  status: ExamStatus;
  questionsCount?: number;
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface Assignment {
  id: string;
  examId: string;
  exam?: Exam;
  studentId: string;
  student?: User;
  dueDate: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  examAttempts?: Array<{ id: string; status: AttemptStatus; score?: number }>;
}

export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'SUBMITTED' | 'SCORED';

export interface StudentAnswer {
  id?: string;
  attemptId?: string;
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  rawValue?: string;
  content?: string;
  answerType?: 'TEXT' | 'NUMBER';
  numericValue?: number;
  isCorrect?: boolean;
  score?: number;
  timedOut?: boolean;
  correctOptionId?: string;
  correctTextAnswer?: string;
  explanation?: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  assignmentId?: string;
  exam?: Exam;
  studentId: string;
  student?: User;
  startedAt: string;
  submittedAt?: string;
  durationSeconds?: number;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  status: AttemptStatus;
  answers?: StudentAnswer[];
  questions?: Question[];
}

export type MaterialType = 'PDF' | 'DOCX' | 'EMBEDDED_VIDEO';

export interface Material {
  id: string;
  subjectId: string;
  subject?: Subject;
  title: string;
  materialType: MaterialType;
  storageUrl?: string;
  embedUrl?: string;
  originalFileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  accessLevel: AccessLevel;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptFeedback extends StudentAnswer {
  questionId: string;
  isCorrect: boolean;
  timedOut?: boolean;
}
