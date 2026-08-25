import { Exam, Material, User } from '../types';

export const isProActive = (user: User | null | undefined) => {
  if (!user || user.tier !== 'PRO') return false;
  return !user.proExpiresAt || new Date(user.proExpiresAt).getTime() > Date.now();
};

export const canAccessPro = (user: User | null | undefined, accessLevel?: string) => {
  return accessLevel !== 'PRO' || isProActive(user);
};

export const canStartExam = (user: User | null | undefined, exam: Exam, publishedExams: Exam[]) => {
  if (!isProActive(user)) {
    if (exam.accessLevel === 'PRO') return false;
    const firstTwo = [...publishedExams]
      .filter((item) => item.status === 'PUBLISHED')
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .slice(0, 2)
      .map((item) => item.id);
    return firstTwo.includes(exam.id);
  }
  return exam.status === 'PUBLISHED';
};

export const canAccessMaterial = (user: User | null | undefined, material: Material) =>
  material.accessLevel !== 'PRO' || isProActive(user);
