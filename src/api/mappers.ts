import {
  AnswerOption,
  Assignment,
  Exam,
  ExamAttempt,
  Material,
  Question,
  SequentialFeedback,
  SequentialSession,
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

export const mapOption = (raw: any, index: number): AnswerOption => {
  const isCorrect =
    typeof raw.isCorrect === 'boolean'
      ? raw.isCorrect
      : typeof raw.is_correct === 'boolean'
      ? raw.is_correct
      : typeof raw.correct === 'boolean'
      ? raw.correct
      : undefined;

  return {
    id: raw.id != null ? String(raw.id) : undefined,
    label: raw.label || String.fromCharCode(65 + index),
    content: raw.contentText ?? raw.content ?? raw.content_text ?? '',
    isCorrect,
    position: raw.position ?? index,
    image: raw.imageUrl ?? raw.image ?? raw.image_url,
    imageStorageUri: raw.imageStorageUri,
  };
};

export const mapQuestion = (raw: any): Question => {
  const type = raw.questionType || raw.type;
  const isMultiPart = type === 'MULTI_PART_SHORT_ANSWER';
  const rawParts = raw.questionParts ?? raw.parts;
  const parts = Array.isArray(rawParts)
    ? [...rawParts]
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((p: any, index: number) => ({
          id: p.id != null ? String(p.id) : undefined,
          contentText: p.contentText ?? p.content_text ?? p.content ?? '',
          correctAnswer: p.correctAnswer ?? p.correct_answer,
          position: p.position ?? index,
        }))
    : undefined;

  return {
    id: raw.id,
    examId: raw.examId,
    subjectId: raw.subjectId || '',
    title: raw.title,
    content: raw.contentText ?? raw.content ?? '',
    // The backend stores every choice question as MULTIPLE_CHOICE, but its
    // answer-key contract requires exactly one correct option. Keep the UI
    // in single-select mode after a question is reloaded.
    type: isMultiPart
      ? 'MULTI_PART_SHORT_ANSWER'
      : type === 'SHORT_ANSWER' || type === 'ESSAY' || type === 'FILL_BLANK'
      ? 'ESSAY'
      : type === 'MULTIPLE_CHOICE'
      ? 'SINGLE_CHOICE'
      : type || 'SINGLE_CHOICE',
    points: raw.points ?? (isMultiPart ? (parts?.length || 1) : 1),
    timeLimit: raw.timeLimitSeconds ?? raw.timeLimit ?? 30,
    image: raw.imageUrl ?? raw.image,
    imageStorageUri: raw.imageStorageUri,
    instruction: raw.instruction,
    options: (raw.questionOptions ?? raw.options ?? []).map(mapOption),
    parts,
    questionParts: parts,
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
  canRetake: raw.canRetake === true,
  createdAt: asIso(raw.createdAt ?? raw.assignedAt),
  updatedAt: asIso(raw.updatedAt),
  examAttempts: (raw.examAttempts || []).map((attempt: any) => ({
    id: attempt.id,
    status: attempt.status,
    flowVersion: attempt.flowVersion,
    correctCount: attempt.correctCount,
    totalQuestions: attempt.totalQuestions,
    score: attempt.score ?? (attempt.totalQuestions ? (attempt.correctCount / attempt.totalQuestions) * 10 : undefined),
  })),
});

export const mapAnswer = (raw: any): any => {
  const rawPartFeedback = raw.partFeedback ?? raw.part_feedback ?? raw.partsFeedback;
  let partFeedback = Array.isArray(rawPartFeedback)
    ? rawPartFeedback.map((p: any) => ({
        partId: String(p.partId ?? p.part_id ?? p.id ?? ''),
        isCorrect: p.isCorrect === true || p.is_correct === true,
        correctAnswer: p.correctAnswer ?? p.correct_answer,
      }))
    : undefined;

  const rawParts = raw.partAnswers ?? raw.parts;
  const parts = Array.isArray(rawParts)
    ? rawParts.map((p: any) => ({
        partId: String(p.partId ?? p.part?.id ?? p.part_id ?? p.id ?? ''),
        rawValue: String(p.rawValue ?? p.raw_value ?? p.textAnswer ?? ''),
      }))
    : undefined;

  if (!partFeedback && Array.isArray(rawParts) && rawParts.some((p: any) => p.isCorrect !== undefined)) {
    partFeedback = rawParts.map((p: any) => ({
      partId: String(p.partId ?? p.part?.id ?? p.part_id ?? p.id ?? ''),
      isCorrect: p.isCorrect === true || p.is_correct === true,
      correctAnswer: p.correctAnswer ?? p.correct_answer,
    }));
  }

  const calculatedIsCorrect =
    partFeedback && partFeedback.length > 0
      ? partFeedback.every((p) => p.isCorrect)
      : undefined;

  const isCorrect =
    typeof raw.isCorrect === 'boolean'
      ? raw.isCorrect
      : typeof raw.is_correct === 'boolean'
      ? raw.is_correct
      : typeof raw.correct === 'boolean'
      ? raw.correct
      : calculatedIsCorrect;

  return {
    id: raw.id != null ? String(raw.id) : undefined,
    attemptId: raw.attemptId != null ? String(raw.attemptId) : raw.attempt_id != null ? String(raw.attempt_id) : undefined,
    questionId: String(raw.questionId ?? raw.question_id ?? raw.question?.id ?? ''),
    selectedOptionId: raw.selectedOptionId != null
      ? String(raw.selectedOptionId)
      : raw.selected_option_id != null
      ? String(raw.selected_option_id)
      : raw.selectedOption?.id != null
      ? String(raw.selectedOption.id)
      : undefined,
    textAnswer: raw.rawValue ?? raw.textAnswer ?? raw.text_answer ?? raw.content,
    rawValue: raw.rawValue ?? raw.raw_value,
    content: raw.content,
    answerType: raw.answerType ?? raw.answer_type,
    numericValue: typeof raw.numericValue === 'number' ? raw.numericValue : typeof raw.numeric_value === 'number' ? raw.numeric_value : undefined,
    isCorrect,
    score: typeof raw.score === 'number' ? raw.score : typeof raw.points === 'number' ? raw.points : undefined,
    timedOut: raw.timedOut ?? raw.timed_out,
    correctOptionId: raw.correctOptionId != null
      ? String(raw.correctOptionId)
      : raw.correct_option_id != null
      ? String(raw.correct_option_id)
      : raw.correctOption?.id != null
      ? String(raw.correctOption.id)
      : undefined,
    correctTextAnswer: raw.correctTextAnswer ?? raw.correct_text_answer,
    parts,
    partFeedback,
    explanation: raw.explanation ?? raw.question?.explanation ?? raw.explaination,
    explanationImage: raw.explanationImageUrl ?? raw.explanationImage ?? raw.explanation_image_url ?? raw.question?.explanationImageUrl,
  };
};

export const mapSequentialFeedback = (raw: any): SequentialFeedback | undefined => {
  if (!raw) return undefined;
  const guidance = raw.guidance
    ? {
        text: raw.guidance.text ?? undefined,
        image: raw.guidance.image ?? undefined,
      }
    : undefined;
  const explanation = raw.explanation
    ? typeof raw.explanation === 'string'
      ? { text: raw.explanation }
      : {
          text: raw.explanation.text ?? undefined,
          image: raw.explanation.image ?? undefined,
        }
    : undefined;

  const rawParts = raw.parts ?? raw.partFeedback ?? raw.part_feedback;
  const parts = Array.isArray(rawParts)
    ? rawParts.map((p: any) => ({
        partId: String(p.partId ?? p.part_id ?? p.id ?? ''),
        isCorrect: p.isCorrect === true || p.is_correct === true,
        correctAnswer: p.correctAnswer ?? p.correct_answer,
      }))
    : undefined;

  const allPartsCorrect = parts && parts.length > 0 ? parts.every((p) => p.isCorrect) : false;
  const isCorrect = raw.isCorrect !== undefined
    ? raw.isCorrect === true
    : (parts ? allPartsCorrect : false);

  return {
    questionId: String(raw.questionId ?? ''),
    isCorrect,
    timedOut: raw.timedOut === true,
    correctOptionId: raw.correctOptionId != null ? String(raw.correctOptionId) : undefined,
    correctTextAnswer: raw.correctTextAnswer,
    correctAnswer: raw.correctAnswer
      ? { id: String(raw.correctAnswer.id), content: raw.correctAnswer.content ?? '' }
      : undefined,
    parts,
    partFeedback: parts,
    guidance,
    explanation,
  };
};

export const mapSequentialSession = (raw: any): SequentialSession => ({
  attemptId: String(raw.attemptId ?? raw.id ?? ''),
  examId: String(raw.examId ?? ''),
  flowVersion: Number(raw.flowVersion ?? 2),
  attemptStatus: raw.attemptStatus ?? raw.status ?? 'IN_PROGRESS',
  progressVersion: Number(raw.progressVersion ?? 0),
  totalQuestions: Number(raw.totalQuestions ?? raw.navigator?.length ?? 0),
  currentOrdinal: raw.currentOrdinal ?? raw.currentQuestion?.ordinal ?? null,
  serverNow: asIso(raw.serverNow ?? new Date().toISOString()),
  navigator: (raw.navigator ?? []).map((item: any) => ({
    ordinal: Number(item.ordinal),
    status: item.status,
  })),
  synchronizedTimeout: raw.synchronizedTimeout === true,
  currentQuestion: raw.currentQuestion
    ? {
        id: String(raw.currentQuestion.id),
        ordinal: Number(raw.currentQuestion.ordinal),
        status: raw.currentQuestion.status,
        activatedAt: raw.currentQuestion.activatedAt
          ? asIso(raw.currentQuestion.activatedAt)
          : null,
        deadlineAt: raw.currentQuestion.deadlineAt
          ? asIso(raw.currentQuestion.deadlineAt)
          : null,
        advanceAfter: raw.currentQuestion.advanceAfter
          ? asIso(raw.currentQuestion.advanceAfter)
          : null,
        question: raw.currentQuestion.question
          ? mapQuestion(raw.currentQuestion.question)
          : undefined,
        feedback: mapSequentialFeedback(raw.currentQuestion.feedback),
      }
    : null,
  resultUrl: raw.resultUrl,
});

export const mapAttempt = (raw: any): ExamAttempt => {
  const totalQuestions = raw.totalQuestions ?? raw.total_questions ?? raw.questions?.length ?? 0;
  const correctAnswers = raw.correctCount ?? raw.correct_count ?? raw.correctAnswers ?? raw.correct_answers;
  const sequentialSession = raw.navigator
    ? mapSequentialSession(raw)
    : undefined;
  return {
    id: raw.id != null
      ? String(raw.id)
      : raw.attemptId != null
      ? String(raw.attemptId)
      : '',
    examId: raw.examId ?? raw.exam_id ?? '',
    assignmentId: raw.assignmentId ?? raw.assignment_id,
    exam: raw.exam ? mapExam(raw.exam) : undefined,
    studentId: raw.userId ?? raw.user_id ?? raw.studentId ?? raw.student_id,
    student: raw.user ? mapUser(raw.user) : raw.student ? mapUser(raw.student) : undefined,
    startedAt: asIso(raw.startedAt ?? raw.started_at),
    submittedAt: raw.submittedAt || raw.submitted_at ? asIso(raw.submittedAt ?? raw.submitted_at) : undefined,
    durationSeconds: raw.durationSeconds ?? raw.duration_seconds,
    score: raw.score ?? (typeof correctAnswers === 'number' && totalQuestions ? (correctAnswers / totalQuestions) * 10 : undefined),
    totalQuestions,
    correctAnswers,
    status: raw.status ?? raw.attemptStatus,
    flowVersion: raw.flowVersion ?? (sequentialSession ? 2 : 1),
    progressVersion: raw.progressVersion,
    answers: (raw.attemptedAnswers ?? raw.attempted_answers ?? raw.answers ?? []).map(mapAnswer),
    questions: (raw.questions ?? raw.attemptedAnswers?.map((a: any) => a.question).filter(Boolean) ?? []).map(mapQuestion),
    sequentialSession,
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
