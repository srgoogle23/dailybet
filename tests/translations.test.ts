import { describe, it, expect } from 'vitest';
import { translations } from '../translations';

describe('translations', () => {
  it('should have pt and en locales', () => {
    expect(translations).toHaveProperty('pt');
    expect(translations).toHaveProperty('en');
  });

  it('should have the same keys in pt and en', () => {
    const ptKeys = Object.keys(translations.pt).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(ptKeys).toEqual(enKeys);
  });

  it('pt should have all required keys', () => {
    const requiredKeys = [
      'appTitle', 'setupTitle', 'setupSubtitle', 'placeholderName',
      'emptyList', 'startBetting', 'buyout', 'insufficientFunds',
      'balance', 'currentBettor', 'whoWillPresent', 'betAmount',
      'confirmBet', 'step', 'of', 'maxBet', 'oddsTitle', 'oddsSubtitle',
      'totalPool', 'favorite', 'underdog', 'bets', 'spinRoulette',
      'spinning', 'winnerTitle', 'betSummary', 'winners', 'prizePerWinner',
      'betOn', 'on', 'profit', 'newDraw', 'historyTitle', 'historyEmpty',
      'leaderboard', 'wins', 'close', 'resetData',
      'brokeTitle', 'brokeMessage', 'getLoan', 'loanAmount'
    ];
    requiredKeys.forEach(key => {
      expect(translations.pt).toHaveProperty(key);
    });
  });

  it('en should have all required keys', () => {
    const requiredKeys = [
      'appTitle', 'setupTitle', 'setupSubtitle', 'placeholderName',
      'emptyList', 'startBetting', 'buyout', 'insufficientFunds',
      'balance', 'currentBettor', 'whoWillPresent', 'betAmount',
      'confirmBet', 'step', 'of', 'maxBet', 'oddsTitle', 'oddsSubtitle',
      'totalPool', 'favorite', 'underdog', 'bets', 'spinRoulette',
      'spinning', 'winnerTitle', 'betSummary', 'winners', 'prizePerWinner',
      'betOn', 'on', 'profit', 'newDraw', 'historyTitle', 'historyEmpty',
      'leaderboard', 'wins', 'close', 'resetData',
      'brokeTitle', 'brokeMessage', 'getLoan', 'loanAmount'
    ];
    requiredKeys.forEach(key => {
      expect(translations.en).toHaveProperty(key);
    });
  });

  it('all values should be non-empty strings', () => {
    Object.values(translations.pt).forEach(value => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
    Object.values(translations.en).forEach(value => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it('appTitle should be DailyBet in both locales', () => {
    expect(translations.pt.appTitle).toBe('DailyBet');
    expect(translations.en.appTitle).toBe('DailyBet');
  });
});
