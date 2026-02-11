import React, { useState } from 'react';
import { Button } from '../Button';
import { PrinterIcon, DownloadIcon } from '../icons';
import { PRINT_SIZES, PAPER_SIZES } from '../../types';
import { generatePrintLayout } from '../../utils/imageUtils';

interface PrintPanelProps {
  currentImage: string | null;
  burnCurrentFilters: () => Promise<string | null>;
}

export const PrintPanel: React.FC<PrintPanelProps> = ({ currentImage, burnCurrentFilters }) => {
  const [selectedSize, setSelectedSize] = useState<string>('2x2');
  const [selectedPaper, setSelectedPaper] = useState<string>('4R');
  const [copies, setCopies] = useState<number>(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSheet, setPreviewSheet] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!currentImage) return;
    setIsGenerating(true);
    setError('');
    
    try {
      // Must apply brightness/contrast before layout
      const baseImage = await burnCurrentFilters() || currentImage;
      const sheet = await generatePrintLayout(baseImage, selectedSize, selectedPaper, copies);
      setPreviewSheet(sheet);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate print layout");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewSheet) return;
    const link = document.createElement('a');
    link.href = previewSheet;
    link.download = `Hiwaypark_Print_${selectedSize}_x${copies}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentImage) {
    return (
      <div className="p-4 text-center text-slate-500 mt-10">
        Please capture or edit an image before creating a print layout.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
          <PrinterIcon width={20} height={20} />
          Print Setup
        </h2>
        <p className="text-sm text-slate-400 mb-4">Arrange your photos for final printing.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {!previewSheet ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">ID Size Format</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md focus:ring-brand-500 focus:border-brand-500 block w-full p-2.5"
            >
              {Object.values(PRINT_SIZES).map(size => (
                <option key={size.id} value={size.id}>{size.name} ({size.widthMm}x{size.heightMm}mm)</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">Paper Size</label>
            <select
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md focus:ring-brand-500 focus:border-brand-500 block w-full p-2.5"
            >
              {Object.entries(PAPER_SIZES).map(([id, info]) => (
                <option key={id} value={id}>{info.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-300">Number of Copies</label>
              <span className="text-xs text-brand-400 font-mono font-bold">{copies} pcs</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            loading={isGenerating} 
            icon={<PrinterIcon width={18} height={18} />}
            className="mt-4"
          >
            Generate Layout Sheet
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg">
            <img 
              src={previewSheet} 
              alt="Print Preview" 
              className="w-full h-auto object-contain bg-white rounded shadow-inner"
              style={{ maxHeight: '300px' }}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleDownload} icon={<DownloadIcon width={18} height={18} />} variant="primary">
              Download Ready to Print
            </Button>
            <Button onClick={() => setPreviewSheet(null)} variant="secondary">
              Modify Layout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
