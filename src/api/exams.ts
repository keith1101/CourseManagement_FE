import { apiClient } from './client';
import { Exam, ExamStatus } from '../types';
import { mapExam } from './mappers';

const toPayload = (data: Partial<Exam>) => ({
  title: data.title,
  description: data.description,
  accessLevel: data.accessLevel || 'FREE',
});

export const examsApi = {
  getExams: async (params?: { subjectId?: string; status?: ExamStatus; search?: string }): Promise<Exam[]> => {
    const res = await apiClient.get<any[]>('/exams', { params });
    return res.data.map(mapExam);
  },

  getExamById: async (id: string): Promise<Exam> => {
    const res = await apiClient.get<any>(`/exams/${id}`);
    return mapExam(res.data);
  },

  createExam: async (data: Partial<Exam>): Promise<Exam> => {
    const res = await apiClient.post<any>('/exams', toPayload(data));
    return mapExam(res.data);
  },

  updateExam: async (id: string, data: Partial<Exam>): Promise<Exam> => {
    const res = await apiClient.patch<any>(`/exams/${id}`, toPayload(data));
    return mapExam(res.data);
  },

  publishExam: async (id: string, status: ExamStatus): Promise<Exam> => {
    const endpoint = status === 'PUBLISHED' ? 'publish' : 'unpublish';
    const res = await apiClient.patch<any>(`/exams/${id}/${endpoint}`);
    return mapExam(res.data);
  },

  deleteExam: async (id: string): Promise<{ success: boolean }> => {
    await apiClient.delete(`/exams/${id}`);
    return { success: true };
  },
};
