import { describe, it, expect } from 'vitest';
import { BET_AMOUNT, PRESET_BET_AMOUNTS, INITIAL_BALANCE, BUYOUT_COST, LOAN_AMOUNT, AVATAR_COLORS } from '../constants';

describe('constants', () => {
  it('BET_AMOUNT should be 100', () => {
    expect(BET_AMOUNT).toBe(100);
  });

  it('PRESET_BET_AMOUNTS should contain expected values', () => {
    expect(PRESET_BET_AMOUNTS).toEqual([10, 50, 100, 200, 500]);
  });

  it('INITIAL_BALANCE should be 1000', () => {
    expect(INITIAL_BALANCE).toBe(1000);
  });

  it('BUYOUT_COST should be 999', () => {
    expect(BUYOUT_COST).toBe(999);
  });

  it('LOAN_AMOUNT should be 500', () => {
    expect(LOAN_AMOUNT).toBe(500);
  });

  it('AVATAR_COLORS should have 15 colors', () => {
    expect(AVATAR_COLORS).toHaveLength(15);
  });

  it('AVATAR_COLORS should all be tailwind bg classes', () => {
    AVATAR_COLORS.forEach(color => {
      expect(color).toMatch(/^bg-\w+-500$/);
    });
  });
});
