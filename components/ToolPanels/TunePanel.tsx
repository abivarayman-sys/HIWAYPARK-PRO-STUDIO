import React from 'react';
import { SlidersIcon } from '../icons';
import { Button } from '../Button';

interface TunePanelProps {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  onBrightnessChange: (val: number) => void;
  onContrastChange: (val: number) => void;
  onSaturationChange: (val: number) => void;
  onBlurChange: (val: number) => void;
  onReset: () => void;
  hasImage: boolean;
}

export const TunePanel: React.FC<TunePanelProps> = ({
  brightness,
  contrast,
  saturation,
  blur,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onBlurChange,
  onReset,
  hasImage
}) => {
  if (!hasImage) {
    return (
      <div className="p-4 text-center text-slate-500 mt-10">
        Please capture or upload an image first to use tuning tools.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
          <SlidersIcon width={20} height={20} />
          Manual Tune
        </h2>
        <p className="text-sm text-slate-400 mb-4">Adjust basic image properties. These apply instantly.</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">Brightness</label>
            <span className="text-xs text-brand-400 font-mono">{brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={brightness}
            onChange={(e) => onBrightnessChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">Contrast</label>
            <span className="text-xs text-brand-400 font-mono">{contrast}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={contrast}
            onChange={(e) => onContrastChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">Saturation</label>
            <span className="text-xs text-brand-400 font-mono">{saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={saturation}
            onChange={(e) => onSaturationChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">Gaussian Blur</label>
            <span className="text-xs text-brand-400 font-mono">{blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={blur}
            onChange={(e) => onBlurChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={onReset} fullWidth>
            Reset Adjustments
          </Button>
        </div>
      </div>
    </div>
  );
};