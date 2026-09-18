import { describe, it, expect } from 'vitest';
import { isProActive, canStartExam } from '../access';
import { User } from '../../types';

describe('isProActive utility', () => {
  const baseUser: User = {
    id: 'u-1',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'STUDENT',
    accessLevel: 'PRO',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('returns false if user is null or undefined', () => {
    expect(isProActive(null)).toBe(false);
    expect(isProActive(undefined)).toBe(false);
  });

  it('returns false if user accessLevel is FREE', () => {
    const freeUser: User = { ...baseUser, accessLevel: 'FREE' };
    expect(isProActive(freeUser)).toBe(false);
  });

  it('returns false if user status is LOCKED even if accessLevel is PRO', () => {
    const lockedUser: User = {
      ...baseUser,
      accessLevel: 'PRO',
      status: 'LOCKED',
      proExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    expect(isProActive(lockedUser)).toBe(false);
  });

  it('returns true if user is PRO and proExpiresAt is null/undefined (lifetime)', () => {
    const lifetimeUser: User = { ...baseUser, proExpiresAt: null };
    expect(isProActive(lifetimeUser)).toBe(true);
  });

  it('returns true if user is PRO and proExpiresAt is in the future', () => {
    const activeProUser: User = {
      ...baseUser,
      proExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    expect(isProActive(activeProUser)).toBe(true);
  });

  it('returns false if user is PRO but proExpiresAt is in the past', () => {
    const expiredProUser: User = {
      ...baseUser,
      proExpiresAt: new Date(Date.now() - 86400000).toISOString(),
    };
    expect(isProActive(expiredProUser)).toBe(false);
  });
});

describe('canStartExam utility', () => {
  const freeUser: User = {
    id: 'u-free',
    email: 'free@example.com',
    fullName: 'Free Student',
    role: 'STUDENT',
    accessLevel: 'FREE',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const proUser: User = {
    id: 'u-pro',
    email: 'pro@example.com',
    fullName: 'Pro Student',
    role: 'STUDENT',
    accessLevel: 'PRO',
    status: 'ACTIVE',
    proExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const freePublishedExam = {
    id: 'exam-free-1',
    title: 'Đề thi Toán đại cương',
    accessLevel: 'FREE' as const,
    status: 'PUBLISHED' as const,
    durationMinutes: 45,
    totalPoints: 10,
    passingScore: 5.0,
    subjectId: 'subj-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const proPublishedExam = {
    ...freePublishedExam,
    id: 'exam-pro-1',
    title: 'Đề thi Nâng cao PRO',
    accessLevel: 'PRO' as const,
  };

  const draftExam = {
    ...freePublishedExam,
    id: 'exam-draft-1',
    status: 'DRAFT' as const,
  };

  it('allows FREE student to start published FREE exam without an assignment', () => {
    expect(canStartExam(freeUser, freePublishedExam)).toBe(true);
  });

  it('allows PRO student to start published FREE exam', () => {
    expect(canStartExam(proUser, freePublishedExam)).toBe(true);
  });

  it('allows PRO student to start published PRO exam', () => {
    expect(canStartExam(proUser, proPublishedExam)).toBe(true);
  });

  it('prevents FREE student from starting PRO exam', () => {
    expect(canStartExam(freeUser, proPublishedExam)).toBe(false);
  });

  it('prevents starting non-published (DRAFT) exam', () => {
    expect(canStartExam(freeUser, draftExam)).toBe(false);
    expect(canStartExam(proUser, draftExam)).toBe(false);
  });

  it('prevents locked student from starting exam', () => {
    const lockedUser: User = { ...freeUser, status: 'LOCKED' };
    expect(canStartExam(lockedUser, freePublishedExam)).toBe(false);
  });

  it('prevents starting an exam if the specific assignment is OVERDUE', () => {
    const overdueAssignment = {
      id: 'assign-overdue-1',
      studentId: freeUser.id,
      examId: freePublishedExam.id,
      status: 'OVERDUE' as const,
      dueDate: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(canStartExam(freeUser, freePublishedExam, overdueAssignment)).toBe(false);
  });

  it('allows starting an exam if the specific assignment is active (PENDING or IN_PROGRESS)', () => {
    const pendingAssignment = {
      id: 'assign-pending-1',
      studentId: freeUser.id,
      examId: freePublishedExam.id,
      status: 'PENDING' as const,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(canStartExam(freeUser, freePublishedExam, pendingAssignment)).toBe(true);
  });
});
