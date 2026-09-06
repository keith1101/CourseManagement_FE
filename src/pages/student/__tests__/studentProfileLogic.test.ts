import { describe, it, expect } from 'vitest';
import { formatDate } from '../../../utils/date';
import { isProActive } from '../../../utils/access';
import { User } from '../../../types';

/**
 * Pure presentation helper reflecting StudentProfilePage display logic
 */
export function getProfileProDisplay(user: User | null | undefined) {
  const isLocked = user?.status === 'LOCKED';
  const isPro = user?.accessLevel === 'PRO';
  const proExpiryFormatted = formatDate(user?.proExpiresAt);

  let badgeVariant: 'error' | 'premium' | 'neutral';
  let badgeLabel: string;

  if (isLocked) {
    badgeVariant = 'error';
    badgeLabel = 'Đã khóa';
  } else if (isProActive(user)) {
    badgeVariant = 'premium';
    badgeLabel = 'Gói PRO';
  } else if (isPro) {
    badgeVariant = 'error';
    badgeLabel = 'PRO đã hết hạn';
  } else {
    badgeVariant = 'neutral';
    badgeLabel = 'Gói Miễn phí';
  }

  const showExpiryText = !isLocked && isPro && Boolean(proExpiryFormatted);
  const expiryText = showExpiryText ? `Thời hạn PRO đến ngày ${proExpiryFormatted}` : null;

  return {
    badgeVariant,
    badgeLabel,
    expiryText,
  };
}

describe('StudentProfilePage PRO Expiry & Account Status Logic', () => {
  const baseUser: User = {
    id: 'u-101',
    email: 'student@example.com',
    fullName: 'Nguyễn Văn A',
    role: 'STUDENT',
    accessLevel: 'PRO',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('1. formats 2027-09-01 as 01/09/2027 with prefix "Thời hạn PRO đến ngày "', () => {
    const user: User = {
      ...baseUser,
      proExpiresAt: '2027-09-01T00:00:00+07:00',
    };
    const result = getProfileProDisplay(user);
    expect(result.badgeLabel).toBe('Gói PRO');
    expect(result.expiryText).toBe('Thời hạn PRO đến ngày 01/09/2027');
  });

  it('2. adds leading zero to single digit day or month', () => {
    // Single digit day: 6 -> 06
    const user1: User = {
      ...baseUser,
      proExpiresAt: '2026-11-06T00:00:00+07:00',
    };
    expect(getProfileProDisplay(user1).expiryText).toBe('Thời hạn PRO đến ngày 06/11/2026');

    // Single digit month: 1 -> 01
    const user2: User = {
      ...baseUser,
      proExpiresAt: '2027-01-20T00:00:00+07:00',
    };
    expect(getProfileProDisplay(user2).expiryText).toBe('Thời hạn PRO đến ngày 20/01/2027');
  });

  it('3. keeps two-digit day and month unchanged (25/12/2027)', () => {
    const user: User = {
      ...baseUser,
      proExpiresAt: '2027-12-25T00:00:00+07:00',
    };
    expect(getProfileProDisplay(user).expiryText).toBe('Thời hạn PRO đến ngày 25/12/2027');
  });

  it('4. handles null or undefined proExpiresAt gracefully without crashing', () => {
    const userNull: User = { ...baseUser, proExpiresAt: null };
    const resultNull = getProfileProDisplay(userNull);
    expect(resultNull.badgeLabel).toBe('Gói PRO');
    expect(resultNull.expiryText).toBeNull();

    const userUndefined: User = { ...baseUser, proExpiresAt: undefined };
    const resultUndefined = getProfileProDisplay(userUndefined);
    expect(resultUndefined.badgeLabel).toBe('Gói PRO');
    expect(resultUndefined.expiryText).toBeNull();
  });

  it('5. handles invalid date strings gracefully without showing "Invalid Date"', () => {
    const userInvalid: User = { ...baseUser, proExpiresAt: 'invalid-date' };
    const result = getProfileProDisplay(userInvalid);
    expect(result.expiryText).toBeNull();
  });

  it('6. does NOT show PRO expiration text on FREE accounts even if proExpiresAt is set', () => {
    const freeUser: User = {
      ...baseUser,
      accessLevel: 'FREE',
      proExpiresAt: '2027-09-01T00:00:00+07:00',
    };
    const result = getProfileProDisplay(freeUser);
    expect(result.badgeLabel).toBe('Gói Miễn phí');
    expect(result.expiryText).toBeNull();
  });

  it('7. does NOT show PRO badge or expiration text on LOCKED accounts', () => {
    const lockedUser: User = {
      ...baseUser,
      status: 'LOCKED',
      accessLevel: 'PRO',
      proExpiresAt: '2027-09-01T00:00:00+07:00',
    };
    const result = getProfileProDisplay(lockedUser);
    expect(result.badgeLabel).toBe('Đã khóa');
    expect(result.badgeVariant).toBe('error');
    expect(result.expiryText).toBeNull();
  });
});
