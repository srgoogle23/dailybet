import { describe, it, expect } from 'vitest';
import { AppPhase } from '../types';

describe('types', () => {
  describe('AppPhase', () => {
    it('should have all expected phases', () => {
      expect(AppPhase.SETUP).toBe('SETUP');
      expect(AppPhase.BETTING).toBe('BETTING');
      expect(AppPhase.ODDS).toBe('ODDS');
      expect(AppPhase.ROULETTE).toBe('ROULETTE');
      expect(AppPhase.RESULTS).toBe('RESULTS');
    });

    it('should have exactly 5 phases', () => {
      const phases = Object.values(AppPhase);
      expect(phases).toHaveLength(5);
    });
  });
});
