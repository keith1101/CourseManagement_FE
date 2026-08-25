import { apiClient } from './client';
import { ExamAttempt, StudentAnswer, AttemptFeedback } from '../types';
import { mapAnswer, mapAttempt } from './mappers';

export interface SaveAnswerPayload extends StudentAnswer {
  timedOut?: boolean;
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

  saveAnswer: async (attemptId: string, answer: SaveAnswerPayload): Promise<AttemptFeedback> => {
    const res = await apiClient.post<any>(`/attempts/${attemptId}/answers`, {
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      answerType: answer.answerType,
      rawValue: answer.rawValue ?? answer.textAnswer,
      normalizedText: answer.textAnswer?.trim().toLowerCase(),
      content: answer.content,
      numericValue: answer.numericValue,
      timedOut: answer.timedOut,
    });
    return mapAnswer(res.data) as AttemptFeedback;
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
