import { apiClient } from './client';
import { Subject } from '../types';
import { mapSubject } from './mappers';

const toPayload = (data: Partial<Subject>) => ({
  code: data.code,
  name: data.name,
  description: data.description,
  displayOrder: data.order,
  isActive: data.isActive,
});

export const subjectsApi = {
  getSubjects: async (): Promise<Subject[]> => {
    const res = await apiClient.get<any[]>('/subjects');
    return res.data.map(mapSubject);
  },

  getSubjectById: async (id: string): Promise<Subject> => {
    const res = await apiClient.get<any>(`/subjects/${id}`);
    return mapSubject(res.data);
  },

  createSubject: async (data: Partial<Subject>): Promise<Subject> => {
    const res = await apiClient.post<any>('/subjects', toPayload(data));
    return mapSubject(res.data);
  },

  updateSubject: async (id: string, data: Partial<Subject>): Promise<Subject> => {
    const res = await apiClient.patch<any>(`/subjects/${id}`, toPayload(data));
    return mapSubject(res.data);
  },

  deleteSubject: async (id: string): Promise<{ success: boolean }> => {
    await apiClient.delete(`/subjects/${id}`);
    return { success: true };
  },
};
