import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Printer, 
  Download, 
  X, 
  Users, 
  DollarSign, 
  Calendar, 
  ClipboardCheck, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  FileSpreadsheet
} from 'lucide-react';
import { BimbelState, Student, Invoice, Assessment, Attendance, TeacherAttendance, ScheduleItem, BankAccountInfo } from '../../types';
import Logo from '../common/Logo';
import { 
  printStudentReport, 
  printInvoiceReceipt, 
  printAttendanceReport, 
  printFinancialReport, 
  downloadCSV, 
  downloadJSON,
  printHtmlDocument,
  DEFAULT_SCHOOL_INFO
} from '../../lib/exportUtils';
import { 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw, 
  Check, 
  Star, 
  PlusCircle, 
  Sliders,
  PenTool,
  Image as ImageIcon
} from 'lucide-react';
import DocumentBrandingManager from '../common/DocumentBrandingManager';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: BimbelState;
  userRole?: 'admin' | 'teacher' | 'parent';
  preselectedStudentId?: string;
  preselectedInvoiceId?: string;
  onUpdateAssessment?: (assessment: Assessment) => void;
  onDeleteAssessment?: (id: string) => void;
  onAddAssessment?: (assessment: Omit<Assessment, 'id'>) => void;
}

export function ReportExportModal({
  isOpen,
  onClose,
  state,
  userRole = 'admin',
  preselectedStudentId,
  preselectedInvoiceId,
  onUpdateAssessment,
  onDeleteAssessment,
  onAddAssessment,
}: ReportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'rapor' | 'keuangan' | 'absensi' | 'jadwal' | 'backup'>(() => {
    if (preselectedInvoiceId) return 'keuangan';
    return 'rapor';
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (preselectedStudentId) return preselectedStudentId;
    return state.students.length > 0 ? state.students[0].id : '';
  });

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(() => {
    if (preselectedInvoiceId) return preselectedInvoiceId;
    return state.invoices.length > 0 ? state.invoices[0].id : '';
  });

  const [attendanceType, setAttendanceType] = useState<'student' | 'teacher'>('student');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Assessment Editing State for Admin & Teacher
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState<string>('');
  const [editTeacherName, setEditTeacherName] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editAspects, setEditAspects] = useState<Record<string, number>>({});
  
  // Custom Headmaster / Recommendation note customization for Print
  const [customRecommendation, setCustomRecommendation] = useState<string>(
    'Ananda menunjukkan semangat belajar dan adaptasi yang sangat positif di Bimbel Rumah CahayaQu. Diharapkan pendampingan membaca dan muroja\'ah di rumah terus dijaga secara konsisten bersama Ayah/Bunda.'
  );
  const [isEditingRecommendation, setIsEditingRecommendation] = useState<boolean>(false);

  // Document Branding & Signature states
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('bimbel_custom_logo') : null;
  });
  const [headmasterSigUrl, setHeadmasterSigUrl] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('bimbel_headmaster_signature') : null;
  });
  const [headmasterName, setHeadmasterName] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('bimbel_headmaster_name') || 'Defika, S.Pd.') : 'Defika, S.Pd.';
  });
  const [teacherSigUrl, setTeacherSigUrl] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('bimbel_teacher_signature') : null;
  });
  const [teacherName, setTeacherName] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('bimbel_teacher_name') || 'Guru Pembimbing') : 'Guru Pembimbing';
  });

  // Toggle for Branding Manager UI in Rapor tab
  const [showBrandingManager, setShowBrandingManager] = useState<boolean>(false);

  // New assessment entry state in modal
  const [isCreatingNewAssessment, setIsCreatingNewAssessment] = useState<boolean>(false);
  const [newAssessSubject, setNewAssessSubject] = useState<string>('Membaca');
  const [newAssessTeacher, setNewAssessTeacher] = useState<string>('');
  const [newAssessDate, setNewAssessDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newAssessNotes, setNewAssessNotes] = useState<string>('');
  const [newAssessAspects, setNewAssessAspects] = useState<Record<string, number>>({
    'Kelancaran & Pemahaman': 4,
    'Fokus & Konsentrasi': 4,
    'Sikap & Kemandirian': 5,
  });

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (!isOpen) return null;

  const currentStudent = state.students.find(s => s.id === selectedStudentId) || state.students[0];
  const currentInvoice = state.invoices.find(i => i.id === selectedInvoiceId) || state.invoices[0];

  // Evaluations matching the current student
  const studentAssessments = currentStudent 
    ? state.assessments.filter(a => a.studentId === currentStudent.id || a.studentName.toLowerCase() === currentStudent.name.toLowerCase())
    : [];

  const handleStartEditAssessment = (assessment: Assessment) => {
    setEditingAssessmentId(assessment.id);
    setEditSubject(assessment.subject);
    setEditTeacherName(assessment.teacherName);
    setEditDate(assessment.date);
    setEditNotes(assessment.notes || '');
    
    // Convert AspectScore[] to Record<string, number> for UI rating controls
    const aspectsRecord: Record<string, number> = {};
    if (Array.isArray(assessment.aspects)) {
      assessment.aspects.forEach((asp) => {
        aspectsRecord[asp.name] = asp.score;
      });
    }
    if (Object.keys(aspectsRecord).length === 0) {
      aspectsRecord['Kelancaran & Pemahaman'] = 4;
      aspectsRecord['Fokus & Konsentrasi'] = 4;
      aspectsRecord['Sikap & Kemandirian'] = 5;
    }
    setEditAspects(aspectsRecord);
  };

  const handleCancelEditAssessment = () => {
    setEditingAssessmentId(null);
  };

  const handleSaveEditAssessment = (originalAssessment: Assessment) => {
    if (!editSubject.trim()) {
      triggerToast('Mata pelajaran tidak boleh kosong.');
      return;
    }

    // Convert Record<string, number> back to AspectScore[]
    const aspectsArray = Object.entries(editAspects).map(([name, score]) => ({
      name,
      score: Number(score) || 5,
    }));

    const updated: Assessment = {
      ...originalAssessment,
      subject: editSubject.trim(),
      teacherName: editTeacherName.trim() || originalAssessment.teacherName,
      date: editDate,
      notes: editNotes.trim(),
      aspects: aspectsArray,
    };

    if (onUpdateAssessment) {
      onUpdateAssessment(updated);
      triggerToast('Laporan evaluasi rapor berhasil diperbarui!');
    }
    setEditingAssessmentId(null);
  };

  const handleDeleteAssessmentItem = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data laporan evaluasi ini?')) {
      if (onDeleteAssessment) {
        onDeleteAssessment(id);
        triggerToast('Data evaluasi rapor telah dihapus.');
      }
    }
  };

  const handleCreateNewAssessment = () => {
    if (!currentStudent) return;
    if (!newAssessNotes.trim()) {
      triggerToast('Catatan evaluasi wajib diisi.');
      return;
    }

    const teacherName = newAssessTeacher || (state.users.find(u => u.role === 'teacher')?.name || 'Guru Pembimbing');

    const aspectsArray = Object.entries(newAssessAspects).map(([name, score]) => ({
      name,
      score: Number(score) || 5,
    }));

    if (onAddAssessment) {
      onAddAssessment({
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        teacherName: teacherName,
        date: newAssessDate,
        subject: newAssessSubject,
        aspects: aspectsArray,
        notes: newAssessNotes.trim(),
      });
      triggerToast(`Laporan baru berhasil ditambahkan untuk ${currentStudent.name}!`);
      setIsCreatingNewAssessment(false);
      setNewAssessNotes('');
    }
  };

  // 1. Handlers for Student Reports
  const handlePrintStudentReport = () => {
    if (!currentStudent) {
      triggerToast('Pilih murid terlebih dahulu.');
      return;
    }
    printStudentReport(
      currentStudent, 
      state.assessments, 
      state.attendance, 
      state.schedules,
      { 
        customRecommendation,
        headmasterName: headmasterName || undefined,
        teacherName: teacherName || currentStudent.teacherName || undefined,
        customLogoUrl: customLogoUrl || undefined,
        headmasterSignatureUrl: headmasterSigUrl || undefined,
        teacherSignatureUrl: teacherSigUrl || undefined,
      }
    );
  };

  const handleExportStudentsCSV = () => {
    if (userRole === 'parent') {
      triggerToast('Akses dibatasi hanya untuk staf pengajar dan administrator.');
      return;
    }
    const headers = ['ID Murid', 'Nama Murid', 'Mata Pelajaran / Program', 'Nama Orang Tua', 'No. Telepon / WA', 'Guru Pembimbing'];
    const rows = state.students.map(s => [
      s.id,
      s.name,
      s.className || s.subject || 'Membaca',
      s.parentName,
      s.parentPhone,
      s.teacherName || '-'
    ]);
    downloadCSV(`Data_Murid_Bimbel_${new Date().toISOString().split('T')[0]}`, headers, rows);
    triggerToast('File Excel / CSV Data Siswa berhasil disimpan!');
  };

  const handlePrintAllStudentsList = () => {
    if (userRole === 'parent') {
      triggerToast('Akses dibatasi hanya untuk staf pengajar dan administrator.');
      return;
    }
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const bodyHtml = `
      <div class="doc-title-block">
        <div class="doc-title">Daftar Induk Murid Terdaftar</div>
        <div class="doc-subtitle">Bimbel Rumah CahayaQu • Dicetak pada: ${today}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 5%;">No</th>
            <th style="width: 25%;">Nama Siswa</th>
            <th style="width: 20%;">Program Belajar</th>
            <th style="width: 20%;">Nama Orang Tua</th>
            <th style="width: 15%;">No. Telepon</th>
            <th style="width: 15%;">Guru Pembimbing</th>
          </tr>
        </thead>
        <tbody>
          ${state.students.map((s, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td><strong>${s.name}</strong></td>
              <td>${s.className || s.subject || 'Membaca'}</td>
              <td>${s.parentName}</td>
              <td>${s.parentPhone}</td>
              <td>${s.teacherName || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printHtmlDocument(`Daftar_Murid_${new Date().toISOString().split('T')[0]}`, bodyHtml);
  };

  // 2. Handlers for Financial Reports
  const handlePrintInvoice = () => {
    if (!currentInvoice) {
      triggerToast('Pilih invoice terlebih dahulu.');
      return;
    }
    printInvoiceReceipt(currentInvoice, state.bankAccount);
  };

  const handlePrintFinancialReport = () => {
    if (userRole === 'parent') {
      triggerToast('Akses dibatasi hanya untuk administrator.');
      return;
    }
    printFinancialReport(state.invoices, 'Semua Periode 2026');
  };

  const handleExportInvoicesCSV = () => {
    if (userRole === 'parent') {
      triggerToast('Akses dibatasi hanya untuk administrator.');
      return;
    }
    const headers = ['No. Invoice', 'Nama Siswa', 'Nama Orang Tua', 'Nominal (Rp)', 'Bulan Tagihan', 'Jatuh Tempo', 'Status'];
    const rows = state.invoices.map(inv => [
      inv.invoiceNo,
      inv.studentName,
      inv.parentName,
      inv.amount,
      inv.billingMonth,
      inv.dueDate,
      inv.status
    ]);
    downloadCSV(`Laporan_Keuangan_SPP_${new Date().toISOString().split('T')[0]}`, headers, rows);
    triggerToast('File Excel / CSV Rekap SPP berhasil disimpan!');
  };

  // 3. Handlers for Attendance Reports (Strict Student Isolation for Parents)
  const handlePrintAttendance = () => {
    if (userRole === 'parent') {
      const studentAttendance = currentStudent
        ? state.attendance.filter(a => a.studentId === currentStudent.id || a.studentName?.toLowerCase() === currentStudent.name.toLowerCase())
        : state.attendance;
      printAttendanceReport('student', studentAttendance, `Rekap Presensi Belajar: ${currentStudent?.name || 'Ananda'}`);
    } else if (attendanceType === 'student') {
      printAttendanceReport('student', state.attendance, 'Rekap Presensi Murid');
    } else {
      printAttendanceReport('teacher', state.teacherAttendance || [], 'Rekap Kehadiran Guru & Radius GPS');
    }
  };

  const handleExportAttendanceCSV = () => {
    if (userRole === 'parent') {
      const studentAttendance = currentStudent
        ? state.attendance.filter(a => a.studentId === currentStudent.id || a.studentName?.toLowerCase() === currentStudent.name.toLowerCase())
        : state.attendance;
      const headers = ['ID', 'Nama Siswa', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Catatan'];
      const rows = studentAttendance.map(a => [
        a.id,
        a.studentName,
        a.date,
        a.timeIn || '-',
        a.timeOut || '-',
        a.status,
        ''
      ]);
      downloadCSV(`Rekap_Absensi_${(currentStudent?.name || 'Siswa').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`, headers, rows);
    } else if (attendanceType === 'student') {
      const headers = ['ID', 'Nama Siswa', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Catatan'];
      const rows = state.attendance.map(a => [
        a.id,
        a.studentName,
        a.date,
        a.timeIn || '-',
        a.timeOut || '-',
        a.status,
        ''
      ]);
      downloadCSV(`Rekap_Absensi_Siswa_${new Date().toISOString().split('T')[0]}`, headers, rows);
    } else {
      const headers = ['ID', 'Nama Guru', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Lokasi Cabang', 'Jarak (Meter)', 'Dalam Radius', 'Catatan'];
      const rows = (state.teacherAttendance || []).map(a => [
        a.id,
        a.teacherName,
        a.date,
        a.timeIn || '-',
        a.timeOut || '-',
        a.status,
        a.locationName || '-',
        a.distanceMeters || 0,
        a.isWithinRadius ? 'Ya' : 'Tidak',
        a.notes || ''
      ]);
      downloadCSV(`Rekap_Absensi_Guru_GPS_${new Date().toISOString().split('T')[0]}`, headers, rows);
    }
    triggerToast('File Excel / CSV Absensi berhasil disimpan!');
  };

  // 4. Handlers for Schedule Print (Filtered for Child when Parent)
  const handlePrintSchedule = () => {
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const targetSchedules = userRole === 'parent' && currentStudent
      ? state.schedules.filter(sch => {
          if (sch.studentId && sch.studentId !== 'all') {
            return sch.studentId === currentStudent.id || sch.studentName?.toLowerCase().trim() === currentStudent.name.toLowerCase().trim();
          }
          return sch.className === currentStudent.className;
        })
      : state.schedules;

    const bodyHtml = `
      <div class="doc-title-block">
        <div class="doc-title">Jadwal Pembelajaran ${userRole === 'parent' && currentStudent ? `Ananda ${currentStudent.name}` : 'Terpadu Bimbel'}</div>
        <div class="doc-subtitle">Bimbel Rumah CahayaQu • Dicetak pada: ${today}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;" class="text-center">Hari</th>
            <th style="width: 20%;" class="text-center">Waktu / Sesi</th>
            <th style="width: 20%;">Mata Pelajaran</th>
            <th style="width: 25%;">Materi & Fokus</th>
            <th style="width: 20%;">Guru Pengajar</th>
          </tr>
        </thead>
        <tbody>
          ${(targetSchedules.length > 0 ? targetSchedules : state.schedules).map(sch => `
            <tr>
              <td class="text-center font-bold">${sch.day}</td>
              <td class="text-center">${sch.timeSlot}</td>
              <td><strong>${sch.className}</strong></td>
              <td>${sch.subject || sch.className}</td>
              <td>${sch.teacherName}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printHtmlDocument(`Jadwal_Belajar_${new Date().toISOString().split('T')[0]}`, bodyHtml);
  };

  // 5. Full Backup
  const handleDownloadFullBackup = () => {
    downloadJSON(`Backup_Data_Bimbel_CahayaQu_${new Date().toISOString().split('T')[0]}`, state);
    triggerToast('Cadangan seluruh database aplikasi berhasil diunduh (.json)!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-[95%] sm:w-full overflow-hidden shadow-2xl border border-[#E0D8CC] flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-primary/10 via-brand-light to-white border-b border-[#EDE6DD] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-[#E0D8CC] shadow-sm flex items-center justify-center p-1 shrink-0 overflow-hidden">
              <Logo className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-brand-dark font-display truncate">
                Pusat Laporan & Ekspor Data
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer border border-[#E0D8CC] min-h-[44px] min-w-[44px] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 bg-brand-light/50 border-b border-[#EDE6DD] flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('rapor')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'rapor'
                ? 'bg-white text-brand-primary border-t border-x border-[#EDE6DD] shadow-xs'
                : 'text-gray-600 hover:text-brand-dark'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rapor & Data Murid</span>
          </button>

          <button
            onClick={() => setActiveTab('keuangan')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'keuangan'
                ? 'bg-white text-brand-primary border-t border-x border-[#EDE6DD] shadow-xs'
                : 'text-gray-600 hover:text-brand-dark'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Kwitansi & Keuangan SPP</span>
          </button>

          <button
            onClick={() => setActiveTab('absensi')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'absensi'
                ? 'bg-white text-brand-primary border-t border-x border-[#EDE6DD] shadow-xs'
                : 'text-gray-600 hover:text-brand-dark'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Laporan Presensi</span>
          </button>

          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'jadwal'
                ? 'bg-white text-brand-primary border-t border-x border-[#EDE6DD] shadow-xs'
                : 'text-gray-600 hover:text-brand-dark'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal Belajar</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'backup'
                  ? 'bg-white text-brand-primary border-t border-x border-[#EDE6DD] shadow-xs'
                  : 'text-gray-600 hover:text-brand-dark'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cadangkan Data (Backup)</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: RAPOR & DATA SISWA */}
          {activeTab === 'rapor' && (
            <div className="space-y-5">
              <div className="p-4 bg-brand-light/70 rounded-2xl border border-[#E8E1D7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm text-brand-dark flex items-center gap-1.5">
                    <span>1. Cetak Rapor Perkembangan Murid (PDF)</span>
                  </h4>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {userRole === 'parent' 
                      ? 'Lembar resmi rapor hasil belajar ananda, rekap kehadiran, catatan guru, dan tanda tangan kepala bimbel.'
                      : 'Memuat nilai aspek membaca/berhitung/mengaji, rekap kehadiran, catatan guru, dan tanda tangan resmi.'}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {state.students.length > 1 ? (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#E0D8CC] rounded-xl text-xs font-bold text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    >
                      {state.students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.className || 'Membaca'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-3 py-1.5 bg-white border border-[#E0D8CC] rounded-xl text-xs font-extrabold text-brand-primary">
                      {currentStudent?.name} ({currentStudent?.className || 'Membaca'})
                    </span>
                  )}
                </div>
              </div>

              {/* Student Summary Info Card */}
              {currentStudent && (
                <div className="p-4 bg-white rounded-2xl border border-brand-primary/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-brand-dark">{currentStudent.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary font-bold text-[10px]">
                        {currentStudent.className || 'Program Terpadu'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Wali: <strong>{currentStudent.parentName}</strong> • Guru: {currentStudent.teacherName || 'Guru Pembimbing'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrintStudentReport}
                      className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-brand-primary/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak / Simpan PDF Rapor</span>
                    </button>
                  </div>
                </div>
              )}

              {/* FITUR EDIT & KELOLA DATA LAPORAN RAPOR (ADMIN & TEACHER) */}
              {userRole !== 'parent' && currentStudent && (
                <div className="p-4 bg-white rounded-2xl border border-[#E0D8CC] shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EDE6DD]">
                    <div>
                      <h5 className="text-xs font-extrabold text-brand-dark flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Kelola & Edit Data Laporan Rapor: {currentStudent.name}</span>
                      </h5>
                      <p className="text-[11px] text-gray-500">
                        Ubah catatan evaluasi, ganti logo cetak, atau cantumkan tanda tangan digital resmi.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowBrandingManager(!showBrandingManager)}
                        className={`px-3 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                          showBrandingManager 
                            ? 'bg-brand-primary text-white border-brand-primary shadow-xs' 
                            : 'bg-purple-50 hover:bg-purple-100 text-brand-primary border-brand-primary/30'
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>{showBrandingManager ? 'Tutup Pengaturan Kop/TTD' : 'Edit Logo & Tanda Tangan'}</span>
                        {(customLogoUrl || headmasterSigUrl || teacherSigUrl) && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCreatingNewAssessment(!isCreatingNewAssessment)}
                        className="px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isCreatingNewAssessment ? 'Batal Tambah' : '+ Tambah Evaluasi'}</span>
                      </button>
                    </div>
                  </div>

                  {/* KUSTOMISASI LOGO & TANDA TANGAN RESMI */}
                  {showBrandingManager && (
                    <DocumentBrandingManager
                      onLogoChange={(logo) => setCustomLogoUrl(logo)}
                      onHeadmasterSigChange={(sig, name) => {
                        setHeadmasterSigUrl(sig);
                        setHeadmasterName(name);
                      }}
                      onTeacherSigChange={(sig, name) => {
                        setTeacherSigUrl(sig);
                        setTeacherName(name);
                      }}
                      defaultHeadmasterName={headmasterName}
                      defaultTeacherName={teacherName || currentStudent.teacherName || 'Guru Pembimbing'}
                      className="animate-in fade-in"
                    />
                  )}

                  {/* FORM TAMBAH EVALUASI BARU */}
                  {isCreatingNewAssessment && (
                    <div className="p-4 bg-purple-50/50 rounded-2xl border border-brand-primary/20 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-brand-primary/10">
                        <span className="text-xs font-bold text-brand-dark">Input Evaluasi / Rapor Baru</span>
                        <button
                          type="button"
                          onClick={() => setIsCreatingNewAssessment(false)}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          Tutup
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">Mata Pelajaran / Sesi</label>
                          <input
                            type="text"
                            value={newAssessSubject}
                            onChange={(e) => setNewAssessSubject(e.target.value)}
                            placeholder="Membaca / Berhitung / Mengaji"
                            className="w-full text-xs px-3 py-2 bg-white border border-[#E0D8CC] rounded-xl focus:outline-hidden focus:border-brand-primary font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">Tanggal</label>
                          <input
                            type="date"
                            value={newAssessDate}
                            onChange={(e) => setNewAssessDate(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white border border-[#E0D8CC] rounded-xl focus:outline-hidden focus:border-brand-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">Nama Guru Penilai</label>
                          <input
                            type="text"
                            value={newAssessTeacher}
                            onChange={(e) => setNewAssessTeacher(e.target.value)}
                            placeholder="Guru Pembimbing"
                            className="w-full text-xs px-3 py-2 bg-white border border-[#E0D8CC] rounded-xl focus:outline-hidden focus:border-brand-primary"
                          />
                        </div>
                      </div>

                      {/* Penilaian Aspek (Rating) */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 block mb-1.5">Penilaian Aspek (Bintang 1 - 5):</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {Object.keys(newAssessAspects).map(aspectKey => (
                            <div key={aspectKey} className="p-2 bg-white rounded-xl border border-[#E0D8CC] flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-gray-700 truncate pr-1">{aspectKey}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewAssessAspects(prev => ({ ...prev, [aspectKey]: star }))}
                                    className={`text-xs cursor-pointer ${star <= (newAssessAspects[aspectKey] || 0) ? 'text-amber-500' : 'text-gray-300'}`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-600 block mb-1">Catatan Evaluasi / Kemajuan Siswa:</label>
                        <textarea
                          rows={2}
                          value={newAssessNotes}
                          onChange={(e) => setNewAssessNotes(e.target.value)}
                          placeholder="Tuliskan detail kemajuan belajar ananda, halaman buku, materi yang dikuasai..."
                          className="w-full text-xs px-3 py-2 bg-white border border-[#E0D8CC] rounded-xl focus:outline-hidden focus:border-brand-primary font-medium"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsCreatingNewAssessment(false)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateNewAssessment}
                          className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Evaluasi</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DAFTAR EVALUASI YANG SUDAH ADA & DAPAT DI-EDIT */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Riwayat Evaluasi Rapor Tersimpan ({studentAssessments.length})
                    </span>

                    {studentAssessments.length === 0 ? (
                      <div className="p-4 bg-brand-light/50 rounded-xl border border-dashed border-[#E0D8CC] text-center text-xs text-gray-500">
                        Belum ada catatan evaluasi rapor untuk {currentStudent.name}. Klik "+ Tambah Evaluasi Rapor" untuk memasukkan data.
                      </div>
                    ) : (
                      studentAssessments.map((item) => {
                        const isEditing = editingAssessmentId === item.id;

                        if (isEditing) {
                          return (
                            <div key={item.id} className="p-3.5 bg-purple-50 rounded-2xl border-2 border-brand-primary/40 space-y-3 animate-in fade-in">
                              <div className="flex items-center justify-between pb-1.5 border-b border-brand-primary/20">
                                <span className="text-xs font-bold text-brand-dark flex items-center gap-1">
                                  <Edit3 className="w-3 h-3 text-brand-primary" /> Sedang Mengedit Laporan Evaluasi
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">ID: {item.id}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 block mb-1">Mata Pelajaran</label>
                                  <input
                                    type="text"
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E0D8CC] rounded-xl focus:border-brand-primary font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 block mb-1">Tanggal</label>
                                  <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E0D8CC] rounded-xl focus:border-brand-primary"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 block mb-1">Guru Penilai</label>
                                  <input
                                    type="text"
                                    value={editTeacherName}
                                    onChange={(e) => setEditTeacherName(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E0D8CC] rounded-xl focus:border-brand-primary"
                                  />
                                </div>
                              </div>

                              {/* Edit Aspects */}
                              <div>
                                <label className="text-[10px] font-bold text-gray-600 block mb-1">Penilaian Aspek:</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {Object.keys(editAspects).map(aspectKey => (
                                    <div key={aspectKey} className="p-2 bg-white rounded-xl border border-[#E0D8CC] flex items-center justify-between">
                                      <span className="text-[10.5px] font-semibold text-gray-700 truncate pr-1">{aspectKey}</span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {[1, 2, 3, 4, 5].map(star => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => setEditAspects(prev => ({ ...prev, [aspectKey]: star }))}
                                            className={`text-xs cursor-pointer ${star <= (editAspects[aspectKey] || 0) ? 'text-amber-500' : 'text-gray-300'}`}
                                          >
                                            ★
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-gray-600 block mb-1">Catatan Evaluasi:</label>
                                <textarea
                                  rows={2}
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E0D8CC] rounded-xl focus:border-brand-primary font-medium"
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={handleCancelEditAssessment}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" /> Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditAssessment(item)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" /> Simpan Perubahan
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={item.id} className="p-3 bg-brand-light/60 hover:bg-brand-light rounded-xl border border-[#E0D8CC] transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-brand-dark">{item.subject}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-[#E0D8CC] text-gray-600 font-mono">
                                  {item.date}
                                </span>
                                <span className="text-[10px] text-gray-500">Oleh: {item.teacherName}</span>
                              </div>

                              <p className="text-xs text-gray-700 italic line-clamp-2">
                                "{item.notes || 'Ananda mengikuti pembelajaran dengan sangat baik dan fokus.'}"
                              </p>

                              {Array.isArray(item.aspects) && item.aspects.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                  {item.aspects.map((asp) => (
                                    <span key={asp.name} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-[#E8E1D7] text-gray-600 flex items-center gap-1">
                                      {asp.name}: <strong className="text-amber-600">{asp.score}★</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {!Array.isArray(item.aspects) && item.aspects && Object.keys(item.aspects).length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                  {Object.entries(item.aspects).map(([k, v]) => (
                                    <span key={k} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-[#E8E1D7] text-gray-600 flex items-center gap-1">
                                      {k}: <strong className="text-amber-600">{String(v)}★</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleStartEditAssessment(item)}
                                className="p-2 bg-white hover:bg-brand-primary/10 text-brand-primary border border-[#E0D8CC] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Edit data evaluasi laporan ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteAssessmentItem(item.id)}
                                className="p-2 bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-[#E0D8CC] rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                                title="Hapus laporan ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* KUSTOMISASI CATATAN REKOMENDASI KEPALA BIMBEL UNTUK DOKUMEN RAPOR */}
                  <div className="pt-3 border-t border-[#EDE6DD]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-brand-primary" />
                        Catatan & Rekomendasi Kepala Bimbel (Tercetak di Lembar Rapor):
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingRecommendation(!isEditingRecommendation)}
                        className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer"
                      >
                        {isEditingRecommendation ? 'Selesai Edit' : 'Ubah Teks'}
                      </button>
                    </div>

                    {isEditingRecommendation ? (
                      <textarea
                        rows={2}
                        value={customRecommendation}
                        onChange={(e) => setCustomRecommendation(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-brand-primary/40 rounded-xl focus:outline-hidden"
                      />
                    ) : (
                      <p className="text-xs text-gray-600 italic bg-brand-light/60 p-2.5 rounded-xl border border-[#E0D8CC]">
                        "{customRecommendation}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Bulk Actions - Admin and Teacher only */}
              {userRole !== 'parent' && (
                <div className="pt-3 border-t border-[#EDE6DD]">
                  <h5 className="text-xs font-extrabold text-brand-dark mb-3">
                    Ekspor & Cetak Keseluruhan Data Siswa:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handlePrintAllStudentsList}
                      className="p-3.5 bg-white hover:bg-brand-light border border-[#E0D8CC] rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-brand-dark group-hover:text-brand-primary">
                          🖨️ Cetak Buku Induk Murid (PDF)
                        </p>
                        <p className="text-[11px] text-gray-500">Format tabel siap cetak seluruh murid</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary" />
                    </button>

                    <button
                      type="button"
                      onClick={handleExportStudentsCSV}
                      className="p-3.5 bg-white hover:bg-brand-light border border-[#E0D8CC] rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-brand-dark group-hover:text-brand-primary">
                          📊 Unduh File Excel / CSV Data Siswa
                        </p>
                        <p className="text-[11px] text-gray-500">Buka langsung di Microsoft Excel / Sheets</p>
                      </div>
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-brand-primary" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KEUANGAN & KWITANSI SPP */}
          {activeTab === 'keuangan' && (
            <div className="space-y-5">
              <div className="p-4 bg-brand-light/70 rounded-2xl border border-[#E8E1D7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm text-brand-dark flex items-center gap-1.5">
                    <span>1. Cetak Kwitansi / Bukti Pembayaran SPP (PDF)</span>
                  </h4>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Kwitansi sah dengan nomor invoice, status, rincian biaya, dan info rekening.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {state.invoices.length > 1 ? (
                    <select
                      value={selectedInvoiceId}
                      onChange={(e) => setSelectedInvoiceId(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#E0D8CC] rounded-xl text-xs font-bold text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    >
                      {state.invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNo} - {inv.studentName} ({inv.status})
                        </option>
                      ))}
                    </select>
                  ) : state.invoices.length === 1 ? (
                    <span className="px-3 py-1.5 bg-white border border-[#E0D8CC] rounded-xl text-xs font-mono font-bold text-brand-primary">
                      {state.invoices[0].invoiceNo} ({state.invoices[0].status})
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 italic">Tidak ada tagihan</span>
                  )}
                </div>
              </div>

              {currentInvoice && (
                <div className="p-4 bg-white rounded-2xl border border-brand-primary/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded-md">{currentInvoice.invoiceNo}</span>
                      <span className="font-extrabold text-sm text-brand-dark">{currentInvoice.studentName}</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        currentInvoice.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {currentInvoice.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Bulan: <strong>{currentInvoice.billingMonth}</strong> • Nominal: <strong>Rp {currentInvoice.amount.toLocaleString('id-ID')}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrintInvoice}
                      className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-brand-primary/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak / Simpan Kwitansi PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bulk Financial Export - Admin only */}
              {userRole !== 'parent' && (
                <div className="pt-3 border-t border-[#EDE6DD]">
                  <h5 className="text-xs font-extrabold text-brand-dark mb-3">
                    Laporan Rekapitulasi Keuangan:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handlePrintFinancialReport}
                      className="p-3.5 bg-white hover:bg-brand-light border border-[#E0D8CC] rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-brand-dark group-hover:text-brand-primary">
                          🖨️ Cetak Rekap Keuangan SPP (PDF)
                        </p>
                        <p className="text-[11px] text-gray-500">Total tagihan, penerimaan lunas, dan piutang</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary" />
                    </button>

                    <button
                      type="button"
                      onClick={handleExportInvoicesCSV}
                      className="p-3.5 bg-white hover:bg-brand-light border border-[#E0D8CC] rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-brand-dark group-hover:text-brand-primary">
                          📊 Simpan File Excel / CSV Pembayaran
                        </p>
                        <p className="text-[11px] text-gray-500">Format spreadsheet lengkap data tagihan</p>
                      </div>
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-brand-primary" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LAPORAN ABSENSI */}
          {activeTab === 'absensi' && (
            <div className="space-y-5">
              {/* Type toggle: only shown for admin/teacher, hidden for parent */}
              {userRole !== 'parent' && (
                <div className="p-3 bg-brand-light rounded-2xl border border-[#E8E1D7] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAttendanceType('student')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      attendanceType === 'student'
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Presensi Murid ({state.attendance.length} Data)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceType('teacher')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      attendanceType === 'teacher'
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Kehadiran Guru & GPS ({(state.teacherAttendance || []).length} Data)
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrintAttendance}
                  className="p-4 bg-white hover:bg-brand-light border border-brand-primary/30 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between shadow-xs group"
                >
                  <div>
                    <p className="text-xs font-bold text-brand-dark group-hover:text-brand-primary flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-brand-primary" />
                      <span>{userRole === 'parent' ? 'Cetak / Simpan PDF Laporan Presensi' : 'Cetak / Simpan PDF Laporan Presensi'}</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {userRole === 'parent'
                        ? 'Format resmi rekapan jadwal masuk, kepulangan, dan kehadiran ananda'
                        : (attendanceType === 'student' ? 'Format resmi dengan rekap jam, kehadiran & catatan belajar siswa' : 'Format resmi dengan rekap jam, kehadiran & validasi radius')}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary" />
                </button>

                <button
                  type="button"
                  onClick={handleExportAttendanceCSV}
                  className="p-4 bg-white hover:bg-brand-light border border-[#E0D8CC] rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between shadow-xs group"
                >
                  <div>
                    <p className="text-xs font-bold text-brand-dark group-hover:text-brand-primary flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Simpan File Excel / CSV Presensi</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {userRole === 'parent'
                        ? 'Buka langsung di spreadsheet untuk rekapan kehadiran ananda'
                        : 'Buka langsung di spreadsheet untuk pembukuan bulanan'}
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-brand-primary" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: JADWAL */}
          {activeTab === 'jadwal' && (
            <div className="space-y-4 text-center p-6 bg-brand-light/60 rounded-3xl border border-[#E8E1D7]">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-brand-dark font-display">
                  Cetak Jadwal Pembelajaran Mingguan
                </h4>
                <p className="text-xs text-brand-muted max-w-md mx-auto mt-1">
                  Format cetak A4 rapi mencakup pembagian hari, jam sesi, mata pelajaran, dan guru pengampu.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrintSchedule}
                className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-brand-primary/20 inline-flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF Jadwal Belajar</span>
              </button>
            </div>
          )}

          {/* TAB 5: BACKUP ALL DATA */}
          {activeTab === 'backup' && userRole === 'admin' && (
            <div className="space-y-4 p-5 bg-gradient-to-br from-amber-50 to-white rounded-3xl border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-900">
                    Cadangkan Seluruh Database Aplikasi (Full Backup)
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Unduh satu berkas JSON terpadu yang memuat seluruh data siswa, absensi, evaluasi nilai rapor, tagihan SPP, akun pengguna, dan jadwal. Berkas ini dapat digunakan untuk arsip dan pemulihan data kapan saja.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadFullBackup}
                  className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Cadangan Database (.json)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Toast */}
        <div className="p-4 bg-brand-light/80 border-t border-[#EDE6DD] flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            {toastMsg ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {toastMsg}
              </span>
            ) : (
              <span>💡 Gunakan opsi <em>"Save as PDF"</em> di browser saat dialog cetak muncul.</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs border border-[#E0D8CC] transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
