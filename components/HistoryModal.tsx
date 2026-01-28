import React, { useEffect, useState } from 'react';
import { HistoryEntry } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Trophy, Calendar, Wallet, Trash } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [wallets, setWallets] = useState<Record<string, number>>({});
  const [view, setView] = useState<'leaderboard' | 'history'>('leaderboard');

  useEffect(() => {
    if (isOpen) {
      const storedHistory = localStorage.getItem('dailybet_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory).reverse());
      }
      
      const storedWallets = localStorage.getItem('dailybet_wallets');
      if (storedWallets) {
          setWallets(JSON.parse(storedWallets));
      }
    }
  }, [isOpen]);

  const handleResetData = () => {
      if (window.confirm('Are you sure you want to delete all financial data and history?')) {
          localStorage.removeItem('dailybet_history');
          localStorage.removeItem('dailybet_wallets');
          setHistory([]);
          setWallets({});
      }
  };

  if (!isOpen) return null;

  const sortedWallets = Object.entries(wallets)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" /> {t.historyTitle}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
            <button 
                onClick={() => setView('leaderboard')}
                className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${view === 'leaderboard' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:bg-slate-800/50'}`}
            >
                {t.leaderboard}
            </button>
            <button 
                onClick={() => setView('history')}
                className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${view === 'history' ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:bg-slate-800/50'}`}
            >
                Timeline
            </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-4 custom-scrollbar min-h-[300px]">
          
          {view === 'leaderboard' && (
              <>
                 {sortedWallets.length === 0 ? (
                     <p className="text-center text-slate-600 py-8">No wallet data found.</p>
                 ) : (
                     <div className="space-y-2">
                        {sortedWallets.map(([name, balance], index) => (
                            <div key={name} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-slate-900 ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : index === 2 ? 'bg-orange-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {index + 1}
                                    </div>
                                    <span className={`font-bold ${index < 3 ? 'text-white' : 'text-slate-400'}`}>{name}</span>
                                </div>
                                <span className="font-mono font-bold text-emerald-400 text-lg">${balance}</span>
                            </div>
                        ))}
                     </div>
                 )}
              </>
          )}

          {view === 'history' && (
               <div className="space-y-3">
                 {history.length === 0 ? (
                    <p className="text-center text-slate-600 py-8">{t.historyEmpty}</p>
                 ) : history.map((entry) => (
                   <div key={entry.id} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                     <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-full ${entry.winnerAvatar} flex items-center justify-center text-xs font-bold text-white`}>
                         {entry.winnerName.substring(0, 2).toUpperCase()}
                       </div>
                       <div>
                         <p className="font-bold text-white">{entry.winnerName}</p>
                         <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()} • {new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                       </div>
                     </div>
                     <div className="text-indigo-400 font-mono font-bold">
                       POT: ${entry.totalPool}
                     </div>
                   </div>
                 ))}
               </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-2">
          <button onClick={handleResetData} className="px-4 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg font-bold transition-colors flex items-center gap-2">
            <Trash className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors">
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};