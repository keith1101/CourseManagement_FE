import { apiClient } from './client';
import { AccessLevel, Material } from '../types';
import { mapMaterial } from './mappers';

export const materialsApi = {
  getMaterials: async (params?: { subjectId?: string; materialType?: string; accessLevel?: string }): Promise<Material[]> => {
    const res = await apiClient.get<any[]>('/materials', { params });
    return res.data.map(mapMaterial);
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

    return mapMaterial(res.data);
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
  embedUrl:
    data.materialType === 'EMBEDDED_VIDEO'
      ? transformVideoEmbedUrl(data.embedUrl)
      : undefined,
  accessLevel: data.accessLevel,
});

/**
 * Converts common YouTube page URLs to an iframe-compatible embed URL before
 * sending the material payload to the API.
 */
export const transformVideoEmbedUrl = (value?: string) => {
  if (!value) return value;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    const youtubeHosts = new Set(['youtube.com', 'm.youtube.com', 'youtube-nocookie.com']);

    if (youtubeHosts.has(hostname)) {
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');
        return videoId
          ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
          : value;
      }

      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length === 2 && ['shorts', 'live'].includes(pathParts[0])) {
        return `https://www.youtube.com/embed/${encodeURIComponent(pathParts[1])}`;
      }

      if (pathParts[0] === 'embed' && pathParts[1]) {
        return value.trim();
      }
    }

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0];
      return videoId
        ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
        : value;
    }
  } catch {
    // The backend will return the validation error for malformed URLs.
  }

  return value;
};
