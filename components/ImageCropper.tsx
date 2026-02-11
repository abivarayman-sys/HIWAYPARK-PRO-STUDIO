import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CropRect } from '../types';

interface ImageCropperProps {
  src: string;
  targetAspectRatio: number; // width / height
  onChange: (rect: CropRect) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ src, targetAspectRatio, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Crop rect in percentages (0-100)
  const [crop, setCrop] = useState<CropRect>({ x: 10, y: 10, width: 80, height: 80 });
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize crop size to fit image maximally while respecting target aspect ratio
  useEffect(() => {
    const handleImageLoad = () => {
      if (!imgRef.current) return;
      const { clientWidth: cw, clientHeight: ch } = imgRef.current;
      if (cw === 0 || ch === 0) return;

      const imageAspect = cw / ch;
      
      let newW = 0;
      let newH = 0;

      if (imageAspect > targetAspectRatio) {
        // Image is wider than crop box. Maximize height.
        newH = 90; // 90% of height
        const newHPx = (90 / 100) * ch;
        const newWPx = newHPx * targetAspectRatio;
        newW = (newWPx / cw) * 100;
      } else {
        // Image is taller than crop box. Maximize width.
        newW = 90; // 90% of width
        const newWPx = (90 / 100) * cw;
        const newHPx = newWPx / targetAspectRatio;
        newH = (newHPx / ch) * 100;
      }

      const initialCrop = {
        x: (100 - newW) / 2,
        y: (100 - newH) / 2,
        width: newW,
        height: newH
      };
      
      setCrop(initialCrop);
      onChange(initialCrop);
    };

    if (imgRef.current?.complete) {
      handleImageLoad();
    }
  }, [src, targetAspectRatio]); // Re-run if aspect ratio changes

  const handlePointerDown = (e: React.PointerEvent, type: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setStartCrop({ ...crop });
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !containerRef.current) return;

    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;

    let newCrop = { ...startCrop };

    if (dragType === 'move') {
      const deltaXPct = (deltaX / cw) * 100;
      const deltaYPct = (deltaY / ch) * 100;
      newCrop.x = Math.max(0, Math.min(100 - newCrop.width, startCrop.x + deltaXPct));
      newCrop.y = Math.max(0, Math.min(100 - newCrop.height, startCrop.y + deltaYPct));
    } else {
      // Resize handling - perform in pixels to strictly maintain aspect ratio
      const startWPx = (startCrop.width / 100) * cw;
      const startHPx = (startCrop.height / 100) * ch;
      const startXPx = (startCrop.x / 100) * cw;
      const startYPx = (startCrop.y / 100) * ch;

      let newWPx = startWPx;
      let newHPx = startHPx;
      let newXPx = startXPx;
      let newYPx = startYPx;

      if (dragType === 'se') {
        newWPx = startWPx + deltaX;
      } else if (dragType === 'sw') {
        newWPx = startWPx - deltaX;
      } else if (dragType === 'ne') {
        newWPx = startWPx + deltaX;
      } else if (dragType === 'nw') {
        newWPx = startWPx - deltaX;
      }

      // Enforce minimum size
      newWPx = Math.max(40, newWPx);
      newHPx = newWPx / targetAspectRatio;

      // Adjust X and Y for left/top drags
      if (dragType === 'sw' || dragType === 'nw') {
        newXPx = startXPx + (startWPx - newWPx);
      }
      if (dragType === 'ne' || dragType === 'nw') {
        newYPx = startYPx + (startHPx - newHPx);
      }

      // Convert back to percentages
      newCrop.width = (newWPx / cw) * 100;
      newCrop.height = (newHPx / ch) * 100;
      newCrop.x = (newXPx / cw) * 100;
      newCrop.y = (newYPx / ch) * 100;

      // Boundary clamping (simplified, prioritizes keeping box inside)
      if (newCrop.x < 0) newCrop.x = 0;
      if (newCrop.y < 0) newCrop.y = 0;
      if (newCrop.x + newCrop.width > 100) newCrop.x = 100 - newCrop.width;
      if (newCrop.y + newCrop.height > 100) newCrop.y = 100 - newCrop.height;
    }

    setCrop(newCrop);
    onChange(newCrop);

  }, [isDragging, dragType, dragStartPos, startCrop, targetAspectRatio]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    // inline-flex perfectly bounds the container exactly to the visual image size
    <div 
      className="relative inline-flex shrink-0 bg-black shadow-2xl border border-slate-700/50 touch-none" 
      ref={containerRef} 
      style={{ maxWidth: '100%', maxHeight: '100%', touchAction: 'none' }}
    >
      {/* The base image */}
      <img 
        ref={imgRef}
        src={src} 
        alt="Crop Source" 
        className="block pointer-events-none select-none"
        style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
        onLoad={() => {
          // Trigger the effect by just reading dimensions (handled in useEffect)
        }}
      />

      {/* Dark overlay with mask for the cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <mask id="crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect 
              x={`${crop.x}%`} 
              y={`${crop.y}%`} 
              width={`${crop.width}%`} 
              height={`${crop.height}%`} 
              fill="black" 
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask)" />
        
        {/* Border of the crop area */}
        <rect 
          x={`${crop.x}%`} 
          y={`${crop.y}%`} 
          width={`${crop.width}%`} 
          height={`${crop.height}%`} 
          fill="none" 
          stroke="white" 
          strokeWidth="2" 
          strokeDasharray="4 4" 
        />
      </svg>

      {/* Interactive elements */}
      <div className="absolute inset-0 z-20 overflow-hidden touch-none">
        {/* Draggable center area */}
        <div
          className="absolute cursor-move touch-none"
          style={{ 
            left: `${crop.x}%`, 
            top: `${crop.y}%`, 
            width: `${crop.width}%`, 
            height: `${crop.height}%` 
          }}
          onPointerDown={(e) => handlePointerDown(e, 'move')}
        />

        {/* Resize Handles - Increased to w-8 h-8 for flawless mobile touch targets */}
        <div
          className="absolute w-8 h-8 bg-white border-4 border-brand-500 rounded-full shadow-lg cursor-nwse-resize transform -translate-x-1/2 -translate-y-1/2 touch-none"
          style={{ left: `${crop.x}%`, top: `${crop.y}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'nw')}
        />
        <div
          className="absolute w-8 h-8 bg-white border-4 border-brand-500 rounded-full shadow-lg cursor-nesw-resize transform translate-x-1/2 -translate-y-1/2 touch-none"
          style={{ left: `${crop.x + crop.width}%`, top: `${crop.y}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'ne')}
        />
        <div
          className="absolute w-8 h-8 bg-white border-4 border-brand-500 rounded-full shadow-lg cursor-nesw-resize transform -translate-x-1/2 translate-y-1/2 touch-none"
          style={{ left: `${crop.x}%`, top: `${crop.y + crop.height}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'sw')}
        />
        <div
          className="absolute w-8 h-8 bg-white border-4 border-brand-500 rounded-full shadow-lg cursor-nwse-resize transform translate-x-1/2 translate-y-1/2 touch-none"
          style={{ left: `${crop.x + crop.width}%`, top: `${crop.y + crop.height}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'se')}
        />
      </div>
    </div>
  );
};