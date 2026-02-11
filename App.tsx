import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { SourcePanel } from './components/ToolPanels/SourcePanel';
import { CropPanel } from './components/ToolPanels/CropPanel';
import { TunePanel } from './components/ToolPanels/TunePanel';
import { CleanupPanel } from './components/ToolPanels/CleanupPanel';
import { RetouchPanel } from './components/ToolPanels/RetouchPanel';
import { AIPanel } from './components/ToolPanels/AIPanel';
import { GroupPanel } from './components/ToolPanels/GroupPanel';
import { PrintPanel } from './components/ToolPanels/PrintPanel';
import { ToolMode, PhotoState, CropRect, PRINT_SIZES } from './types';
import { applyFiltersToDataUrl, cropImageBase64, applyCleanupMask } from './utils/imageUtils';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ToolMode>(ToolMode.SOURCE);
  
  // Central state for the image and edits
  const [photoState, setPhotoState] = useState<PhotoState>({
    originalBase64: null,
    currentBase64: null,
    history: [],
    historyIndex: -1,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
  });

  // Tool Specific States
  const [cropSizeId, setCropSizeId] = useState<string>('4x6');
  const [cropOrientation, setCropOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [customCropInches, setCustomCropInches] = useState({ width: 4, height: 6 });
  const [currentCropRect, setCurrentCropRect] = useState<CropRect | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [brushSize, setBrushSize] = useState(25);
  const cleanupCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cleanupError, setCleanupError] = useState('');

  // Calculate current crop targets based on size ID, custom inputs, and orientation
  const getCurrentCropTargets = () => {
    let targetW = 0, targetH = 0, targetWPx = 0, targetHPx = 0;
    
    if (cropSizeId === 'custom') {
      targetW = customCropInches.width * 25.4;
      targetH = customCropInches.height * 25.4;
      targetWPx = Math.round(customCropInches.width * 300);
      targetHPx = Math.round(customCropInches.height * 300);
    } else {
      const size = PRINT_SIZES[cropSizeId];
      if (size) {
        targetW = size.widthMm;
        targetH = size.heightMm;
        targetWPx = size.widthPx300Dpi;
        targetHPx = size.heightPx300Dpi;
      }
    }

    if (cropOrientation === 'landscape') {
      [targetW, targetH] = [targetH, targetW];
      [targetWPx, targetHPx] = [targetHPx, targetWPx];
    }

    return { targetW, targetH, targetWPx, targetHPx };
  };

  // Action: Set a completely new source image (resets everything)
  const handleSetSourceImage = useCallback((base64: string) => {
    setPhotoState({
      originalBase64: base64,
      currentBase64: base64,
      history: [base64],
      historyIndex: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
    });
    setActiveMode(ToolMode.CROP);
  }, []);

  // Action: Add a new edit state to history
  const handleAddEdit = useCallback((newBase64: string) => {
    setPhotoState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newBase64);
      return {
        ...prev,
        currentBase64: newBase64,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
      };
    });
    // Clear canvas when new edit comes in
    if (cleanupCanvasRef.current) {
      const ctx = cleanupCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, cleanupCanvasRef.current.width, cleanupCanvasRef.current.height);
    }
  }, []);

  // Action: Undo
  const handleUndo = useCallback(() => {
    setPhotoState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          currentBase64: prev.history[newIndex],
          historyIndex: newIndex,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
        };
      }
      return prev;
    });
    if (cleanupCanvasRef.current) {
      const ctx = cleanupCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, cleanupCanvasRef.current.width, cleanupCanvasRef.current.height);
    }
  }, []);

  // Action: Apply Crop
  const handleApplyCrop = async () => {
    if (!photoState.currentBase64 || !currentCropRect) return;
    
    setIsProcessing(true);
    try {
      const { targetWPx, targetHPx } = getCurrentCropTargets();
      const croppedBase64 = await cropImageBase64(
        photoState.currentBase64,
        currentCropRect,
        targetWPx,
        targetHPx
      );
      handleAddEdit(croppedBase64);
      setActiveMode(ToolMode.RETOUCH);
    } catch (e) {
      console.error("Failed to crop image", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Apply Cleanup (Content Aware Fill)
  const handleApplyCleanup = async () => {
    if (!photoState.currentBase64 || !cleanupCanvasRef.current) return;
    setIsProcessing(true);
    setCleanupError('');
    try {
      // First, composite the image with the red brush strokes
      const baseImage = await getBurnedImage() || photoState.currentBase64;
      const maskCanvas = cleanupCanvasRef.current;
      
      // Check if canvas is actually drawn on by checking pixel data
      const ctx = maskCanvas.getContext('2d');
      if (ctx) {
        const pixelBuffer = new Uint32Array(ctx.getImageData(0,0, maskCanvas.width, maskCanvas.height).data.buffer);
        if (!pixelBuffer.some(color => color !== 0)) {
           throw new Error("No brush strokes detected. Please draw over the areas you want to remove.");
        }
      }

      const compositeBase64 = await applyCleanupMask(baseImage, maskCanvas);
      
      const prompt = "CRITICAL INSTRUCTION: Analyze the bright red brush strokes overlaid on this image. Remove everything underneath the red strokes and intelligently fill the gaps using content-aware background matching (in-painting). The output MUST NOT have the red strokes anymore. Preserve the rest of the image, the person's identity, and lighting EXACTLY as it is without any other modifications.";
      
      const resultBase64 = await geminiService.editImage(compositeBase64, prompt);
      handleAddEdit(resultBase64);
    } catch (err: any) {
      console.error(err);
      setCleanupError(err.message || 'An error occurred during cleanup processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Manual Tuning
  const handleTuneChange = (type: keyof PhotoState, value: number) => {
    setPhotoState(prev => ({ ...prev, [type]: value }));
  };

  const handleTuneReset = () => {
    setPhotoState(prev => ({ 
      ...prev, 
      brightness: 100, 
      contrast: 100, 
      saturation: 100, 
      blur: 0 
    }));
  };

  // Utility to burn current CSS filters into the actual base64 before passing to AI or Print
  const getBurnedImage = async (): Promise<string | null> => {
    if (!photoState.currentBase64) return null;
    if (photoState.brightness === 100 && photoState.contrast === 100 && photoState.saturation === 100 && photoState.blur === 0) {
      return photoState.currentBase64;
    }
    try {
      return await applyFiltersToDataUrl(
        photoState.currentBase64, 
        photoState.brightness, 
        photoState.contrast,
        photoState.saturation,
        photoState.blur
      );
    } catch (e) {
      console.error("Failed to apply filters", e);
      return photoState.currentBase64; // fallback
    }
  };

  const renderToolPanel = () => {
    switch (activeMode) {
      case ToolMode.SOURCE:
        return <SourcePanel onImageSet={handleSetSourceImage} />;
      case ToolMode.CROP:
        return (
          <CropPanel 
            hasImage={!!photoState.currentBase64}
            selectedSizeId={cropSizeId}
            onSizeChange={setCropSizeId}
            orientation={cropOrientation}
            onOrientationChange={setCropOrientation}
            customWidthInches={customCropInches.width}
            customHeightInches={customCropInches.height}
            onCustomSizeChange={(w, h) => setCustomCropInches({width: w, height: h})}
            onApplyCrop={handleApplyCrop}
            isProcessing={isProcessing}
          />
        );
      case ToolMode.TUNE:
        return (
          <TunePanel 
            brightness={photoState.brightness}
            contrast={photoState.contrast}
            saturation={photoState.saturation}
            blur={photoState.blur}
            onBrightnessChange={(val) => handleTuneChange('brightness', val)}
            onContrastChange={(val) => handleTuneChange('contrast', val)}
            onSaturationChange={(val) => handleTuneChange('saturation', val)}
            onBlurChange={(val) => handleTuneChange('blur', val)}
            onReset={handleTuneReset}
            hasImage={!!photoState.currentBase64}
          />
        );
      case ToolMode.CLEANUP:
        return (
          <CleanupPanel 
            hasImage={!!photoState.currentBase64}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            onClearBrush={() => {
              if(cleanupCanvasRef.current) {
                const ctx = cleanupCanvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, cleanupCanvasRef.current.width, cleanupCanvasRef.current.height);
              }
            }}
            onApplyCleanup={handleApplyCleanup}
            isProcessing={isProcessing}
            error={cleanupError}
          />
        )
      case ToolMode.RETOUCH:
        return (
          <RetouchPanel 
            currentImage={photoState.currentBase64}
            onImageEdit={handleAddEdit}
            burnCurrentFilters={getBurnedImage}
          />
        );
      case ToolMode.AI_MAGIC:
        return (
          <AIPanel 
            currentImage={photoState.currentBase64} 
            onImageEdit={handleAddEdit}
            burnCurrentFilters={getBurnedImage}
          />
        );
      case ToolMode.GROUP_MAGIC:
        return (
          <GroupPanel 
            currentImage={photoState.currentBase64}
            onImageEdit={handleAddEdit}
            burnCurrentFilters={getBurnedImage}
          />
        );
      case ToolMode.PRINT_LAYOUT:
        return (
          <PrintPanel 
            currentImage={photoState.currentBase64}
            burnCurrentFilters={getBurnedImage}
          />
        );
      default:
        return null;
    }
  };

  const { targetW, targetH } = getCurrentCropTargets();
  const targetCropAspect = targetH > 0 ? (targetW / targetH) : 1;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 font-sans text-slate-100 selection:bg-brand-500/30">
      <Header onUndo={handleUndo} canUndo={photoState.historyIndex > 0} />
      
      {/* Main Responsive Layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full">
        
        {/* Sidebar (Bottom on mobile, Left on desktop) */}
        <Sidebar 
          activeMode={activeMode} 
          onSelectMode={setActiveMode} 
          className="order-3 md:order-1 flex flex-row md:flex-col w-full md:w-20 overflow-x-auto md:overflow-visible border-t md:border-t-0 md:border-r"
        />
        
        {/* Tool Panel (Drawer on mobile, beside Sidebar on desktop) */}
        <div className="order-2 md:order-2 w-full md:w-80 h-[38vh] md:h-full shrink-0 overflow-y-auto bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.2)] md:shadow-xl z-10">
          {renderToolPanel()}
        </div>

        {/* Workspace (Top on mobile, Right main area on desktop) */}
        <div className="order-1 md:order-3 flex-1 overflow-hidden relative">
          <Workspace 
            currentBase64={photoState.currentBase64} 
            brightness={photoState.brightness}
            contrast={photoState.contrast}
            saturation={photoState.saturation}
            blur={photoState.blur}
            activeMode={activeMode}
            targetCropAspectRatio={targetCropAspect}
            onCropChange={setCurrentCropRect}
            cleanupCanvasRef={cleanupCanvasRef}
            brushSize={brushSize}
          />
        </div>
      </div>
    </div>
  );
};

export default App;