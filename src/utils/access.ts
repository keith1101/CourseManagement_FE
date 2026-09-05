import { Assignment, Exam, Material, User } from '../types';

export const isProActive = (user: User | null | undefined) => {
  if (!user || user.accessLevel !== 'PRO') return false;
  return !user.proExpiresAt || new Date(user.proExpiresAt).getTime() > Date.now();
};

export const canAccessPro = (user: User | null | undefined, accessLevel?: string) => {
  return accessLevel !== 'PRO' || isProActive(user);
};

export const canStartExam = (
  user: User | null | undefined,
  exam: Exam,
  assignment?: Assignment,
) => {
  if (exam.status !== 'PUBLISHED') return false;
  if (assignment?.status === 'OVERDUE') return false;
  if (exam.accessLevel === 'PRO') return isProActive(user);
  return isProActive(user) || !!assignment;
};

export const canAccessMaterial = (user: User | null | undefined, material: Material) =>
  material.accessLevel !== 'PRO' || isProActive(user);
