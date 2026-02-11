import React, { useRef, useState, useEffect } from 'react';
import { ToolMode, CropRect } from '../types';
import { ImageCropper } from './ImageCropper';

interface WorkspaceProps {
  currentBase64: string | null;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  activeMode: ToolMode;
  targetCropAspectRatio?: number;
  onCropChange?: (rect: CropRect) => void;
  cleanupCanvasRef?: React.RefObject<HTMLCanvasElement>;
  brushSize?: number;
}

export const Workspace: React.FC<WorkspaceProps> = ({ 
  currentBase64, 
  brightness, 
  contrast, 
  saturation,
  blur,
  activeMode,
  targetCropAspectRatio,
  onCropChange,
  cleanupCanvasRef,
  brushSize = 20
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Create an inline style for the CSS filters based on the state
  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`
  };

  // Sync canvas dimensions with image natural dimensions for accurate masking
  useEffect(() => {
    if (activeMode === ToolMode.CLEANUP && imgRef.current && cleanupCanvasRef?.current) {
      const img = imgRef.current;
      const canvas = cleanupCanvasRef.current;
      
      const setSize = () => {
        if (!img.naturalWidth || !img.naturalHeight) return;
        if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
          // Only resize if natural dimensions differ to avoid clearing canvas unnecessarily
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        }
      };

      if (img.complete) {
        setSize();
      } else {
        img.addEventListener('load', setSize);
        return () => img.removeEventListener('load', setSize);
      }
    }
  }, [activeMode, currentBase64, cleanupCanvasRef]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeMode !== ToolMode.CLEANUP || !cleanupCanvasRef?.current || !imgRef.current) return;
    const canvas = cleanupCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // Scale from visible rect to native canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeMode !== ToolMode.CLEANUP || !cleanupCanvasRef?.current) return;
    const canvas = cleanupCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    // Draw with semi-transparent red to show mask over image
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    // Scale brush size to relative image resolution
    ctx.lineWidth = brushSize * scaleX; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex-1 relative flex items-center justify-center w-full h-full min-h-0 min-w-0 overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="z-10 w-full h-full p-2 md:p-8 flex items-center justify-center min-h-0 min-w-0">
        {currentBase64 ? (
          activeMode === ToolMode.CROP && targetCropAspectRatio && onCropChange ? (
             <ImageCropper 
               src={currentBase64} 
               targetAspectRatio={targetCropAspectRatio}
               onChange={onCropChange}
             />
          ) : (
            // Use inline-flex to perfectly shrink-wrap the scaled image, ensuring the overlay canvas matches identically.
            <div 
              className="relative inline-flex shadow-2xl shadow-black/50 rounded-lg overflow-hidden border border-slate-700/50 bg-black shrink-0" 
              style={{ maxWidth: '100%', maxHeight: '100%', touchAction: 'none' }}
            >
              <img 
                ref={imgRef}
                src={currentBase64} 
                alt="Current Edit" 
                className="block transition-all duration-200"
                style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', ...filterStyle }}
                draggable={false}
              />
              
              {/* Cleanup Canvas Overlay */}
              <canvas
                ref={cleanupCanvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                className={`absolute inset-0 w-full h-full touch-none ${activeMode === ToolMode.CLEANUP ? 'cursor-crosshair z-20' : 'pointer-events-none hidden'}`}
              />
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 text-center px-4">
            <div className="w-20 h-20 md:w-24 md:h-24 mb-4 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <p className="text-base md:text-lg font-medium">No Image Selected</p>
            <p className="text-xs md:text-sm mt-1">Go to Source to capture or upload a photo.</p>
          </div>
        )}
      </div>
    </div>
  );
};