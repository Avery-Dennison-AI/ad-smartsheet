import apiClient from './apiClient';
import type { Workspace, WorkspaceRole } from '../types';

export function createWorkspace(data: { name: string; description?: string; color: string }) {
  return apiClient.post('/api/workspaces', data);
}

export function listWorkspaces() {
  return apiClient.get('/api/workspaces');
}

export function getWorkspace(id: string) {
  return apiClient.get(`/api/workspaces/${id}`);
}

export function updateWorkspace(id: string, data: { name?: string; description?: string; color?: string }) {
  return apiClient.patch(`/api/workspaces/${id}`, data);
}

export function deleteWorkspace(id: string) {
  return apiClient.delete(`/api/workspaces/${id}`);
}

export function addMember(workspaceId: string, data: { userId: string; role: WorkspaceRole }) {
  return apiClient.post(`/api/workspaces/${workspaceId}/members`, data);
}

export function removeMember(workspaceId: string, memberId: string) {
  return apiClient.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);
}

export function updateMemberRole(workspaceId: string, memberId: string, role: WorkspaceRole) {
  return apiClient.patch(`/api/workspaces/${workspaceId}/members/${memberId}`, { role });
}

export function searchUsers(workspaceId: string, query: string) {
  return apiClient.get(`/api/workspaces/${workspaceId}/members/search`, { params: { query } });
}
