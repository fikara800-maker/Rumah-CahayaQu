'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  RotateCcw, 
  Check, 
  PenTool, 
  PenLine,
  Image as ImageIcon, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  Eye,
  FileSignature
} from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import Logo from './Logo';
import { LOGO_BASE64 } from '../../lib/logoBase64';

interface DocumentBrandingManagerProps {
  onLogoChange?: (logoUrl: string | null) => void;
  onHeadmasterSigChange?: (sigUrl: string | null, name: string) => void;
  onTeacherSigChange?: (sigUrl: string | null, name: string) => void;
  defaultHeadmasterName?: string;
  defaultTeacherName?: string;
  className?: string;
}

export default function DocumentBrandingManager({
  onLogoChange,
  onHeadmasterSigChange,
  onTeacherSigChange,
  defaultHeadmasterName = 'Defika, S.Pd.',
  defaultTeacherName = 'Guru Pembimbing',
  className = ''
}: DocumentBrandingManagerProps) {
  // Active Tab in Editor: 'logo' | 'headmaster_sig' | 'teacher_sig'
  const [activeSection, setActiveSection] = useState<'logo' | 'headmaster_sig' | 'teacher_sig'>('logo');

  // Logo state
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Headmaster Signature state
  const [headmasterName, setHeadmasterName] = useState<string>(defaultHeadmasterName);
  const [headmasterSig, setHeadmasterSig] = useState<string | null>(null);
  const [headmasterMode, setHeadmasterMode] = useState<'draw' | 'upload'>('draw');
  const headmasterFileRef = useRef<HTMLInputElement | null>(null);

  // Teacher Signature state
  const [teacherName, setTeacherName] = useState<string>(defaultTeacherName);
  const [teacherSig, setTeacherSig] = useState<string | null>(null);
  const [teacherMode, setTeacherMode] = useState<'draw' | 'upload'>('draw');
  const teacherFileRef = useRef<HTMLInputElement | null>(null);

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Load saved state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLogo = localStorage.getItem('bimbel_custom_logo');
      if (savedLogo) setCustomLogo(savedLogo);

      const savedHeadSig = localStorage.getItem('bimbel_headmaster_signature');
      if (savedHeadSig) setHeadmasterSig(savedHeadSig);

      const savedHeadName = localStorage.getItem('bimbel_headmaster_name');
      if (savedHeadName) setHeadmasterName(savedHeadName);

      const savedTeachSig = localStorage.getItem('bimbel_teacher_signature');
      if (savedTeachSig) setTeacherSig(savedTeachSig);

      const savedTeachName = localStorage.getItem('bimbel_teacher_name');
      if (savedTeachName) setTeacherName(savedTeachName);
    }
  }, []);

  // Update parent when default values change
  useEffect(() => {
    if (defaultTeacherName && defaultTeacherName !== 'Guru Pembimbing') {
      setTeacherName(defaultTeacherName);
    }
  }, [defaultTeacherName]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomLogo(dataUrl);
      localStorage.setItem('bimbel_custom_logo', dataUrl);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bimbel_logo_updated'));
      }
      if (onLogoChange) onLogoChange(dataUrl);
      showToast('Logo berhasil diganti dan disimpan untuk semua dokumen & tampilan!');
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setCustomLogo(null);
    localStorage.removeItem('bimbel_custom_logo');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bimbel_logo_updated'));
    }
    if (onLogoChange) onLogoChange(null);
    showToast('Logo dikembalikan ke logo resmi Rumah CahayaQu.');
  };

  // Handle Headmaster Signature
  const handleSaveHeadmasterSig = (dataUrl: string) => {
    setHeadmasterSig(dataUrl);
    localStorage.setItem('bimbel_headmaster_signature', dataUrl);
    localStorage.setItem('bimbel_headmaster_name', headmasterName);
    if (onHeadmasterSigChange) onHeadmasterSigChange(dataUrl, headmasterName);
    showToast('Tanda tangan Kepala Bimbel berhasil disimpan!');
  };

  const handleHeadmasterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleSaveHeadmasterSig(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleClearHeadmasterSig = () => {
    setHeadmasterSig(null);
    localStorage.removeItem('bimbel_headmaster_signature');
    if (onHeadmasterSigChange) onHeadmasterSigChange(null, headmasterName);
    showToast('Tanda tangan Kepala Bimbel dihapus (kolom tanda tangan kosong).');
  };

  const handleUpdateHeadmasterName = (name: string) => {
    setHeadmasterName(name);
    localStorage.setItem('bimbel_headmaster_name', name);
    if (onHeadmasterSigChange) onHeadmasterSigChange(headmasterSig, name);
  };

  // Handle Teacher Signature
  const handleSaveTeacherSig = (dataUrl: string) => {
    setTeacherSig(dataUrl);
    localStorage.setItem('bimbel_teacher_signature', dataUrl);
    localStorage.setItem('bimbel_teacher_name', teacherName);
    if (onTeacherSigChange) onTeacherSigChange(dataUrl, teacherName);
    showToast('Tanda tangan Guru Pembimbing berhasil disimpan!');
  };

  const handleTeacherFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleSaveTeacherSig(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleClearTeacherSig = () => {
    setTeacherSig(null);
    localStorage.removeItem('bimbel_teacher_signature');
    if (onTeacherSigChange) onTeacherSigChange(null, teacherName);
    showToast('Tanda tangan Guru Pembimbing dihapus.');
  };

  const handleUpdateTeacherName = (name: string) => {
    setTeacherName(name);
    localStorage.setItem('bimbel_teacher_name', name);
    if (onTeacherSigChange) onTeacherSigChange(teacherSig, name);
  };

  return (
    <div className={`p-4 bg-purple-50/60 rounded-2xl border border-brand-primary/20 space-y-4 ${className}`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-brand-primary/20">
        <div>
          <h5 className="text-xs font-extrabold text-brand-dark flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-brand-primary" />
            <span>Kustomisasi Kop Dokumen, Logo & Tanda Tangan Resmi</span>
          </h5>
          <p className="text-[11px] text-gray-500">
            Atur logo yang dicetak pada KOP rapor serta cantumkan tanda tangan digital resmi.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E0D8CC] shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('logo')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeSection === 'logo'
                ? 'bg-brand-primary text-white shadow-2xs'
                : 'text-gray-600 hover:text-brand-primary hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Ganti Logo</span>
            {customLogo && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('headmaster_sig')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeSection === 'headmaster_sig'
                ? 'bg-brand-primary text-white shadow-2xs'
                : 'text-gray-600 hover:text-brand-primary hover:bg-gray-50'
            }`}
          >
            <FileSignature className="w-3 h-3" />
            <span>TTD Kepala Bimbel</span>
            {headmasterSig && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('teacher_sig')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeSection === 'teacher_sig'
                ? 'bg-brand-primary text-white shadow-2xs'
                : 'text-gray-600 hover:text-brand-primary hover:bg-gray-50'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span>TTD Guru</span>
            {teacherSig && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>
        </div>
      </div>

      {/* SECTION 1: EDIT & GANTI LOGO */}
      {activeSection === 'logo' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#E0D8CC]">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#FAF8F5] border border-[#E0D8CC] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                {customLogo ? (
                  <img src={customLogo} alt="Logo Kustom Bimbel" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Logo className="w-10 h-10" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-brand-dark">
                    {customLogo ? 'Logo Kustom Aktif' : 'Logo Resmi Rumah CahayaQu'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    customLogo ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-brand-primary'
                  }`}>
                    {customLogo ? 'Kustom' : 'Default'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {customLogo 
                    ? 'Logo ini otomatis tercetak pada kop surat rapor, kwitansi, presensi, dan dokumen ekspor.'
                    : 'Menggunakan logo vektor emas & ungu bawaan sistem.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{customLogo ? 'Ganti Logo Lain' : 'Unggah Logo Baru'}</span>
              </button>

              {customLogo && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Kembalikan ke logo awal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: TANDA TANGAN KEPALA BIMBEL */}
      {activeSection === 'headmaster_sig' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">
                Nama & Gelar Kepala Bimbel (Tercetak di Rapor):
              </label>
              <input
                type="text"
                value={headmasterName}
                onChange={(e) => handleUpdateHeadmasterName(e.target.value)}
                placeholder="Contoh: Defika, S.Pd."
                className="w-full text-xs px-3 py-2 bg-white border border-[#E0D8CC] rounded-xl focus:border-brand-primary font-bold text-brand-dark"
              />
            </div>

            <div className="flex items-end justify-between sm:justify-end gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E0D8CC]">
                <button
                  type="button"
                  onClick={() => setHeadmasterMode('draw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    headmasterMode === 'draw'
                      ? 'bg-brand-primary text-white shadow-2xs'
                      : 'text-gray-600 hover:text-brand-primary'
                  }`}
                >
                  <PenLine className="w-3 h-3" />
                  <span>Coret / Gambar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeadmasterMode('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    headmasterMode === 'upload'
                      ? 'bg-brand-primary text-white shadow-2xs'
                      : 'text-gray-600 hover:text-brand-primary'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Foto</span>
                </button>
              </div>

              {headmasterSig && (
                <button
                  type="button"
                  onClick={handleClearHeadmasterSig}
                  className="p-2 bg-white hover:bg-red-50 text-red-500 border border-[#E0D8CC] rounded-xl text-xs transition-all cursor-pointer"
                  title="Hapus tanda tangan ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Drawing Canvas or Upload */}
          {headmasterMode === 'draw' ? (
            <SignatureCanvas
              initialImage={headmasterSig}
              onSave={handleSaveHeadmasterSig}
              height={140}
            />
          ) : (
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#C5B4E3] text-center space-y-2">
              <input
                ref={headmasterFileRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleHeadmasterFileUpload}
                className="hidden"
              />
              <FileSignature className="w-8 h-8 text-brand-primary/60 mx-auto" />
              <div>
                <p className="text-xs font-bold text-brand-dark">Unggah Gambar Tanda Tangan Kepala Bimbel</p>
                <p className="text-[11px] text-gray-500">Disarankan format PNG transparan untuk hasil cetak terbaik</p>
              </div>
              <button
                type="button"
                onClick={() => headmasterFileRef.current?.click()}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih Gambar Tanda Tangan</span>
              </button>
            </div>
          )}

          {/* Live Preview Box */}
          {headmasterSig && (
            <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-24 h-12 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-1 overflow-hidden">
                  <img src={headmasterSig} alt="Pratinjau TTD Kepala Bimbel" className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tanda Tangan Siap Dicetak
                  </span>
                  <p className="text-[11px] text-gray-500">Atas nama: <strong>{headmasterName}</strong></p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearHeadmasterSig}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
              >
                Hapus TTD
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: TANDA TANGAN GURU PEMBIMBING */}
      {activeSection === 'teacher_sig' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">
                Nama Guru Pembimbing (Tercetak di Rapor):
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => handleUpdateTeacherName(e.target.value)}
                placeholder="Contoh: Guru Tami / Guru Pembimbing"
                className="w-full text-xs px-3 py-2 bg-white border border-[#E0D8CC] rounded-xl focus:border-brand-primary font-bold text-brand-dark"
              />
            </div>

            <div className="flex items-end justify-between sm:justify-end gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E0D8CC]">
                <button
                  type="button"
                  onClick={() => setTeacherMode('draw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    teacherMode === 'draw'
                      ? 'bg-brand-primary text-white shadow-2xs'
                      : 'text-gray-600 hover:text-brand-primary'
                  }`}
                >
                  <PenLine className="w-3 h-3" />
                  <span>Coret / Gambar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherMode('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    teacherMode === 'upload'
                      ? 'bg-brand-primary text-white shadow-2xs'
                      : 'text-gray-600 hover:text-brand-primary'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Foto</span>
                </button>
              </div>

              {teacherSig && (
                <button
                  type="button"
                  onClick={handleClearTeacherSig}
                  className="p-2 bg-white hover:bg-red-50 text-red-500 border border-[#E0D8CC] rounded-xl text-xs transition-all cursor-pointer"
                  title="Hapus tanda tangan guru"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Drawing Canvas or Upload */}
          {teacherMode === 'draw' ? (
            <SignatureCanvas
              initialImage={teacherSig}
              onSave={handleSaveTeacherSig}
              height={140}
            />
          ) : (
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#C5B4E3] text-center space-y-2">
              <input
                ref={teacherFileRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleTeacherFileUpload}
                className="hidden"
              />
              <PenTool className="w-8 h-8 text-brand-primary/60 mx-auto" />
              <div>
                <p className="text-xs font-bold text-brand-dark">Unggah Gambar Tanda Tangan Guru Pembimbing</p>
                <p className="text-[11px] text-gray-500">Disarankan format PNG transparan untuk hasil cetak terbaik</p>
              </div>
              <button
                type="button"
                onClick={() => teacherFileRef.current?.click()}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih Gambar Tanda Tangan</span>
              </button>
            </div>
          )}

          {/* Live Preview Box */}
          {teacherSig && (
            <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-24 h-12 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-1 overflow-hidden">
                  <img src={teacherSig} alt="Pratinjau TTD Guru" className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tanda Tangan Guru Siap Dicetak
                  </span>
                  <p className="text-[11px] text-gray-500">Atas nama: <strong>{teacherName}</strong></p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearTeacherSig}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
              >
                Hapus TTD
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
