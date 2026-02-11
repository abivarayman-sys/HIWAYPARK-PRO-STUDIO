export enum ToolMode {
  SOURCE = 'SOURCE',
  CROP = 'CROP',
  TUNE = 'TUNE',
  CLEANUP = 'CLEANUP',
  RETOUCH = 'RETOUCH',
  AI_MAGIC = 'AI_MAGIC',
  GROUP_MAGIC = 'GROUP_MAGIC',
  PRINT_LAYOUT = 'PRINT_LAYOUT'
}

export interface PhotoState {
  originalBase64: string | null;
  currentBase64: string | null;
  history: string[];
  historyIndex: number;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export interface PrintSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  widthPx300Dpi: number;
  heightPx300Dpi: number;
}

export interface CropRect {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export const PRINT_SIZES: Record<string, PrintSize> = {
  '1x1': { id: '1x1', name: '1x1 Inch', widthMm: 25.4, heightMm: 25.4, widthPx300Dpi: 300, heightPx300Dpi: 300 },
  '2x2': { id: '2x2', name: '2x2 Inch', widthMm: 50.8, heightMm: 50.8, widthPx300Dpi: 600, heightPx300Dpi: 600 },
  'passport_ph': { id: 'passport_ph', name: 'PH Passport (35x45mm)', widthMm: 35, heightMm: 45, widthPx300Dpi: 413, heightPx300Dpi: 531 },
  'wallet': { id: 'wallet', name: 'Wallet Size (2.5x3.5")', widthMm: 63.5, heightMm: 88.9, widthPx300Dpi: 750, heightPx300Dpi: 1050 },
  '4x6': { id: '4x6', name: '4x6 Inch', widthMm: 101.6, heightMm: 152.4, widthPx300Dpi: 1200, heightPx300Dpi: 1800 },
  '4r': { id: '4r', name: '4R Portrait (4x6")', widthMm: 101.6, heightMm: 152.4, widthPx300Dpi: 1200, heightPx300Dpi: 1800 },
};

export const PAPER_SIZES = {
  'A4': { name: 'A4 Sheet', widthPx: 2480, heightPx: 3508 },
  '4R': { name: '4R Photo Paper', widthPx: 1200, heightPx: 1800 }
};