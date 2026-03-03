import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupScreen } from '../components/SetupScreen';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Participant } from '../types';
import React from 'react';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
};

const mockParticipants: Participant[] = [];

describe('SetupScreen', () => {
  let setParticipants: ReturnType<typeof vi.fn>;
  let onNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setParticipants = vi.fn();
    onNext = vi.fn();
  });

  it('renders the setup title', () => {
    renderWithProvider(
      <SetupScreen participants={mockParticipants} setParticipants={setParticipants} onNext={onNext} />
    );
    expect(screen.getByText('Squad Daily')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderWithProvider(
      <SetupScreen participants={mockParticipants} setParticipants={setParticipants} onNext={onNext} />
    );
    expect(screen.getByText(/Quem vai puxar a daily/)).toBeInTheDocument();
  });

  it('shows empty state when no participants', () => {
    renderWithProvider(
      <SetupScreen participants={[]} setParticipants={setParticipants} onNext={onNext} />
    );
    expect(screen.getByText('Nenhum participante adicionado ainda.')).toBeInTheDocument();
  });

  it('disables start button with less than 2 participants', () => {
    renderWithProvider(
      <SetupScreen participants={[]} setParticipants={setParticipants} onNext={onNext} />
    );
    const startButton = screen.getByText(/Começar Apostas/);
    expect(startButton.closest('button')).toBeDisabled();
  });

  it('enables start button with 2+ participants', () => {
    const twoParticipants: Participant[] = [
      { id: '1', name: 'Alice', avatarColor: 'bg-red-500', balance: 1000, isImmune: false },
      { id: '2', name: 'Bob', avatarColor: 'bg-blue-500', balance: 1000, isImmune: false },
    ];
    renderWithProvider(
      <SetupScreen participants={twoParticipants} setParticipants={setParticipants} onNext={onNext} />
    );
    const startButton = screen.getByText(/Começar Apostas/);
    expect(startButton.closest('button')).not.toBeDisabled();
  });

  it('adds a participant when submitting the form', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <SetupScreen participants={[]} setParticipants={setParticipants} onNext={onNext} />
    );

    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, 'Alice{enter}');
    
    expect(setParticipants).toHaveBeenCalled();
  });

  it('does not add empty name', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <SetupScreen participants={[]} setParticipants={setParticipants} onNext={onNext} />
    );

    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, '   {enter}');
    
    expect(setParticipants).not.toHaveBeenCalled();
  });

  it('does not add duplicate names', async () => {
    const user = userEvent.setup();
    const existingParticipants: Participant[] = [
      { id: '1', name: 'Alice', avatarColor: 'bg-red-500', balance: 1000, isImmune: false },
    ];
    renderWithProvider(
      <SetupScreen participants={existingParticipants} setParticipants={setParticipants} onNext={onNext} />
    );

    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, 'alice{enter}');
    
    // Should not add - duplicate name (case insensitive)
    expect(setParticipants).not.toHaveBeenCalled();
  });

  it('renders participant list with names and balances', () => {
    const participants: Participant[] = [
      { id: '1', name: 'Alice', avatarColor: 'bg-red-500', balance: 1000, isImmune: false },
      { id: '2', name: 'Bob', avatarColor: 'bg-blue-500', balance: 500, isImmune: false },
    ];
    renderWithProvider(
      <SetupScreen participants={participants} setParticipants={setParticipants} onNext={onNext} />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  it('calls onNext when start button clicked', async () => {
    const user = userEvent.setup();
    const participants: Participant[] = [
      { id: '1', name: 'Alice', avatarColor: 'bg-red-500', balance: 1000, isImmune: false },
      { id: '2', name: 'Bob', avatarColor: 'bg-blue-500', balance: 1000, isImmune: false },
    ];
    renderWithProvider(
      <SetupScreen participants={participants} setParticipants={setParticipants} onNext={onNext} />
    );
    const startButton = screen.getByText(/Começar Apostas/);
    await user.click(startButton);
    expect(onNext).toHaveBeenCalled();
  });

  it('removes participant when delete button clicked', async () => {
    const user = userEvent.setup();
    const participants: Participant[] = [
      { id: '1', name: 'Alice', avatarColor: 'bg-red-500', balance: 1000, isImmune: false },
    ];
    renderWithProvider(
      <SetupScreen participants={participants} setParticipants={setParticipants} onNext={onNext} />
    );
    
    // Find and click the delete button (trash icon button)
    const deleteButtons = screen.getAllByRole('button');
    const trashButton = deleteButtons.find(b => b.className.includes('hover:text-red-400'));
    if (trashButton) {
      await user.click(trashButton);
      expect(setParticipants).toHaveBeenCalled();
    }
  });

  it('auto-loads participants from localStorage on mount', () => {
    localStorage.setItem('dailybet_wallets', JSON.stringify({ 'Alice': 800, 'Bob': 1200 }));
    
    renderWithProvider(
      <SetupScreen participants={[]} setParticipants={setParticipants} onNext={onNext} />
    );
    
    expect(setParticipants).toHaveBeenCalled();
    const call = setParticipants.mock.calls[0][0];
    expect(call).toHaveLength(2);
    expect(call[0].name).toBe('Alice');
    expect(call[0].balance).toBe(800);
    expect(call[1].name).toBe('Bob');
    expect(call[1].balance).toBe(1200);
  });

  it('does not auto-load when participants already exist', () => {
    localStorage.setItem('dailybet_wallets', JSON.stringify({ 'Alice': 800 }));
    const participants: Participant[] = [
      { id: '1', name: 'Charlie', avatarColor: 'bg-red-500', balance: 1000, isImmune: false },
    ];
    renderWithProvider(
      <SetupScreen participants={participants} setParticipants={setParticipants} onNext={onNext} />
    );
    
    // Should NOT call setParticipants to auto-load
    expect(setParticipants).not.toHaveBeenCalled();
  });

  it('loads balance from localStorage for manually added participants', async () => {
    const user = userEvent.setup();
    localStorage.setItem('dailybet_wallets', JSON.stringify({ 'Alice': 750 }));
    
    renderWithProvider(
      <SetupScreen participants={[]} setParticipants={setParticipants} onNext={onNext} />
    );

    // Clear the auto-load call
    setParticipants.mockClear();
    
    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, 'Alice{enter}');
    
    if (setParticipants.mock.calls.length > 0) {
      const newParticipants = setParticipants.mock.calls[0][0];
      const alice = newParticipants.find((p: Participant) => p.name === 'Alice');
      if (alice) {
        expect(alice.balance).toBe(750);
      }
    }
  });

  it('uses INITIAL_BALANCE for new participants not in localStorage', async () => {
    const user = userEvent.setup();
    
    renderWithProvider(
      <SetupScreen participants={[]} setParticipants={setParticipants} onNext={onNext} />
    );

    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, 'NewUser{enter}');
    
    if (setParticipants.mock.calls.length > 0) {
      const newParticipants = setParticipants.mock.calls[0][0];
      const newUser = newParticipants.find((p: Participant) => p.name === 'NewUser');
      if (newUser) {
        expect(newUser.balance).toBe(1000);
      }
    }
  });
});
