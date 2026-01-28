import React, { useEffect, useState } from 'react';
import { Participant } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface RouletteScreenProps {
  participants: Participant[];
  onFinish: (winnerId: string) => void;
}

export const RouletteScreen: React.FC<RouletteScreenProps> = ({ participants, onFinish }) => {
  const { t } = useLanguage();
  const [winner, setWinner] = useState<Participant | null>(null);
  const [rouletteItems, setRouletteItems] = useState<Participant[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Visual Configuration
  const CARD_WIDTH = 180; 
  const WINNING_INDEX = 75; 
  const TOTAL_ITEMS = 100;

  useEffect(() => {
    // Filter participants to exclude immune ones
    const eligibleParticipants = participants.filter(p => !p.isImmune);
    
    // Safety check: if everyone bought out, fallback to all (or handle error)
    // For now, if everyone buys out, the show must go on (chaos mode: anyone can win)
    const candidates = eligibleParticipants.length > 0 ? eligibleParticipants : participants;

    // Cryptographically secure random number generator to fix bias
    const getRandomIndex = (max: number) => {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] % max;
    };

    const winnerIndex = getRandomIndex(candidates.length);
    const selectedWinner = candidates[winnerIndex];
    setWinner(selectedWinner);

    // Build the strip
    const items: Participant[] = [];
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        if (i === WINNING_INDEX) {
            items.push(selectedWinner);
        } else {
            // Fill with random eligible candidates
            items.push(candidates[getRandomIndex(candidates.length)]);
        }
    }
    setRouletteItems(items);

    const timer = setTimeout(() => {
        setIsSpinning(true);
    }, 500);

    const finishTimer = setTimeout(() => {
        onFinish(selectedWinner.id);
    }, 8500); 

    return () => {
        clearTimeout(timer);
        clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!winner) return null;

  // Use a fixed visual jitter for this spin. 
  // We use the ID length to generate a pseudo-random jitter that is consistent for this render.
  // This avoids recalculating random numbers during re-renders.
  const pseudoRandom = winner.id.charCodeAt(0) % 60; 
  const safeJitter = pseudoRandom - 30; // +/- 30px

  const getTransform = () => {
      if (!isSpinning) return 'translateX(0px)';
      const position = (WINNING_INDEX * CARD_WIDTH) + safeJitter;
      return `translateX(calc(50vw - ${position}px - ${CARD_WIDTH / 2}px))`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full overflow-hidden bg-slate-900 relative">
        
        {/* Tigrinho Mascot */}
        <div className="absolute top-10 right-4 md:right-20 animate-bounce duration-[2000ms] z-40 hidden sm:block">
            <div className="text-[5rem] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform rotate-12 hover:scale-110 transition-transform cursor-pointer" title="Tigrinho da Sorte">
               🐯
            </div>
            <div className="bg-yellow-500 text-black font-bold text-xs px-2 py-1 rounded-full text-center -mt-4 shadow-lg border-2 border-white transform -rotate-6">
               Sorte Grande!
            </div>
        </div>

        <div className="mb-12 text-center animate-pulse">
            <h2 className="text-2xl font-black text-white tracking-widest">{t.spinning}</h2>
        </div>

        {/* The Roulette Window */}
        <div className="relative w-full h-[240px] bg-slate-950 border-y-4 border-indigo-600 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* Center Marker (The Needle) */}
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-yellow-400 z-30 transform -translate-x-1/2 shadow-[0_0_15px_rgba(250,204,21,0.8)]"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400 z-30">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-t-[16px] border-t-yellow-400 border-r-[12px] border-r-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-yellow-400 z-30">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-b-[16px] border-b-yellow-400 border-r-[12px] border-r-transparent"></div>
            </div>

            {/* The Strip */}
            <div 
                className="absolute top-0 h-full flex items-center will-change-transform"
                style={{
                    transform: getTransform(),
                    transition: 'transform 8s cubic-bezier(0.15, 0.85, 0.25, 1)', 
                    width: `${TOTAL_ITEMS * CARD_WIDTH}px`,
                }}
            >
                {rouletteItems.map((item, index) => (
                    <div 
                        key={`${item.id}-${index}`}
                        className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-800 border-r border-slate-700 relative box-border"
                        style={{ width: `${CARD_WIDTH}px`, height: '100%' }}
                    >
                        <div className={`w-24 h-24 rounded-full ${item.avatarColor} flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg ring-4 ring-black/20`}>
                            {item.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-slate-300 font-bold truncate max-w-[80%] text-center">{item.name}</span>
                        
                        {/* Winner Highlight Effect */}
                        {index === WINNING_INDEX && (
                            <div className="absolute inset-0 bg-yellow-400/10 border-2 border-yellow-400/50 animate-pulse"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Side Gradients to fade out */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-20 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-20 pointer-events-none"></div>
        </div>
    </div>
  );
};