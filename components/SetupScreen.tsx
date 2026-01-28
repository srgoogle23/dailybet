import React, { useState } from 'react';
import { Participant } from '../types';
import { Button } from './ui/Button';
import { Plus, Trash2, Users, Wallet } from 'lucide-react';
import { AVATAR_COLORS, INITIAL_BALANCE } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface SetupScreenProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  onNext: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ participants, setParticipants, onNext }) => {
  const { t } = useLanguage();
  const [nameInput, setNameInput] = useState('');
  
  // Load balances from local storage to check for existing users
  const getStoredBalance = (name: string): number => {
      const storage = localStorage.getItem('dailybet_wallets');
      if (!storage) return INITIAL_BALANCE;
      const wallets = JSON.parse(storage);
      return wallets[name] !== undefined ? wallets[name] : INITIAL_BALANCE;
  };

  const handleAdd = () => {
    if (!nameInput.trim()) return;
    
    const name = nameInput.trim();
    // Prevent duplicates in the current list
    if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        setNameInput('');
        return;
    }

    const balance = getStoredBalance(name);

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name: name,
      avatarColor: AVATAR_COLORS[participants.length % AVATAR_COLORS.length],
      balance: balance,
      isImmune: false
    };

    setParticipants([...participants, newParticipant]);
    setNameInput('');
  };

  const handleRemove = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="max-w-md mx-auto w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full mb-4">
          <Users className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2 glow-text">{t.setupTitle}</h1>
        <p className="text-slate-400">{t.setupSubtitle}</p>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholderName}
          className="flex-1 bg-slate-800 border-slate-700 border text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />
        <Button onClick={handleAdd} disabled={!nameInput.trim()}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {participants.length === 0 && (
          <div className="text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
            {t.emptyList}
          </div>
        )}
        
        {participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:border-indigo-500/50 transition-colors group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-10 h-10 rounded-full ${p.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-lg flex-shrink-0`}>
                {p.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                  <span className="font-medium text-slate-200 truncate">{p.name}</span>
                  <span className={`text-xs font-mono font-bold flex items-center gap-1 ${p.balance < 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                      <Wallet className="w-3 h-3" /> ${p.balance}
                  </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleRemove(p.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
            </div>
          </div>
        ))}
      </div>

      <Button 
        fullWidth 
        onClick={onNext} 
        disabled={participants.length < 2}
        className="text-lg"
      >
        {t.startBetting} ({participants.length})
      </Button>
    </div>
  );
};