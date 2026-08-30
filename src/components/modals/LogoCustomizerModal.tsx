'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  RotateCcw, 
  Check, 
  Image as ImageIcon, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Camera
} from 'lucide-react';
import Logo from '../common/Logo';

interface LogoCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newLogoUrl: string | null) => void;
}

export default function LogoCustomizerModal({
  isOpen,
  onClose,
  onSuccess
}: LogoCustomizerModalProps) {
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load current saved logo on open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('bimbel_custom_logo');
      setCurrentLogo(saved || null);
      setPreviewLogo(saved || null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (PNG, JPG, JPEG, SVG, atau WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleSaveLogo = () => {
    if (previewLogo) {
      localStorage.setItem('bimbel_custom_logo', previewLogo);
      setCurrentLogo(previewLogo);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bimbel_logo_updated'));
      }
      if (onSuccess) onSuccess(previewLogo);
      showToast('Logo berhasil diperbarui di seluruh aplikasi!');
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('bimbel_custom_logo');
    setCurrentLogo(null);
    setPreviewLogo(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bimbel_logo_updated'));
    }
    if (onSuccess) onSuccess(null);
    showToast('Logo dikembalikan ke lambang resmi Rumah CahayaQu!');
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div 
        className="bg-white w-[95%] sm:w-full max-w-lg rounded-3xl shadow-2xl border border-[#E5DBCE] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 bg-linear-to-r from-brand-primary to-[#632582] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs shrink-0">
              <Camera className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight truncate">
                Ganti & Kustomisasi Logo
              </h3>
              <p className="text-[11px] text-white/80 truncate">
                Atur logo baru untuk tampilan Login, Header Portal & Dokumen Rapor
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* Toast feedback */}
          {toastMessage && (
            <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Upload Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
              isDragOver 
                ? 'border-brand-primary bg-purple-50 scale-[0.99]' 
                : 'border-[#D9CFBF] hover:border-brand-primary/60 bg-[#FAF8F5]'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-[#EAE3DC] mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-brand-primary" />
            </div>

            <p className="text-xs sm:text-sm font-bold text-brand-dark">
              Klik untuk memilih gambar atau seret file ke sini
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Mendukung format PNG, JPG, WebP, SVG (Disarankan gambar transparan / ratio 1:1)
            </p>
          </div>

          {/* Live Previews in Real App Contexts */}
          <div className="p-3.5 sm:p-4 bg-purple-50/50 rounded-2xl border border-brand-primary/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-brand-dark flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-brand-primary" />
                <span>Pratinjau Tampilan Logo di Berbagai Tempat</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                {previewLogo ? (previewLogo === currentLogo ? 'Logo Aktif' : 'Logo Baru') : 'Logo Bawaan'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Context 1: Login Box Preview */}
              <div className="p-2 bg-white rounded-xl border border-[#EAE3DC] flex flex-col items-center text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 p-1.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] flex items-center justify-center mb-1.5 shadow-2xs overflow-hidden">
                  <Logo customSrc={previewLogo} className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] font-bold text-gray-700">Halaman Login</span>
                <span className="text-[9px] text-gray-400">Ukuran 48px</span>
              </div>

              {/* Context 2: Navbar Header Preview */}
              <div className="p-2 bg-white rounded-xl border border-[#EAE3DC] flex flex-col items-center text-center">
                <div className="w-8 h-8 sm:w-9 sm:h-9 p-1 rounded-lg bg-[#FAF8F5] border border-[#EFEAE2] flex items-center justify-center mb-2 shadow-2xs overflow-hidden">
                  <Logo customSrc={previewLogo} className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] font-bold text-gray-700">Header Navbar</span>
                <span className="text-[9px] text-gray-400">Ukuran 36px</span>
              </div>

              {/* Context 3: Rapor & KOP Surat Preview */}
              <div className="p-2 bg-white rounded-xl border border-[#EAE3DC] flex flex-col items-center text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 p-1 rounded-xl bg-white border border-gray-300 flex items-center justify-center mb-1.5 shadow-2xs overflow-hidden">
                  <Logo customSrc={previewLogo} className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] font-bold text-gray-700">KOP Rapor</span>
                <span className="text-[9px] text-gray-400">Dokumen</span>
              </div>
            </div>
          </div>

          {/* Hint info */}
          <div className="flex items-start gap-2 text-[11px] text-gray-500">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Perubahan logo akan langsung diterapkan pada portal wali murid, guru, admin, serta lembar cetak rapor PDF dan kwitansi.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-[#EDE6DD] flex flex-wrap items-center justify-between gap-2.5 sticky bottom-0 shrink-0">
          <div>
            {(currentLogo || previewLogo) && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3.5 py-2 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-[#E5DBCE] transition-all cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bawaan</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs border border-[#E5DBCE] transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Tutup
            </button>

            {previewLogo && previewLogo !== currentLogo && (
              <button
                type="button"
                onClick={handleSaveLogo}
                className="px-4 sm:px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[44px] justify-center"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Logo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
