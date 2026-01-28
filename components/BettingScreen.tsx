import React, { useState, useEffect } from 'react';
import { Participant, Bet } from '../types';
import { Button } from './ui/Button';
import { ChevronRight, Wallet, DollarSign, ShieldBan, CheckCircle2, RotateCcw } from 'lucide-react';
import { PRESET_BET_AMOUNTS, BET_AMOUNT as DEFAULT_BET, BUYOUT_COST } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface BettingScreenProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  onComplete: (bets: Bet[]) => void;
}

export const BettingScreen: React.FC<BettingScreenProps> = ({ participants, setParticipants, onComplete }) => {
  const { t } = useLanguage();
  
  // Queue system: [0, 1, 2...] indices of participants who need to bet
  const [bettingQueue, setBettingQueue] = useState<number[]>(() => participants.map((_, i) => i));
  const [queueIndex, setQueueIndex] = useState(0);
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [rebetNotification, setRebetNotification] = useState<string | null>(null);

  // Derive current bettor from the queue
  const currentParticipantIndex = bettingQueue[queueIndex];
  const currentBettor = participants[currentParticipantIndex];

  useEffect(() => {
    // Reset inputs when user changes
    if (currentBettor) {
        const initialBet = Math.min(DEFAULT_BET, currentBettor.balance);
        setBetAmount(initialBet > 0 ? initialBet : 0);
        setSelectedCandidateId(null);
        setRebetNotification(null);
    }
  }, [currentBettor]);

  const handleConfirmBet = () => {
    if (!selectedCandidateId || betAmount <= 0 || betAmount > currentBettor.balance) return;

    const newBet: Bet = {
        bettorId: currentBettor.id,
        chosenCandidateId: selectedCandidateId,
        amount: betAmount
    };

    const updatedBets = [...bets, newBet];
    setBets(updatedBets);

    // Advance Queue
    if (queueIndex < bettingQueue.length - 1) {
        setQueueIndex(prev => prev + 1);
    } else {
        onComplete(updatedBets);
    }
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
      // If anyone previously voted for this user (who is now immune), invalidate their bet and add them to queue
      const invalidBets = bets.filter(b => b.chosenCandidateId === currentBettor.id);
      
      if (invalidBets.length > 0) {
          // Remove invalid bets
          const validBets = bets.filter(b => b.chosenCandidateId !== currentBettor.id);
          setBets(validBets);

          // Find the original indices of the people who need to bet again
          const indicesToReplay = invalidBets.map(b => 
              participants.findIndex(p => p.id === b.bettorId)
          );

          // Add them to the end of the queue
          setBettingQueue(prev => {
              // Ensure we don't add duplicates if logic gets complex, though unique indices is simpler
              const newQueue = [...prev, ...indicesToReplay];
              return newQueue;
          });

          setRebetNotification(`${invalidBets.length} aposta(s) em você foram canceladas. Os apostadores jogarão novamente.`);
      }

      // 4. Do NOT advance turn. User stays to place their own bet.
  };

  const setMaxBet = () => {
      setBetAmount(currentBettor.balance);
  };

  if (!currentBettor) return null;

  const progress = ((queueIndex) / bettingQueue.length) * 100;
  const isBalanceLow = currentBettor.balance < betAmount;
  
  // Detect if this is a "Re-bet" turn (simple check: if queue index is greater than original count)
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

      {rebetNotification && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/50 p-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <RotateCcw className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-200">{rebetNotification}</p>
          </div>
      )}

      {/* Candidate Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
        {participants.map((candidate) => {
          const isImmune = candidate.isImmune;
          const isDisabled = isImmune; 

          return (
            <button
                key={candidate.id}
                onClick={() => !isDisabled && setSelectedCandidateId(candidate.id)}
                disabled={isDisabled}
                className={`
                relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
                ${selectedCandidateId === candidate.id 
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105 z-10' 
                    : isDisabled 
                        ? 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed grayscale' 
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
                <span className={`font-semibold text-sm ${selectedCandidateId === candidate.id ? 'text-white' : 'text-slate-300'}`}>
                {candidate.name}
                </span>
                {selectedCandidateId === candidate.id && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                )}
                {isImmune && <span className="text-[10px] uppercase font-bold text-indigo-400">IMUNE</span>}
            </button>
          );
        })}
      </div>

      {/* Amount Selection */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-8 relative overflow-hidden">
        {/* Subtle Tiger Watermark */}
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
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className={`bg-transparent w-20 text-right font-mono font-bold focus:outline-none ${isBalanceLow ? 'text-red-400' : 'text-white'}`}
                        min="1"
                        max={currentBettor.balance}
                    />
                </div>
            </div>
        </div>
        <div className="flex gap-2 justify-between overflow-x-auto pb-2 relative z-10">
            {PRESET_BET_AMOUNTS.map(amount => (
                <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={amount > currentBettor.balance}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed
                        ${betAmount === amount 
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
      </div>

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
            disabled={!selectedCandidateId || betAmount <= 0 || betAmount > currentBettor.balance}
            className="flex-[2] text-lg py-4 flex items-center justify-center gap-2"
          >
            {t.confirmBet} <ChevronRight className="w-5 h-5" />
          </Button>
      </div>

      <div className="mt-4 text-center text-slate-500 text-sm">
        {t.step} {queueIndex + 1} {t.of} {bettingQueue.length}
      </div>
    </div>
  );
};