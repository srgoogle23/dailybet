import React from 'react';
import { Participant, Bet, OddCalculation } from '../types';
import { Button } from './ui/Button';
import { PlayCircle, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OddsScreenProps {
  participants: Participant[];
  bets: Bet[];
  onStartRoulette: () => void;
}

export const OddsScreen: React.FC<OddsScreenProps> = ({ participants, bets, onStartRoulette }) => {
  const { t } = useLanguage();
  const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);

  // Calculate Odds
  const oddsData: OddCalculation[] = participants.map(participant => {
    // Total amount bet on this specific candidate
    const amountBetOnCandidate = bets
        .filter(b => b.chosenCandidateId === participant.id)
        .reduce((sum, b) => sum + b.amount, 0);
    
    let multiplier = 0;
    if (amountBetOnCandidate > 0) {
      multiplier = totalPool / amountBetOnCandidate;
    } else {
        multiplier = 99.99;
    }

    multiplier = Math.round(multiplier * 100) / 100;

    return {
      candidateId: participant.id,
      totalBets: bets.filter(b => b.chosenCandidateId === participant.id).length, 
      multiplier,
      potentialPayout: 0 
    };
  }).sort((a, b) => a.multiplier - b.multiplier);

  return (
    <div className="max-w-4xl mx-auto w-full p-6 animate-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <TrendingUp className="text-emerald-400" />
          {t.oddsTitle}
        </h1>
        <p className="text-slate-400">{t.oddsSubtitle}</p>
        <div className="mt-4 inline-block bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-sm uppercase mr-2">{t.totalPool}</span>
            <span className="text-emerald-400 font-mono text-xl font-bold">${totalPool}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {oddsData.map((odd) => {
            const participant = participants.find(p => p.id === odd.candidateId)!;
            const isZero = odd.totalBets === 0;
            const isFavorite = !isZero && odd.multiplier === Math.min(...oddsData.filter(o => o.totalBets > 0).map(o => o.multiplier));
            
            const amountOnCandidate = bets.filter(b => b.chosenCandidateId === odd.candidateId).reduce((s, b) => s + b.amount, 0);

            return (
                <div key={odd.candidateId} className="bg-slate-800 rounded-xl p-4 border border-slate-700 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                    {isFavorite && (
                        <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 text-xs font-bold px-2 py-1 rounded-bl-lg">
                            {t.favorite}
                        </div>
                    )}
                    {isZero && (
                        <div className="absolute top-0 right-0 bg-pink-500/20 text-pink-500 text-xs font-bold px-2 py-1 rounded-bl-lg">
                            {t.underdog}
                        </div>
                    )}

                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full ${participant.avatarColor} flex items-center justify-center text-lg font-bold text-white ring-2 ring-slate-900`}>
                            {participant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">{participant.name}</h3>
                            <p className="text-xs text-slate-400">${amountOnCandidate} apostados</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-end bg-slate-900/50 p-3 rounded-lg">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Odd</p>
                            <p className="text-2xl font-mono font-bold text-indigo-400">
                                {isZero ? '-' : `${odd.multiplier.toFixed(2)}x`}
                            </p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-slate-500 uppercase font-bold">{t.bets}</p>
                             <p className="text-lg font-mono font-bold text-emerald-400">
                                {odd.totalBets}
                             </p>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      <div className="flex justify-center">
        <Button 
            onClick={onStartRoulette} 
            className="px-12 py-4 text-xl shadow-indigo-500/40 shadow-2xl animate-pulse hover:animate-none"
        >
            <span className="flex items-center gap-3">
                {t.spinRoulette} <PlayCircle className="w-6 h-6" />
            </span>
        </Button>
      </div>
    </div>
  );
};