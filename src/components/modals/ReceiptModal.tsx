import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Building2, 
  FileText, 
  ShieldCheck, 
  CreditCard,
  Calendar,
  User,
  Sparkles
} from 'lucide-react';
import { Invoice, BankAccountInfo } from '../../types';
import Logo from '../common/Logo';
import { DEFAULT_SCHOOL_INFO } from '../../lib/exportUtils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  bankAccount?: BankAccountInfo;
  parentName?: string;
  studentClass?: string;
}

// Convert numbers to Indonesian words for receipt (Terbilang)
function terbilang(angka: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  if (angka < 12) {
    return bilangan[angka];
  } else if (angka < 20) {
    return terbilang(angka - 10) + ' Belas';
  } else if (angka < 100) {
    return terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10);
  } else if (angka < 200) {
    return 'Seratus ' + terbilang(angka - 100);
  } else if (angka < 1000) {
    return terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100);
  } else if (angka < 2000) {
    return 'Seribu ' + terbilang(angka - 1000);
  } else if (angka < 1000000) {
    return terbilang(Math.floor(angka / 1000)) + ' Ribu ' + terbilang(angka % 1000);
  } else if (angka < 1000000000) {
    return terbilang(Math.floor(angka / 1000000)) + ' Juta ' + terbilang(angka % 1000000);
  }
  return angka.toString();
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  bankAccount,
  parentName,
  studentClass,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = invoice.amount.toLocaleString('id-ID');
  const amountInWords = `${terbilang(invoice.amount).trim()} Rupiah`;
  const paymentDate = invoice.dueDate || new Date().toISOString().split('T')[0];
  const receiptNo = `KWT-${invoice.invoiceNo.replace(/\D/g, '') || Date.now().toString().slice(-6)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#EDE6DD] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Top Modal Bar (Excluded from print) */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-brand-primary text-white shrink-0 print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">Bukti Kuitansi Pembayaran Resmi</h3>
                <p className="text-[11px] text-white/80 font-medium">Bimbel Rumah CahayaQu • Status Lunas</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-brand-primary font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Cetak Kuitansi"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak / Simpan PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer aspect-square"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Receipt Paper Container */}
          <div className="p-6 sm:p-8 overflow-y-auto sleek-scrollbar flex-1 bg-[#FAF7F2]">
            <div 
              id="printable-receipt"
              className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DFD5C6] shadow-sm relative overflow-hidden space-y-6"
            >
              {/* Watermark LUNAS */}
              <div className="absolute right-6 top-20 pointer-events-none select-none opacity-[0.08] transform rotate-[-20deg]">
                <span className="text-8xl sm:text-9xl font-black text-emerald-700 tracking-widest border-8 border-emerald-700 px-6 py-2 rounded-3xl">
                  LUNAS
                </span>
              </div>

              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-brand-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-light p-2 flex items-center justify-center border border-[#EAE3DC] shadow-2xs shrink-0">
                    <Logo className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-brand-dark tracking-tight font-display">
                      {DEFAULT_SCHOOL_INFO.name}
                    </h2>
                    <p className="text-[11px] text-gray-500 font-medium leading-tight">
                      {DEFAULT_SCHOOL_INFO.address}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      WhatsApp: {DEFAULT_SCHOOL_INFO.phone} • Email: info@rumahcahayaqu.id
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-brand-light/70 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto border sm:border-0 border-[#ECE4D8]">
                  <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                    KUITANSI RESMI
                  </div>
                  <div className="text-xs font-mono font-extrabold text-brand-dark">
                    No: {receiptNo}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    Tanggal: {paymentDate}
                  </div>
                </div>
              </div>

              {/* Receipt Body Details */}
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 pb-2.5 border-b border-[#F0EBE1]">
                  <span className="font-bold text-gray-500">Telah Diterima Dari:</span>
                  <span className="sm:col-span-2 font-extrabold text-brand-dark">
                    {parentName || `Wali dari Ananda ${invoice.studentName}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 pb-2.5 border-b border-[#F0EBE1]">
                  <span className="font-bold text-gray-500">Nama Siswa / Kelas:</span>
                  <span className="sm:col-span-2 font-extrabold text-brand-dark">
                    {invoice.studentName} {studentClass ? `(${studentClass})` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 pb-2.5 border-b border-[#F0EBE1]">
                  <span className="font-bold text-gray-500">Untuk Pembayaran:</span>
                  <span className="sm:col-span-2 font-extrabold text-brand-dark">
                    SPP &amp; Iuran Belajar Bulan <strong className="text-brand-primary font-black">{invoice.billingMonth}</strong> (Invoice #{invoice.invoiceNo})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 pb-2.5 border-b border-[#F0EBE1]">
                  <span className="font-bold text-gray-500">Uang Sejumlah:</span>
                  <div className="sm:col-span-2">
                    <span className="font-extrabold text-brand-primary text-sm sm:text-base font-mono">
                      Rp {formattedAmount}
                    </span>
                    <p className="text-[11.5px] italic text-gray-600 font-serif bg-brand-light/60 p-2 rounded-lg mt-1 border border-[#EDE6DD]">
                      "{amountInWords}"
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 pb-2.5 border-b border-[#F0EBE1]">
                  <span className="font-bold text-gray-500">Metode &amp; Status:</span>
                  <div className="sm:col-span-2 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      LUNAS &amp; TERVERIFIKASI
                    </span>
                    <span className="text-gray-500 text-xs font-medium">
                      Transfer Bank ({bankAccount?.bankName || 'BSI Bimbel'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer / Signature */}
              <div className="pt-4 flex flex-col sm:flex-row items-end justify-between gap-6">
                <div className="text-[11px] text-gray-400 max-w-xs font-medium">
                  <p className="leading-relaxed">
                    *Kuitansi ini sah dan diterbitkan secara digital oleh sistem administrasi Rumah CahayaQu sebagai bukti pelunasan resmi.
                  </p>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <p className="text-[11px] text-gray-500 font-medium">Indramayu, {paymentDate}</p>
                  <p className="text-xs font-extrabold text-brand-dark mt-0.5">Bagian Administrasi &amp; Keuangan</p>
                  
                  {/* Digital Stamp & Signature */}
                  <div className="my-2 inline-flex items-center justify-center p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                      <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider block mt-0.5">
                        DIGITALLY VERIFIED
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-brand-dark underline font-display">
                    {bankAccount?.accountHolder || 'Defika (Rumah CahayaQu)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer (Excluded from print) */}
          <div className="p-4 bg-white border-t border-[#EDE6DD] flex items-center justify-between gap-3 shrink-0 print:hidden">
            <span className="text-xs text-gray-500 font-medium">
              Format Kuitansi Resmi Standar A5 / PDF
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Unduh / Cetak Kuitansi</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
