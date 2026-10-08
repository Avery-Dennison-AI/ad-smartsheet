import apiClient from '../../services/apiClient';

export interface CreateProjectParams {
  name: string;
  keyPrefix: string;
  template: string;
}

export const createProject = (workspaceId: string, body: CreateProjectParams) =>
  apiClient.post(`/workspaces/${workspaceId}/projects`, body);
