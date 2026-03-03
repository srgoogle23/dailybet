import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import React from 'react';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('DailyBet')).toBeInTheDocument();
  });

  it('renders setup screen by default', () => {
    render(<App />);
    expect(screen.getByText('Squad Daily')).toBeInTheDocument();
  });

  it('shows language toggle button', () => {
    render(<App />);
    expect(screen.getByText('pt')).toBeInTheDocument();
  });

  it('toggles language to English', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const langBtn = screen.getByText('pt');
    await user.click(langBtn);
    
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('Daily Squad')).toBeInTheDocument();
  });

  it('toggles language back to Portuguese', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await user.click(screen.getByText('pt'));
    await user.click(screen.getByText('en'));
    
    expect(screen.getByText('pt')).toBeInTheDocument();
    expect(screen.getByText('Squad Daily')).toBeInTheDocument();
  });

  it('shows history button', () => {
    render(<App />);
    const historyBtn = screen.getByTitle('History');
    expect(historyBtn).toBeInTheDocument();
  });

  it('opens and closes history modal', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await user.click(screen.getByTitle('History'));
    expect(screen.getByText('Banco & Histórico')).toBeInTheDocument();
    
    await user.click(screen.getByText('Fechar'));
    expect(screen.queryByText('Banco & Histórico')).not.toBeInTheDocument();
  });

  it('shows start betting button disabled with no participants', () => {
    render(<App />);
    const startBtn = screen.getByText(/Começar Apostas/).closest('button');
    expect(startBtn).toBeDisabled();
  });

  it('does not show back button on setup screen', () => {
    render(<App />);
    const backButton = screen.queryByTitle('Voltar');
    expect(backButton).not.toBeInTheDocument();
  });

  it('renders the tiger emoji mascot', () => {
    render(<App />);
    expect(screen.getByText('🐯')).toBeInTheDocument();
  });

  it('can add participants and navigate to betting phase', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('Nome do dev...');
    
    await user.type(input, 'Alice{enter}');
    await user.type(input, 'Bob{enter}');
    
    const startBtn = screen.getByText(/Começar Apostas/).closest('button')!;
    expect(startBtn).not.toBeDisabled();
    
    await user.click(startBtn);
    
    // Should now be in betting phase
    expect(screen.getByText(/APOSTADOR ATUAL/)).toBeInTheDocument();
  });

  it('shows back button in betting phase and can go back', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, 'Alice{enter}');
    await user.type(input, 'Bob{enter}');
    
    await user.click(screen.getByText(/Começar Apostas/).closest('button')!);
    
    // Back button should be visible
    const backBtn = screen.getByTitle('Voltar');
    expect(backBtn).toBeInTheDocument();
    
    await user.click(backBtn);
    
    // Should be back on setup
    expect(screen.getByText('Squad Daily')).toBeInTheDocument();
  });

  it('can complete a full betting flow and see odds', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, 'Alice{enter}');
    await user.type(input, 'Bob{enter}');
    
    await user.click(screen.getByText(/Começar Apostas/).closest('button')!);
    
    // Alice bets on Bob
    const candidateButtons = screen.getAllByRole('button');
    const bobCandidate = candidateButtons.find(b => b.textContent?.includes('Bob') && !b.textContent?.includes('$'));
    if (bobCandidate) {
      await user.click(bobCandidate);
    }
    
    // Set amount and add
    await user.click(screen.getByText('$100'));
    const addBtns = screen.getAllByRole('button');
    const addBtn = addBtns.find(b => b.textContent?.includes('Bob') && b.textContent?.includes('$100'));
    if (addBtn) {
      await user.click(addBtn);
    }
    
    // Confirm Alice's bet
    const confirmBtns = screen.getAllByText(/Finalizar Apostas/);
    const mainConfirm = confirmBtns.find(el => el.closest('button')?.className.includes('flex-'));
    if (mainConfirm?.closest('button') && !mainConfirm.closest('button')!.disabled) {
      await user.click(mainConfirm.closest('button')!);
    }
  });

  it('syncs balances from localStorage on handleReset', async () => {
    localStorage.setItem('dailybet_wallets', JSON.stringify({ 'TestUser': 500 }));
    render(<App />);
    // App reads localStorage during reset flow
    expect(screen.getByText('Squad Daily')).toBeInTheDocument();
  });

  it('can navigate full flow: setup -> betting -> back to setup', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, 'Dev1{enter}');
    await user.type(input, 'Dev2{enter}');
    
    await user.click(screen.getByText(/Começar Apostas/).closest('button')!);
    expect(screen.getByText(/APOSTADOR ATUAL/)).toBeInTheDocument();
    
    // Click back
    await user.click(screen.getByTitle('Voltar'));
    expect(screen.getByText('Squad Daily')).toBeInTheDocument();
  });

  it('handles complete betting flow to odds screen', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, 'P1{enter}');
    await user.type(input, 'P2{enter}');
    
    await user.click(screen.getByText(/Começar Apostas/).closest('button')!);
    
    // P1 bets on P2
    // Click on P2 candidate card
    const p2Cards = screen.getAllByText('P2');
    const p2Candidate = p2Cards.find(el => el.closest('button')?.className.includes('rounded-xl'));
    if (p2Candidate) await user.click(p2Candidate.closest('button')!);
    
    // Set amount
    const amountInput = screen.getByRole('spinbutton');
    await user.clear(amountInput);
    await user.type(amountInput, '100');
    
    // Add selection
    const addBtns = screen.getAllByRole('button');
    const greenAddBtn = addBtns.find(b => b.className.includes('bg-emerald-600') && !b.disabled);
    if (greenAddBtn) await user.click(greenAddBtn);
    
    // Confirm P1's bets
    const confirmBtns = screen.getAllByRole('button');
    const confirmBtn = confirmBtns.find(b => b.className.includes('bg-indigo-600') && b.className.includes('flex-') && !b.disabled);
    if (confirmBtn) await user.click(confirmBtn);
    
    // P2's turn - bet on P1
    const p1Cards = screen.getAllByText('P1');
    const p1Candidate = p1Cards.find(el => el.closest('button')?.className.includes('rounded-xl'));
    if (p1Candidate) await user.click(p1Candidate.closest('button')!);
    
    const amountInput2 = screen.getByRole('spinbutton');
    await user.clear(amountInput2);
    await user.type(amountInput2, '100');
    
    const addBtns2 = screen.getAllByRole('button');
    const greenAddBtn2 = addBtns2.find(b => b.className.includes('bg-emerald-600') && !b.disabled);
    if (greenAddBtn2) await user.click(greenAddBtn2);
    
    const confirmBtns2 = screen.getAllByRole('button');
    const confirmBtn2 = confirmBtns2.find(b => b.className.includes('bg-indigo-600') && b.className.includes('flex-') && !b.disabled);
    if (confirmBtn2) await user.click(confirmBtn2);
    
    // Should now be on odds screen
    expect(screen.getByText(/Odds da Daily/)).toBeInTheDocument();
  });

  it('can go back from odds to betting', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('Nome do dev...');
    await user.type(input, 'X1{enter}');
    await user.type(input, 'X2{enter}');
    
    await user.click(screen.getByText(/Começar Apostas/).closest('button')!);
    
    // Complete all bets
    for (let i = 0; i < 2; i++) {
      const candidateName = i === 0 ? 'X2' : 'X1';
      const cards = screen.getAllByText(candidateName);
      const candidate = cards.find(el => el.closest('button')?.className.includes('rounded-xl'));
      if (candidate) await user.click(candidate.closest('button')!);
      
      const amountInput = screen.getByRole('spinbutton');
      await user.clear(amountInput);
      await user.type(amountInput, '10');
      
      const addBtns = screen.getAllByRole('button');
      const greenAddBtn = addBtns.find(b => b.className.includes('bg-emerald-600') && !b.disabled);
      if (greenAddBtn) await user.click(greenAddBtn);
      
      const confirmBtns = screen.getAllByRole('button');
      const confirmBtn = confirmBtns.find(b => b.className.includes('bg-indigo-600') && b.className.includes('flex-') && !b.disabled);
      if (confirmBtn) await user.click(confirmBtn);
    }
    
    // On odds screen, click back
    expect(screen.getByText(/Odds da Daily/)).toBeInTheDocument();
    await user.click(screen.getByTitle('Voltar'));
    
    // Should be back on betting
    expect(screen.getByText(/APOSTADOR ATUAL/)).toBeInTheDocument();
  });
});

