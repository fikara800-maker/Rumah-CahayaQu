'use client';

import React, { useState } from 'react';
import { Database, Copy, Check, X, FileCode, Layers, ShieldCheck } from 'lucide-react';
import { MYSQL_SCHEMA_SQL, POSTGRESQL_SCHEMA_SQL } from '../../data/databaseSchemas';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DatabaseSchemaModal({ isOpen, onClose }: DatabaseSchemaModalProps) {
  const [activeTab, setActiveTab] = useState<'mysql' | 'postgresql'>('mysql');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentSql = activeTab === 'mysql' ? MYSQL_SCHEMA_SQL : POSTGRESQL_SCHEMA_SQL;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E0D8CC] w-[95%] sm:w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#EDE6DD] flex items-center justify-between bg-brand-light shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary/15 text-brand-primary flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-brand-dark font-display truncate">
                Skema Database Relasional
              </h3>
              <p className="text-[11px] text-brand-muted truncate">
                DDL Master Lokasi Bimbel, Geofencing, dan Presensi Real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white border border-[#E0D8CC] flex items-center justify-center text-gray-400 hover:text-brand-dark transition-all cursor-pointer shadow-xs min-h-[44px] min-w-[44px] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher & Copy Action */}
        <div className="px-4 sm:px-5 py-3 border-b border-[#EDE6DD] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 p-1 bg-brand-light rounded-xl border border-[#E8E1D7]">
            <button
              onClick={() => setActiveTab('mysql')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                activeTab === 'mysql'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-brand-dark'
              }`}
            >
              MySQL 8.0+
            </button>
            <button
              onClick={() => setActiveTab('postgresql')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                activeTab === 'postgresql'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-brand-dark'
              }`}
            >
              PostgreSQL / PostGIS
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-brand-light hover:bg-brand-light/80 text-brand-dark border border-[#E0D8CC] font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[36px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin ke Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Salin Script SQL</span>
              </>
            )}
          </button>
        </div>

        {/* SQL Code Preview Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[#1A1822] text-[#E8E6F0] font-mono text-[11px] sm:text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap select-all">{currentSql}</pre>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#EDE6DD] bg-brand-light flex items-center justify-between text-xs text-brand-muted shrink-0 sticky bottom-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Skema siap dieksekusi di phpMyAdmin, DBeaver, pgAdmin, atau Supabase.</span>
            <span className="sm:hidden text-[10px]">Siap dieksekusi di SQL DB.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-dark hover:bg-brand-dark/90 text-white font-bold rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
