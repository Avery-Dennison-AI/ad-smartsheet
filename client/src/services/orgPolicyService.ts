import apiClient from './apiClient';
import type { OrgPolicy } from '@/types';

export const getOrgPolicy = () => apiClient.get<{ success: boolean; data: OrgPolicy }>('/api/org-policy');

export const updateOrgPolicy = (patch: Partial<OrgPolicy>) =>
  apiClient.patch<{ success: boolean; data: OrgPolicy }>('/api/org-policy', patch);
