import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryModal } from '../components/HistoryModal';
import { LanguageProvider } from '../contexts/LanguageContext';
import React from 'react';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
};

describe('HistoryModal', () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
  });

  it('returns null when not open', () => {
    const { container } = renderWithProvider(
      <HistoryModal isOpen={false} onClose={onClose} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders when open', () => {
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    expect(screen.getByText('Banco & Histórico')).toBeInTheDocument();
  });

  it('shows leaderboard tab by default', () => {
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    expect(screen.getByText('Saldo dos Jogadores')).toBeInTheDocument();
  });

  it('shows empty state when no wallet data', () => {
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    expect(screen.getByText('No wallet data found.')).toBeInTheDocument();
  });

  it('shows wallet data from localStorage', () => {
    localStorage.setItem('dailybet_wallets', JSON.stringify({
      'Alice': 1500,
      'Bob': 800,
    }));
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('$1500')).toBeInTheDocument();
    expect(screen.getByText('$800')).toBeInTheDocument();
  });

  it('sorts wallets by balance descending', () => {
    localStorage.setItem('dailybet_wallets', JSON.stringify({
      'Alice': 500,
      'Bob': 1500,
      'Charlie': 1000,
    }));
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    
    const names = screen.getAllByText(/Alice|Bob|Charlie/);
    expect(names[0].textContent).toBe('Bob');
    expect(names[1].textContent).toBe('Charlie');
    expect(names[2].textContent).toBe('Alice');
  });

  it('can switch to timeline tab', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    
    await user.click(screen.getByText('Timeline'));
    expect(screen.getByText('Sem histórico ainda.')).toBeInTheDocument();
  });

  it('shows history entries in timeline tab', async () => {
    const user = userEvent.setup();
    localStorage.setItem('dailybet_history', JSON.stringify([{
      id: 'h1',
      date: '2025-01-01T12:00:00Z',
      winnerName: 'Alice',
      winnerAvatar: 'bg-red-500',
      winnerId: 'p1',
      totalPool: 300
    }]));
    
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    
    await user.click(screen.getByText('Timeline'));
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('POT: $300')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    
    const closeBtn = screen.getByText('Fechar');
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('resets data when confirm dialog accepted', async () => {
    const user = userEvent.setup();
    localStorage.setItem('dailybet_wallets', JSON.stringify({ 'Alice': 1000 }));
    localStorage.setItem('dailybet_history', JSON.stringify([{ id: 'h1' }]));
    
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    
    // Find the trash/reset button
    const buttons = screen.getAllByRole('button');
    const resetBtn = buttons.find(b => b.className.includes('bg-red-900'));
    if (resetBtn) {
      await user.click(resetBtn);
    }
    
    expect(localStorage.getItem('dailybet_wallets')).toBeNull();
    expect(localStorage.getItem('dailybet_history')).toBeNull();
    
    vi.restoreAllMocks();
  });

  it('does not reset data when confirm dialog rejected', async () => {
    const user = userEvent.setup();
    localStorage.setItem('dailybet_wallets', JSON.stringify({ 'Alice': 1000 }));
    
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    renderWithProvider(
      <HistoryModal isOpen={true} onClose={onClose} />
    );
    
    const buttons = screen.getAllByRole('button');
    const resetBtn = buttons.find(b => b.className.includes('bg-red-900'));
    if (resetBtn) {
      await user.click(resetBtn);
    }
    
    expect(localStorage.getItem('dailybet_wallets')).not.toBeNull();
    
    vi.restoreAllMocks();
  });
});
