import React, { useState } from 'react';
import { AppPhase, Participant, Bet } from './types';
import { SetupScreen } from './components/SetupScreen';
import { BettingScreen } from './components/BettingScreen';
import { OddsScreen } from './components/OddsScreen';
import { RouletteScreen } from './components/RouletteScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { HistoryModal } from './components/HistoryModal';
import { Globe, History as HistoryIcon, ArrowLeft } from 'lucide-react';

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [phase, setPhase] = useState<AppPhase>(AppPhase.SETUP);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleBetsComplete = (completedBets: Bet[]) => {
    setBets(completedBets);
    setPhase(AppPhase.ODDS);
  };

  const handleStartRoulette = () => {
    setPhase(AppPhase.ROULETTE);
  };

  const handleRouletteFinish = (winner: string) => {
    setWinnerId(winner);
    setPhase(AppPhase.RESULTS);
  };

  const handleReset = () => {
    setBets([]);
    setWinnerId(null);
    
    // CRITICAL FIX: Sync balances from LocalStorage to State
    const storedWalletsStr = localStorage.getItem('dailybet_wallets');
    const storedWallets = storedWalletsStr ? JSON.parse(storedWalletsStr) : {};
    
    setParticipants(prev => prev.map(p => ({
        ...p,
        isImmune: false, // Reset immunity for new round
        balance: storedWallets[p.name] !== undefined ? storedWallets[p.name] : p.balance
    })));

    setPhase(AppPhase.SETUP);
  };

  const handleBack = () => {
    switch (phase) {
        case AppPhase.BETTING:
            setPhase(AppPhase.SETUP);
            setBets([]); // Clear bets if going back to setup
            break;
        case AppPhase.ODDS:
            setPhase(AppPhase.BETTING);
            setBets([]); // Clear bets to restart betting process
            break;
        case AppPhase.ROULETTE:
            setPhase(AppPhase.ODDS);
            break;
        default:
            break;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* Header/Nav */}
      <header className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
           
           <div className="flex items-center gap-4">
               {/* Back Button */}
               {phase !== AppPhase.SETUP && phase !== AppPhase.RESULTS && (
                   <button 
                        onClick={handleBack}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
                        title="Voltar"
                   >
                       <ArrowLeft className="w-5 h-5" />
                   </button>
               )}

               {/* Logo */}
               <div className="font-black text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 flex items-center gap-2">
                 {t.appTitle} <span className="filter drop-shadow-md text-2xl">🐯</span>
               </div>
           </div>

           {/* Controls */}
           <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="History"
             >
                <HistoryIcon className="w-5 h-5" />
             </button>

             <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors uppercase"
             >
                <Globe className="w-3 h-3" /> {language}
             </button>
           </div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        {phase === AppPhase.SETUP && (
          <SetupScreen 
            participants={participants} 
            setParticipants={setParticipants} 
            onNext={() => setPhase(AppPhase.BETTING)} 
          />
        )}

        {phase === AppPhase.BETTING && (
          <BettingScreen 
            participants={participants}
            setParticipants={setParticipants}
            onComplete={handleBetsComplete} 
          />
        )}

        {phase === AppPhase.ODDS && (
          <OddsScreen 
            participants={participants} 
            bets={bets}
            onStartRoulette={handleStartRoulette}
          />
        )}

        {phase === AppPhase.ROULETTE && (
            <RouletteScreen 
                participants={participants}
                onFinish={handleRouletteFinish}
            />
        )}

        {phase === AppPhase.RESULTS && winnerId && (
            <ResultsScreen 
                participants={participants}
                bets={bets}
                winnerId={winnerId}
                onReset={handleReset}
            />
        )}
      </main>

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;