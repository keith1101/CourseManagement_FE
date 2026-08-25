import { apiClient } from './client';
import { Assignment } from '../types';
import { mapAssignment } from './mappers';

export const assignmentsApi = {
  getAssignments: async (): Promise<Assignment[]> => {
    const res = await apiClient.get<any[]>('/assignments');
    return res.data.map(mapAssignment);
  },

  getMyAssignments: async (): Promise<Assignment[]> => {
    const res = await apiClient.get<any[]>('/assignments');
    return res.data.map(mapAssignment);
  },

  createAssignment: async (data: { examId: string; studentIds: string[]; dueDate: string }): Promise<Assignment[]> => {
    const created = await Promise.all(
      data.studentIds.map((userId) =>
        apiClient.post<any>('/assignments', { userId, examId: data.examId, dueAt: data.dueDate }),
      ),
    );
    return created.map((res) => mapAssignment(res.data));
  },

  updateAssignment: async (id: string, dueDate: string): Promise<Assignment> => {
    const res = await apiClient.patch<any>(`/assignments/${id}`, { dueAt: dueDate });
    return mapAssignment(res.data);
  },

  deleteAssignment: async (id: string): Promise<{ success: boolean }> => {
    await apiClient.delete(`/assignments/${id}`);
    return { success: true };
  },
};
