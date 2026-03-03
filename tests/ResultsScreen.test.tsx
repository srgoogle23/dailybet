import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsScreen } from '../components/ResultsScreen';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Participant, Bet } from '../types';
import React from 'react';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
};

const makeParticipants = (): Participant[] => [
  { id: 'p1', name: 'Alice', avatarColor: 'bg-red-500', balance: 1000, isImmune: false },
  { id: 'p2', name: 'Bob', avatarColor: 'bg-blue-500', balance: 1000, isImmune: false },
  { id: 'p3', name: 'Charlie', avatarColor: 'bg-green-500', balance: 1000, isImmune: false },
];

const makeBets = (): Bet[] => [
  { bettorId: 'p1', chosenCandidateId: 'p2', amount: 100 },
  { bettorId: 'p2', chosenCandidateId: 'p2', amount: 200 },
  { bettorId: 'p3', chosenCandidateId: 'p1', amount: 150 },
];

describe('ResultsScreen', () => {
  let onReset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onReset = vi.fn();
    vi.useFakeTimers();
  });

  it('renders the winner name', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    // Bob is the winner (p2) — may appear multiple times
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
  });

  it('shows winner title', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    expect(screen.getByText('RESPONSÁVEL PELA DAILY')).toBeInTheDocument();
  });

  it('shows total pot', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    expect(screen.getByText('$450')).toBeInTheDocument();
  });

  it('shows number of winners', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    // Alice and Bob bet on p2, so 2 winners
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows bet summary section', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    expect(screen.getByText('Placar das Apostas')).toBeInTheDocument();
  });

  it('shows new draw button', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    expect(screen.getByText('Novo Sorteio')).toBeInTheDocument();
  });

  it('calls onReset when new draw button clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    
    // Wait for animation delay
    await new Promise(r => setTimeout(r, 600));
    
    const newDrawBtn = screen.getByText('Novo Sorteio').closest('button')!;
    await user.click(newDrawBtn);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('saves history to localStorage', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    
    const historyStr = localStorage.getItem('dailybet_history');
    expect(historyStr).not.toBeNull();
    const history = JSON.parse(historyStr!);
    expect(history).toHaveLength(1);
    expect(history[0].winnerName).toBe('Bob');
  });

  it('saves updated wallets to localStorage', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    
    const walletsStr = localStorage.getItem('dailybet_wallets');
    expect(walletsStr).not.toBeNull();
    const wallets = JSON.parse(walletsStr!);
    // Alice bet 100 on p2 (winner): she wins her share of 450
    // Bob bet 200 on p2 (winner): he wins his share of 450
    // Charlie bet 150 on p1 (loser): he loses 150
    expect(wallets['Charlie']).toBeLessThan(1000);
  });

  it('shows profit for winning bettors', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    // At least one profit element should exist
    const profitElements = screen.getAllByText('LUCRO');
    expect(profitElements.length).toBeGreaterThan(0);
  });

  it('shows loss for losing bettors', () => {
    vi.useRealTimers();
    renderWithProvider(
      <ResultsScreen participants={makeParticipants()} bets={makeBets()} winnerId="p2" onReset={onReset} />
    );
    // Charlie lost, should show -$150
    expect(screen.getByText('-$150')).toBeInTheDocument();
  });
});
