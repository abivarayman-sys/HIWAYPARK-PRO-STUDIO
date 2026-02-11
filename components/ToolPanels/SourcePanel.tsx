import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '../Button';
import { CameraIcon, UploadIcon } from '../icons';
import { fileToBase64 } from '../../utils/imageUtils';

interface SourcePanelProps {
  onImageSet: (base64: string) => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({ onImageSet }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      setError('Could not access camera. Please allow permissions or use upload.');
      console.error(err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera(); // Cleanup on unmount
    };
  }, [stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.95);
        onImageSet(base64);
        stopCamera();
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        onImageSet(base64);
      } catch (err) {
        setError('Failed to read file.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Source Image</h2>
        <p className="text-sm text-slate-400 mb-4">Capture a new photo from your webcam or upload an existing one to begin editing.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {!isCameraActive ? (
        <div className="flex flex-col gap-3">
          <Button onClick={startCamera} icon={<CameraIcon />} fullWidth>
            Open Web Camera
          </Button>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-sm uppercase">or</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button 
            variant="secondary" 
            icon={<UploadIcon />} 
            fullWidth
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Photo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] border border-slate-700">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover transform scale-x-[-1]" // mirror for self-view
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={stopCamera} className="flex-1">
              Cancel
            </Button>
            <Button onClick={capturePhoto} className="flex-2 bg-brand-600">
              Take Photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
