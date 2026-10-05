import apiClient from './apiClient';
import type { SheetMembersResult, SharedWithMeItem } from '../types';

export function getSheetMembers(sheetId: string) {
  return apiClient.get(`/api/sheets/${sheetId}/members`);
}

export function addSheetMember(sheetId: string, data: { userId: string; role: 'viewer' | 'editor' | 'admin' }) {
  return apiClient.post(`/api/sheets/${sheetId}/members`, data);
}

export function updateSheetMemberRole(sheetId: string, userId: string, role: 'viewer' | 'editor' | 'admin') {
  return apiClient.patch(`/api/sheets/${sheetId}/members/${userId}`, { role });
}

export function removeSheetMember(sheetId: string, userId: string) {
  return apiClient.delete(`/api/sheets/${sheetId}/members/${userId}`);
}

export function getSharedWithMe() {
  return apiClient.get('/api/user/shared-with-me');
}
