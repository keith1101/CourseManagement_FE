import { apiClient } from './client';
import { Assignment } from '../types';
import { mapAssignment } from './mappers';
import { getApiErrorMessage } from './errors';

export interface AssignmentBatchResult {
  created: Assignment[];
  failed: Array<{ studentId: string; message: string }>;
}

export const assignmentsApi = {
  getAssignments: async (): Promise<Assignment[]> => {
    const res = await apiClient.get<any[]>('/assignments');
    return res.data.map(mapAssignment);
  },

  getMyAssignments: async (): Promise<Assignment[]> => {
    const res = await apiClient.get<any[]>('/assignments');
    return res.data.map(mapAssignment);
  },

  createAssignment: async (data: { examId: string; studentIds: string[]; dueDate?: string }): Promise<AssignmentBatchResult> => {
    const payloadBase: { examId: string; dueAt?: string } = { examId: data.examId };
    if (data.dueDate && data.dueDate.trim() !== '') {
      payloadBase.dueAt = data.dueDate;
    }
    const results = await Promise.allSettled(
      data.studentIds.map((userId) =>
        apiClient.post<any>('/assignments', { userId, ...payloadBase }),
      ),
    );
    return results.reduce<AssignmentBatchResult>(
      (result, item, index) => {
        const studentId = data.studentIds[index];
        if (item.status === 'fulfilled') {
          result.created.push(mapAssignment(item.value.data));
        } else {
          result.failed.push({
            studentId,
            message: getApiErrorMessage(item.reason, 'Không thể giao bài cho học sinh này.'),
          });
        }
        return result;
      },
      { created: [], failed: [] },
    );
  },

  updateAssignment: async (id: string, dueDate?: string | null): Promise<Assignment> => {
    const payload: { dueAt?: string | null } = {};
    if (dueDate && dueDate.trim() !== '') {
      payload.dueAt = dueDate;
    } else if (dueDate === null) {
      payload.dueAt = null;
    }
    const res = await apiClient.patch<any>(`/assignments/${id}`, payload);
    return mapAssignment(res.data);
  },

  deleteAssignment: async (id: string): Promise<{ success: boolean }> => {
    await apiClient.delete(`/assignments/${id}`);
    return { success: true };
  },
};
