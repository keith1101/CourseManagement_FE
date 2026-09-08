import { apiClient } from './client';
import { AuthResponse, ChangePasswordDto, LoginDto, RegisterDto, RegistrationResult, User } from '../types';
import { mapUser } from './mappers';

export const authApi = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const res = await apiClient.post<any>('/auth/login', data);
    return { accessToken: res.data.accessToken, user: mapUser(res.data.user) };
  },

  register: async (data: RegisterDto): Promise<RegistrationResult> => {
    const res = await apiClient.post<RegistrationResult>('/auth/register', {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phoneNumber || undefined,
    });

    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<any>('/auth/me');
    return mapUser(res.data);
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const res = await apiClient.patch<{ message: string }>('/auth/change-password', {
      oldPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.patch<any>('/auth/profile', {
      fullName: data.fullName,
      email: data.email,
      phone: data.phoneNumber,
      dateOfBirth: data.dateOfBirth,
    });
    return mapUser(res.data);
  },

  verifyEmail: async (
    token: string,
  ): Promise<{ message: string; email: string }> => {
    const res = await apiClient.post('/auth/verify-email', { 
      token, 
    });

    return res.data;
  },

  resendVerification: async (
    email: string,
  ): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/resend-verification', {
      email,
    });

    return res.data;
  },
};
