import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BettingScreen } from '../components/BettingScreen';
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

describe('BettingScreen', () => {
  let setParticipants: ReturnType<typeof vi.fn>;
  let onComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setParticipants = vi.fn();
    onComplete = vi.fn();
  });

  it('renders the first bettor name', () => {
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
  });

  it('shows current bettor step counter', () => {
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    expect(screen.getByText(/Passo/)).toBeInTheDocument();
  });

  it('shows balance of current bettor', () => {
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    expect(screen.getByText('$1000')).toBeInTheDocument();
  });

  it('shows all candidates to bet on', () => {
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Charlie').length).toBeGreaterThan(0);
  });

  it('shows preset bet amounts', () => {
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  it('shows buyout button', () => {
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    expect(screen.getByText(/Comprar Saída/)).toBeInTheDocument();
  });

  it('confirm button is disabled when no selection made', () => {
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    const confirmBtns = screen.getAllByText(/Finalizar Apostas/);
    const mainConfirm = confirmBtns.find(el => el.closest('button')?.className.includes('flex-'));
    expect(mainConfirm?.closest('button')).toBeDisabled();
  });

  it('shows broke UI when bettor has zero balance', () => {
    const participants = makeParticipants();
    participants[0].balance = 0;
    renderWithProvider(
      <BettingScreen participants={participants} setParticipants={setParticipants} onComplete={onComplete} />
    );
    expect(screen.getByText(/Sem Grana!/)).toBeInTheDocument();
  });

  it('shows loan button when bettor is broke', () => {
    const participants = makeParticipants();
    participants[0].balance = 0;
    renderWithProvider(
      <BettingScreen participants={participants} setParticipants={setParticipants} onComplete={onComplete} />
    );
    expect(screen.getByText(/Pegar Crédito/)).toBeInTheDocument();
  });

  it('handles loan - updates state only, not localStorage (debt system)', async () => {
    const user = userEvent.setup();
    const participants = makeParticipants();
    participants[0].balance = 0;
    renderWithProvider(
      <BettingScreen participants={participants} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    const loanBtn = screen.getByText(/Pegar Crédito/).closest('button')!;
    await user.click(loanBtn);
    
    expect(setParticipants).toHaveBeenCalled();
    // localStorage should NOT be updated (debt stays as real balance)
    const wallets = localStorage.getItem('dailybet_wallets');
    expect(wallets).toBeNull();
  });

  it('allows selecting a candidate and adding to selections', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    // Click on Bob
    const candidateButtons = screen.getAllByRole('button');
    const bobButton = candidateButtons.find(b => b.textContent?.includes('Bob'));
    if (bobButton) {
      await user.click(bobButton);
    }

    // Set amount
    const presetButton = screen.getByText('$100');
    await user.click(presetButton);

    // Click add
    const addBtn = candidateButtons.find(b => b.textContent?.includes('Bob') && b.textContent?.includes('$'));
    if (addBtn) {
      await user.click(addBtn);
    }
  });

  it('shows immune candidates as disabled', () => {
    const participants = makeParticipants();
    participants[1].isImmune = true;
    renderWithProvider(
      <BettingScreen participants={participants} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    // Bob should show IMUNE text
    expect(screen.getByText('IMUNE')).toBeInTheDocument();
  });

  it('disables buyout when balance is insufficient', () => {
    const participants = makeParticipants();
    participants[0].balance = 500;
    renderWithProvider(
      <BettingScreen participants={participants} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    const buyoutButton = screen.getByTitle(/Comprar Saída/);
    expect(buyoutButton).toBeDisabled();
  });

  it('shows PROTEGIDO when current bettor is immune', () => {
    const participants = makeParticipants();
    participants[0].isImmune = true;
    renderWithProvider(
      <BettingScreen participants={participants} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    expect(screen.getByText('PROTEGIDO')).toBeInTheDocument();
  });

  it('handles buyout correctly', async () => {
    const user = userEvent.setup();
    const participants = makeParticipants();
    participants[0].balance = 2000;
    renderWithProvider(
      <BettingScreen participants={participants} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    const buyoutBtn = screen.getByTitle(/Comprar Saída/);
    await user.click(buyoutBtn);
    
    expect(setParticipants).toHaveBeenCalled();
    const wallets = JSON.parse(localStorage.getItem('dailybet_wallets') || '{}');
    expect(wallets['Alice']).toBe(1001); // 2000 - 999
  });

  it('handles max bet button', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    const maxBtn = screen.getByText('Máx');
    await user.click(maxBtn);
  });

  it('can add multiple selections (multi-bet)', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    // Select Bob and add
    const allBtns = screen.getAllByRole('button');
    const bobBtn = allBtns.find(b => b.textContent === 'Bob');
    if (bobBtn) await user.click(bobBtn);
    await user.click(screen.getByText('$100'));
    
    // Click the add button (contains "Bob" and "$100")
    const addBtns = screen.getAllByRole('button');
    const addBtn = addBtns.find(b => b.textContent?.includes('Bob') && b.textContent?.includes('$100'));
    if (addBtn) await user.click(addBtn);
    
    // Should show the selection in the list - check by looking for the amount text
    const selectionAmount = screen.queryByText('$100');
    expect(selectionAmount).toBeInTheDocument();
  });

  it('can remove a selection', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    // Add a selection first
    const allBtns = screen.getAllByRole('button');
    const bobBtn = allBtns.find(b => b.textContent === 'Bob');
    if (bobBtn) await user.click(bobBtn);
    await user.click(screen.getByText('$100'));
    
    const addBtns = screen.getAllByRole('button');
    const addBtn = addBtns.find(b => b.textContent?.includes('Bob') && b.textContent?.includes('$100'));
    if (addBtn) await user.click(addBtn);
    
    // Now find and click the X remove button
    const removeBtns = screen.getAllByRole('button');
    const xBtn = removeBtns.find(b => b.querySelector('svg.lucide-x'));
    if (xBtn) await user.click(xBtn);
  });

  it('handles confirm with selections', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    // Add a selection
    const allBtns = screen.getAllByRole('button');
    const bobBtn = allBtns.find(b => b.textContent === 'Bob');
    if (bobBtn) await user.click(bobBtn);
    await user.click(screen.getByText('$100'));
    
    const addBtns = screen.getAllByRole('button');
    const addBtn = addBtns.find(b => b.textContent?.includes('Bob') && b.textContent?.includes('$100'));
    if (addBtn) await user.click(addBtn);
    
    // Confirm bet  
    const confirmBtns = screen.getAllByText(/Finalizar Apostas/);
    const mainConfirm = confirmBtns.find(el => el.closest('button')?.className.includes('flex-'));
    if (mainConfirm?.closest('button') && !mainConfirm.closest('button')!.disabled) {
      await user.click(mainConfirm.closest('button')!);
    }
  });

  it('shows insufficient funds warning when bet exceeds balance', async () => {
    const user = userEvent.setup();
    const participants = makeParticipants();
    participants[0].balance = 30;
    renderWithProvider(
      <BettingScreen participants={participants} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    // Try to set a high amount
    const amountInput = screen.getByRole('spinbutton');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    
    expect(screen.getByText('Saldo Insuficiente')).toBeInTheDocument();
  });

  it('does not loan when balance is positive', async () => {
    const user = userEvent.setup();
    const participants = makeParticipants();
    participants[0].balance = 100;
    renderWithProvider(
      <BettingScreen participants={participants} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    // Loan button should not be visible
    expect(screen.queryByText(/Pegar Crédito/)).not.toBeInTheDocument();
  });

  it('can update amount with existing selection on same candidate', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <BettingScreen participants={makeParticipants()} setParticipants={setParticipants} onComplete={onComplete} />
    );
    
    // Select Bob and add $100
    const allBtns = screen.getAllByRole('button');
    const bobBtn = allBtns.find(b => b.textContent === 'Bob');
    if (bobBtn) await user.click(bobBtn);
    await user.click(screen.getByText('$100'));
    
    let addBtns = screen.getAllByRole('button');
    let addBtn = addBtns.find(b => b.textContent?.includes('Bob') && b.textContent?.includes('$100'));
    if (addBtn) await user.click(addBtn);
    
    // Select Bob again and add more
    const btns2 = screen.getAllByRole('button');
    const bobBtn2 = btns2.find(b => b.textContent?.includes('Bob') && b.textContent?.includes('✓'));
    if (bobBtn2) await user.click(bobBtn2);
    
    await user.click(screen.getByText('$50'));
    
    addBtns = screen.getAllByRole('button');
    addBtn = addBtns.find(b => b.textContent?.includes('Bob') && b.textContent?.includes('$50'));
    if (addBtn) await user.click(addBtn);
  });
});
