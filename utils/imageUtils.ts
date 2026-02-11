import { PRINT_SIZES, PAPER_SIZES, CropRect } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const applyFiltersToDataUrl = async (
  dataUrl: string,
  brightness: number,
  contrast: number,
  saturation: number,
  blur: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get 2d context"));
        return;
      }
      
      // Apply filters
      // Map brightness/contrast/saturation from 0-200 (100 is neutral) to percentage string
      // Blur is in pixels
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

export const applyCleanupMask = async (sourceBase64: string, maskCanvas: HTMLCanvasElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Could not get 2d context"));

      ctx.drawImage(img, 0, 0);
      ctx.drawImage(maskCanvas, 0, 0, img.width, img.height);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = reject;
    img.src = sourceBase64;
  });
};

export const cropImageBase64 = async (
  sourceBase64: string,
  cropRectPct: CropRect,
  targetWidthPx: number,
  targetHeightPx: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidthPx;
      canvas.height = targetHeightPx;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Could not get 2d context"));

      // Calculate source pixels based on percentages
      const sx = (cropRectPct.x / 100) * img.width;
      const sy = (cropRectPct.y / 100) * img.height;
      const sw = (cropRectPct.width / 100) * img.width;
      const sh = (cropRectPct.height / 100) * img.height;

      // Ensure high quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background in case of any transparency or edge issues
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidthPx, targetHeightPx);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = reject;
    img.src = sourceBase64;
  });
};

export const generatePrintLayout = async (
  sourceBase64: string,
  printSizeId: string,
  paperSizeId: string,
  copies: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const printSize = PRINT_SIZES[printSizeId];
      const paperInfo = PAPER_SIZES[paperSizeId as keyof typeof PAPER_SIZES];
      
      if (!printSize || !paperInfo) {
        reject(new Error("Invalid print or paper size"));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = paperInfo.widthPx;
      canvas.height = paperInfo.heightPx;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get 2d context"));
        return;
      }

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // We need to crop/scale the source image to fit the target aspect ratio perfectly
      const targetWidth = printSize.widthPx300Dpi;
      const targetHeight = printSize.heightPx300Dpi;
      
      const sourceAspect = img.width / img.height;
      const targetAspect = targetWidth / targetHeight;
      
      let sWidth = img.width;
      let sHeight = img.height;
      let sx = 0;
      let sy = 0;

      if (sourceAspect > targetAspect) {
        // Source is wider, crop sides
        sWidth = img.height * targetAspect;
        sx = (img.width - sWidth) / 2;
      } else {
        // Source is taller, crop top/bottom
        sHeight = img.width / targetAspect;
        sy = (img.height - sHeight) / 2;
      }

      // Create a temporary canvas for the perfectly cropped single ID
      const singleIdCanvas = document.createElement('canvas');
      singleIdCanvas.width = targetWidth;
      singleIdCanvas.height = targetHeight;
      const idCtx = singleIdCanvas.getContext('2d');
      if(idCtx) {
         idCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
         // Draw a faint border around it for cutting guides
         idCtx.strokeStyle = '#cccccc';
         idCtx.lineWidth = 2;
         idCtx.strokeRect(0, 0, targetWidth, targetHeight);
      }

      // Layout logic
      const padding = 20; // px padding between images
      const marginX = 50; // page margin
      const marginY = 50;
      
      const availableWidth = canvas.width - (marginX * 2);
      const cols = Math.floor((availableWidth + padding) / (targetWidth + padding));
      
      if (cols === 0) {
        reject(new Error("Image too large for this paper size"));
        return;
      }

      let count = 0;
      let x = marginX;
      let y = marginY;

      for (let i = 0; i < copies; i++) {
        if (count > 0 && count % cols === 0) {
          x = marginX;
          y += targetHeight + padding;
          
          if (y + targetHeight > canvas.height - marginY) {
            console.warn("Exceeded paper height, stopping at", count, "copies");
            break; // Stop if we exceed page height (could implement multi-page later)
          }
        }
        
        ctx.drawImage(singleIdCanvas, x, y);
        x += targetWidth + padding;
        count++;
      }

      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = reject;
    img.src = sourceBase64;
  });
};