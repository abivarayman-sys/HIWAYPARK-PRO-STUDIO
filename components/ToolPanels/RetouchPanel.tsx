import React, { useState } from 'react';
import { Button } from '../Button';
import { SmileIcon } from '../icons';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';

interface RetouchPanelProps {
  currentImage: string | null;
  onImageEdit: (newImageBase64: string) => void;
  burnCurrentFilters: () => Promise<string | null>;
}

export const RetouchPanel: React.FC<RetouchPanelProps> = ({ currentImage, onImageEdit, burnCurrentFilters }) => {
  const { credits, deductCredit } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState('');

  const handleRetouch = async (prompt: string) => {
    if (!currentImage) return;
    if (credits <= 0) {
      setError("Out of AI credits. Please upgrade your plan.");
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      const baseImage = await burnCurrentFilters() || currentImage;
      const resultBase64 = await geminiService.editImage(baseImage, prompt);
      
      const deducted = await deductCredit(1);
      if (deducted) {
        onImageEdit(resultBase64);
      } else {
        throw new Error("Failed to deduct credits.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while processing the image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const presetEdits = [
    { label: 'Smooth Skin & Blemishes', prompt: 'CRITICAL INSTRUCTION: Preserve the exact identity, facial structure, and likeness of the original person. ONLY apply subtle skin smoothing and blemish removal. DO NOT change the person\'s actual face, eyes, or mouth.' },
    { label: 'Add a Natural Smile', prompt: 'CRITICAL INSTRUCTION: Preserve the exact identity, facial structure, and likeness of the original person. Modify ONLY the mouth to show a natural smile. DO NOT alter the eyes, nose, face shape, or background.' },
    { label: 'Close Mouth completely', prompt: 'CRITICAL INSTRUCTION: Preserve the exact identity and likeness. Modify ONLY the mouth to be fully closed with a neutral expression. DO NOT change any other facial features or the background.' },
    { label: 'Open Eyes completely', prompt: 'CRITICAL INSTRUCTION: Preserve the exact identity, facial structure, and likeness of the person. ONLY modify the eyes so they are fully open and looking forward. DO NOT change the face shape, nose, mouth, or background. The output MUST look like the exact same person.' },
    { label: 'Professional Hair (Short)', prompt: 'CRITICAL INSTRUCTION: Preserve the person\'s exact face, identity, and facial features. ONLY change the hairstyle to a neat, professional, well-groomed short haircut. DO NOT modify the face.' },
    { label: 'Professional Hair (Long)', prompt: 'CRITICAL INSTRUCTION: Preserve the person\'s exact face, identity, and facial features. ONLY change the hairstyle to a neat, professional, elegant long hairstyle. DO NOT modify the face.' },
  ];

  if (!currentImage) {
    return (
      <div className="p-4 text-center text-slate-500 mt-10">
        Please capture or upload an image first to use Face Retouch Tools.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-brand-400 flex items-center gap-2 mb-2">
          <SmileIcon width={20} height={20} />
          Face Retouch
        </h2>
        <p className="text-sm text-slate-400 mb-4">Fix skin, adjust expressions, or try a new hairstyle instantly.</p>
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

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Quick Adjustments</h3>
        {presetEdits.map((preset, idx) => (
          <Button 
            key={idx}
            variant="secondary"
            className="justify-start text-left"
            disabled={isProcessing || credits <= 0}
            onClick={() => handleRetouch(preset.prompt)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-700"></div>
        <span className="flex-shrink-0 mx-4 text-slate-500 text-sm uppercase">or</span>
        <div className="flex-grow border-t border-slate-700"></div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Custom Face Edit</h3>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Add light natural makeup, fix eyebrows..."
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none h-24"
          disabled={isProcessing || credits <= 0}
        />
        <Button 
          disabled={!customPrompt.trim() || isProcessing || credits <= 0}
          loading={isProcessing}
          onClick={() => handleRetouch(`CRITICAL INSTRUCTION: You must preserve the exact identity, facial features, and likeness of the person. ONLY make this change: ${customPrompt}`)}
          icon={<SmileIcon width={16} height={16} />}
        >
          Apply Custom Retouch
        </Button>
      </div>
    </div>
  );
};