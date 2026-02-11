import React from 'react';
import { ToolMode } from '../types';
import { CameraIcon, SparklesIcon, SlidersIcon, PrinterIcon, CropIcon, SmileIcon, UsersIcon, EraserIcon } from './icons';

interface SidebarProps {
  activeMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeMode, onSelectMode, className = '' }) => {
  const navItems = [
    { mode: ToolMode.SOURCE, label: 'Source', icon: <CameraIcon /> },
    { mode: ToolMode.CROP, label: 'Crop', icon: <CropIcon /> },
    { mode: ToolMode.TUNE, label: 'Tune', icon: <SlidersIcon /> },
    { mode: ToolMode.CLEANUP, label: 'Cleanup', icon: <EraserIcon /> },
    { mode: ToolMode.RETOUCH, label: 'Retouch', icon: <SmileIcon /> },
    { mode: ToolMode.AI_MAGIC, label: 'AI Magic', icon: <SparklesIcon /> },
    { mode: ToolMode.GROUP_MAGIC, label: 'Group', icon: <UsersIcon /> },
    { mode: ToolMode.PRINT_LAYOUT, label: 'Print', icon: <PrinterIcon /> },
  ];

  return (
    <aside className={`bg-slate-900 border-slate-800 z-20 touch-pan-x ${className}`}>
      {navItems.map((item) => (
        <button
          key={item.mode}
          onClick={() => onSelectMode(item.mode)}
          className={`flex-none md:flex-auto flex flex-col items-center justify-center p-2 min-w-[72px] md:min-w-0 md:py-4 gap-1 transition-all relative ${
            activeMode === item.mode 
              ? 'text-brand-400' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          {activeMode === item.mode && (
            <>
              {/* Desktop indicator */}
              <div className="hidden md:block absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r-md shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
              {/* Mobile indicator */}
              <div className="md:hidden absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-t-md shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
            </>
          )}
          <div className={`p-1.5 md:p-2 rounded-xl ${activeMode === item.mode ? 'bg-brand-950/50' : ''}`}>
             {item.icon}
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase text-center leading-tight px-1">{item.label}</span>
        </button>
      ))}
    </aside>
  );
};