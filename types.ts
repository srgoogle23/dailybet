export enum AppPhase {
  SETUP = 'SETUP',
  BETTING = 'BETTING',
  ODDS = 'ODDS',
  ROULETTE = 'ROULETTE',
  RESULTS = 'RESULTS'
}

export interface Participant {
  id: string;
  name: string;
  avatarColor: string;
  balance: number;
  isImmune?: boolean; // New property to track buyout status
}

export interface Bet {
  bettorId: string;
  chosenCandidateId: string;
  amount: number;
}

export interface OddCalculation {
  candidateId: string;
  totalBets: number;
  multiplier: number;
  potentialPayout: number;
}

export interface HistoryEntry {
  id: string;
  date: string;
  winnerName: string;
  winnerAvatar: string;
  totalPool: number;
  winnerId: string;
}

export type Language = 'pt' | 'en';