import React from 'react';
import { Button } from '../Button';
import { CropIcon } from '../icons';
import { PRINT_SIZES } from '../../types';

interface CropPanelProps {
  hasImage: boolean;
  selectedSizeId: string;
  onSizeChange: (sizeId: string) => void;
  orientation: 'portrait' | 'landscape';
  onOrientationChange: (orientation: 'portrait' | 'landscape') => void;
  customWidthInches: number;
  customHeightInches: number;
  onCustomSizeChange: (w: number, h: number) => void;
  onApplyCrop: () => void;
  isProcessing?: boolean;
}

export const CropPanel: React.FC<CropPanelProps> = ({
  hasImage,
  selectedSizeId,
  onSizeChange,
  orientation,
  onOrientationChange,
  customWidthInches,
  customHeightInches,
  onCustomSizeChange,
  onApplyCrop,
  isProcessing = false
}) => {
  if (!hasImage) {
    return (
      <div className="p-4 text-center text-slate-500 mt-10">
        Please capture or upload an image first to use the Crop tool.
      </div>
    );
  }

  const selectedSize = PRINT_SIZES[selectedSizeId];
  
  // Calculate display dimensions based on orientation and size selection
  let dispW = 0, dispH = 0, dispPxW = 0, dispPxH = 0;
  
  if (selectedSizeId === 'custom') {
    dispW = parseFloat((customWidthInches * 25.4).toFixed(1));
    dispH = parseFloat((customHeightInches * 25.4).toFixed(1));
    dispPxW = Math.round(customWidthInches * 300);
    dispPxH = Math.round(customHeightInches * 300);
  } else if (selectedSize) {
    dispW = selectedSize.widthMm;
    dispH = selectedSize.heightMm;
    dispPxW = selectedSize.widthPx300Dpi;
    dispPxH = selectedSize.heightPx300Dpi;
  }

  if (orientation === 'landscape') {
    [dispW, dispH] = [dispH, dispW];
    [dispPxW, dispPxH] = [dispPxH, dispPxW];
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
          <CropIcon width={20} height={20} />
          Crop & Frame
        </h2>
        <p className="text-sm text-slate-400 mb-4">Select the required size and frame the subject perfectly.</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Size Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-300">Target Size</label>
          <select
            value={selectedSizeId}
            onChange={(e) => onSizeChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md focus:ring-brand-500 focus:border-brand-500 block w-full p-2.5"
            disabled={isProcessing}
          >
            {Object.values(PRINT_SIZES).map(size => (
              <option key={size.id} value={size.id}>{size.name} ({size.widthMm}x{size.heightMm}mm)</option>
            ))}
            <option value="custom">Custom Size (Inches)</option>
          </select>
        </div>

        {/* Custom Size Inputs (Inches) */}
        {selectedSizeId === 'custom' && (
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-slate-400">Width (inches)</label>
              <input 
                type="number" 
                step="0.1"
                value={customWidthInches}
                onChange={(e) => onCustomSizeChange(Number(e.target.value) || 1, customHeightInches)}
                className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md p-2 w-full"
                min="0.1"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-slate-400">Height (inches)</label>
              <input 
                type="number" 
                step="0.1"
                value={customHeightInches}
                onChange={(e) => onCustomSizeChange(customWidthInches, Number(e.target.value) || 1)}
                className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md p-2 w-full"
                min="0.1"
              />
            </div>
          </div>
        )}

        {/* Orientation Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-300">Orientation</label>
          <div className="flex bg-slate-900 border border-slate-700 rounded-md p-1">
            <button
              onClick={() => onOrientationChange('portrait')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${orientation === 'portrait' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Portrait
            </button>
            <button
              onClick={() => onOrientationChange('landscape')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${orientation === 'landscape' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Landscape
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-800/50 border border-slate-700 rounded p-3 text-xs text-slate-300">
          <p>Final output dimensions:</p>
          <ul className="list-disc list-inside mt-1 text-slate-400">
            <li>Physical: {dispW}mm x {dispH}mm</li>
            <li>Pixels (300dpi): {dispPxW}px x {dispPxH}px</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-2">
          <Button 
            onClick={onApplyCrop} 
            loading={isProcessing}
            fullWidth
            icon={<CropIcon width={16} height={16} />}
          >
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
};