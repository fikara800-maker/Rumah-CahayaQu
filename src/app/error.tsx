"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js App Error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 antialiased">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E0D8CC] shadow-xl p-6 sm:p-8 text-center space-y-6">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Error Message Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-black text-[#2D232E] tracking-tight">
            Terjadi Kendala Teknis
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Sistem mendeteksi adanya kendala saat memuat halaman. Data Anda tetap tersimpan dengan aman.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 bg-[#8A4C93] hover:bg-[#8A4C93]/90 text-white rounded-xl text-xs font-bold shadow-md shadow-[#8A4C93]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full py-2.5 px-4 bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#2D232E] rounded-xl text-xs font-bold border border-[#E0D8CC] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-gray-500" />
            Kembali ke Beranda
          </button>
        </div>

      </div>
    </div>
  );
}
