import { apiClient } from './client';
import { AccessLevel, Material } from '../types';
import { mapMaterial } from './mappers';
import { normalizeYoutubeEmbedUrl } from '../utils/youtube';

const mapMaterialResponse = (raw: any): Material => {
  const material = mapMaterial(raw);

  return material.materialType === 'EMBEDDED_VIDEO'
    ? { ...material, embedUrl: normalizeYoutubeEmbedUrl(material.embedUrl) }
    : material;
};

export const materialsApi = {
  getMaterials: async (params?: { subjectId?: string; materialType?: string; accessLevel?: string }): Promise<Material[]> => {
    const res = await apiClient.get<any[]>('/materials', { params });
    return res.data.map(mapMaterialResponse);
  },

  uploadMaterial: async (
    file: File,
    data: { subjectId: string; title: string; accessLevel: AccessLevel },
  ): Promise<Material> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectId', data.subjectId);
    formData.append('title', data.title);
    formData.append('accessLevel', data.accessLevel);

    const res = await apiClient.post<any>('/materials/upload', formData);

    return mapMaterialResponse(res.data);
  },

  getMaterialDownloadUrl: async (
    id: string,
  ): Promise<{ url: string; expiresAt: string }> => {
    const res = await apiClient.get<{ url: string; expiresAt: string }>(
      `/materials/${id}/download`,
    );
    return res.data;
  },

  getMaterialById: async (id: string): Promise<Material> => {
    const res = await apiClient.get<any>(`/materials/${id}`);
    return mapMaterialResponse(res.data);
  },

  createMaterial: async (data: Partial<Material>): Promise<Material> => {
    const res = await apiClient.post<any>('/materials', toPayload(data));
    return mapMaterialResponse(res.data);
  },

  updateMaterial: async (id: string, data: Partial<Material>): Promise<Material> => {
    const res = await apiClient.patch<any>(`/materials/${id}`, toPayload(data));
    return mapMaterialResponse(res.data);
  },

  deleteMaterial: async (id: string): Promise<void> => {
    await apiClient.delete(`/materials/${id}`);
  },

  publishMaterial: async (id: string): Promise<Material> => {
    const res = await apiClient.patch<any>(`/materials/${id}/publish`);
    return mapMaterialResponse(res.data);
  },

  unpublishMaterial: async (id: string): Promise<Material> => {
    const res = await apiClient.patch<any>(`/materials/${id}/unpublish`);
    return mapMaterialResponse(res.data);
  },
};

const toPayload = (data: Partial<Material>) => ({
  subjectId: data.subjectId,
  title: data.title,
  materialType: data.materialType,
  storageUrl: data.materialType === 'EMBEDDED_VIDEO' ? undefined : data.storageUrl,
  embedUrl:
    data.materialType === 'EMBEDDED_VIDEO'
      ? transformVideoEmbedUrl(data.embedUrl)
      : undefined,
  accessLevel: data.accessLevel,
});

/**
 * Converts common YouTube page URLs to an iframe-compatible embed URL before
 * sending the material payload to the API. Kept as a named export for callers
 * that already use the API module.
 */
export const transformVideoEmbedUrl = normalizeYoutubeEmbedUrl;
