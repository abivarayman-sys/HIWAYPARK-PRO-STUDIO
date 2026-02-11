import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

interface DashboardModalProps {
  onClose: () => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({ onClose }) => {
  const { user, credits, logout } = useAuth();

  const maxCredits = 300;
  const creditPercentage = Math.min(100, Math.max(0, (credits / maxCredits) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Account Dashboard</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white text-xl font-bold uppercase">
              {user?.email?.[0] || 'U'}
            </div>
            <div>
              <p className="text-sm text-slate-400">Signed in as</p>
              <p className="text-white font-medium">{user?.email || 'Unknown User'}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">AI Tool Quota</h3>
              <span className="text-xl font-bold text-brand-400">{credits} <span className="text-sm text-slate-500 font-normal">/ {maxCredits}</span></span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 mb-2 overflow-hidden border border-slate-700">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${credits < 50 ? 'bg-red-500' : 'bg-brand-500'}`} 
                style={{ width: `${creditPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400">
              Each AI action (Cleanup, Magic Edit, Auto-Fix) consumes 1 credit. Free tier is limited to {maxCredits} credits.
            </p>
          </div>

          <div className="bg-brand-950/30 border border-brand-900/50 p-4 rounded-lg">
            <h3 className="text-brand-400 font-medium mb-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Upgrade to Pro
            </h3>
            <p className="text-xs text-slate-300 mb-3">Get unlimited AI edits, batch processing, and priority support.</p>
            <Button variant="primary" fullWidth className="text-xs py-2">View Upgrade Plans</Button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <Button variant="ghost" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
