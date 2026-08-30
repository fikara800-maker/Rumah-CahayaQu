'use client';

import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, Trash2, PenLine } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  initialImage?: string | null;
  width?: number;
  height?: number;
}

export default function SignatureCanvas({
  onSave,
  onCancel,
  initialImage,
  width = 400,
  height = 180
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Initial clear
    ctx.clearRect(0, 0, width, height);

    // If initial image provided, render it
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, (width - img.width) / 2, (height - img.height) / 2, Math.min(width, img.width), Math.min(height, img.height));
        setHasDrawn(true);
      };
      img.src = initialImage;
    }
  }, [width, height, initialImage]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = '#1E1B4B'; // Elegant deep navy/ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prevent scrolling when drawing on touch screens
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export as transparent PNG
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="relative border-2 border-dashed border-[#C5B4E3] rounded-2xl bg-white overflow-hidden shadow-inner flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: `${width}px`, height: `${height}px`, touchAction: 'none' }}
          className="cursor-crosshair w-full bg-white/50"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-gray-400 gap-1.5">
            <PenLine className="w-5 h-5 text-brand-primary/40" />
            <span className="text-[11px] font-medium">Tanda tangan di sini menggunakan mouse atau jari sentuh</span>
          </div>
        )}

        <div className="absolute bottom-2 left-3 pointer-events-none">
          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-mono">Area Tanda Tangan Digital</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Hapus Coretan</span>
        </button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs cursor-pointer"
            >
              Batal
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn}
            className={`px-4 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              hasDrawn 
                ? 'bg-brand-primary hover:bg-brand-primary-hover text-white' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Gunakan Tanda Tangan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
