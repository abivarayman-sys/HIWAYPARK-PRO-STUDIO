import React, { useState } from 'react';
import { Button } from '../Button';
import { SparklesIcon } from '../icons';
import { geminiService } from '../../services/geminiService';

interface AIPanelProps {
  currentImage: string | null;
  onImageEdit: (newImageBase64: string) => void;
  burnCurrentFilters: () => Promise<string | null>;
}

export const AIPanel: React.FC<AIPanelProps> = ({ currentImage, onImageEdit, burnCurrentFilters }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState('');

  const handleAIEdit = async (prompt: string) => {
    if (!currentImage) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // If user tweaked brightness/contrast, we need to apply them to a base64 string
      // before sending to the AI, so the AI "sees" the adjusted image.
      const baseImage = await burnCurrentFilters() || currentImage;
      
      const resultBase64 = await geminiService.editImage(baseImage, prompt);
      onImageEdit(resultBase64);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while processing the image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const presetEdits = [
    { label: 'Solid White Background', prompt: 'Keep the person exactly as they are. Change the background to a perfectly solid, clean white studio background suitable for an official ID.' },
    { label: 'Solid Blue Background', prompt: 'Keep the person exactly as they are. Change the background to a perfectly solid, classic studio blue background suitable for an official ID.' },
    { label: 'Formal Suit (Male)', prompt: 'Keep the person\'s face, hair, and background exactly as they are. Change their clothing to a professional, well-fitting black formal suit with a white shirt and a dark tie. Make it look completely realistic.' },
    { label: 'Formal Attire (Female)', prompt: 'Keep the person\'s face, hair, and background exactly as they are. Change their clothing to a professional, elegant black blazer over a white blouse. Make it look completely realistic.' },
    { label: 'Auto Fix Lighting', prompt: 'Keep the image composition exactly the same. Enhance the lighting, remove harsh shadows on the face, and make it look like a professional studio portrait.' },
  ];

  if (!currentImage) {
    return (
      <div className="p-4 text-center text-slate-500 mt-10">
        Please capture or upload an image first to use AI Magic Tools.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-brand-400 flex items-center gap-2 mb-2">
          <SparklesIcon width={20} height={20} />
          AI Magic Edits
        </h2>
        <p className="text-sm text-slate-400 mb-4">Powered by Gemini. Changes may take a few seconds to process.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Quick Presets</h3>
        {presetEdits.map((preset, idx) => (
          <Button 
            key={idx}
            variant="secondary"
            className="justify-start text-left"
            disabled={isProcessing}
            onClick={() => handleAIEdit(preset.prompt)}
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
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Custom Request</h3>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Change the background to red and make the shirt yellow..."
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none h-24"
          disabled={isProcessing}
        />
        <Button 
          disabled={!customPrompt.trim() || isProcessing}
          loading={isProcessing}
          onClick={() => handleAIEdit(customPrompt)}
          icon={<SparklesIcon width={16} height={16} />}
        >
          Generate Custom Edit
        </Button>
      </div>
    </div>
  );
};
