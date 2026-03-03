import React, { useState, useEffect } from 'react';
import { Participant, Bet } from '../types';
import { Button } from './ui/Button';
import { ChevronRight, Wallet, DollarSign, ShieldBan, CheckCircle2, RotateCcw, HandCoins, Plus, X } from 'lucide-react';
import { PRESET_BET_AMOUNTS, BET_AMOUNT as DEFAULT_BET, BUYOUT_COST, LOAN_AMOUNT } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface BettingScreenProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  onComplete: (bets: Bet[]) => void;
}

interface BetSelection {
  candidateId: string;
  amount: number;
}

export const BettingScreen: React.FC<BettingScreenProps> = ({ participants, setParticipants, onComplete }) => {
  const { t } = useLanguage();
  
  // Queue system: [0, 1, 2...] indices of participants who need to bet
  const [bettingQueue, setBettingQueue] = useState<number[]>(() => participants.map((_, i) => i));
  const [queueIndex, setQueueIndex] = useState(0);
  
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [currentCandidateId, setCurrentCandidateId] = useState<string | null>(null);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [rebetNotification, setRebetNotification] = useState<string | null>(null);

  // Derive current bettor from the queue
  const currentParticipantIndex = bettingQueue[queueIndex];
  const currentBettor = participants[currentParticipantIndex];

  const totalSelected = selections.reduce((sum, s) => sum + s.amount, 0);
  const remainingBalance = currentBettor ? currentBettor.balance - totalSelected : 0;

  useEffect(() => {
    // Reset inputs when user changes
    if (currentBettor) {
        setSelections([]);
        setCurrentCandidateId(null);
        setCurrentAmount(0);
        setRebetNotification(null);
    }
  }, [currentBettor]);

  const handleAddSelection = () => {
    if (!currentCandidateId || currentAmount <= 0 || currentAmount > remainingBalance) return;
    // Check if already selected this candidate
    const existing = selections.find(s => s.candidateId === currentCandidateId);
    if (existing) {
      setSelections(selections.map(s => 
        s.candidateId === currentCandidateId 
          ? { ...s, amount: s.amount + currentAmount } 
          : s
      ));
    } else {
      setSelections([...selections, { candidateId: currentCandidateId, amount: currentAmount }]);
    }
    setCurrentCandidateId(null);
    setCurrentAmount(Math.min(DEFAULT_BET, remainingBalance - currentAmount));
  };

  const handleRemoveSelection = (candidateId: string) => {
    setSelections(selections.filter(s => s.candidateId !== candidateId));
  };

  const handleConfirmBet = () => {
    if (selections.length === 0) return;

    const newBets: Bet[] = selections.map(s => ({
      bettorId: currentBettor.id,
      chosenCandidateId: s.candidateId,
      amount: s.amount
    }));

    const updatedBets = [...bets, ...newBets];
    setBets(updatedBets);

    // Advance Queue
    if (queueIndex < bettingQueue.length - 1) {
        setQueueIndex(prev => prev + 1);
    } else {
        onComplete(updatedBets);
    }
  };

  const handleLoan = () => {
    if (!currentBettor || currentBettor.balance > 0) return;
    
    // Only update React state — NOT localStorage.
    // This way ResultsScreen reads the real (0 or negative) balance from localStorage
    // and deducts the bet amount, naturally creating debt.
    // e.g. localStorage=0, bets 50, loses → 0-50 = -50
    // e.g. localStorage=-50, bets 50, loses → -50-50 = -100
    setParticipants(prev => prev.map(p => 
      p.id === currentBettor.id ? { ...p, balance: LOAN_AMOUNT } : p
    ));
  };

  const handleBuyout = (e: React.MouseEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      
      if (currentBettor.balance < BUYOUT_COST || currentBettor.isImmune) return;
      
      // 1. Update wallet in local storage
      const storage = localStorage.getItem('dailybet_wallets');
      const wallets = storage ? JSON.parse(storage) : {};
      const newBalance = currentBettor.balance - BUYOUT_COST;
      wallets[currentBettor.name] = newBalance;
      localStorage.setItem('dailybet_wallets', JSON.stringify(wallets));

      // 2. Update participants state globally
      setParticipants(prev => prev.map(p => 
          p.id === currentBettor.id 
            ? { ...p, balance: newBalance, isImmune: true } 
            : p
      ));

      // 3. CHECK FOR INVALID BETS (The "Re-bet" Logic)
      const invalidBets = bets.filter(b => b.chosenCandidateId === currentBettor.id);
      
      if (invalidBets.length > 0) {
          const validBets = bets.filter(b => b.chosenCandidateId !== currentBettor.id);
          setBets(validBets);

          const indicesToReplay = invalidBets.map(b => 
              participants.findIndex(p => p.id === b.bettorId)
          );

          setBettingQueue(prev => {
              const newQueue = [...prev, ...indicesToReplay];
              return newQueue;
          });

          setRebetNotification(`${invalidBets.length} aposta(s) em você foram canceladas. Os apostadores jogarão novamente.`);
      }
  };

  const setMaxBet = () => {
      setCurrentAmount(remainingBalance);
  };

  if (!currentBettor) return null;

  const progress = ((queueIndex) / bettingQueue.length) * 100;
  const isBalanceLow = currentAmount > remainingBalance;
  const isBroke = currentBettor.balance <= 0;
  
  // Detect if this is a "Re-bet" turn
  const isRebetTurn = queueIndex >= participants.length;

  return (
    <div className="max-w-2xl mx-auto w-full p-6 relative">
      
      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-indigo-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="text-center mb-8">
        <p className="text-slate-400 mb-2 uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-2">
            {t.currentBettor}
            {isRebetTurn && <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] animate-pulse">RE-BET</span>}
        </p>
        <div className="flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full ${currentBettor.avatarColor} flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-slate-800 mb-4 relative`}>
            {currentBettor.name.substring(0, 2).toUpperCase()}
            {currentBettor.isImmune && <div className="absolute -top-2 -right-2 bg-indigo-500 rounded-full p-1 shadow-lg animate-in zoom-in"><ShieldBan className="w-4 h-4 text-white" /></div>}
          </div>
          <h2 className="text-3xl font-bold text-white">
            <span className="text-indigo-400">{currentBettor.name}</span>, {t.whoWillPresent}
          </h2>
          <div className="mt-2 flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
             <Wallet className="w-4 h-4 text-emerald-400" />
             <span className="text-slate-200 font-mono font-bold">${currentBettor.balance}</span>
          </div>
        </div>
      </div>

      {/* Broke / Loan UI */}
      {isBroke && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 p-6 rounded-xl text-center animate-in fade-in slide-in-from-top-2">
          <HandCoins className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-300 mb-1">{t.brokeTitle}</h3>
          <p className="text-sm text-red-200/70 mb-4">
            <span className="font-bold">{currentBettor.name}</span> {t.brokeMessage}
          </p>
          <button
            onClick={handleLoan}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all active:scale-95 flex items-center gap-2 mx-auto"
          >
            <HandCoins className="w-5 h-5" />
            {t.getLoan} ({t.loanAmount} ${LOAN_AMOUNT})
          </button>
        </div>
      )}

      {rebetNotification && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/50 p-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <RotateCcw className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-200">{rebetNotification}</p>
          </div>
      )}

      {!isBroke && (
        <>
          {/* Candidate Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
            {participants.map((candidate) => {
              const isImmune = candidate.isImmune;
              const isDisabled = isImmune; 
              const isAlreadySelected = selections.some(s => s.candidateId === candidate.id);

              return (
                <button
                    key={candidate.id}
                    onClick={() => !isDisabled && setCurrentCandidateId(candidate.id)}
                    disabled={isDisabled}
                    className={`
                    relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
                    ${currentCandidateId === candidate.id 
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105 z-10' 
                        : isDisabled 
                            ? 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed grayscale' 
                            : isAlreadySelected
                                ? 'bg-emerald-900/20 border-emerald-500/50 opacity-90'
                                : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750 opacity-80 hover:opacity-100'}
                    `}
                >
                    <div className={`w-8 h-8 rounded-full ${candidate.avatarColor} flex items-center justify-center text-xs font-bold text-white relative`}>
                        {candidate.name.substring(0, 2).toUpperCase()}
                        {isImmune && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                <ShieldBan className="w-4 h-4 text-slate-300" />
                            </div>
                        )}
                    </div>
                    <span className={`font-semibold text-sm ${currentCandidateId === candidate.id ? 'text-white' : 'text-slate-300'}`}>
                    {candidate.name}
                    </span>
                    {currentCandidateId === candidate.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    )}
                    {isImmune && <span className="text-[10px] uppercase font-bold text-indigo-400">IMUNE</span>}
                    {isAlreadySelected && !isImmune && <span className="text-[10px] uppercase font-bold text-emerald-400">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Amount Selection + Add to selections */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-4 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-[6rem] opacity-5 pointer-events-none select-none grayscale">🐯</div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> {t.betAmount}
                </span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={setMaxBet}
                        className="text-[10px] uppercase font-bold bg-slate-700 hover:bg-slate-600 text-indigo-300 px-2 py-1 rounded"
                    >
                        {t.maxBet}
                    </button>
                    <div className={`flex items-center bg-slate-900 rounded-lg px-3 py-1 border transition-colors ${isBalanceLow ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-700 focus-within:border-indigo-500'}`}>
                        <DollarSign className="w-4 h-4 text-emerald-400 mr-1" />
                        <input 
                            type="number" 
                            value={currentAmount}
                            onChange={(e) => setCurrentAmount(Number(e.target.value))}
                            className={`bg-transparent w-20 text-right font-mono font-bold focus:outline-none ${isBalanceLow ? 'text-red-400' : 'text-white'}`}
                            min="1"
                            max={remainingBalance}
                        />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 justify-between overflow-x-auto pb-2 relative z-10">
                {PRESET_BET_AMOUNTS.map(amount => (
                    <button
                        key={amount}
                        onClick={() => setCurrentAmount(amount)}
                        disabled={amount > remainingBalance}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed
                            ${currentAmount === amount 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                        `}
                    >
                        ${amount}
                    </button>
                ))}
            </div>
            {isBalanceLow && (
                <div className="text-red-400 text-xs font-bold text-right mt-1">{t.insufficientFunds}</div>
            )}

            {/* Add selection button */}
            <div className="mt-3 relative z-10">
              <button
                onClick={handleAddSelection}
                disabled={!currentCandidateId || currentAmount <= 0 || currentAmount > remainingBalance}
                className="w-full py-2 rounded-lg text-sm font-bold transition-all bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {currentCandidateId 
                  ? `${participants.find(p => p.id === currentCandidateId)?.name} - $${currentAmount}`
                  : t.selectCandidate
                }
              </button>
            </div>
          </div>

          {/* Current selections list */}
          {selections.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs text-slate-400 uppercase font-bold mb-2">{t.bets} ({selections.length}) — ${t.balance}: ${remainingBalance}</p>
              {selections.map(sel => {
                const candidate = participants.find(p => p.id === sel.candidateId);
                return (
                  <div key={sel.candidateId} className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${candidate?.avatarColor} flex items-center justify-center text-[10px] font-bold text-white`}>
                        {candidate?.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-200 font-medium">{candidate?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400 text-sm">${sel.amount}</span>
                      <button onClick={() => handleRemoveSelection(sel.candidateId)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="flex gap-3">
          {/* Buyout Button */}
          <button
              type="button"
              onClick={handleBuyout}
              disabled={currentBettor.balance < BUYOUT_COST || currentBettor.isImmune}
              className={`flex-1 py-4 rounded-lg font-bold transition-all border-2 flex items-center justify-center gap-2
                  ${currentBettor.isImmune 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 opacity-100'
                    : currentBettor.balance >= BUYOUT_COST 
                      ? 'border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 active:scale-95' 
                      : 'border-slate-800 text-slate-600 cursor-not-allowed opacity-50'}
              `}
              title={`${t.buyout} (-$${BUYOUT_COST})`}
          >
              {currentBettor.isImmune ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs uppercase font-black">PROTEGIDO</span>
                  </>
              ) : (
                  <>
                    <ShieldBan className="w-5 h-5" />
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-xs uppercase">{t.buyout}</span>
                        <span className="text-sm">-${BUYOUT_COST}</span>
                    </div>
                  </>
              )}
          </button>

          {/* Confirm Bet Button */}
          <Button 
            onClick={handleConfirmBet} 
            disabled={selections.length === 0}
            className="flex-[2] text-lg py-4 flex items-center justify-center gap-2"
          >
            {t.finalizeBets} ({selections.length}) <ChevronRight className="w-5 h-5" />
          </Button>
      </div>

      <div className="mt-4 text-center text-slate-500 text-sm">
        {t.step} {queueIndex + 1} {t.of} {bettingQueue.length}
      </div>
    </div>
  );
};