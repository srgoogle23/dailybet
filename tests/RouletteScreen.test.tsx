import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouletteScreen } from '../components/RouletteScreen';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Participant } from '../types';
import React from 'react';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
};

const makeParticipants = (): Participant[] => [
  { id: 'p1', name: 'Alice', avatarColor: 'bg-red-500', balance: 1000, isImmune: false },
  { id: 'p2', name: 'Bob', avatarColor: 'bg-blue-500', balance: 1000, isImmune: false },
  { id: 'p3', name: 'Charlie', avatarColor: 'bg-green-500', balance: 1000, isImmune: false },
];

describe('RouletteScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders spinning text', () => {
    const onFinish = vi.fn();
    renderWithProvider(
      <RouletteScreen participants={makeParticipants()} onFinish={onFinish} />
    );
    expect(screen.getByText('SORTEANDO O RESPONSÁVEL...')).toBeInTheDocument();
  });

  it('renders roulette items (participant names are visible)', () => {
    const onFinish = vi.fn();
    renderWithProvider(
      <RouletteScreen participants={makeParticipants()} onFinish={onFinish} />
    );
    // At least some participant names should be shown in the roulette strip
    const allText = document.body.textContent;
    const hasAnyParticipant = ['Alice', 'Bob', 'Charlie'].some(name => allText?.includes(name));
    expect(hasAnyParticipant).toBe(true);
  });

  it('does not include immune participants in the draw', () => {
    const onFinish = vi.fn();
    const participants = makeParticipants();
    participants[0].isImmune = true; // Alice is immune
    participants[1].isImmune = true; // Bob is immune
    
    renderWithProvider(
      <RouletteScreen participants={participants} onFinish={onFinish} />
    );
    
    // Only Charlie should be eligible, so the roulette should predominantly show Charlie
    // Charlie's initials should appear in the strip
    const charlieElements = screen.getAllByText('CH');
    expect(charlieElements.length).toBeGreaterThan(0);
  });

  it('calls onFinish after timeout', () => {
    const onFinish = vi.fn();
    renderWithProvider(
      <RouletteScreen participants={makeParticipants()} onFinish={onFinish} />
    );
    
    vi.advanceTimersByTime(9000); // 8500ms finish timer + buffer
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it('onFinish receives a valid participant id', () => {
    const onFinish = vi.fn();
    const participants = makeParticipants();
    renderWithProvider(
      <RouletteScreen participants={participants} onFinish={onFinish} />
    );
    
    vi.advanceTimersByTime(9000);
    expect(onFinish).toHaveBeenCalledOnce();
    const winnerId = onFinish.mock.calls[0][0];
    expect(participants.some(p => p.id === winnerId)).toBe(true);
  });

  it('does not reveal winner via special styling (no animate-pulse on winner card)', () => {
    const onFinish = vi.fn();
    renderWithProvider(
      <RouletteScreen participants={makeParticipants()} onFinish={onFinish} />
    );
    
    // The winning card should NOT have a special highlight
    const allDivs = document.querySelectorAll('.animate-pulse');
    const winnerHighlights = Array.from(allDivs).filter(el => 
      el.className.includes('bg-yellow-400')
    );
    expect(winnerHighlights).toHaveLength(0);
  });

  it('falls back to all participants if everyone is immune', () => {
    const onFinish = vi.fn();
    const participants = makeParticipants();
    participants.forEach(p => { p.isImmune = true; });
    
    renderWithProvider(
      <RouletteScreen participants={participants} onFinish={onFinish} />
    );
    
    vi.advanceTimersByTime(9000);
    expect(onFinish).toHaveBeenCalledOnce();
    const winnerId = onFinish.mock.calls[0][0];
    expect(participants.some(p => p.id === winnerId)).toBe(true);
  });

  it('cleans up timers on unmount', () => {
    const onFinish = vi.fn();
    const { unmount } = renderWithProvider(
      <RouletteScreen participants={makeParticipants()} onFinish={onFinish} />
    );
    
    unmount();
    vi.advanceTimersByTime(9000);
    // onFinish should not be called after unmount
    expect(onFinish).not.toHaveBeenCalled();
  });
});
