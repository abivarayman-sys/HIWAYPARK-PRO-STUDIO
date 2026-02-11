import React from 'react';
import { CameraIcon, UndoIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onUndo: () => void;
  canUndo: boolean;
  onOpenDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onUndo, canUndo, onOpenDashboard }) => {
  const { credits, user } = useAuth();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
      <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
        <div className="bg-brand-500 p-1.5 md:p-2 rounded-lg text-white shrink-0">
          <CameraIcon width={20} height={20} />
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent truncate">
            Hiwaypark Pro Studio
          </h1>
          <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-wider truncate">ADVANCED ID & PRINT SERVICES</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Undo Last Action"
        >
          <UndoIcon width={16} height={16} />
          <span className="hidden sm:inline">Undo</span>
        </button>

        <div className="h-6 w-px bg-slate-700 hidden sm:block mx-1"></div>

        <button 
          onClick={onOpenDashboard}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full py-1 px-1 pr-3 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
            {user?.email?.[0] || 'U'}
          </div>
          <div className="flex flex-col items-start leading-none hidden sm:flex">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Credits</span>
            <span className="text-xs font-bold text-brand-400">{credits}</span>
          </div>
        </button>
      </div>
    </header>
  );
};
