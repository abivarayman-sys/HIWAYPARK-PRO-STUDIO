import React, { useState } from 'react';
import { Button } from '../Button';
import { UsersIcon, SparklesIcon } from '../icons';
import { geminiService } from '../../services/geminiService';

interface GroupPanelProps {
  currentImage: string | null;
  onImageEdit: (newImageBase64: string) => void;
  burnCurrentFilters: () => Promise<string | null>;
}

export const GroupPanel: React.FC<GroupPanelProps> = ({ currentImage, onImageEdit, burnCurrentFilters }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [dressCodeInput, setDressCodeInput] = useState('');
  const [themeInput, setThemeInput] = useState('');

  const handleGroupEdit = async (prompt: string) => {
    if (!currentImage) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
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

  const handleFixClosedEyes = () => {
    const prompt = "CRITICAL INSTRUCTION: You MUST preserve the exact identities, facial structures, shapes, and likeness of EVERY person in the photo. Carefully find anyone with closed eyes and open them naturally. DO NOT alter ANY other facial features or the background. The people must remain exactly the same individuals.";
    handleGroupEdit(prompt);
  };

  const handleApplyDressCode = () => {
    if (!dressCodeInput.trim()) return;
    const prompt = `CRITICAL INSTRUCTION: Keep everyone's faces, identities, poses, and the background EXACTLY the same. Change the clothing of all people in this group photo to match this dress code/color: ${dressCodeInput}. Make it look natural and well-fitted without altering the people themselves.`;
    handleGroupEdit(prompt);
  };

  const handleApplyTheme = () => {
    if (!themeInput.trim()) return;
    const prompt = `CRITICAL INSTRUCTION: Keep all people, their identities, faces, poses, and clothing EXACTLY the same. Replace the background behind the group with this theme: ${themeInput}. Blend the lighting naturally but DO NOT modify the people.`;
    handleGroupEdit(prompt);
  };

  if (!currentImage) {
    return (
      <div className="p-4 text-center text-slate-500 mt-10">
        Please capture or upload an image first to use Group Magic Tools.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-brand-400 flex items-center gap-2 mb-2">
          <UsersIcon width={20} height={20} />
          Group & Family Magic
        </h2>
        <p className="text-sm text-slate-400 mb-4">Smartly fix group blunders or coordinate everyone's outfits and backgrounds.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Smart Eye Fix */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-800">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Fix Blunders</h3>
        <p className="text-xs text-slate-400 mb-2">Automatically finds people with closed eyes and opens them naturally.</p>
        <Button 
          onClick={handleFixClosedEyes}
          loading={isProcessing}
          icon={<SparklesIcon width={16} height={16} />}
        >
          Auto-Fix Closed Eyes
        </Button>
      </div>

      {/* Group Dress Code */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-800">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Group Dress Code</h3>
        <p className="text-xs text-slate-400 mb-2">Change everyone's outfit to match a specific color or style.</p>
        
        <div className="flex gap-2 flex-wrap mb-2">
          {['All White', 'Formal Suits', 'Denim & White', 'Christmas Sweaters'].map(preset => (
            <button 
              key={preset}
              onClick={() => setDressCodeInput(preset)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          value={dressCodeInput}
          onChange={(e) => setDressCodeInput(e.target.value)}
          placeholder="e.g. Matching blue polo shirts"
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          disabled={isProcessing}
        />
        <Button 
          variant="secondary"
          disabled={!dressCodeInput.trim() || isProcessing}
          loading={isProcessing}
          onClick={handleApplyDressCode}
        >
          Apply Dress Code
        </Button>
      </div>

      {/* Background Theme */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Group Background Theme</h3>
        <p className="text-xs text-slate-400 mb-2">Change the entire background setting for the family or group.</p>
        
        <div className="flex gap-2 flex-wrap mb-2">
          {['Professional Studio', 'Sunny Beach', 'Autumn Park', 'Cozy Living Room'].map(preset => (
            <button 
              key={preset}
              onClick={() => setThemeInput(preset)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          value={themeInput}
          onChange={(e) => setThemeInput(e.target.value)}
          placeholder="e.g. A festive holiday living room"
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          disabled={isProcessing}
        />
        <Button 
          variant="secondary"
          disabled={!themeInput.trim() || isProcessing}
          loading={isProcessing}
          onClick={handleApplyTheme}
        >
          Change Theme
        </Button>
      </div>
    </div>
  );
};