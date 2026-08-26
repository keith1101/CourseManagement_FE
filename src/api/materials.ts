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

  createMaterial: async (data: Partial<Material>): Promise<Material> => {
    const res = await apiClient.post<any>('/materials', toPayload(data));
    return mapMaterial(res.data);
  },

  updateMaterial: async (id: string, data: Partial<Material>): Promise<Material> => {
    const res = await apiClient.patch<any>(`/materials/${id}`, toPayload(data));
    return mapMaterial(res.data);
  },

  deleteMaterial: async (id: string): Promise<void> => {
    await apiClient.delete(`/materials/${id}`);
  },

  publishMaterial: async (id: string): Promise<Material> => {
    const res = await apiClient.patch<any>(`/materials/${id}/publish`);
    return mapMaterial(res.data);
  },

  unpublishMaterial: async (id: string): Promise<Material> => {
    const res = await apiClient.patch<any>(`/materials/${id}/unpublish`);
    return mapMaterial(res.data);
  },
};

const toPayload = (data: Partial<Material>) => ({
  subjectId: data.subjectId,
  title: data.title,
  materialType: data.materialType,
  storageUrl: data.materialType === 'EMBEDDED_VIDEO' ? undefined : data.storageUrl,
  embedUrl: data.materialType === 'EMBEDDED_VIDEO' ? data.embedUrl : undefined,
  originalFileName: data.materialType === 'EMBEDDED_VIDEO' ? undefined : data.originalFileName,
  mimeType: data.materialType === 'EMBEDDED_VIDEO' ? undefined : data.mimeType,
  fileSizeBytes: data.materialType === 'EMBEDDED_VIDEO' ? undefined : data.fileSizeBytes,
  accessLevel: data.accessLevel,
});
