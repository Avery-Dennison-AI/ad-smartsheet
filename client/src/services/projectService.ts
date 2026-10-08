import apiClient from './apiClient';

export interface CreateProjectParams {
  name: string;
  keyPrefix: string;
  template: string;
}

export const createProject = (workspaceId: string, body: CreateProjectParams) =>
  apiClient.post(`/api/workspaces/${workspaceId}/projects`, body);
