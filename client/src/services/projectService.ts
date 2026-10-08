import apiClient from './apiClient';
import type { StatusEntry, ItemTypeEntry, ProjectUsage } from '../types';

export interface CreateProjectParams {
  name: string;
  keyPrefix: string;
  template: string;
}

export const createProject = (workspaceId: string, body: CreateProjectParams) =>
  apiClient.post(`/api/workspaces/${workspaceId}/projects`, body);

export async function getProjectUsage(sheetId: string): Promise<ProjectUsage> {
  const { data } = await apiClient.get(`/api/sheets/${sheetId}/project/usage`);
  return data.data as ProjectUsage;
}

export async function updateStatuses(
  sheetId: string,
  body: { statuses: StatusEntry[]; replacements?: Record<string, string> },
) {
  return apiClient.patch(`/api/sheets/${sheetId}/project/statuses`, body);
}

export async function updateItemTypes(
  sheetId: string,
  body: { itemTypes: ItemTypeEntry[]; replacements?: Record<string, string> },
) {
  return apiClient.patch(`/api/sheets/${sheetId}/project/item-types`, body);
}
