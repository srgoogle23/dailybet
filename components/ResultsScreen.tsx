import React, { useEffect, useState } from 'react';
import { Participant, Bet, HistoryEntry } from '../types';
import { Button } from './ui/Button';
import { Trophy, RefreshCw, Frown, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultsScreenProps {
  participants: Participant[];
  bets: Bet[];
  winnerId: string;
  onReset: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ participants, bets, winnerId, onReset }) => {
  const { t } = useLanguage();
  const winner = participants.find(p => p.id === winnerId)!;
  const [showDetails, setShowDetails] = useState(false);
  const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);

  // Results calculation state to ensure we only process finances once
  const [resultsCalculated, setResultsCalculated] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowDetails(true), 500);

    const calculateAndSave = () => {
        // Prevent double calculation
        if (resultsCalculated) return;
        
        // Unique key for this specific round result to prevent reprocessing on reload
        const processedKey = `dailybet_processed_${winnerId}_${totalPool}_${bets.length}`;
        if (localStorage.getItem(processedKey)) {
            setResultsCalculated(true);
            return;
        }

        // 1. Calculate new balances
        const storage = localStorage.getItem('dailybet_wallets');
        const wallets: Record<string, number> = storage ? JSON.parse(storage) : {};

        // Helper to get current wallet value from storage (most accurate source of truth)
        // If not in storage, fall back to the participant prop, but storage should have the Buyout updates.
        const getWallet = (name: string, fallback: number) => {
            return wallets[name] !== undefined ? wallets[name] : fallback;
        };

        const winningBets = bets.filter(b => b.chosenCandidateId === winnerId);
        const totalBetOnWinner = winningBets.reduce((sum, b) => sum + b.amount, 0);

        // Process bets
        bets.forEach(bet => {
            const bettor = participants.find(p => p.id === bet.bettorId);
            if (!bettor) return;

            // Get balance. This balance ALREADY has the buyout deduction (-999) if they bought out,
            // because handleBuyout updated localStorage.
            let currentBalance = getWallet(bettor.name, bettor.balance);
            
            // Deduct the bet amount
            currentBalance -= bet.amount;

            // Add winnings if applicable
            if (bet.chosenCandidateId === winnerId && totalBetOnWinner > 0) {
                 const share = bet.amount / totalBetOnWinner;
                 const totalPayout = Math.floor(share * totalPool);
                 currentBalance += totalPayout;
            }

            wallets[bettor.name] = currentBalance;
        });

        // Save wallets
        localStorage.setItem('dailybet_wallets', JSON.stringify(wallets));
        
        // 2. Save History
        const newEntry: HistoryEntry = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            winnerName: winner.name,
            winnerAvatar: winner.avatarColor,
            winnerId: winner.id,
            totalPool: totalPool
        };

        const existingHistoryStr = localStorage.getItem('dailybet_history');
        const existingHistory = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
        const updatedHistory = [...existingHistory, newEntry];
        localStorage.setItem('dailybet_history', JSON.stringify(updatedHistory));
        
        // Mark as processed
        localStorage.setItem(processedKey, 'true');
        setResultsCalculated(true);
    };

    calculateAndSave();
  }, [winner, totalPool, winnerId, bets, participants, resultsCalculated]);

  // View Logic (Calculation for display only, separate from persistence)
  const winningBets = bets.filter(b => b.chosenCandidateId === winnerId);
  const totalBetOnWinner = winningBets.reduce((sum, b) => sum + b.amount, 0);
  
  const participantResults = participants.map(p => {
    const userBet = bets.find(b => b.bettorId === p.id);
    const didWin = userBet?.chosenCandidateId === winnerId;
    
    let profit = 0;
    
    if (didWin && userBet && totalBetOnWinner > 0) {
        const share = userBet.amount / totalBetOnWinner;
        const totalPayout = Math.floor(share * totalPool);
        profit = totalPayout - userBet.amount;
    } else if (userBet) {
        profit = -userBet.amount;
    }
    
    return {
        participant: p,
        didWin,
        profit,
        betAmount: userBet?.amount || 0,
        votedFor: participants.find(c => c.id === userBet?.chosenCandidateId)?.name || '?'
    };
  }).sort((a, b) => b.profit - a.profit);

  return (
    <div className="max-w-3xl mx-auto w-full p-6 animate-in zoom-in-95 duration-700">
      
      {/* Winner Spotlight */}
      <div className="text-center mb-12">
        <div className="inline-block relative">
            <Trophy className="w-16 h-16 text-yellow-400 absolute -top-10 -right-8 animate-bounce" />
            <div className={`w-40 h-40 mx-auto rounded-full ${winner.avatarColor} flex items-center justify-center text-6xl font-bold text-white shadow-[0_0_60px_rgba(234,179,8,0.4)] ring-8 ring-slate-800`}>
                {winner.name.substring(0, 2).toUpperCase()}
            </div>
        </div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2">{t.winnerTitle}</h2>
        <h1 className="text-5xl font-black text-white mb-2">{winner.name}</h1>
      </div>

      {/* Payout Summary */}
      <div className={`transition-all duration-700 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-700">
                <div>
                    <p className="text-slate-400 text-sm mb-1">{t.totalPool}</p>
                    <p className="text-2xl font-mono font-bold text-white">${totalPool}</p>
                </div>
                <div>
                    <p className="text-slate-400 text-sm mb-1">{t.winners}</p>
                    <p className="text-2xl font-mono font-bold text-indigo-400">{winningBets.length}</p>
                </div>
            </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-4">{t.betSummary}</h3>
        <div className="space-y-3">
            {participantResults.map((res) => (
                <div key={res.participant.id} className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${res.participant.avatarColor} flex items-center justify-center text-sm font-bold text-white`}>
                            {res.participant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-white">{res.participant.name}</p>
                            <div className="flex gap-2 text-xs">
                                <span className="text-slate-400">{t.betOn} <span className="text-slate-200">${res.betAmount}</span> {t.on}</span>
                                <span className="text-indigo-300 font-bold">{res.votedFor}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        {res.didWin ? (
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="font-mono font-bold text-xl">+${res.profit}</span>
                                </div>
                                <span className="text-[10px] text-emerald-500/70 uppercase font-bold">{t.profit}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-400 opacity-60">
                                <Frown className="w-4 h-4" />
                                <span className="font-mono font-bold">-${res.betAmount}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-12 flex justify-center">
            <Button onClick={onReset} variant="secondary" className="gap-2 flex items-center">
                <RefreshCw className="w-4 h-4" /> {t.newDraw}
            </Button>
        </div>
      </div>
    </div>
  );
};