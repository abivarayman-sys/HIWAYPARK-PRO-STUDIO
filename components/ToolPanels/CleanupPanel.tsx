import React from 'react';
import { Button } from '../Button';
import { EraserIcon, SparklesIcon } from '../icons';
import { useAuth } from '../../contexts/AuthContext';

interface CleanupPanelProps {
  hasImage: boolean;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClearBrush: () => void;
  onApplyCleanup: () => void;
  isProcessing: boolean;
  error?: string;
}

export const CleanupPanel: React.FC<CleanupPanelProps> = ({
  hasImage,
  brushSize,
  onBrushSizeChange,
  onClearBrush,
  onApplyCleanup,
  isProcessing,
  error
}) => {
  const { credits } = useAuth();

  if (!hasImage) {
    return (
      <div className="p-4 text-center text-slate-500 mt-10">
        Please capture or upload an image first to use the Cleanup tool.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
          <EraserIcon width={20} height={20} />
          Magic Eraser
        </h2>
        <p className="text-sm text-slate-400 mb-4">Draw over stray hairs, messy edges, or unwanted objects to intelligently remove them.</p>
        <div className="bg-slate-800/50 border border-slate-700 rounded p-2 text-xs flex justify-between">
          <span className="text-slate-400">Cost per edit:</span>
          <span className="text-brand-400 font-bold">1 Credit</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {credits <= 0 && (
        <div className="bg-orange-900/30 border border-orange-800 text-orange-300 px-4 py-3 rounded-md text-sm">
          Out of AI credits. Please upgrade your plan in the dashboard.
        </div>
      )}

      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">Brush Size</label>
            <span className="text-xs text-brand-400 font-mono">{brushSize}px</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            disabled={isProcessing}
          />
        </div>

        <Button 
          variant="secondary" 
          onClick={onClearBrush} 
          disabled={isProcessing}
        >
          Clear Brush Strokes
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Execute Edit</h3>
        <p className="text-xs text-slate-400 mb-2">The AI will remove the areas marked in red and seamlessly fill the background.</p>
        <Button 
          onClick={onApplyCleanup}
          loading={isProcessing}
          disabled={isProcessing || credits <= 0}
          icon={<SparklesIcon width={16} height={16} />}
        >
          Apply Content Aware Fill
        </Button>
      </div>
    </div>
  );
};