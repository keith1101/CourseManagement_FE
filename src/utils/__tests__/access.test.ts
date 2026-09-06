import { describe, it, expect } from 'vitest';
import { isProActive } from '../access';
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
