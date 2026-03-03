import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OddsScreen } from '../components/OddsScreen';
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

describe('OddsScreen', () => {
  let onStartRoulette: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onStartRoulette = vi.fn();
  });

  it('renders odds title', () => {
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    expect(screen.getByText('Odds da Daily')).toBeInTheDocument();
  });

  it('shows total pot', () => {
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    // Total: 100 + 200 + 150 = 450
    expect(screen.getByText('$450')).toBeInTheDocument();
  });

  it('shows all participant names', () => {
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows FAVORITO label for the candidate with lowest odds', () => {
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    expect(screen.getByText('FAVORITO')).toBeInTheDocument();
  });

  it('shows ZEBRA label for candidates with no bets', () => {
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    // Charlie has no bets on him
    expect(screen.getByText('ZEBRA')).toBeInTheDocument();
  });

  it('shows spin roulette button', () => {
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    expect(screen.getByText('RODAR SORTEIO')).toBeInTheDocument();
  });

  it('calls onStartRoulette when button clicked', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    const btn = screen.getByText('RODAR SORTEIO').closest('button')!;
    await user.click(btn);
    expect(onStartRoulette).toHaveBeenCalledOnce();
  });

  it('shows correct number of bets per candidate', () => {
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    // Bob has 2 bets, Alice has 1, Charlie has 0
    const twos = screen.getAllByText('2');
    expect(twos.length).toBeGreaterThan(0);
  });

  it('calculates multipliers correctly', () => {
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    // Bob: 450/300 = 1.50x, Alice: 450/150 = 3.00x
    expect(screen.getByText('1.50x')).toBeInTheDocument();
    expect(screen.getByText('3.00x')).toBeInTheDocument();
  });

  it('shows dash for candidates with zero bets multiplier', () => {
    renderWithProvider(
      <OddsScreen participants={makeParticipants()} bets={makeBets()} onStartRoulette={onStartRoulette} />
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
