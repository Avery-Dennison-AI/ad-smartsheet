import apiClient from './apiClient';
import type { Accent } from '@/utils/theme';

export async function updateUserPreferences(
  preferences: { accentColor?: Accent },
): Promise<{ id: string; fullName: string; email: string; role: string; accentColor: Accent }> {
  const { data } = await apiClient.patch('/api/user/preferences', preferences);
  return data.data;
}
