import axios from 'axios';
import type { MindModel, Document, NavigationNode, TagDimension, DocType } from '../types';

// 配置 baseURL，假设后端在 3000 端口
const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

export const modelApi = {
  list: async () => {
    const response = await api.get<MindModel[]>('/models');
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get<MindModel>(`/models/${id}`);
    return response.data;
  },
  create: async (data: Partial<MindModel>) => {
    const response = await api.post<MindModel>('/models', data);
    return response.data;
  },
  update: async (id: string, data: Partial<MindModel>) => {
    const response = await api.put<MindModel>(`/models/${id}`, data);
    return response.data;
  },
  updateTags: async (id: string, tags: Record<string, string[]>) => {
    // Typically backend expects full update or partial?
    // Our backend PUT /models/:id expects { name, description, tags }.
    // If we just send tags, it should be fine if backend handles partial updates properly.
    // Let's check backend `routes/models.ts`.
    // Assuming it handles partials. If not, we might need to fetch first.
    // Wait, `update` function above is generic. I can just use `update(id, { tags })`.
    // But `tags` in `MindModel` is `Record<string, string[]>`.
    // We need to merge with existing tags if the backend replaces all tags.
    // Let's add a specific method if needed, or rely on `update`.
    // For now, let's try to use a specific endpoint or logic.
    // Actually, checking backend is safer.
    const response = await api.put<MindModel>(`/models/${id}/tags`, { tags });
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/models/${id}`);
  },
  getDocs: async (id: string) => {
    const response = await api.get<Document[]>(`/models/${id}/docs`);
    return response.data;
  },
  getDocContent: async (id: string, type: string) => {
    const response = await api.get<{ content: string }>(`/models/${id}/docs/${type}`);
    return response.data.content;
  },
  saveDocContent: async (id: string, type: string, content: string) => {
    await api.put(`/models/${id}/docs/${type}`, { content });
  },
  deleteDoc: async (id: string, type: string) => {
    await api.delete(`/models/${id}/docs/${type}`);
  }
};

export const configApi = {
  getDimensions: async () => {
    const response = await api.get<TagDimension[]>('/config/tag-dimensions');
    return response.data;
  },
  getDocTypes: async () => {
    const response = await api.get<DocType[]>('/config/doc-types');
    return response.data;
  },
  addDimension: async (data: { name: string }) => {
    const response = await api.post<TagDimension>('/config/tag-dimensions', data);
    return response.data;
  },
  updateDimension: async (name: string, data: { newName?: string, display_order?: number, color?: string, show_in_nav?: boolean }) => {
    const response = await api.put<TagDimension>(`/config/tag-dimensions/${name}`, data);
    return response.data;
  },
  deleteDimension: async (name: string) => {
    await api.delete(`/config/tag-dimensions/${name}`);
  },
  addDocType: async (data: { name: string, show_in_copy?: boolean, short_name?: string }) => {
    const response = await api.post<DocType>('/config/doc-types', data);
    return response.data;
  },
  updateDocType: async (name: string, data: { newName?: string, display_order?: number, show_in_copy?: boolean, short_name?: string }) => {
    const response = await api.put<DocType>(`/config/doc-types/${name}`, data);
    return response.data;
  },
  deleteDocType: async (name: string) => {
    await api.delete(`/config/doc-types/${name}`);
  }
};

export const navigationApi = {
  getTree: async () => {
    const response = await api.get<NavigationNode[]>('/navigation');
    return response.data;
  }
};
