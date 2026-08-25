import { apiClient } from './client';
import { Question } from '../types';
import { mapQuestion } from './mappers';

const toPayload = (data: Partial<Question>) => ({
  questionType: data.type === 'FILL_BLANK' || data.type === 'ESSAY' ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE',
  contentText: data.content,
  imageUrl: data.image || undefined,
  instruction: data.instruction,
  explaination: data.explanation,
  timeLimitSeconds: data.timeLimit || 30,
  correctTextAnswer: data.correctTextAnswer || (data.options?.[0]?.content || undefined),
  options: (data.options || []).map((option, index) => ({
    contentText: option.content,
    isCorrect: option.isCorrect,
    position: option.position ?? index,
  })),
});

export const questionsApi = {
  getQuestionsByExam: async (examId: string): Promise<Question[]> => {
    const res = await apiClient.get<any[]>(`/exams/${examId}/questions`);
    return res.data.map(mapQuestion);
  },

  getQuestionById: async (id: string): Promise<Question> => {
    const res = await apiClient.get<any>(`/questions/${id}`);
    return mapQuestion(res.data);
  },

  createQuestion: async (examId: string, data: Partial<Question>): Promise<Question> => {
    const res = await apiClient.post<any>(`/exams/${examId}/questions`, toPayload(data));
    return mapQuestion(res.data);
  },

  updateQuestion: async (id: string, data: Partial<Question>): Promise<Question> => {
    const res = await apiClient.patch<any>(`/questions/${id}`, toPayload(data));
    return mapQuestion(res.data);
  },

  deleteQuestion: async (id: string): Promise<{ success: boolean }> => {
    await apiClient.delete(`/questions/${id}`);
    return { success: true };
  },

  reorderQuestions: async (_examId: string, questionIds: string[]): Promise<{ success: boolean }> => {
    for (const [order, id] of questionIds.entries()) {
      await apiClient.patch(`/questions/${id}/order`, { order });
    }
    return { success: true };
  },
};
