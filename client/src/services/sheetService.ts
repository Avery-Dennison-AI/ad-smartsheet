import apiClient from './apiClient';
import type { Sheet, SheetMetaItem } from '../types';

export function listSheets(workspaceId: string) {
  return apiClient.get(`/api/workspaces/${workspaceId}/sheets`);
}

export function getSheet(sheetId: string) {
  return apiClient.get(`/api/sheets/${sheetId}`);
}

export function createSheet(workspaceId: string, name: string) {
  return apiClient.post(`/api/workspaces/${workspaceId}/sheets`, { name });
}

export function renameSheet(sheetId: string, name: string) {
  return apiClient.patch(`/api/sheets/${sheetId}/rename`, { name });
}

export function duplicateSheet(sheetId: string) {
  return apiClient.post(`/api/sheets/${sheetId}/duplicate`);
}

export function deleteSheet(sheetId: string) {
  return apiClient.delete(`/api/sheets/${sheetId}`);
}

export function setFavorite(sheetId: string, starred: boolean) {
  return apiClient.post(`/api/sheets/${sheetId}/favorite`, { starred });
}

export function getRecents(limit = 20) {
  return apiClient.get('/api/user/recents', { params: { limit } });
}

export function getFavorites() {
  return apiClient.get('/api/user/favorites');
}
