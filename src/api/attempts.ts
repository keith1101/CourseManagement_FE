import { apiClient } from './client';
import {
  AttemptFeedback,
  ExamAttempt,
  SequentialFeedback,
  SequentialSession,
  StudentAnswer,
} from '../types';
import { mapAnswer, mapAttempt, mapSequentialFeedback, mapSequentialSession } from './mappers';

export interface SaveAnswerPayload extends StudentAnswer {
  timedOut?: boolean;
  finalize?: boolean;
}

export type SaveAnswerResponse = Omit<AttemptFeedback, 'isCorrect'> & {
  isCorrect?: boolean;
};

export interface SequentialAnswerPart {
  partId: string;
  rawValue: string;
}

export interface SequentialAnswerPayload {
  questionId: string;
  progressVersion: number;
  parts?: SequentialAnswerPart[];
  selectedOptionId?: string;
  rawValue?: string;
  answerType?: 'TEXT' | 'NUMBER';
  normalizedText?: string;
  content?: string;
  numericValue?: number;
}

export interface SequentialSubmitResponse {
  attemptId: string;
  questionId: string;
  status: 'CORRECT' | 'INCORRECT' | 'TIMED_OUT';
  isCorrect: boolean;
  timedOut: boolean;
  advanceAfter?: string | null;
  progressVersion: number;
  feedback?: SequentialFeedback;
}

export const attemptsApi = {
  startAttempt: async (examId: string, assignmentId?: string): Promise<ExamAttempt> => {
    const res = await apiClient.post<any>(`/exams/${examId}/attempts`, assignmentId ? { assignmentId } : {});
    return mapAttempt(res.data);
  },

  getAttempt: async (attemptId: string): Promise<ExamAttempt> => {
    const res = await apiClient.get<any>(`/attempts/${attemptId}`);
    return mapAttempt(res.data);
  },

  getSequentialSession: async (attemptId: string): Promise<SequentialSession> => {
    const res = await apiClient.get<any>(`/attempts/${attemptId}/session`, {
      headers: { 'Cache-Control': 'no-store' },
    });
    return mapSequentialSession(res.data);
  },

  submitCurrentQuestion: async (
    attemptId: string,
    answer: SequentialAnswerPayload,
    idempotencyKey: string,
  ): Promise<SequentialSubmitResponse | SequentialSession> => {
    const res = await apiClient.post<any>(
      `/attempts/${attemptId}/current-question/submit`,
      answer,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    if (res.data?.navigator) return mapSequentialSession(res.data);
    const feedback = mapSequentialFeedback(res.data?.feedback);
    const allPartsCorrect = feedback?.parts && feedback.parts.length > 0
      ? feedback.parts.every((p) => p.isCorrect)
      : undefined;
    const isCorrect = res.data?.isCorrect ?? feedback?.isCorrect ?? allPartsCorrect ?? false;
    const status = res.data?.status ?? (isCorrect ? 'CORRECT' : 'INCORRECT');
    return {
      ...res.data,
      isCorrect,
      status,
      feedback,
    } as SequentialSubmitResponse;
  },

  expireCurrentQuestion: async (attemptId: string): Promise<SequentialSession> => {
    const res = await apiClient.post<any>(`/attempts/${attemptId}/current-question/expire`);
    return mapSequentialSession(res.data);
  },

  continueCurrentQuestion: async (
    attemptId: string,
    questionId: string,
    progressVersion: number,
    idempotencyKey: string,
  ): Promise<SequentialSession> => {
    const res = await apiClient.post<any>(
      `/attempts/${attemptId}/current-question/continue`,
      { questionId, progressVersion },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return mapSequentialSession(res.data);
  },

  saveAnswer: async (attemptId: string, answer: SaveAnswerPayload): Promise<SaveAnswerResponse> => {
    const payload: any = {
      questionId: answer.questionId,
      timedOut: answer.timedOut,
      finalize: answer.finalize,
    };
    if (answer.parts) {
      payload.parts = answer.parts;
    } else {
      payload.selectedOptionId = answer.selectedOptionId || undefined;
      payload.answerType = answer.answerType;
      payload.rawValue = answer.rawValue ?? answer.textAnswer;
      payload.normalizedText = answer.textAnswer?.trim().toLowerCase();
      payload.content = answer.content;
      payload.numericValue = answer.numericValue;
    }
    const res = await apiClient.post<any>(`/attempts/${attemptId}/answers`, payload);
    return mapAnswer(res.data) as SaveAnswerResponse;
  },

  submitAttempt: async (attemptId: string): Promise<ExamAttempt> => {
    const res = await apiClient.post<any>(`/attempts/${attemptId}/submit`);
    return mapAttempt(res.data);
  },

  getResult: async (attemptId: string): Promise<ExamAttempt> => {
    const res = await apiClient.get<any>(`/attempts/${attemptId}/result`);
    return mapAttempt(res.data);
  },

  getMyAttempts: async (): Promise<ExamAttempt[]> => {
    const res = await apiClient.get<any[]>('/attempts');
    return res.data.map(mapAttempt);
  },

  getAllAttempts: async (): Promise<ExamAttempt[]> => {
    const res = await apiClient.get<any[]>('/attempts');
    return res.data.map(mapAttempt);
  },
};
