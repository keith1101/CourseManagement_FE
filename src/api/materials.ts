import { apiClient } from './client';
import { Material } from '../types';
import { mapMaterial } from './mappers';

export const materialsApi = {
  getMaterials: async (params?: { subjectId?: string; materialType?: string; accessLevel?: string }): Promise<Material[]> => {
    const res = await apiClient.get<any[]>('/materials', { params });
    return res.data.map(mapMaterial);
  },

  getMaterialById: async (id: string): Promise<Material> => {
    const res = await apiClient.get<any>(`/materials/${id}`);
    return mapMaterial(res.data);
  },
};
