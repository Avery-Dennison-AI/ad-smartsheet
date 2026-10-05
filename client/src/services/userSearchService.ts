import apiClient from './apiClient';

export interface UserSearchResult {
  _id: string;
  fullName: string;
  email: string;
  orgRole: string;
}

/** Global user search — scoped for guests, full directory for non-guests. */
export async function searchUsersGlobal(query: string): Promise<UserSearchResult[]> {
  const { data } = await apiClient.get('/api/users/search', { params: { query } });
  return (data.data as UserSearchResult[]) || [];
}
