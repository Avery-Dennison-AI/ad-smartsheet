import apiClient from './apiClient';
import type { MyWorkResponse } from '../types';

export function fetchMyWork(): Promise<{ data: { success: boolean; data: MyWorkResponse } }> {
  return apiClient.get('/api/my-work');
}
