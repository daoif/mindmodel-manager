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
  addDimension: async (name: string) => {
    const response = await api.post<TagDimension>('/config/tag-dimensions', { name });
    return response.data;
  },
  addDocType: async (name: string) => {
    const response = await api.post<DocType>('/config/doc-types', { name });
    return response.data;
  }
};

export const navigationApi = {
  getTree: async () => {
    const response = await api.get<NavigationNode[]>('/navigation');
    return response.data;
  }
};
