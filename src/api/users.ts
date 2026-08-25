import { apiClient } from './client';
import { User, UserRole, UserStatus, UserTier } from '../types';
import { mapUser } from './mappers';

const toPayload = (data: Partial<User>) => ({
  fullName: data.fullName,
  email: data.email,
  phone: data.phoneNumber,
  dateOfBirth: data.dateOfBirth,
  role: data.role,
  isActive: data.status ? data.status === 'ACTIVE' : undefined,
  accessLevel: data.tier,
  proExpiresAt: data.proExpiresAt,
});

export const usersApi = {
  getUsers: async (params?: { role?: UserRole; status?: UserStatus; search?: string }): Promise<User[]> => {
    const res = await apiClient.get<any[]>('/users', { params: { search: params?.search } });
    const users = res.data.map(mapUser);
    return users.filter((user) => (!params?.role || user.role === params.role) && (!params?.status || user.status === params.status));
  },

  getUserById: async (id: string): Promise<User> => {
    const res = await apiClient.get<any>(`/users/${id}`);
    return mapUser(res.data);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const res = await apiClient.patch<any>(`/users/${id}`, toPayload(data));
    return mapUser(res.data);
  },

  toggleStatus: async (id: string, status: UserStatus): Promise<User> => {
    const endpoint = status === 'ACTIVE' ? 'unlock' : 'lock';
    const res = await apiClient.patch<any>(`/users/${id}/${endpoint}`);
    return mapUser(res.data);
  },

  setUserRoleTier: async (id: string, role: UserRole, tier: UserTier, proExpiresAt?: string | null): Promise<User> => {
    const res = await apiClient.patch<any>(`/users/${id}`, {
      role,
      accessLevel: tier,
      proExpiresAt: tier === 'PRO' ? proExpiresAt || null : null,
    });
    return mapUser(res.data);
  },
};
